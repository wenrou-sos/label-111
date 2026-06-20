"""业务计算层：分层、偏好、盈亏、留存、异常监控的聚合分析。"""
from datetime import datetime, timedelta
from collections import defaultdict
import statistics

from data import (
    USERS, BETS, USER_BETS, USER_MAP, ANOMALY_USER_IDS,
    LEAGUES, BET_TYPES, CHANNELS, TIER_NAMES, TIER_COLORS,
    NOW, DATA_START, ANOMALY_LABELS,
)


def _parse_range(start, end):
    s = datetime.fromisoformat(start) if start else DATA_START
    e = datetime.fromisoformat(end) if end else NOW
    return s, e


def _bets_in_range(start, end):
    return [b for b in BETS if start <= b["bet_time"] <= end]


def _users_by_tier(tier):
    if not tier or tier == "all":
        return {u["user_id"] for u in USERS}
    return {u["user_id"] for u in USERS if u["tier"] == tier}


def _safe_ratio(payout, bet):
    return round(payout / bet, 4) if bet else 0


def _month_key(dt):
    return dt.strftime("%Y-%m")


def compute_overview(start, end, tier):
    s, e = _parse_range(start, end)
    allowed = _users_by_tier(tier)
    bets = [b for b in _bets_in_range(s, e) if b["user_id"] in allowed]

    total_bet = round(sum(b["amount"] for b in bets), 2)
    total_payout = round(sum(b["payout"] for b in bets), 2)
    active_users = len({b["user_id"] for b in bets})
    payout_ratio = _safe_ratio(total_payout, total_bet)
    anomaly_users = len(ANOMALY_USER_IDS & allowed)

    days = 14
    spark = []
    for i in range(days - 1, -1, -1):
        day = (NOW - timedelta(days=i)).date()
        day_total = round(sum(b["amount"] for b in bets if b["bet_time"].date() == day), 0)
        spark.append({"date": day.isoformat(), "value": day_total})

    prev_bet = 0
    prev_start, prev_end = s - (e - s), s
    prev_bets = [b for b in _bets_in_range(prev_start, prev_end) if b["user_id"] in allowed]
    prev_bet = round(sum(b["amount"] for b in prev_bets), 2)

    def _delta(curr, prev):
        if prev == 0:
            return 0
        return round((curr - prev) / prev * 100, 1)

    cards = [
        {
            "id": "bet", "label": "总投注额", "value": total_bet, "unit": "元",
            "deltaPct": _delta(total_bet, prev_bet), "spark": spark,
            "accent": "#00D9C0",
        },
        {
            "id": "users", "label": "活跃用户", "value": active_users, "unit": "人",
            "deltaPct": _delta(active_users, len({b["user_id"] for b in prev_bets})),
            "spark": _users_spark(bets, days), "accent": "#06B6D4",
        },
        {
            "id": "payout", "label": "平台赔付率", "value": round(payout_ratio * 100, 2),
            "unit": "%", "deltaPct": 0, "spark": [], "accent": "#8B5CF6",
        },
        {
            "id": "anomaly", "label": "异常用户", "value": anomaly_users, "unit": "人",
            "deltaPct": 0, "spark": [], "accent": "#FFB547",
        },
    ]
    return {
        "cards": cards,
        "totals": {
            "totalBet": total_bet, "totalPayout": total_payout,
            "activeUsers": active_users, "payoutRatio": payout_ratio,
            "anomalyUsers": anomaly_users, "betCount": len(bets),
        },
    }


def _users_spark(bets, days):
    spark = []
    for i in range(days - 1, -1, -1):
        day = (NOW - timedelta(days=i)).date()
        spark.append({"date": day.isoformat(), "value": len({b["user_id"] for b in bets if b["bet_time"].date() == day})})
    return spark


def compute_tier(start, end):
    s, e = _parse_range(start, end)
    bets = _bets_in_range(s, e)
    by_user = defaultdict(float)
    by_user_tier = defaultdict(float)
    tier_users = defaultdict(set)
    for b in bets:
        u = USER_MAP.get(b["user_id"])
        if not u:
            continue
        by_user[b["user_id"]] += b["amount"]
        by_user_tier[u["tier"]] += b["amount"]
        tier_users[u["tier"]].add(b["user_id"])

    all_users_count = len(USERS)
    total_bet_period = sum(by_user_tier.values()) or 1

    tiers = []
    for key in ["whale", "middle", "retail"]:
        ucount = len({u["user_id"] for u in USERS if u["tier"] == key})
        active = len(tier_users.get(key, set()))
        amt = round(by_user_tier.get(key, 0), 2)
        tiers.append({
            "key": key,
            "name": TIER_NAMES[key],
            "color": TIER_COLORS[key],
            "userCount": ucount,
            "activeUsers": active,
            "userPct": round(ucount / all_users_count * 100, 1) if all_users_count else 0,
            "betAmount": amt,
            "betPct": round(amt / total_bet_period * 100, 1) if total_bet_period else 0,
            "avgBet": round(amt / active, 2) if active else 0,
        })

    trend = _tier_trend(s, e)
    return {"tiers": tiers, "trend": trend}


