"""API 路由层：鉴权、总览、分层、偏好、盈亏、留存、监控、设置、导出。"""
import csv
import io
from datetime import datetime
from urllib.parse import quote
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

import services
from data import USERS, BETS, TIER_NAMES, LEAGUES, BET_TYPES
from state import (
    SYSTEM_USERS, LOGS, INTERVENTIONS, PASSWORDS, ROLE_PERMS, add_log,
)

router = APIRouter(prefix="/api")


@router.post("/auth/login")
def login(body: dict):
    username = body.get("username", "")
    password = body.get("password", "")
    if PASSWORDS.get(username) != password:
        return {"ok": False, "message": "账号或密码错误"}
    su = next((u for u in SYSTEM_USERS if u["username"] == username), None)
    if not su or su["status"] != "active":
        return {"ok": False, "message": "账号已被禁用"}
    add_log(username, "登录系统")
    su["lastLogin"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    return {
        "ok": True,
        "token": f"demo-token-{username}",
        "user": {
            "username": su["username"],
            "role": su["role"],
            "displayName": su["displayName"],
            "perms": su["perms"],
        },
    }


@router.get("/overview")
def overview(start: str = "", end: str = "", tier: str = "all"):
    return services.compute_overview(start, end, tier)


@router.get("/tier")
def tier(start: str = "", end: str = ""):
    return services.compute_tier(start, end)


@router.get("/preference")
def preference(start: str = "", end: str = "", league: str = "all"):
    return services.compute_preference(start, end, league)


@router.get("/pnl")
def pnl(start: str = "", end: str = "", league: str = "all"):
    return services.compute_pnl(start, end, league)


@router.get("/retention")
def retention(start: str = "", end: str = "", channel: str = "all"):
    return services.compute_retention(start, end, channel)


@router.get("/monitor")
def monitor(start: str = "", end: str = ""):
    return services.compute_monitor(start, end)


@router.get("/monitor/search")
def monitor_search(q: str = Query("", alias="q"), start: str = "", end: str = "", limit: int = 10):
    keyword = (q or "").strip().lower()
    if not keyword:
        return {"items": []}
    data = services.compute_monitor(start, end)
    matched = []
    for u in data["users"]:
        uid = str(u.get("userId", "")).lower()
        nick = str(u.get("nickname", "")).lower()
        if keyword in uid or keyword in nick:
            matched.append({
                "userId": u["userId"],
                "nickname": u["nickname"],
                "tier": u["tier"],
                "tierName": u["tierName"],
                "channel": u["channel"],
                "reasons": u["reasons"],
                "reasonLabels": u["reasonLabels"],
            })
            if len(matched) >= limit:
                break
    return {"items": matched}


@router.post("/monitor/intervene")
def intervene(body: dict):
    user_id = body.get("user_id", "")
    action = body.get("action", "短信提醒")
    operator = body.get("operator", "admin")
    rec = INTERVENTIONS.get(user_id)
    if rec and rec["status"] == "completed":
        status = "completed"
    else:
        status = "processing"
    rec = {
        "userId": user_id,
        "action": action,
        "status": status,
        "operator": operator,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    INTERVENTIONS[user_id] = rec
    add_log(operator, "触发干预", f"用户 {user_id}")
    return {"ok": True, "intervention": rec}


@router.get("/monitor/interventions")
def interventions():
    return {"items": list(INTERVENTIONS.values())}


@router.get("/users")
def users():
    return {"items": SYSTEM_USERS}


@router.get("/users/search")
def search_users(q: str = Query("", alias="q"), limit: int = 10):
    keyword = (q or "").strip().lower()
    if not keyword:
        return {"items": []}
    matched = []
    for u in USERS:
        uid = str(u.get("user_id", "")).lower()
        nick = str(u.get("nickname", "")).lower()
        if keyword in uid or keyword in nick:
            matched.append({
                "userId": u["user_id"],
                "nickname": u["nickname"],
                "tier": u["tier"],
                "tierName": TIER_NAMES[u["tier"]],
                "channel": u["channel"],
            })
            if len(matched) >= limit:
                break
    return {"items": matched}


@router.put("/users/{user_id}")
def update_user(user_id: int, body: dict):
    su = next((u for u in SYSTEM_USERS if u["id"] == user_id), None)
    if not su:
        return {"ok": False, "message": "用户不存在"}
    if "role" in body:
        su["role"] = body["role"]
        su["perms"] = ROLE_PERMS.get(body["role"], su["perms"])
    if "perms" in body:
        su["perms"].update(body["perms"])
    if "status" in body:
        su["status"] = body["status"]
    add_log("admin", "修改权限", f"用户 {su['username']}")
    return {"ok": True, "user": su}


@router.get("/logs")
def logs(page: int = 1, size: int = 20):
    total = len(LOGS)
    start = (page - 1) * size
    end = start + size
    return {"logs": LOGS[start:end], "total": total, "page": page, "size": size}


@router.post("/logs")
def create_log(body: dict):
    add_log(body.get("user", "system"), body.get("action", "操作"), body.get("target", "—"))
    return {"ok": True}


@router.get("/export")
def export(module: str = "tier", format: str = "csv"):
    buf = io.StringIO()
    buf.write("\ufeff")
    writer = csv.writer(buf)

    if module == "tier":
        writer.writerow(["层级", "用户数", "人数占比%", "投注额", "投注额占比%", "人均投注"])
        data = services.compute_tier("", "")["tiers"]
        for r in data:
            writer.writerow([r["name"], r["userCount"], r["userPct"], r["betAmount"], r["betPct"], r["avgBet"]])
        fname = "用户分层分析"
    elif module == "preference":
        writer.writerow(["联赛", "让球", "大小", "胜平负", "波胆"])
        data = services.compute_preference("", "")["matrix"]
        for r in data:
            writer.writerow([r["league"], r["让球"], r["大小"], r["胜平负"], r["波胆"]])
        fname = "投注偏好分析"
    elif module == "pnl":
        writer.writerow(["联赛", "投注额", "派彩", "赔付率"])
        data = services.compute_pnl("", "")["byLeague"]
        for r in data:
            writer.writerow([r["league"], r["bet"], r["payout"], r["ratio"]])
        fname = "盈亏分析"
    elif module == "retention":
        writer.writerow(["渠道", "用户数", "次日留存%", "7日留存%", "30日留存%"])
        data = services.compute_retention("", "")["byChannel"]
        for r in data:
            writer.writerow([r["channel"], r["users"], r["d1"], r["d7"], r["d30"]])
        fname = "用户留存分析"
    elif module == "monitor":
        writer.writerow(["用户ID", "昵称", "层级", "渠道", "异常类型", "深夜占比%", "投注次数", "投注总额"])
        data = services.compute_monitor("", "")["users"]
        for r in data:
            writer.writerow([r["userId"], r["nickname"], r["tierName"], r["channel"],
                             "、".join(r["reasonLabels"]), r["lateNightPct"], r["betCount"], r["totalAmount"]])
        fname = "问题投注监控"
    else:
        writer.writerow(["用户ID", "昵称", "层级", "渠道", "注册日期"])
        for u in USERS[:200]:
            writer.writerow([u["user_id"], u["nickname"], TIER_NAMES[u["tier"]], u["channel"], u["register_date"].date()])
        fname = "用户列表"

    media = "text/csv"
    content = buf.getvalue().encode("utf-8")
    return StreamingResponse(
        io.BytesIO(content),
        media_type=media,
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(fname)}.csv"},
    )
