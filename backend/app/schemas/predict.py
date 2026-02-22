# backend/app/schemas/predict.py
from pydantic import BaseModel
from typing import Any, Dict, Literal


class PredictRequest(BaseModel):
    dataset: Literal["bank", "credit"]
    features: Dict[str, Any]