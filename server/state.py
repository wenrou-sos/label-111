"""可变内存状态：系统账号、操作日志、干预记录。"""
from datetime import datetime

NOW = datetime.now()

PASSWORDS = {
    "admin": "admin123",
    "analyst": "analyst123",
    "viewer": "viewer123",
}

SYSTEM_USERS = [
    {"id": 1, "username": "admin", "role": "admin", "displayName": "运营管理员",
     "perms": {"export": True, "intervene": True, "manage": True},
     "lastLogin": "2026-06-19 09:12", "status": "active"},
    {"id": 2, "username": "analyst", "role": "analyst", "displayName": "数据分析师",
     "perms": {"export": True, "intervene": True, "manage": False},
     "lastLogin": "2026-06-18 17:40", "status": "active"},
    {"id": 3, "username": "viewer", "role": "viewer", "displayName": "风控查看员",
     "perms": {"export": False, "intervene": False, "manage": False},
     "lastLogin": "2026-06-17 14:05", "status": "active"},
    {"id": 4, "username": "risk01", "role": "analyst", "displayName": "风控专员A",
     "perms": {"export": True, "intervene": True, "manage": False},
     "lastLogin": "2026-06-16 11:22", "status": "active"},
    {"id": 5, "username": "ops_guest", "role": "viewer", "displayName": "外部审计",
     "perms": {"export": False, "intervene": False, "manage": False},
     "lastLogin": "2026-06-10 10:00", "status": "disabled"},
]

ROLE_PERMS = {
    "admin": {"export": True, "intervene": True, "manage": True},
    "analyst": {"export": True, "intervene": True, "manage": False},
    "viewer": {"export": False, "intervene": False, "manage": False},
}

LOGS = [
    {"id": 1, "user": "admin", "action": "登录系统", "target": "—", "time": "2026-06-19 09:12", "ip": "10.0.1.22"},
    {"id": 2, "user": "analyst", "action": "导出数据", "target": "用户分层分析", "time": "2026-06-18 17:41", "ip": "10.0.1.31"},
    {"id": 3, "user": "risk01", "action": "触发干预", "target": "用户 U3F9A", "time": "2026-06-17 15:20", "ip": "10.0.1.45"},
    {"id": 4, "user": "admin", "action": "修改权限", "target": "用户 ops_guest", "time": "2026-06-16 10:30", "ip": "10.0.1.22"},
    {"id": 5, "user": "analyst", "action": "查看监控", "target": "问题投注监控", "time": "2026-06-16 09:05", "ip": "10.0.1.31"},
]

INTERVENTIONS = {}


def add_log(user, action, target="—"):
    LOGS.insert(0, {
        "id": len(LOGS) + 1,
        "user": user,
        "action": action,
        "target": target,
        "time": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "ip": "10.0.1.22",
    })
    if len(LOGS) > 200:
        del LOGS[200:]
