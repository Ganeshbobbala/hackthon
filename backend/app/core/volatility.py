"""Volatility calculation and categorization module."""

import numpy as np
from ..schemas import VolatilityResult


def calculate_volatility(fares: np.ndarray) -> VolatilityResult:
    """Calculate the Volatility Index: (std / mean) * 100 (Coefficient of Variation).

    Categories:
    - < 5: Low
    - 5–10: Moderate
    - 10–20: High
    - > 20: Very High
    """
    formula = "(std / mean) × 100"

    if len(fares) < 2:
        return VolatilityResult(
            volatility_index=0.0,
            category="Low",
            formula=formula,
            explanation="Insufficient data points to compute route volatility index.",
        )

    mean_val = float(np.mean(fares))
    std_val = float(np.std(fares, ddof=1))

    if mean_val <= 0:
        return VolatilityResult(
            volatility_index=0.0,
            category="Low",
            formula=formula,
            explanation="Average fare is non-positive; volatility is zero.",
        )

    vol_index = (std_val / mean_val) * 100.0

    if vol_index < 5.0:
        category = "Low"
        explanation = "Low price dispersion: fares on this route remain exceptionally steady with minimal day-to-day swing."
    elif vol_index < 10.0:
        category = "Moderate"
        explanation = "Moderate price dispersion: fares reflect normal cyclical patterns with modest weekend or seasonal variation."
    elif vol_index <= 20.0:
        category = "High"
        explanation = "High price dispersion: noticeable swings driven by demand surges, dynamic carrier repricing, or booking lead times."
    else:
        category = "Very High"
        explanation = "Very High price dispersion: extreme fare variability with frequent sharp spikes and promotional dips."

    return VolatilityResult(
        volatility_index=round(vol_index, 1),
        category=category,
        formula=formula,
        explanation=explanation,
    )
