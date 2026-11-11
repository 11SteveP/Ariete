import calendar
from datetime import timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.dates import today_iso
from lib.db import db
from models.riba import InvoiceUpdate, Reminder, Riba, RibaInput
from routers.auth import require_auth

router = APIRouter(prefix="/riba", tags=["riba"], dependencies=[Depends(require_auth)])


def _to_riba(doc: dict) -> Riba:
    doc.pop("_id", None)
    if doc.get("created_at") and doc["created_at"].tzinfo is None:
        doc["created_at"] = doc["created_at"].replace(tzinfo=timezone.utc)
    return Riba(**doc)


@router.get("", response_model=List[Riba])
async def list_riba():
    docs = await db.riba.find().sort([("data_caricamento", -1), ("created_at", -1)]).to_list(5000)
    return [_to_riba(d) for d in docs]


@router.post("", response_model=Riba, status_code=201)
async def create_riba(body: RibaInput):
    riba = Riba(**body.model_dump())
    await db.riba.insert_one(riba.model_dump())
    return riba


@router.get("/reminder", response_model=Reminder)
async def reminder():
    today = today_iso()
    y, m, d = (int(x) for x in today.split("-"))
    is_last_day = d == calendar.monthrange(y, m)[1]
    month = today[:7]
    pending = [_to_riba(doc) for doc in await db.riba.find({"fatturata": False}).sort("data_caricamento", 1).to_list(5000)]
    overdue = [r for r in pending if r.data_caricamento[:7] < month]
    items = [r for r in pending if r.data_caricamento[:7] <= month] if is_last_day else overdue
    return Reminder(
        today=today,
        is_last_day=is_last_day,
        active=len(items) > 0,
        pending_count=len(pending),
        pending_total=round(sum(r.importo for r in pending), 2),
        overdue_count=len(overdue),
        items=items,
    )


@router.put("/{id}", response_model=Riba)
async def update_riba(id: str, body: RibaInput):
    doc = await db.riba.find_one_and_update({"id": id}, {"$set": body.model_dump()}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="RiBa non trovata")
    return _to_riba(doc)


@router.patch("/{id}/fattura", response_model=Riba)
async def set_invoice(id: str, body: InvoiceUpdate):
    update = body.model_dump()
    if not body.fatturata:
        update.update(numero_fattura=None, data_fattura=None)
    elif not body.data_fattura:
        update["data_fattura"] = today_iso()
    doc = await db.riba.find_one_and_update({"id": id}, {"$set": update}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="RiBa non trovata")
    return _to_riba(doc)


@router.delete("/{id}", status_code=204)
async def delete_riba(id: str):
    res = await db.riba.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RiBa non trovata")
