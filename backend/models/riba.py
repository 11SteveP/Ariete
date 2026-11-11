import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field

DATE_RE = r"^\d{4}-\d{2}-\d{2}$"
MONTH_RE = r"^\d{4}-\d{2}$"


class PinLogin(BaseModel):
    pin: str = Field(min_length=4, max_length=6)


class PinChange(BaseModel):
    current_pin: str = Field(min_length=4, max_length=6)
    new_pin: str = Field(pattern=r"^\d{4,6}$")


class AuthStatus(BaseModel):
    authenticated: bool


class RibaInput(BaseModel):
    cliente: str = Field(min_length=1, max_length=200)
    cliente_id: Optional[str] = None
    importo: float = Field(gt=0)
    data_scadenza: str = Field(pattern=DATE_RE)
    data_caricamento: str = Field(pattern=DATE_RE)
    mese_fattura: str = Field(pattern=MONTH_RE)  # YYYY-MM: month the invoice must be issued
    note: str = ""


class InvoiceUpdate(BaseModel):
    fatturata: bool
    numero_fattura: Optional[str] = None
    data_fattura: Optional[str] = Field(default=None, pattern=DATE_RE)


class Riba(RibaInput):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fatturata: bool = False
    numero_fattura: Optional[str] = None
    data_fattura: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Reminder(BaseModel):
    today: str
    is_last_day: bool
    active: bool
    pending_count: int
    pending_total: float
    overdue_count: int
    items: List[Riba]
