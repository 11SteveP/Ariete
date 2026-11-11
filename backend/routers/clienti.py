import re
from datetime import timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException

from lib.db import db
from models.cliente import Cliente, ClienteInput
from routers.auth import require_auth

router = APIRouter(prefix="/clienti", tags=["clienti"], dependencies=[Depends(require_auth)])


def _to_cliente(doc: dict) -> Cliente:
    doc.pop("_id", None)
    if doc.get("created_at") and doc["created_at"].tzinfo is None:
        doc["created_at"] = doc["created_at"].replace(tzinfo=timezone.utc)
    return Cliente(**doc)


async def _ensure_unique(nome: str, exclude_id: str | None = None) -> None:
    query: dict = {"nome": {"$regex": f"^{re.escape(nome)}$", "$options": "i"}}
    if exclude_id:
        query["id"] = {"$ne": exclude_id}
    if await db.clienti.find_one(query):
        raise HTTPException(status_code=409, detail="Esiste già un cliente con questo nome")


@router.get("", response_model=List[Cliente])
async def list_clienti():
    docs = await db.clienti.find().sort("nome", 1).collation({"locale": "it"}).to_list(5000)
    return [_to_cliente(d) for d in docs]


@router.post("", response_model=Cliente, status_code=201)
async def create_cliente(body: ClienteInput):
    body.nome = body.nome.strip()
    await _ensure_unique(body.nome)
    cliente = Cliente(**body.model_dump())
    await db.clienti.insert_one(cliente.model_dump())
    return cliente


@router.put("/{id}", response_model=Cliente)
async def update_cliente(id: str, body: ClienteInput):
    body.nome = body.nome.strip()
    await _ensure_unique(body.nome, exclude_id=id)
    doc = await db.clienti.find_one_and_update({"id": id}, {"$set": body.model_dump()}, return_document=True)
    if not doc:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    await db.riba.update_many({"cliente_id": id}, {"$set": {"cliente": body.nome}})
    return _to_cliente(doc)


@router.delete("/{id}", status_code=204)
async def delete_cliente(id: str):
    res = await db.clienti.delete_one({"id": id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    # RiBa keep the client name as text; just drop the link.
    await db.riba.update_many({"cliente_id": id}, {"$set": {"cliente_id": None}})
