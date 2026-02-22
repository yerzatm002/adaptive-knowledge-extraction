# backend/app/schemas/rules.py
from pydantic import BaseModel
from typing import Optional, Literal


class RulesRequest(BaseModel):
    dataset: Optional[Literal["bank", "credit", "news"]] = None
    source: Optional[Literal["DecisionTree", "Apriori", "NLP"]] = None
    limit: int = 50