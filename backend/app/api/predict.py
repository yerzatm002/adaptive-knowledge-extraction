# backend/app/api/predict.py
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from app.schemas.predict import PredictRequest
from app.services.model_registry import registry
from app.services.validation import align_features

router = APIRouter(tags=["predict"])


@router.post("/predict")
def predict(req: PredictRequest):
    dataset = req.dataset.lower()

    if dataset == "bank":
        bundle = registry.bank
    elif dataset == "credit":
        bundle = registry.credit
    else:
        raise HTTPException(status_code=400, detail="dataset must be 'bank' or 'credit'")

    if bundle is None:
        raise HTTPException(status_code=503, detail="Model bundle not loaded")

    # 1) Align columns
    X = align_features(req.features, bundle.feature_columns)

    # 2) Preprocess
    try:
        X_ready = bundle.preprocess.transform(X)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Preprocess error: {str(e)}")

    # 3) Predict + probability
    try:
        pred = bundle.model.predict(X_ready)[0]
        # predict_proba may not exist in some models
        if hasattr(bundle.model, "predict_proba"):
            prob = float(bundle.model.predict_proba(X_ready)[0, 1])
        else:
            prob = None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")

    return {
        "dataset": dataset,
        "prediction": int(pred) if str(pred).isdigit() else pred,
        "probability": prob
    }