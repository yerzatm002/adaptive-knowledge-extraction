from __future__ import annotations
import os, json
from typing import Any, Dict, List
from sqlalchemy import text
from app.database import engine

RULES_DIR = os.getenv("RULES_DIR", "rules_json")

FILES = {
    ("bank", "DecisionTree"): "rules_bank_decision_tree.json",
    ("bank", "Apriori"): "rules_bank_apriori.json",
    ("credit", "DecisionTree"): "rules_credit_decision_tree.json",
    ("news", "NLP"): "rules_news_nlp.json",
}

def _load_json(path: str):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def _count_existing(dataset: str, source: str) -> int:
    q = text("SELECT COUNT(*) FROM rules WHERE dataset=:d AND source=:s")
    with engine.connect() as conn:
        return int(conn.execute(q, {"d": dataset, "s": source}).scalar() or 0)

def ensure_rules_exist(dataset: str, source: str):
    # если уже есть — ничего не делаем
    if _count_existing(dataset, source) > 0:
        return

    filename = FILES.get((dataset, source))
    if not filename:
        return

    path = os.path.join(RULES_DIR, filename)
    data = _load_json(path)
    if isinstance(data, dict) and "items" in data:
        data = data["items"]
    if not isinstance(data, list):
        return

    rows: List[Dict[str, Any]] = []
    if source == "DecisionTree":
        for r in data:
            if "if" in r and ("then_class" in r or "then" in r):
                rows.append({
                    "dataset": dataset,
                    "source": "DecisionTree",
                    "rule_if": str(r.get("if")),
                    "rule_then": str(r.get("then_class") or r.get("then")),
                    "probability": r.get("probability"),
                    "coverage": r.get("coverage"),
                    "support": None, "confidence": None, "lift": None, "freq": None
                })
    elif source == "Apriori":
        for r in data:
            rule_if = r.get("IF") or r.get("if")
            rule_then = r.get("THEN") or r.get("then")
            if rule_if and rule_then:
                rows.append({
                    "dataset": dataset,
                    "source": "Apriori",
                    "rule_if": str(rule_if),
                    "rule_then": str(rule_then),
                    "probability": None, "coverage": None,
                    "support": r.get("support"), "confidence": r.get("confidence"), "lift": r.get("lift"),
                    "freq": None
                })
    elif source == "NLP":
        for r in data:
            rule_if = r.get("if_then") or r.get("if")
            if rule_if:
                rows.append({
                    "dataset": dataset,
                    "source": "NLP",
                    "rule_if": str(rule_if),
                    "rule_then": "knowledge_rule",
                    "probability": None, "coverage": None,
                    "support": None, "confidence": None, "lift": None,
                    "freq": r.get("freq")
                })

    if not rows:
        return

    ins = text("""
      INSERT INTO rules (dataset, source, rule_if, rule_then, probability, coverage, support, confidence, lift, freq)
      VALUES (:dataset, :source, :rule_if, :rule_then, :probability, :coverage, :support, :confidence, :lift, :freq)
    """)
    with engine.begin() as conn:
        conn.execute(ins, rows)