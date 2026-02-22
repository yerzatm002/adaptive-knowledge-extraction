# backend/app/api/rules.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database import engine
from app.schemas.rules import RulesRequest

router = APIRouter(tags=["rules"])


@router.post("/rules")
def get_rules(req: RulesRequest):
    if req.limit <= 0 or req.limit > 500:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 500")

    q = """
    SELECT
      id, dataset, source, rule_if, rule_then,
      probability, coverage,
      support, confidence, lift,
      freq, created_at
    FROM rules
    WHERE 1=1
    """

    params = {"limit": req.limit}

    if req.dataset:
        q += " AND dataset = :dataset"
        params["dataset"] = req.dataset

    if req.source:
        q += " AND source = :source"
        params["source"] = req.source

    q += " ORDER BY created_at DESC, id DESC LIMIT :limit"

    with engine.connect() as conn:
        rows = conn.execute(text(q), params).mappings().all()

    return {"count": len(rows), "items": rows}