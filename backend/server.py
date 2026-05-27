"""Backend Jardin Intérieur — proxy LM Studio + détection branche/crise + croissance.

Architecture pensée pour fonctionner en local (LM Studio sur localhost:1234)
ou avec n'importe quel backend OpenAI-compatible.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Literal

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

from services.branch_detection import detect_branch
from services.crisis import CRISIS_MESSAGE, detect_crisis
from services.llm import get_default_config, stream_chat
from services.prompts import build_system_prompt
from services.tree import compute_growth, stage_from_count

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("jardin")

app = FastAPI(title="Jardin Intérieur API")
api = APIRouter(prefix="/api")


# --------------------------- Schémas ---------------------------

class Category(BaseModel):
    id: str
    label: str
    color: str | None = None
    leaves: int = 0
    flowers: int = 0
    fruits: int = 0


class TrunkStats(BaseModel):
    leaves: int = 0
    roots: int = 0
    flowers: int = 0
    fruits: int = 0


class DetectBranchRequest(BaseModel):
    text: str
    categories: list[Category] = Field(default_factory=list)


class CrisisRequest(BaseModel):
    text: str


class GrowthRequest(BaseModel):
    mode: Literal["free", "daily", "rumination", "light"] = "free"
    message_count: int
    category_id: str | None = None
    trunk: TrunkStats
    categories: list[Category] = Field(default_factory=list)


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ChatStreamRequest(BaseModel):
    messages: list[ChatMessage]
    mode: Literal["free", "daily", "rumination", "light"] = "free"
    categories: list[Category] = Field(default_factory=list)
    # Configuration LLM optionnelle (override des défauts serveur)
    base_url: str | None = None
    model: str | None = None
    api_key: str | None = None


# --------------------------- Endpoints utilitaires ---------------------------

@api.get("/")
async def root() -> dict:
    return {
        "name": "Jardin Intérieur API",
        "status": "ok",
        "llm_default": get_default_config(),
    }


@api.get("/config/llm")
async def llm_config() -> dict:
    """Retourne la configuration LLM par défaut (URL et modèle)."""
    return get_default_config()


@api.post("/crisis/detect")
async def crisis_detect(payload: CrisisRequest) -> dict:
    is_crisis = detect_crisis(payload.text)
    return {
        "is_crisis": is_crisis,
        "message": CRISIS_MESSAGE if is_crisis else None,
    }


@api.post("/branch/detect")
async def branch_detect(payload: DetectBranchRequest) -> dict:
    result = detect_branch(
        payload.text,
        [c.model_dump() for c in payload.categories],
    )
    return {"detection": result}


@api.post("/tree/grow")
async def tree_grow(payload: GrowthRequest) -> dict:
    result = compute_growth(
        payload.trunk.model_dump(),
        [c.model_dump() for c in payload.categories],
        payload.mode,
        payload.message_count,
        payload.category_id,
    )
    return result


@api.get("/tree/stage")
async def tree_stage(count: int = 0) -> dict:
    return stage_from_count(count)


# --------------------------- Chat streaming ---------------------------

@api.post("/chat/stream")
async def chat_stream(payload: ChatStreamRequest):
    """Stream une réponse du LLM (SSE).

    Format de chaque ligne : `data: <json>\n\n`
    - { "type": "delta", "content": "..." }  → chunk de texte
    - { "type": "done" }                     → fin de réponse
    - { "type": "error", "message": "..." } → erreur (LM Studio non joignable, etc.)
    - { "type": "crisis", "message": "..." } → crise détectée, le LLM n'a pas été appelé
    """
    # Crise → on court-circuite l'appel LLM pour préserver la sécurité.
    last_user = next(
        (m for m in reversed(payload.messages) if m.role == "user"),
        None,
    )
    if last_user and detect_crisis(last_user.content):
        async def crisis_gen():
            yield "data: " + json.dumps({"type": "crisis", "content": CRISIS_MESSAGE}) + "\n\n"
            yield "data: " + json.dumps({"type": "done"}) + "\n\n"

        return StreamingResponse(
            crisis_gen(),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # Construction de la conversation avec le bon système prompt
    system_prompt = build_system_prompt(
        payload.mode,
        [c.model_dump() for c in payload.categories],
    )
    llm_messages = [{"role": "system", "content": system_prompt}]
    # On garde les n derniers messages utiles (pas le system, qu'on remplace)
    for m in payload.messages:
        if m.role == "system":
            continue
        llm_messages.append({"role": m.role, "content": m.content})

    async def event_gen():
        try:
            async for chunk in stream_chat(
                llm_messages,
                base_url=payload.base_url,
                model=payload.model,
                api_key=payload.api_key,
            ):
                yield "data: " + json.dumps({"type": "delta", "content": chunk}) + "\n\n"
            yield "data: " + json.dumps({"type": "done"}) + "\n\n"
        except httpx_connect_error_message() as e:  # pragma: no cover
            logger.exception("LLM connection failed")
            yield "data: " + json.dumps({"type": "error", "message": str(e)}) + "\n\n"
        except Exception as e:
            logger.exception("LLM streaming failed: %s", e)
            yield "data: " + json.dumps({
                "type": "error",
                "message": (
                    "Je n'arrive pas à joindre le modèle local. "
                    "Vérifie que LM Studio est lancé et que le serveur local est démarré "
                    "sur l'adresse configurée."
                ),
                "detail": str(e),
            }) + "\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


def httpx_connect_error_message():
    """Helper pour rendre le type d'erreur de connexion explicite."""
    import httpx
    return (httpx.ConnectError, httpx.ConnectTimeout, httpx.ReadTimeout)


# --------------------------- App wiring ---------------------------

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def index() -> dict:
    return {"app": "Jardin Intérieur", "api": "/api"}
