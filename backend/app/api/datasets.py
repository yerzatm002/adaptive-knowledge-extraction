from __future__ import annotations

import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.dataset import Dataset
from app.services.storage import upload_dataset
from app.config import SUPABASE_BUCKET
from app.services.auto_pipeline import run_after_upload

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.post("/upload")
async def upload_dataset_endpoint(file: UploadFile = File(...), db: Session = Depends(get_db)):
    try:
        dataset_id = uuid.uuid4()
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        # 1) upload to Supabase
        storage_path = upload_dataset(
            file_bytes=file_bytes,
            filename=file.filename,
            dataset_id=str(dataset_id),
            content_type=file.content_type
        )

        # 2) insert datasets row
        dataset_row = Dataset(
            id=dataset_id,
            original_filename=file.filename,
            bucket=SUPABASE_BUCKET,
            storage_path=storage_path,
            size_bytes=len(file_bytes),
            mime_type=file.content_type
        )
        db.add(dataset_row)
        db.commit()

        # 3) academic pipeline: compute U, select method, run predict on first row (or NLP triples)
        pipeline_result = run_after_upload(file_bytes)

        return {
            "dataset_id": str(dataset_id),
            "bucket": SUPABASE_BUCKET,
            "storage_path": storage_path,
            **pipeline_result
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))