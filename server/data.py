"""脱敏数据生成器：构建用户、投注、留存会话数据集，并注入异常行为样本。"""
import random
import hashlib
from datetime import datetime, timedelta

RNG = random.Random(42)
NOW = datetime.now().replace(microsecond=0, second=0)
DATA_START = NOW - timedelta(days=120)

LEAGUES = ["英超", "西甲", "意甲", "德甲", "法甲", "欧冠", "NBA", "中超"]
LEAGUE_WEIGHTS = [22, 18, 14, 13, 9, 12, 7, 5]
BET_TYPES = ["让球", "大小", "胜平负", "波胆"]
BET_TYPE_WEIGHTS = [30, 25, 33, 12]
CHANNELS = ["自然流量", "社交媒体", "广告投放", "邀请裂变", "应用商店"]
CHANNEL_WEIGHTS = [28, 22, 20, 16, 14]

TIER_NAMES = {"whale": "鲸鱼用户", "middle": "中产用户", "retail": "散户"}
TIER_COLORS = {"whale": "#8B5CF6", "middle": "#06B6D4", "retail": "#64748B"}

TYPE_WIN_PROB = {"让球": 0.455, "大小": 0.485, "胜平负": 0.445, "波胆": 0.30}
LEAGUE_WIN_MOD = {
    "英超": 1.00, "西甲": 1.01, "意甲": 0.99, "德甲": 1.00,
    "法甲": 0.98, "欧冠": 0.97, "NBA": 1.02, "中超": 1.03,
}

PROFILES = {
    "whale": {"count": (60, 150), "amount": (1500, 3500)},
    "middle": {"count": (25, 55), "amount": (600, 1400)},
    "retail": {"count": (2, 14), "amount": (50, 250)},
}
TIER_DIST = [("whale", 0.04), ("middle", 0.18), ("retail", 0.78)]

RETENTION_BASE = {
    "自然流量": (0.60, 0.30, 0.13),
    "社交媒体": (0.56, 0.27, 0.11),
    "广告投放": (0.50, 0.23, 0.09),
    "邀请裂变": (0.64, 0.33, 0.15),
    "应用商店": (0.53, 0.25, 0.10),
}

ANOMALY_LABELS = {
    "freq": "投注频次异常",
    "spike": "单日金额突增",
    "late": "深夜投注占比高",
}


def _choice(items, weights):
    return RNG.choices(items, weights=weights, k=1)[0]


def _mask_id(i):
    h = hashlib.md5(f"betuser-{i}".encode()).hexdigest()[:5]
    return "U" + h.upper()


def _mask_nick(i):
    return f"用户****{i & 0xFF:02X}"


def _tier_from_monthly(avg_monthly):
    if avg_monthly > 100000:
        return "whale"
    if avg_monthly > 10000:
        return "middle"
    return "retail"


def _make_bet(uid, league, btype, amount, bt):
    bt = bt.replace(microsecond=0)
    win_prob = min(0.6, max(0.2, TYPE_WIN_PROB[btype] * LEAGUE_WIN_MOD[league]))
    if RNG.random() < win_prob:
        payout = round(amount * RNG.uniform(1.7, 2.4), 2)
    else:
        payout = 0.0
    return {
        "bet_id": "",
        "user_id": uid,
        "league": league,
        "bet_type": btype,
        "amount": round(amount, 2),
        "payout": payout,
        "bet_time": bt,
    }


