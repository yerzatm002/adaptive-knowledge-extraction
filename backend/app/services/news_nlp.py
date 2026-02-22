from __future__ import annotations
import re
from typing import List, Dict

# очень простой шаблон: "<Entity> <verb> <Entity>"
VERBS = r"(signed|met|discussed|announced|opened|invested|published|introduced|developed|reported|strengthened|released)"
PATTERN = re.compile(rf"\b([A-Z][A-Za-z0-9\s&\-]+?)\s+{VERBS}\s+([A-Z][A-Za-z0-9\s&\-]+?)\b")

def extract_triples(text: str) -> List[Dict[str, str]]:
    triples = []
    for m in PATTERN.finditer(text):
        e1 = m.group(1).strip()
        verb = m.group(2).strip()  # careful: verb group index depends; keep robust below
    # fix groups:
    # group(2) is verb by our regex? Actually VERBS is capturing.
    return triples

def extract_triples_safe(text: str) -> List[Dict[str, str]]:
    triples = []
    for m in PATTERN.finditer(text):
        e1 = m.group(1).strip()
        verb = m.group(2).strip()  # capturing verb
        e2 = m.group(3).strip() if m.lastindex and m.lastindex >= 3 else ""
        if e2:
            triples.append({"entity1": e1, "verb": verb, "entity2": e2})
    return triples