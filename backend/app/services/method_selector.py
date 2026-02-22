from __future__ import annotations
from typing import Literal

Method = Literal["NLP", "DecisionTree", "Apriori"]

def select_method(dataset_type: str, U: float) -> Method:
    # Текст → NLP всегда
    if dataset_type == "news":
        return "NLP"

    # Числовые/категориальные табличные: выбираем по U
    # U низкий → DT (структура хорошо формализуется)
    # U средний → Apriori (ассоциативные правила полезны)
    # U высокий → всё ещё DT как fallback (или Apriori), но лучше Apriori
    if U < 0.33:
        return "DecisionTree"
    elif U < 0.66:
        return "Apriori"
    else:
        return "Apriori"