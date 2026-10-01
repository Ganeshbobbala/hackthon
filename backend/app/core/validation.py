"""Rolling-origin backtesting and model validation engine.

Ensures strict zero-leakage temporal evaluation across K walk-forward folds.
Evaluates MAE, RMSE, MAPE, and 80% interval coverage against naive baselines.
"""

from typing import Dict, List, Tuple
import numpy as np
import pandas as pd

from ..schemas import (
    ValidationData,
    ValidationFold,
    BaselineComparison,
    RouteValidationSummary,
)
from .forecasting import run_seasonal_regression_forecast


def compute_metrics(actuals: np.ndarray, predictions: np.ndarray) -> Tuple[float, float, float]:
    """Calculate MAE, RMSE, and MAPE."""
    if len(actuals) == 0:
        return 0.0, 0.0, 0.0

    errors = actuals - predictions
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    
    # Avoid division by zero in MAPE
    valid_mask = actuals > 0
    if np.any(valid_mask):
        mape = float(np.mean(np.abs(errors[valid_mask] / actuals[valid_mask])) * 100.0)
    else:
        mape = 0.0

    return round(mae, 1), round(rmse, 1), round(mape, 2)


def compute_coverage(actuals: np.ndarray, lowers: np.ndarray, uppers: np.ndarray) -> float:
    """Calculate the percentage of actuals falling within the prediction band."""
    if len(actuals) == 0:
        return 0.0
    inside = (actuals >= lowers) & (actuals <= uppers)
    coverage = float(np.mean(inside) * 100.0)
    return round(coverage, 1)


def run_rolling_origin_validation(
    df_route: pd.DataFrame,
    route: str,
    k_folds: int = 4,
    horizon_days: int = 7,
) -> ValidationData:
    """Execute rolling-origin backtest strictly without future data leakage."""
    daily = df_route.groupby("date")["fare"].median().sort_index().reset_index()
    n_total = len(daily)

    # If insufficient data for meaningful multi-fold backtesting
    if n_total < 35:
        dummy_comparison = BaselineComparison(
            model_mae=0.0,
            baseline_mae=0.0,
            baseline_type="7-day rolling median",
            beats_baseline=False,
            improvement_pct=0.0,
        )
        return ValidationData(
            route=route,
            folds=[],
            avg_mae=0.0,
            avg_rmse=0.0,
            avg_mape=0.0,
            avg_coverage_pct=0.0,
            baseline_comparison=dummy_comparison,
            per_route_table=[],
            disclaimer=(
                "Insufficient observations for rolling backtest. "
                "At least 35 daily observations are required to conduct a multi-fold backtest."
            ),
        )

    folds: List[ValidationFold] = []
    all_actuals = []
    all_preds = []
    all_baseline_preds = []

    # Step backwards from end: fold 1, 2, 3, 4
    for fold_idx in range(k_folds):
        cutoff_offset = (k_folds - fold_idx) * horizon_days
        cutoff_idx = n_total - cutoff_offset

        if cutoff_idx < 25:
            continue

        train_slice = daily.iloc[:cutoff_idx].copy()
        test_slice = daily.iloc[cutoff_idx : cutoff_idx + horizon_days].copy()

        if len(test_slice) == 0:
            continue

        # Zero leakage: Forecast only uses data <= cutoff
        points, _ = run_seasonal_regression_forecast(train_slice, horizon_days=len(test_slice))

        actuals = test_slice["fare"].values
        preds = np.array([p.yhat for p in points[: len(test_slice)]])
        lowers = np.array([p.yhat_lower for p in points[: len(test_slice)]])
        uppers = np.array([p.yhat_upper for p in points[: len(test_slice)]])

        # Baseline: 7-day median of the training slice
        baseline_pred_val = float(train_slice["fare"].tail(7).median())
        baseline_preds = np.full_like(actuals, baseline_pred_val)

        mae, rmse, mape = compute_metrics(actuals, preds)
        coverage = compute_coverage(actuals, lowers, uppers)

        folds.append(
            ValidationFold(
                fold=fold_idx + 1,
                train_end=str(train_slice["date"].max()),
                test_start=str(test_slice["date"].min()),
                test_end=str(test_slice["date"].max()),
                mae=mae,
                rmse=rmse,
                mape=mape,
                coverage_pct=coverage,
            )
        )

        all_actuals.extend(actuals)
        all_preds.extend(preds)
        all_baseline_preds.extend(baseline_preds)

    actuals_arr = np.array(all_actuals)
    preds_arr = np.array(all_preds)
    baseline_arr = np.array(all_baseline_preds)

    avg_mae, avg_rmse, avg_mape = compute_metrics(actuals_arr, preds_arr)
    base_mae, _, _ = compute_metrics(actuals_arr, baseline_arr)

    avg_coverage = round(float(np.mean([f.coverage_pct for f in folds])), 1) if folds else 0.0

    beats = avg_mae < base_mae
    improvement = round(((base_mae - avg_mae) / base_mae) * 100.0, 1) if base_mae > 0 else 0.0

    comparison = BaselineComparison(
        model_mae=avg_mae,
        baseline_mae=base_mae,
        baseline_type="7-day rolling median",
        beats_baseline=beats,
        improvement_pct=improvement,
    )

    return ValidationData(
        route=route,
        folds=folds,
        avg_mae=avg_mae,
        avg_rmse=avg_rmse,
        avg_mape=avg_mape,
        avg_coverage_pct=avg_coverage,
        baseline_comparison=comparison,
        per_route_table=[],  # populated by router across all routes
    )


def build_per_route_table(full_df: pd.DataFrame) -> List[RouteValidationSummary]:
    """Generate unranked summary table across all available routes."""
    summaries: List[RouteValidationSummary] = []
    routes = sorted(full_df["route"].unique().tolist())

    for r in routes:
        sub = full_df[full_df["route"] == r]
        daily = sub.groupby("date")["fare"].median()
        n_obs = len(daily)

        if n_obs < 30:
            summaries.append(
                RouteValidationSummary(
                    route=r,
                    n_observations=n_obs,
                    mae=0.0,
                    rmse=0.0,
                    mape=0.0,
                    coverage_pct=0.0,
                    status="Insufficient Sample (<30)",
                )
            )
        else:
            val_data = run_rolling_origin_validation(sub, r, k_folds=3, horizon_days=7)
            summaries.append(
                RouteValidationSummary(
                    route=r,
                    n_observations=n_obs,
                    mae=val_data.avg_mae,
                    rmse=val_data.avg_rmse,
                    mape=val_data.avg_mape,
                    coverage_pct=val_data.avg_coverage_pct,
                    status="Validated (Rolling Backtest)",
                )
            )

    return summaries
