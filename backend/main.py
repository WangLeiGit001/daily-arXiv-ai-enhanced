from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

API_KEY = os.getenv("FAVORITES_API_KEY")
DATA_DIR = Path(os.getenv("FAVORITES_DATA_DIR", "data/favorites"))
RAW_ORIGINS = os.getenv("FAVORITES_CORS_ORIGINS", "*")
ALLOWED_ORIGINS = [item.strip() for item in RAW_ORIGINS.split(",") if item.strip()] or ["*"]

app = FastAPI(title="Daily arXiv Favorites API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Paper(BaseModel):
    id: Optional[str] = None
    url: Optional[str] = None
    title: Optional[str] = None
    authors: Optional[str] = None
    category: Optional[Any] = None
    summary: Optional[str] = None
    date: Optional[str] = None
    details: Optional[str] = None
    motivation: Optional[str] = None
    method: Optional[str] = None
    result: Optional[str] = None
    conclusion: Optional[str] = None
    code_url: Optional[str] = None
    code_stars: Optional[int] = None
    code_last_update: Optional[str] = None


class FavoriteEventRequest(BaseModel):
    action: Literal["add", "remove"]
    paper: Paper


class FavoritesResponse(BaseModel):
    favorites: List[Paper]
    count: int
    updated_at: str


def _extract_api_key(
    x_api_key: Optional[str], authorization: Optional[str]
) -> Optional[str]:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    if x_api_key:
        return x_api_key.strip()
    return None


def require_api_key(
    x_api_key: Optional[str] = Header(default=None, alias="X-API-Key"),
    authorization: Optional[str] = Header(default=None),
) -> None:
    if not API_KEY:
        raise HTTPException(
            status_code=500, detail="FAVORITES_API_KEY not configured"
        )
    provided = _extract_api_key(x_api_key, authorization)
    if not provided or provided != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


def _event_file_path(now: datetime) -> Path:
    date_str = now.date().isoformat()
    return DATA_DIR / f"{date_str}.jsonl"


def _paper_id(paper: Paper) -> Optional[str]:
    return paper.id or paper.url


def _append_jsonl(path: Path, record: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def _parse_time(value: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return datetime.min.replace(tzinfo=timezone.utc)


def _load_favorites() -> List[Paper]:
    if not DATA_DIR.exists():
        return []
    latest: Dict[str, Dict[str, Any]] = {}
    latest_time: Dict[str, datetime] = {}
    for path in sorted(DATA_DIR.glob("*.jsonl")):
        with path.open("r", encoding="utf-8") as handle:
            for line in handle:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                paper = record.get("paper") or {}
                paper_id = record.get("paper_id") or paper.get("id") or paper.get("url")
                if not paper_id:
                    continue
                action = record.get("action")
                event_time = _parse_time(record.get("event_time", ""))
                if action == "add":
                    latest[paper_id] = paper
                    latest_time[paper_id] = event_time
                elif action == "remove":
                    latest.pop(paper_id, None)
                    latest_time.pop(paper_id, None)
    ordered_ids = sorted(
        latest_time.keys(), key=lambda key: latest_time[key], reverse=True
    )
    return [Paper(**latest[item]) for item in ordered_ids]


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/api/favorites", response_model=FavoritesResponse)
def list_favorites(_: None = Depends(require_api_key)) -> FavoritesResponse:
    favorites = _load_favorites()
    return FavoritesResponse(
        favorites=favorites,
        count=len(favorites),
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


@app.post("/api/favorites")
def write_favorite(
    payload: FavoriteEventRequest, _: None = Depends(require_api_key)
) -> Dict[str, str]:
    paper_id = _paper_id(payload.paper)
    if not paper_id:
        raise HTTPException(status_code=400, detail="paper.id or paper.url required")
    now = datetime.now(timezone.utc)
    record = {
        "event_time": now.isoformat(),
        "action": payload.action,
        "paper_id": paper_id,
        "paper": payload.paper.dict(exclude_none=True),
    }
    _append_jsonl(_event_file_path(now), record)
    return {"status": "ok"}
