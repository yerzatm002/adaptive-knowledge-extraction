from __future__ import annotations
from typing import Literal, Optional
import pandas as pd

DatasetType = Literal["bank", "credit", "news", "unknown"]

BANK_MIN_COLS = {"age","job","marital","education","default","balance","housing","loan","contact","day","month","duration","campaign","pdays","previous","poutcome"}
NEWS_MIN_COLS = {"title","content"}  # category optional
# credit columns могут отличаться, поэтому проверяем ключевые
CREDIT_HINT_COLS = {"person_age","person_income","loan_amnt","loan_int_rate","loan_percent_income"}

def detect_dataset_type(df: pd.DataFrame) -> DatasetType:
    cols = set([c.strip() for c in df.columns.astype(str)])
    if NEWS_MIN_COLS.issubset(cols):
        return "news"
    if len(cols.intersection(BANK_MIN_COLS)) >= 10:
        return "bank"
    if len(cols.intersection(CREDIT_HINT_COLS)) >= 3:
        return "credit"
    return "unknown"