def _tier_trend(s, e):
    months = {}
    for b in BETS:
        if not (s <= b["bet_time"] <= e):
            continue
        u = USER_MAP.get(b["user_id"])
        if not u:
            continue
        mk = _month_key(b["bet_time"])
        if mk not in months:
            months[mk] = {"month": mk, "whale": 0, "middle": 0, "retail": 0}
        months[mk][u["tier"]] += b["amount"]
    out = []
    for mk in sorted(months):
        row = months[mk]
        out.append({
            "month": row["month"],
            "whale": round(row["whale"], 0),
            "middle": round(row["middle"], 0),
            "retail": round(row["retail"], 0),
        })
    return out


def compute_preference(start, end, league=None):
    s, e = _parse_range(start, end)
    bets = _bets_in_range(s, e)
    if league and league != "all":
        bets = [b for b in bets if b["league"] == league]

    league_amt = defaultdict(float)
    league_cnt = defaultdict(int)
    type_amt = defaultdict(float)
    type_cnt = defaultdict(int)
    matrix = {lg: {t: 0.0 for t in BET_TYPES} for lg in LEAGUES}

    for b in bets:
        league_amt[b["league"]] += b["amount"]
        league_cnt[b["league"]] += 1
        type_amt[b["bet_type"]] += b["amount"]
        type_cnt[b["bet_type"]] += 1
        matrix[b["league"]][b["bet_type"]] += b["amount"]

    leagues = [
        {"league": lg, "amount": round(league_amt[lg], 0), "count": league_cnt[lg]}
        for lg in LEAGUES
    ]
    types = [
        {"type": t, "amount": round(type_amt[t], 0), "count": type_cnt[t]}
        for t in BET_TYPES
    ]
    matrix_out = [
        {"league": lg, **{t: round(matrix[lg][t], 0) for t in BET_TYPES}}
        for lg in LEAGUES
    ]
    return {"leagues": leagues, "types": types, "matrix": matrix_out}


def compute_pnl(start, end, league=None):
    s, e = _parse_range(start, end)
    bets = _bets_in_range(s, e)
    if league and league != "all":
        bets = [b for b in bets if b["league"] == league]

    total_bet = sum(b["amount"] for b in bets)
    total_payout = sum(b["payout"] for b in bets)
    ratio = _safe_ratio(total_payout, total_bet)
    net = round(total_bet - total_payout, 2)

    status = "normal"
    if ratio > 0.98:
        status = "danger"
    elif ratio > 0.93:
        status = "warning"

    by_league = []
    for lg in LEAGUES:
        lb = [b for b in bets if b["league"] == lg]
        bet = sum(b["amount"] for b in lb)
        payout = sum(b["payout"] for b in lb)
        by_league.append({"league": lg, "bet": round(bet, 0), "payout": round(payout, 0), "ratio": _safe_ratio(payout, bet)})

    by_type = []
    for t in BET_TYPES:
        tb = [b for b in bets if b["bet_type"] == t]
        bet = sum(b["amount"] for b in tb)
        payout = sum(b["payout"] for b in tb)
        by_type.append({"type": t, "bet": round(bet, 0), "payout": round(payout, 0), "ratio": _safe_ratio(payout, bet)})

    trend = []
    months = {}
    for b in bets:
        mk = _month_key(b["bet_time"])
        if mk not in months:
            months[mk] = {"bet": 0.0, "payout": 0.0}
        months[mk]["bet"] += b["amount"]
        months[mk]["payout"] += b["payout"]
    for mk in sorted(months):
        row = months[mk]
        trend.append({
            "month": mk,
            "bet": round(row["bet"], 0),
            "payout": round(row["payout"], 0),
            "ratio": _safe_ratio(row["payout"], row["bet"]),
        })

    alerts = []
    for row in trend:
        sev = "normal"
        if row["ratio"] > 0.98:
            sev = "danger"
        elif row["ratio"] > 0.93 or row["ratio"] < 0.80:
            sev = "warning"
        if sev != "normal":
            alerts.append({
                "month": row["month"], "ratio": row["ratio"], "severity": sev,
                "message": "赔付率过高，平台盈利承压" if row["ratio"] > 0.93 else "赔付率过低，可能影响用户体验",
            })

    return {
        "summary": {
            "totalBet": round(total_bet, 2), "totalPayout": round(total_payout, 2),
            "payoutRatio": ratio, "netResult": net, "status": status,
        },
        "byLeague": by_league,
        "byType": by_type,
        "trend": trend,
        "alerts": alerts,
    }


