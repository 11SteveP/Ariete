import hmac
import os
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, HTTPException, Response

from lib.db import db
from models.riba import AuthStatus, PinLogin

COOKIE = "riba_session"
router = APIRouter(prefix="/auth", tags=["auth"])


async def require_auth(riba_session: str | None = Cookie(default=None)) -> None:
    if not riba_session or not await db.sessions.find_one({"token": riba_session}):
        raise HTTPException(status_code=401, detail="Non autenticato")


@router.post("/login", response_model=AuthStatus)
async def login(body: PinLogin, response: Response):
    if not hmac.compare_digest(body.pin, os.environ.get("APP_PIN", "1234")):
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
