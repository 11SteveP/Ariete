import hashlib
import hmac
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, HTTPException, Response

from lib.db import db
from models.riba import AuthStatus, PinChange, PinLogin

COOKIE = "riba_session"
router = APIRouter(prefix="/auth", tags=["auth"])


async def require_auth(riba_session: str | None = Cookie(default=None)) -> None:
    if not riba_session or not await db.sessions.find_one({"token": riba_session}):
        raise HTTPException(status_code=401, detail="Non autenticato")


def _hash(pin: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", pin.encode(), salt.encode(), 200_000).hex()


async def _check_pin(pin: str) -> bool:
    """PIN saved from the app (hashed, in `settings`) wins; otherwise APP_PIN from .env."""
    saved = await db.settings.find_one({"key": "pin"})
    if saved:
        return hmac.compare_digest(_hash(pin, saved["salt"]), saved["hash"])
    return hmac.compare_digest(pin, os.environ.get("APP_PIN", "1234"))


@router.post("/login", response_model=AuthStatus)
async def login(body: PinLogin, response: Response):
    if not await _check_pin(body.pin):
        raise HTTPException(status_code=401, detail="PIN errato")
    token = str(uuid.uuid4())
    await db.sessions.insert_one({"token": token, "created_at": datetime.now(timezone.utc)})
    response.set_cookie(COOKIE, token, httponly=True, secure=True, samesite="lax", max_age=60 * 60 * 24 * 30)
    return AuthStatus(authenticated=True)


@router.post("/logout", response_model=AuthStatus)
async def logout(response: Response, riba_session: str | None = Cookie(default=None)):
    if riba_session:
        await db.sessions.delete_one({"token": riba_session})
    response.delete_cookie(COOKIE)
    return AuthStatus(authenticated=False)


@router.get("/me", response_model=AuthStatus)
async def me(riba_session: str | None = Cookie(default=None)):
    await require_auth(riba_session)
    return AuthStatus(authenticated=True)


@router.post("/pin", response_model=AuthStatus)
async def change_pin(body: PinChange, riba_session: str | None = Cookie(default=None)):
    await require_auth(riba_session)
    if not await _check_pin(body.current_pin):
        raise HTTPException(status_code=400, detail="Il PIN attuale non è corretto")
    salt = uuid.uuid4().hex
    await db.settings.update_one(
        {"key": "pin"},
        {"$set": {"key": "pin", "salt": salt, "hash": _hash(body.new_pin, salt), "updated_at": datetime.now(timezone.utc)}},
        upsert=True,
    )
    # Sign out every other device; keep the current session.
    await db.sessions.delete_many({"token": {"$ne": riba_session}})
    return AuthStatus(authenticated=True)