def compute_retention(start, end, channel=None):
    s, e = _parse_range(start, end)
    span = e - s

    def _cohort(ps, pe):
        c = [u for u in USERS if ps <= u["register_date"] <= pe]
        if channel and channel != "all":
            c = [u for u in c if u["channel"] == channel]
        return c

    cohort = _cohort(s, e)
    prev_cohort = _cohort(s - span, s)

    def _rate(users, field):
        if not users:
            return 0
        return round(sum(1 for u in users if u[field]) / len(users) * 100, 1)

    rates = [
        {"key": "d1", "label": "次日留存", "value": _rate(cohort, "_has_d1"), "prev": _rate(prev_cohort, "_has_d1")},
        {"key": "d7", "label": "7日留存", "value": _rate(cohort, "_has_d7"), "prev": _rate(prev_cohort, "_has_d7")},
        {"key": "d30", "label": "30日留存", "value": _rate(cohort, "_has_d30"), "prev": _rate(prev_cohort, "_has_d30")},
    ]

    by_channel = []
    for ch in CHANNELS:
        cu = [u for u in cohort if u["channel"] == ch]
        by_channel.append({
            "channel": ch, "users": len(cu),
            "d1": _rate(cu, "_has_d1"), "d7": _rate(cu, "_has_d7"), "d30": _rate(cu, "_has_d30"),
        })

    trend = []
    months = defaultdict(list)
    for u in cohort:
        months[_month_key(u["register_date"])].append(u)
    for mk in sorted(months):
        cu = months[mk]
        trend.append({
            "month": mk, "users": len(cu),
            "d1": _rate(cu, "_has_d1"), "d7": _rate(cu, "_has_d7"), "d30": _rate(cu, "_has_d30"),
        })

    return {"rates": rates, "byChannel": by_channel, "trend": trend}


def _detect_freq(bets):
    if len(bets) < 5:
        return False
    times = sorted(b["bet_time"] for b in bets)
    i = 0
    while i < len(times):
        j = i
        while j < len(times) and (times[j] - times[i]).total_seconds() <= 900:
            j += 1
        if j - i >= 5:
            return True
        i += 1
    return False


def _detect_spike(bets):
    daily = defaultdict(float)
    for b in bets:
        daily[b["bet_time"].date()] += b["amount"]
    if len(daily) < 3:
        return False
    vals = [v for v in daily.values() if v > 0]
    if len(vals) < 3:
        return False
    med = statistics.median(vals)
    if med <= 0:
        return False
    return max(vals) > 10 * med


def _detect_late(bets):
    if not bets:
        return 0
    late = sum(1 for b in bets if 2 <= b["bet_time"].hour < 5)
    return round(late / len(bets) * 100, 1)


def compute_monitor(start, end):
    s, e = _parse_range(start, end)
    flagged = []
    for u in USERS:
        ub = [b for b in USER_BETS.get(u["user_id"], []) if s <= b["bet_time"] <= e]
        if len(ub) < 3:
            continue
        reasons = []
        if _detect_freq(ub):
            reasons.append("freq")
        if _detect_spike(ub):
            reasons.append("spike")
        late_pct = _detect_late(ub)
        if late_pct > 40:
            reasons.append("late")
        if not reasons:
            continue

        daily = defaultdict(float)
        for b in ub:
            daily[b["bet_time"].date()] += b["amount"]
        last_bet = max(b["bet_time"] for b in ub)

        flagged.append({
            "userId": u["user_id"],
            "nickname": u["nickname"],
            "tier": u["tier"],
            "tierName": TIER_NAMES[u["tier"]],
            "channel": u["channel"],
            "reasons": reasons,
            "reasonLabels": [ANOMALY_LABELS[r] for r in reasons],
            "lateNightPct": late_pct,
            "betCount": len(ub),
            "totalAmount": round(sum(b["amount"] for b in ub), 0),
            "maxDaily": round(max(daily.values()), 0) if daily else 0,
            "lastBet": last_bet.isoformat(),
        })

    flagged.sort(key=lambda x: len(x["reasons"]), reverse=True)
    by_type = {
        "freq": sum(1 for f in flagged if "freq" in f["reasons"]),
        "spike": sum(1 for f in flagged if "spike" in f["reasons"]),
        "late": sum(1 for f in flagged if "late" in f["reasons"]),
    }
    return {"summary": {"total": len(flagged), "byType": by_type}, "users": flagged}
