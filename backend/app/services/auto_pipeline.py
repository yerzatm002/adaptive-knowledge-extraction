from __future__ import annotations
import pandas as pd
from io import BytesIO
from typing import Any, Dict

from app.services.u_index import compute_U
from app.services.dataset_classifier import detect_dataset_type
from app.services.method_selector import select_method
from app.services.rules_loader import ensure_rules_exist
from app.services.model_registry import registry
from app.services.validation import align_features
from app.services.news_nlp import extract_triples_safe


def run_after_upload(file_bytes: bytes) -> Dict[str, Any]:
    """
    Возвращает:
    - dataset_type
    - U
    - method
    - preview (1-я строка)
    - prediction (если bank/credit)
    - nlp_triples (если news)
    """
    # читаем небольшую часть для расчёта (первые 200 строк достаточно)
    df = pd.read_csv(BytesIO(file_bytes))
    df_head = df.head(200)

    dataset_type = detect_dataset_type(df_head)
    U = compute_U(df_head, alpha=0.5, beta=0.5)
    method = select_method(dataset_type, U)

    # гарантируем правила в БД (если нет — загрузим из JSON)
    ensure_rules_exist(dataset_type, method)

    preview_row = df_head.iloc[0].to_dict() if len(df_head) else {}

    if dataset_type in ("bank", "credit"):
        bundle = registry.bank if dataset_type == "bank" else registry.credit
        if bundle is None:
            return {"dataset_type": dataset_type, "U": U, "method": method, "preview": preview_row, "prediction": None}

        X = align_features(preview_row, bundle.feature_columns)
        X_ready = bundle.preprocess.transform(X)
        pred = bundle.model.predict(X_ready)[0]
        prob = float(bundle.model.predict_proba(X_ready)[0, 1]) if hasattr(bundle.model, "predict_proba") else None

        return {
            "dataset_type": dataset_type,
            "U": U,
            "method": method,
            "preview": preview_row,
            "prediction": {"prediction": int(pred) if str(pred).isdigit() else pred, "probability": prob}
        }

    if dataset_type == "news":
        # пробуем извлечь триплеты из первых 3 строк content
        triples = []
        for _, row in df_head.head(3).iterrows():
            text = str(row.get("content", "")) or ""
            triples.extend(extract_triples_safe(text))
        return {
            "dataset_type": dataset_type,
            "U": U,
            "method": method,
            "preview": preview_row,
            "nlp_triples": triples[:15]
        }

    return {"dataset_type": "unknown", "U": U, "method": method, "preview": preview_row}