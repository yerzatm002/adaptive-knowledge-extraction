# backend/app/services/validation.py
from __future__ import annotations
from typing import Any, Dict, List
import pandas as pd


def align_features(features: Dict[str, Any], expected_columns: List[str]) -> pd.DataFrame:
    """
    1) добавляет отсутствующие колонки как None
    2) убирает лишние
    3) упорядочивает колонки как expected_columns
    """
    # убираем лишние поля
    filtered = {k: v for k, v in features.items() if k in expected_columns}

    # добавляем отсутствующие
    for col in expected_columns:
        if col not in filtered:
            filtered[col] = None

    # формируем DataFrame ровно в нужном порядке
    df = pd.DataFrame([filtered], columns=expected_columns)
    return df