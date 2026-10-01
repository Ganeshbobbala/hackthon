"""Statistical computation engine: 30/60/90 windows, percentiles, quartiles, and distribution."""

from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from ..schemas import WindowStatistics, PercentileResult, DistributionBin, ChartDataPoint


def calculate_window_statistics(fares: np.ndarray, window_days: int) -> WindowStatistics:
    """Calculate summary statistics (median, mean, min, max, Q1, Q3, std, n) for a fare array."""
    if len(fares) == 0:
        return WindowStatistics(
            window_days=window_days,
            median=0.0,
            mean=0.0,
            min=0.0,
            max=0.0,
            q1=0.0,
            q3=0.0,
            iqr=0.0,
            std=0.0,
            n=0,
        )

    fares_sorted = np.sort(fares.astype(float))
    median_val = float(np.median(fares_sorted))
    mean_val = float(np.mean(fares_sorted))
    min_val = float(np.min(fares_sorted))
    max_val = float(np.max(fares_sorted))
    q1_val = float(np.percentile(fares_sorted, 25))
    q3_val = float(np.percentile(fares_sorted, 75))
    iqr_val = float(q3_val - q1_val)
    std_val = float(np.std(fares_sorted, ddof=1)) if len(fares_sorted) > 1 else 0.0

    return WindowStatistics(
        window_days=window_days,
        median=round(median_val, 1),
        mean=round(mean_val, 1),
        min=round(min_val, 1),
        max=round(max_val, 1),
        q1=round(q1_val, 1),
        q3=round(q3_val, 1),
        iqr=round(iqr_val, 1),
        std=round(std_val, 1),
        n=len(fares_sorted),
    )


def calculate_percentile(window_fares: np.ndarray, current_fare: float) -> PercentileResult:
    """Calculate percentile rank using scipy.stats.percentileofscore with kind='weak'.

    Bands:
    0–25: Relatively Low
    25–50: Below Typical
    50–75: Above Typical
    75–100: High
    """
    if len(window_fares) == 0:
        return PercentileResult(
            percentile=50.0,
            band="Typical",
            sentence="Insufficient historical data to determine exact percentile position.",
        )

    # Scipy weak percentile
    pct = float(stats.percentileofscore(window_fares, current_fare, kind="weak"))
    pct = max(0.0, min(100.0, pct))

    if pct <= 25.0:
        band = "Relatively Low"
    elif pct <= 50.0:
        band = "Below Typical"
    elif pct <= 75.0:
        band = "Above Typical"
    else:
        band = "High"

    sentence = f"Today's fare is higher than approximately {round(pct):.0f}% of fares in this selected period."

    return PercentileResult(
        percentile=round(pct, 1),
        band=band,
        sentence=sentence,
    )


def build_distribution_bins(window_fares: np.ndarray, current_fare: float, num_bins: int = 10) -> List[DistributionBin]:
    """Generate histogram distribution bins with current fare locator."""
    if len(window_fares) == 0:
        return []

    min_val = float(np.min(window_fares))
    max_val = float(np.max(window_fares))

    if min_val == max_val:
        return [
            DistributionBin(
                bin_start=min_val - 100,
                bin_end=max_val + 100,
                label=f"₹{int(min_val):,}",
                count=len(window_fares),
                is_current=True,
            )
        ]

    # Create bins slightly wider than min and max to enclose all points
    bin_edges = np.linspace(min_val, max_val, num_bins + 1)
    counts, _ = np.histogram(window_fares, bins=bin_edges)

    distribution: List[DistributionBin] = []
    current_found = False

    for i in range(num_bins):
        start = float(bin_edges[i])
        end = float(bin_edges[i + 1])
        cnt = int(counts[i])
        # Bin inclusion: last bin is closed on right
        if i == num_bins - 1:
            is_cur = start <= current_fare <= end
        else:
            is_cur = start <= current_fare < end

        if is_cur:
            current_found = True

        distribution.append(
            DistributionBin(
                bin_start=round(start, 0),
                bin_end=round(end, 0),
                label=f"₹{int(start):,}–₹{int(end):,}",
                count=cnt,
                is_current=is_cur,
            )
        )

    # Edge case if current_fare is outside window extremes
    if not current_found and len(distribution) > 0:
        if current_fare < min_val:
            distribution[0].is_current = True
        elif current_fare > max_val:
            distribution[-1].is_current = True

    return distribution


def build_chart_series(df_window: pd.DataFrame, q1: float, q3: float) -> List[ChartDataPoint]:
    """Generate daily time-series points with rolling 7-day median and quartile bounds."""
    if df_window.empty:
        return []

    # Daily median aggregation across airlines if multiple airlines present
    daily = df_window.groupby("date")["fare"].median().reset_index()
    daily["rolling_median"] = daily["fare"].rolling(window=7, min_periods=1).median()

    chart_points: List[ChartDataPoint] = []
    for _, row in daily.iterrows():
        chart_points.append(
            ChartDataPoint(
                date=str(row["date"]),
                fare=round(float(row["fare"]), 1),
                rolling_median=round(float(row["rolling_median"]), 1),
                q1=round(q1, 1),
                q3=round(q3, 1),
            )
        )

    return chart_points