def generate():
    users = []
    bets = []
    n_users = 800

    tier_pool = []
    for t, p in TIER_DIST:
        tier_pool += [t] * round(n_users * p)
    while len(tier_pool) < n_users:
        tier_pool.append("retail")
    RNG.shuffle(tier_pool)

    anomalous_idx = set(RNG.sample(range(n_users), 14))

    for i in range(n_users):
        profile_key = tier_pool[i]
        prof = PROFILES[profile_key]
        uid = _mask_id(i)
        nickname = _mask_nick(i)
        channel = _choice(CHANNELS, CHANNEL_WEIGHTS)
        reg_days = RNG.randint(5, 118)
        register_date = NOW - timedelta(days=reg_days)

        b1, b7, b30 = RETENTION_BASE[channel]
        has_d1 = RNG.random() < b1
        has_d7 = RNG.random() < b7
        has_d30 = RNG.random() < b30

        user = {
            "user_id": uid,
            "nickname": nickname,
            "channel": channel,
            "register_date": register_date,
            "profile": profile_key,
            "tier": profile_key,
            "_has_d1": has_d1,
            "_has_d7": has_d7,
            "_has_d30": has_d30,
            "_anomalous": i in anomalous_idx,
            "_reasons": [],
        }
        users.append(user)

        active_days = max(1, (NOW - register_date).days)
        months_active = active_days / 30.0
        count_per_month = RNG.randint(*prof["count"])
        total_bets = max(1, int(count_per_month * months_active))
        is_anom = i in anomalous_idx

        u_bets = []
        for _ in range(total_bets):
            days_ago = RNG.uniform(0, active_days)
            bt = NOW - timedelta(days=days_ago)
            hour = RNG.randint(8, 23)
            bt = bt.replace(hour=hour, minute=RNG.randint(0, 59), second=RNG.randint(0, 59))
            league = _choice(LEAGUES, LEAGUE_WEIGHTS)
            btype = _choice(BET_TYPES, BET_TYPE_WEIGHTS)
            amount = RNG.uniform(*prof["amount"])
            u_bets.append(_make_bet(uid, league, btype, amount, bt))

        total_amt = sum(b["amount"] for b in u_bets)
        avg_monthly = total_amt / months_active if months_active else 0
        user["tier"] = _tier_from_monthly(avg_monthly)

        if is_anom:
            reasons = RNG.sample(["freq", "spike", "late"], k=RNG.randint(1, 2))
            user["_reasons"] = reasons
            if "late" in reasons:
                late_k = max(1, len(u_bets) // 2)
                for b in RNG.sample(u_bets, k=late_k):
                    b["bet_time"] = b["bet_time"].replace(hour=RNG.randint(2, 4))
            if "freq" in reasons:
                base = NOW - timedelta(days=RNG.randint(1, 25), hours=RNG.randint(0, 12))
                base = base.replace(hour=RNG.randint(9, 23), minute=RNG.randint(0, 59))
                for k in range(6):
                    bt = base + timedelta(minutes=k * RNG.randint(1, 4))
                    if bt > NOW:
                        continue
                    league = _choice(LEAGUES, LEAGUE_WEIGHTS)
                    btype = _choice(BET_TYPES, BET_TYPE_WEIGHTS)
                    u_bets.append(_make_bet(uid, league, btype, RNG.uniform(*prof["amount"]), bt))
            if "spike" in reasons:
                spike_day = NOW - timedelta(days=RNG.randint(1, 25))
                base_amount = prof["amount"][1] * 9
                for k in range(5):
                    bt = spike_day.replace(hour=RNG.randint(10, 22), minute=RNG.randint(0, 59))
                    if bt > NOW:
                        bt = NOW - timedelta(hours=k)
                    league = _choice(LEAGUES, LEAGUE_WEIGHTS)
                    btype = _choice(BET_TYPES, BET_TYPE_WEIGHTS)
                    u_bets.append(_make_bet(uid, league, btype, base_amount * RNG.uniform(0.8, 1.2), bt))

        bets.extend(u_bets)

    for idx, b in enumerate(bets):
        b["bet_id"] = f"B{idx:06d}"

    user_bets = {}
    for u in users:
        user_bets[u["user_id"]] = sorted(
            [b for b in bets if b["user_id"] == u["user_id"]],
            key=lambda x: x["bet_time"],
        )

    return users, bets, user_bets


USERS, BETS, USER_BETS = generate()
USER_MAP = {u["user_id"]: u for u in USERS}
ANOMALY_USER_IDS = {u["user_id"] for u in USERS if u["_anomalous"]}
