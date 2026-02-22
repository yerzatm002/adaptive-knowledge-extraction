# backend/app/services/model_registry.py
from __future__ import annotations
from dataclasses import dataclass
import os
import joblib

ARTIFACTS_DIR = os.getenv("ARTIFACTS_DIR", "artifacts")


@dataclass
class ModelBundle:
    model: object
    preprocess: object
    feature_columns: list[str]


class Registry:
    bank: ModelBundle | None = None
    credit: ModelBundle | None = None


registry = Registry()


def _load(path: str):
    if not os.path.exists(path):
        raise FileNotFoundError(f"Artifact not found: {path}")
    return joblib.load(path)


def load_all_models():
    """
    Загружает модели и препроцессоры в память при старте приложения.
    """
    bank_dt = _load(os.path.join(ARTIFACTS_DIR, "bank_dt_model.joblib"))
    bank_pp = _load(os.path.join(ARTIFACTS_DIR, "bank_preprocess.joblib"))
    bank_cols = _load(os.path.join(ARTIFACTS_DIR, "bank_feature_columns.joblib"))

    credit_dt = _load(os.path.join(ARTIFACTS_DIR, "credit_dt_model.joblib"))
    credit_pp = _load(os.path.join(ARTIFACTS_DIR, "credit_preprocess.joblib"))
    credit_cols = _load(os.path.join(ARTIFACTS_DIR, "credit_feature_columns.joblib"))

    registry.bank = ModelBundle(model=bank_dt, preprocess=bank_pp, feature_columns=list(bank_cols))
    registry.credit = ModelBundle(model=credit_dt, preprocess=credit_pp, feature_columns=list(credit_cols))