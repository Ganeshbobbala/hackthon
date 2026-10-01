"""Tests for explainable heuristic Buy-Wait rule engine."""

import pytest
from app.core.heuristic import evaluate_heuristic_signal
from app.schemas import WindowStatistics, PercentileResult, VolatilityResult, TrendResult


def make_dummy_stats(q1=3000.0, median=4000.0, q3=5000.0, iqr=2000.0, n=60):
    return WindowStatistics(
        window_days=60,
        median=median,
        mean=median,
        min=2000.0,
        max=7000.0,
        q1=q1,
        q3=q3,
        iqr=iqr,
        std=500.0,
        n=n,
    )


def test_heuristic_buy_now():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=15.0, band="Relatively Low", sentence="...")
    vol = VolatilityResult(volatility_index=6.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Stable", change_pct=0.0, recent_median=4000.0, previous_median=4000.0, description="")

    res = evaluate_heuristic_signal(2500.0, stats, pct, vol, trend)
    assert res.signal == "BUY NOW"
    assert any("BUY NOW" in rule for rule in res.rule_trace)
    assert not res.anomaly_flag


def test_heuristic_consider_buying():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=35.0, band="Below Typical", sentence="...")
    vol = VolatilityResult(volatility_index=7.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Stable", change_pct=0.0, recent_median=4000.0, previous_median=4000.0, description="")

    res = evaluate_heuristic_signal(3400.0, stats, pct, vol, trend)
    assert res.signal == "CONSIDER BUYING"


def test_heuristic_neutral_monitor():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=50.0, band="Above Typical", sentence="...")
    vol = VolatilityResult(volatility_index=8.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Stable", change_pct=0.0, recent_median=4000.0, previous_median=4000.0, description="")

    res = evaluate_heuristic_signal(4000.0, stats, pct, vol, trend)
    assert res.signal == "NEUTRAL / MONITOR"


def test_heuristic_consider_waiting():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=70.0, band="Above Typical", sentence="...")
    vol = VolatilityResult(volatility_index=8.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Stable", change_pct=0.0, recent_median=4000.0, previous_median=4000.0, description="")

    res = evaluate_heuristic_signal(4800.0, stats, pct, vol, trend)
    assert res.signal == "CONSIDER WAITING"


def test_heuristic_wait_price_high():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=85.0, band="High", sentence="...")
    vol = VolatilityResult(volatility_index=8.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Stable", change_pct=0.0, recent_median=4000.0, previous_median=4000.0, description="")

    res = evaluate_heuristic_signal(6000.0, stats, pct, vol, trend)
    assert res.signal == "WAIT / PRICE HIGH"


def test_heuristic_modifiers_anomaly_and_caution():
    # Outlier fare > Q3 + 1.5 * IQR = 5000 + 1.5*2000 = 8000
    stats = make_dummy_stats(q3=5000.0, iqr=2000.0)
    pct = PercentileResult(percentile=98.0, band="High", sentence="...")
    vol = VolatilityResult(volatility_index=24.0, category="Very High", formula="", explanation="")
    trend = TrendResult(direction="Increasing", change_pct=12.0, recent_median=5500.0, previous_median=4900.0, description="")

    res = evaluate_heuristic_signal(8500.0, stats, pct, vol, trend)
    assert res.signal == "WAIT / PRICE HIGH"
    assert res.anomaly_flag is True
    assert res.caution_flag is True
    assert any("anomaly" in r.lower() for r in res.reasons)
    assert any("volatility caution" in r.lower() for r in res.reasons)


def test_heuristic_modifier_low_but_rising():
    stats = make_dummy_stats()
    pct = PercentileResult(percentile=30.0, band="Below Typical", sentence="...")
    vol = VolatilityResult(volatility_index=6.0, category="Moderate", formula="", explanation="")
    trend = TrendResult(direction="Increasing", change_pct=8.5, recent_median=3500.0, previous_median=3200.0, description="")

    res = evaluate_heuristic_signal(3200.0, stats, pct, vol, trend)
    assert res.signal == "CONSIDER BUYING"
    assert any("Momentum warning" in r or "rising" in r.lower() for r in res.reasons)
