# backend/app/api/metrics.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from sqlalchemy import text

from app.database import engine

router = APIRouter(tags=["metrics"])


@router.get("/metrics")
def get_metrics(dataset: str | None = None, limit: int = 20):
    """
    MVP: отдаём последние метрики из таблицы metrics.
    dataset: optional filter (bank/credit/news)
    """
    if limit <= 0 or limit > 200:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 200")

    q = """
    SELECT
      id, dataset, model,
      accuracy, precision, recall, f1, roc_auc, time_sec,
      created_at
    FROM metrics
    WHERE 1=1
    """
    params = {"limit": limit}

    if dataset:
        q += " AND dataset = :dataset"
        params["dataset"] = dataset

    q += " ORDER BY created_at DESC, id DESC LIMIT :limit"

    try:
        with engine.connect() as conn:
            rows = conn.execute(text(q), params).mappings().all()
        return {"count": len(rows), "items": rows}
    except Exception as e:
        # если таблицы metrics нет или другая проблема
        raise HTTPException(status_code=500, detail=f"Metrics read error: {str(e)}")