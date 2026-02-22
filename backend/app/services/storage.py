# backend/app/services/storage.py
from __future__ import annotations

from supabase import create_client
from app.config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET


def _get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set")
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def upload_dataset(file_bytes: bytes, filename: str, dataset_id: str, content_type: str | None = None) -> str:
    """
    Upload file into Supabase Storage bucket.
    Returns storage_path like: datasets/<dataset_id>/<original_filename>
    """
    supabase = _get_supabase_client()
    storage_path = f"datasets/{dataset_id}/{filename}"

    # supabase-py storage upload
    # Note: upsert=False to avoid accidental overwrite (можно сделать True при необходимости)
    options = {"content-type": content_type} if content_type else {}

    res = supabase.storage.from_(SUPABASE_BUCKET).upload(
        path=storage_path,
        file=file_bytes,
        file_options=options
    )

    # supabase-py returns dict-like; on error may contain "error"
    if isinstance(res, dict) and res.get("error"):
        raise RuntimeError(f"Supabase upload error: {res['error']}")

    return storage_path