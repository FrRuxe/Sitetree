"""Client de streaming vers LM Studio (ou tout backend OpenAI-compatible).

LM Studio expose une API OpenAI-compatible sur http://localhost:1234/v1 par
défaut. On utilise httpx en streaming SSE pour relayer les chunks au frontend.
"""

from __future__ import annotations

import json
import logging
import os
from typing import AsyncIterator

import httpx

logger = logging.getLogger(__name__)

DEFAULT_BASE_URL = os.environ.get("LLM_BASE_URL", "http://localhost:1234/v1")
DEFAULT_MODEL = os.environ.get("LLM_MODEL", "gemma-3-4b-it")
DEFAULT_API_KEY = os.environ.get("LLM_API_KEY", "lm-studio")
DEFAULT_TIMEOUT = float(os.environ.get("LLM_TIMEOUT", "60"))


def get_default_config() -> dict:
    return {
        "base_url": DEFAULT_BASE_URL,
        "model": DEFAULT_MODEL,
    }


async def stream_chat(
    messages: list[dict],
    *,
    base_url: str | None = None,
    model: str | None = None,
    api_key: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 400,
) -> AsyncIterator[str]:
    """Stream les tokens de réponse depuis le LLM local.

    Yields des chunks de texte (string). Lève une exception en cas d'échec
    de connexion / d'erreur HTTP.
    """
    url = f"{(base_url or DEFAULT_BASE_URL).rstrip('/')}/chat/completions"
    payload = {
        "model": model or DEFAULT_MODEL,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key or DEFAULT_API_KEY}",
    }

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        async with client.stream("POST", url, json=payload, headers=headers) as resp:
            if resp.status_code != 200:
                body = await resp.aread()
                raise RuntimeError(
                    f"LLM error {resp.status_code}: {body.decode('utf-8', errors='ignore')[:300]}"
                )
            async for line in resp.aiter_lines():
                if not line:
                    continue
                if line.startswith("data: "):
                    data = line[6:].strip()
                else:
                    data = line.strip()
                if data == "[DONE]":
                    return
                try:
                    obj = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choices = obj.get("choices") or []
                if not choices:
                    continue
                delta = choices[0].get("delta") or {}
                content = delta.get("content")
                if content:
                    yield content
