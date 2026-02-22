from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.datasets import router as datasets_router
from app.api.predict import router as predict_router
from app.services.model_registry import load_all_models
from app.api.rules import router as rules_router
from app.api.metrics import router as metrics_router

app = FastAPI(title="Adaptive ML Knowledge Extraction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # позже заменим на домен Vercel
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Загружаем joblib артефакты в память
    load_all_models()

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(datasets_router)
app.include_router(predict_router)
app.include_router(rules_router)
app.include_router(metrics_router)