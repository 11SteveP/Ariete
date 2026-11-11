import uuid
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class ClienteInput(BaseModel):
    nome: str = Field(min_length=1, max_length=200)
    partita_iva: str = ""
    email: str = ""
    note: str = ""


class Cliente(ClienteInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
