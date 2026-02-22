from __future__ import annotations
import numpy as np
import pandas as pd

def compute_H(df: pd.DataFrame) -> float:
    """
    H — нормализованная энтропия "разнообразия" значений (средняя по колонкам),
    пригодна для слабоформализованных данных без целевой метки.
    """
    eps = 1e-12
    entropies = []
    for col in df.columns:
        s = df[col].dropna()
        if len(s) == 0:
            continue
        vc = s.astype(str).value_counts(normalize=True)
        H = -float(np.sum(vc * np.log(vc + eps)))
        # нормализация на log(K)
        K = max(len(vc), 2)
        H_norm = H / np.log(K)
        entropies.append(H_norm)

    if not entropies:
        return 1.0
    return float(np.mean(entropies))


def compute_C(df: pd.DataFrame) -> float:
    """
    C — полнота данных (1 - доля пропусков).
    """
    total = df.shape[0] * df.shape[1]
    if total == 0:
        return 0.0
    missing = int(df.isna().sum().sum())
    return float(1.0 - missing / total)


def compute_U(df: pd.DataFrame, alpha: float = 0.5, beta: float = 0.5) -> float:
    """
    U = αH + β(1 - C)
    """
    H = compute_H(df)
    C = compute_C(df)
    U = alpha * H + beta * (1.0 - C)
    return float(max(0.0, min(1.0, U)))