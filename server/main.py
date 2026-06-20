"""FastAPI 应用入口：CORS、路由挂载、健康检查。"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import router

app = FastAPI(title="博彩用户行为分析看板 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def root():
    return {"service": "betting-analytics", "status": "ok"}


@app.get("/api/meta")
def meta():
    from data import LEAGUES, BET_TYPES, CHANNELS
    return {
        "leagues": LEAGUES,
        "betTypes": BET_TYPES,
        "channels": CHANNELS,
        "tiers": [
            {"key": "whale", "name": "鲸鱼用户", "threshold": ">10万/月"},
            {"key": "middle", "name": "中产用户", "threshold": "1-10万/月"},
            {"key": "retail", "name": "散户", "threshold": "<1万/月"},
        ],
    }
