# backend/scripts/import_rules.py
from __future__ import annotations

import os
import json
import argparse
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()  # подхватит backend/.env если запускаете из backend

DATABASE_URL = os.getenv("DATABASE_URL")
RULES_DIR_DEFAULT = os.getenv("RULES_DIR", "rules_json")


def _as_float(x: Any) -> Optional[float]:
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None


def _as_int(x: Any) -> Optional[int]:
    try:
        if x is None:
            return None
        return int(x)
    except Exception:
        return None


def _get_first(d: Dict[str, Any], keys: List[str], default=None):
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return default


def load_json(path: str) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def normalize_dt_rules(items: List[Dict[str, Any]], dataset: str) -> List[Dict[str, Any]]:
    """
    Expected keys may vary:
      - "if"
      - "then_class" or "then" or "class" or "prediction"
      - "probability"
      - "coverage"
    """
    out = []
    for r in items:
        rule_if = _get_first(r, ["if", "rule_if", "conditions"])
        rule_then = _get_first(r, ["then_class", "then", "rule_then", "class", "prediction"])
        if rule_if is None or rule_then is None:
            # пропускаем битые записи
            continue
        out.append({
            "dataset": dataset,
            "source": "DecisionTree",
            "rule_if": str(rule_if),
            "rule_then": str(rule_then),
            "probability": _as_float(_get_first(r, ["probability", "proba"])),
            "coverage": _as_float(_get_first(r, ["coverage"])),
            "support": None,
            "confidence": None,
            "lift": None,
            "freq": None,
        })
    return out


def normalize_apriori_rules(items: List[Dict[str, Any]], dataset: str) -> List[Dict[str, Any]]:
    """
    Expected keys may vary:
      - "IF" / "THEN" (often upper)
      - "if" / "then"
      - "support", "confidence", "lift"
    """
    out = []
    for r in items:
        rule_if = _get_first(r, ["IF", "if", "rule_if"])
        rule_then = _get_first(r, ["THEN", "then", "rule_then"])
        if rule_if is None or rule_then is None:
            continue
        out.append({
            "dataset": dataset,
            "source": "Apriori",
            "rule_if": str(rule_if),
            "rule_then": str(rule_then),
            "probability": None,
            "coverage": None,
            "support": _as_float(_get_first(r, ["support"])),
            "confidence": _as_float(_get_first(r, ["confidence"])),
            "lift": _as_float(_get_first(r, ["lift"])),
            "freq": None,
        })
    return out


def normalize_nlp_rules(items: List[Dict[str, Any]], dataset: str = "news") -> List[Dict[str, Any]]:
    """
    Expected keys may vary:
      - "if_then" (already full IF ... THEN ...)
      - OR "if" + "then" style
      - freq: "freq"
    We store:
      rule_if: if_then (or if)
      rule_then: "knowledge_rule" (constant)
    """
    out = []
    for r in items:
        rule_if = _get_first(r, ["if_then", "if", "rule_if"])
        if rule_if is None:
            continue
        out.append({
            "dataset": dataset,
            "source": "NLP",
            "rule_if": str(rule_if),
            "rule_then": "knowledge_rule",
            "probability": None,
            "coverage": None,
            "support": None,
            "confidence": None,
            "lift": None,
            "freq": _as_int(_get_first(r, ["freq", "count"])),
        })
    return out


def insert_rules(engine, rows: List[Dict[str, Any]]):
    if not rows:
        print("No rows to insert.")
        return 0

    sql = text("""
        INSERT INTO rules
        (dataset, source, rule_if, rule_then, probability, coverage, support, confidence, lift, freq)
        VALUES
        (:dataset, :source, :rule_if, :rule_then, :probability, :coverage, :support, :confidence, :lift, :freq)
    """)

    with engine.begin() as conn:
        conn.execute(sql, rows)

    return len(rows)


def main():
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not set. Put it in backend/.env or environment variables.")

    parser = argparse.ArgumentParser(description="Import rules JSON into Neon(Postgres) rules table")
    parser.add_argument("--rules-dir", default=RULES_DIR_DEFAULT, help="Directory with rules_*.json files")
    parser.add_argument("--reset", action="store_true", help="Truncate rules table before insert")
    args = parser.parse_args()

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

    if args.reset:
        with engine.begin() as conn:
            conn.execute(text("TRUNCATE TABLE rules RESTART IDENTITY;"))
        print("rules table truncated.")

    rules_dir = args.rules_dir

    files = {
        "bank_dt": os.path.join(rules_dir, "rules_bank_decision_tree.json"),
        "bank_ap": os.path.join(rules_dir, "rules_bank_apriori.json"),
        "credit_dt": os.path.join(rules_dir, "rules_credit_decision_tree.json"),
        "news_nlp": os.path.join(rules_dir, "rules_news_nlp.json"),
    }

    total_inserted = 0

    # 1) bank DecisionTree
    bank_dt = load_json(files["bank_dt"])
    if isinstance(bank_dt, dict) and "items" in bank_dt:
        bank_dt = bank_dt["items"]
    total_inserted += insert_rules(engine, normalize_dt_rules(bank_dt, "bank"))
    print("Imported bank DecisionTree rules.")

    # 2) bank Apriori
    bank_ap = load_json(files["bank_ap"])
    if isinstance(bank_ap, dict) and "items" in bank_ap:
        bank_ap = bank_ap["items"]
    total_inserted += insert_rules(engine, normalize_apriori_rules(bank_ap, "bank"))
    print("Imported bank Apriori rules.")

    # 3) credit DecisionTree
    credit_dt = load_json(files["credit_dt"])
    if isinstance(credit_dt, dict) and "items" in credit_dt:
        credit_dt = credit_dt["items"]
    total_inserted += insert_rules(engine, normalize_dt_rules(credit_dt, "credit"))
    print("Imported credit DecisionTree rules.")

    # 4) news NLP
    news_nlp = load_json(files["news_nlp"])
    if isinstance(news_nlp, dict) and "items" in news_nlp:
        news_nlp = news_nlp["items"]
    total_inserted += insert_rules(engine, normalize_nlp_rules(news_nlp, "news"))
    print("Imported news NLP rules.")

    print(f"Done. Total inserted: {total_inserted}")


if __name__ == "__main__":
    main()