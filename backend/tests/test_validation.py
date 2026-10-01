"""Tests for rolling-origin backtest validation and leakage prevention."""

import numpy as np
import pandas as pd
import pytest

from app.core.validation import (
    compute_metrics,
    compute_coverage,
    run_rolling_origin_validation,
)


def test_compute_metrics_known_arrays():
    actuals = np.array([100.0, 200.0, 300.0])
    predictions = np.array([110.0, 190.0, 330.0])
    # errors: +10, -10, +30 -> abs errors: 10, 10, 30 -> MAE = 50 / 3 ≈ 16.7
    # squared: 100 + 100 + 900 = 1100 -> RMSE = sqrt(1100/3) ≈ 19.1
    # percentage: 10/100, 10/200, 30/300 = 0.10 + 0.05 + 0.10 = 0.25 / 3 ≈ 8.33%
    mae, rmse, mape = compute_metrics(actuals, predictions)

    assert pytest.approx(mae, 0.1) == 16.7
    assert pytest.approx(rmse, 0.1) == 19.1
    assert pytest.approx(mape, 0.1) == 8.33


def test_compute_coverage():
    actuals = np.array([100.0, 200.0, 300.0, 400.0])
    lowers = np.array([90.0, 210.0, 280.0, 350.0])
    uppers = np.array([110.0, 250.0, 320.0, 390.0])
    # 100 in [90, 110] -> Yes
    # 200 in [210, 250] -> No
    # 300 in [280, 320] -> Yes
    # 400 in [350, 390] -> No
    # Coverage: 2/4 = 50%
    cov = compute_coverage(actuals, lowers, uppers)
    assert cov == 50.0


def test_rolling_origin_no_leakage():
    # Build 80 days of synthetic test series
    dates = pd.date_range("2026-06-01", periods=80, freq="D").strftime("%Y-%m-%d")
    fares = 4000.0 + 300.0 * np.sin(np.linspace(0, 10, 80)) + np.random.normal(0, 50, 80)
    df = pd.DataFrame({"date": dates, "fare": fares})

    val = run_rolling_origin_validation(df, "TEST-ROUTE", k_folds=3, horizon_days=7)

    assert len(val.folds) > 0
    for fold in val.folds:
        # Strict temporal split assertion: train_end < test_start <= test_end
        train_end_dt = pd.to_datetime(fold.train_end)
        test_start_dt = pd.to_datetime(fold.test_start)
        test_end_dt = pd.to_datetime(fold.test_end)

        assert train_end_dt < test_start_dt, f"Data leakage detected! Train end {fold.train_end} is not before test start {fold.test_start}"
        assert test_start_dt <= test_end_dt
        assert fold.mae >= 0
        assert fold.rmse >= fold.mae  # Mathematical property: RMSE >= MAE


def test_insufficient_data_validation():
    # Only 10 days of data
    dates = pd.date_range("2026-09-01", periods=10, freq="D").strftime("%Y-%m-%d")
    df = pd.DataFrame({"date": dates, "fare": [4000.0] * 10})
    val = run_rolling_origin_validation(df, "SHORT-ROUTE")

    assert len(val.folds) == 0
    assert "insufficient" in val.disclaimer.lower()
