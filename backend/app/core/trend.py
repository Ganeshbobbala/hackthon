"""Recent price trend direction analysis."""

from typing import Optional
import numpy as np
import pandas as pd
from ..schemas import TrendResult


def calculate_recent_direction(df_route: pd.DataFrame) -> TrendResult:
    """Compare median of last 7 days vs previous 7 days with a ±2% stability threshold.

    Notice: This is purely a descriptive metric of past trajectory, not a predictive promise.
    """
    if df_route.empty:
        return TrendResult(
            direction="Stable",
            change_pct=0.0,
            recent_median=0.0,
            previous_median=0.0,
            description="Insufficient historical data to determine price direction.",
        )

    # Daily median aggregation
    daily = df_route.groupby("date")["fare"].median().sort_index().reset_index()

    if len(daily) < 7:
        median_val = float(daily["fare"].median())
        return TrendResult(
            direction="Stable",
            change_pct=0.0,
            recent_median=round(median_val, 1),
            previous_median=round(median_val, 1),
            description="Fewer than 7 daily observations; price trajectory is classified as Stable.",
        )

    # Last 7 days
    recent_slice = daily.tail(7)
    recent_median = float(recent_slice["fare"].median())

    # Previous 7 days (or whatever is available up to 7 days before)
    if len(daily) >= 14:
        prev_slice = daily.iloc[-14:-7]
    else:
        prev_slice = daily.iloc[:-7]

    if prev_slice.empty or prev_slice["fare"].median() == 0:
        prev_median = recent_median
    else:
        prev_median = float(prev_slice["fare"].median())

    if prev_median > 0:
        change_pct = ((recent_median - prev_median) / prev_median) * 100.0
    else:
        change_pct = 0.0

    # ±2% threshold
    if change_pct > 2.0:
        direction = "Increasing"
        desc = (
            f"Fares have risen by {abs(change_pct):.1f}% over the last 7 days compared to the prior week. "
            "Descriptive historical trend; not a forward price guarantee."
        )
    elif change_pct < -2.0:
        direction = "Decreasing"
        desc = (
            f"Fares have softened by {abs(change_pct):.1f}% over the last 7 days compared to the prior week. "
            "Descriptive historical trend; not a forward price guarantee."
        )
    else:
        direction = "Stable"
        desc = (
            f"Fares have held steady ({change_pct:+.1f}%) within the ±2% stability corridor over the last 7 days. "
            "Descriptive historical trend; not a forward price guarantee."
        )

    return TrendResult(
        direction=direction,
        change_pct=round(change_pct, 1),
        recent_median=round(recent_median, 1),
        previous_median=round(prev_median, 1),
        description=desc,
    )
