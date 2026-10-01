"""Tests for statistical calculations, percentiles, quartiles, volatility, and trend."""

import numpy as np
import pandas as pd
import pytest

from app.core.statistics import (
    calculate_window_statistics,
    calculate_percentile,
    build_distribution_bins,
)
from app.core.volatility import calculate_volatility
from app.core.trend import calculate_recent_direction


def test_calculate_window_statistics():
    fares = np.array([2000, 3000, 4000, 5000, 6000])
    stats = calculate_window_statistics(fares, 30)

    assert stats.n == 5
    assert stats.median == 4000.0
    assert stats.mean == 4000.0
    assert stats.min == 2000.0
    assert stats.max == 6000.0
    assert stats.q1 == 3000.0
    assert stats.q3 == 5000.0
    assert stats.iqr == 2000.0
    assert stats.std > 0


def test_percentile_bands():
    fares = np.array([1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000])

    # Minimum fare -> percentile <= 25 (Relatively Low)
    p_low = calculate_percentile(fares, 1000)
    assert p_low.percentile <= 25.0
    assert p_low.band == "Relatively Low"

    # Below median fare -> 25-50 (Below Typical)
    p_below = calculate_percentile(fares, 3000)
    assert 25.0 < p_below.percentile <= 50.0
    assert p_below.band == "Below Typical"

    # Above median fare -> 50-75 (Above Typical)
    p_above = calculate_percentile(fares, 5500)
    assert 50.0 < p_above.percentile <= 75.0
    assert p_above.band == "Above Typical"

    # Top fare -> 75-100 (High)
    p_high = calculate_percentile(fares, 8500)
    assert p_high.percentile > 75.0
    assert p_high.band == "High"


def test_volatility_bands():
    # Very steady fares -> low volatility < 5%
    steady = np.array([5000, 5050, 4980, 5020, 5010])
    v_low = calculate_volatility(steady)
    assert v_low.category == "Low"
    assert v_low.volatility_index < 5.0

    # Moderate volatility (5% to 10%)
    mod = np.array([4500, 4800, 5200, 5100, 4700, 5400])
    v_mod = calculate_volatility(mod)
    assert v_mod.category in ["Moderate", "High"]

    # Highly volatile fares (> 20%)
    wild = np.array([2000, 8000, 3500, 9500, 1500, 7000])
    v_wild = calculate_volatility(wild)
    assert v_wild.category == "Very High"
    assert v_wild.volatility_index > 20.0


def test_recent_direction_trend():
    # Increasing trend over 14 days
    dates = pd.date_range("2026-09-01", periods=14, freq="D").strftime("%Y-%m-%d")
    fares_up = [3000] * 7 + [4000] * 7
    df_up = pd.DataFrame({"date": dates, "fare": fares_up})
    res_up = calculate_recent_direction(df_up)
    assert res_up.direction == "Increasing"
    assert res_up.change_pct > 2.0

    # Decreasing trend
    fares_down = [4500] * 7 + [3200] * 7
    df_down = pd.DataFrame({"date": dates, "fare": fares_down})
    res_down = calculate_recent_direction(df_down)
    assert res_down.direction == "Decreasing"
    assert res_down.change_pct < -2.0

    # Stable trend (within +-2%)
    fares_stable = [5000] * 7 + [5050] * 7
    df_stable = pd.DataFrame({"date": dates, "fare": fares_stable})
    res_stable = calculate_recent_direction(df_stable)
    assert res_stable.direction == "Stable"
    assert -2.0 <= res_stable.change_pct <= 2.0


def test_distribution_bins():
    fares = np.array([1000, 1500, 2000, 2500, 3000, 3500, 4000, 5000])
    bins = build_distribution_bins(fares, current_fare=2200, num_bins=5)
    assert len(bins) == 5
    current_bins = [b for b in bins if b.is_current]
    assert len(current_bins) == 1
    assert current_bins[0].bin_start <= 2200 <= current_bins[0].bin_end
