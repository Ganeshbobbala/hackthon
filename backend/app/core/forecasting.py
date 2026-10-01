"""Forecasting engine with Prophet support and seasonal-trend ML fallback.

Calculates 7-day indicative forecast with an 80% prediction interval and weekly seasonality.
Strictly requires at least 30 observations; otherwise returns available=False with explanation.
Uses in-memory caching per route and data hash.
"""

import hashlib
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge

from ..config import settings
from ..schemas import ForecastData, ForecastPoint, HistoryPoint

# Try importing Prophet if installed in environment
try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

# In-memory cache: hash_key -> ForecastData
_FORECAST_CACHE: Dict[str, ForecastData] = {}


def compute_data_hash(df_route: pd.DataFrame) -> str:
    """Compute MD5 hash of route dates and fares to validate cache freshness."""
    sub = df_route[["date", "fare"]].sort_values("date")
    raw_str = sub.to_json(orient="values")
    return hashlib.md5(raw_str.encode("utf-8")).hexdigest()


def run_seasonal_regression_forecast(
    daily_df: pd.DataFrame,
    horizon_days: int = 7,
    interval_width: float = 0.8,
) -> Tuple[List[ForecastPoint], str]:
    """Scikit-Learn seasonal-trend forecast engine with weekly seasonality and 80% intervals.

    Decomposes series into:
    - Linear/Ridge trend over time t
    - 7-day cyclical seasonality (day-of-week one-hot encoding)
    - Residual standard error mapped to 80% normal prediction interval (z ≈ 1.282)
    """
    df = daily_df.copy()
    df["dt"] = pd.to_datetime(df["date"])
    df = df.sort_values("dt").reset_index(drop=True)

    start_date = df["dt"].min()
    df["t"] = (df["dt"] - start_date).dt.days
    df["dow"] = df["dt"].dt.weekday

    # One-hot encode day of week (0 to 6)
    dow_dummies = pd.get_dummies(df["dow"], prefix="dow", drop_first=True)
    for dow_idx in range(1, 7):
        col = f"dow_{dow_idx}"
        if col not in dow_dummies.columns:
            dow_dummies[col] = 0

    X = pd.concat([df[["t"]], dow_dummies[[f"dow_{i}" for i in range(1, 7)]]], axis=1)
    y = df["fare"].values

    # Fit Ridge regularized regression with mild L2 regularization
    model = Ridge(alpha=1.0)
    model.fit(X, y)

    # In-sample residual variance
    y_pred = model.predict(X)
    residuals = y - y_pred
    dof = max(1, len(y) - X.shape[1] - 1)
    sigma = np.sqrt(np.sum(residuals ** 2) / dof)

    # z-score for 80% confidence interval: scipy.stats.norm.ppf(0.9) ≈ 1.28155
    z_score = 1.28155

    # Generate future horizon points
    last_dt = df["dt"].max()
    future_points: List[ForecastPoint] = []

    for h in range(1, horizon_days + 1):
        future_dt = last_dt + pd.Timedelta(days=h)
        future_t = (future_dt - start_date).days
        future_dow = future_dt.weekday()

        future_row = {"t": future_t}
        for dow_idx in range(1, 7):
            future_row[f"dow_{dow_idx}"] = 1 if future_dow == dow_idx else 0

        X_future = pd.DataFrame([future_row])
        pred_yhat = float(model.predict(X_future)[0])

        # Mild horizon uncertainty expansion
        horizon_uncertainty = sigma * np.sqrt(1.0 + 0.08 * h)
        yhat_lower = max(500.0, pred_yhat - z_score * horizon_uncertainty)
        yhat_upper = pred_yhat + z_score * horizon_uncertainty

        future_points.append(
            ForecastPoint(
                date=future_dt.strftime("%Y-%m-%d"),
                yhat=round(pred_yhat, 1),
                yhat_lower=round(yhat_lower, 1),
                yhat_upper=round(yhat_upper, 1),
            )
        )

    return future_points, "Seasonal-Trend Regression (Weekly Seasonality + 80% Confidence Interval)"


def run_prophet_forecast(
    daily_df: pd.DataFrame,
    horizon_days: int = 7,
    interval_width: float = 0.8,
) -> Tuple[List[ForecastPoint], str]:
    """Fit Facebook Prophet model with weekly seasonality."""
    df_prophet = daily_df.rename(columns={"date": "ds", "fare": "y"})[["ds", "y"]].copy()

    m = Prophet(
        interval_width=interval_width,
        weekly_seasonality=True,
        daily_seasonality=False,
        yearly_seasonality=False,
    )
    m.fit(df_prophet)

    future = m.make_future_dataframe(periods=horizon_days, freq="D")
    forecast = m.predict(future)

    future_slice = forecast.tail(horizon_days)
    points: List[ForecastPoint] = []
    for _, row in future_slice.iterrows():
        points.append(
            ForecastPoint(
                date=pd.to_datetime(row["ds"]).strftime("%Y-%m-%d"),
                yhat=round(float(row["yhat"]), 1),
                yhat_lower=round(float(max(500.0, row["yhat_lower"])), 1),
                yhat_upper=round(float(row["yhat_upper"]), 1),
            )
        )

    return points, "Facebook Prophet (Weekly Seasonality, interval_width=0.8)"


def generate_forecast(
    df_route: pd.DataFrame,
    route: str,
    horizon_days: int = 7,
) -> ForecastData:
    """Generate 7-day indicative forecast or return informative unavailablity."""
    if df_route.empty:
        return ForecastData(
            route=route,
            available=False,
            reason="No data records available for this route.",
        )

    # Daily aggregation
    daily = df_route.groupby("date")["fare"].median().sort_index().reset_index()
    n_obs = len(daily)

    # Minimum 30 observations check
    if n_obs < settings.MIN_OBSERVATIONS_FOR_FORECAST:
        return ForecastData(
            route=route,
            available=False,
            reason=(
                f"At least {settings.MIN_OBSERVATIONS_FOR_FORECAST} observations are required for an indicative forecast. "
                f"Selected route has only {n_obs} daily observations."
            ),
        )

    # Check cache
    cache_key = f"{route}_{n_obs}_{compute_data_hash(df_route)}_{horizon_days}"
    if cache_key in _FORECAST_CACHE:
        return _FORECAST_CACHE[cache_key]

    # Run forecasting engine
    if PROPHET_AVAILABLE:
        try:
            points, method_name = run_prophet_forecast(daily, horizon_days, settings.INTERVAL_WIDTH)
        except Exception:
            points, method_name = run_seasonal_regression_forecast(daily, horizon_days, settings.INTERVAL_WIDTH)
    else:
        points, method_name = run_seasonal_regression_forecast(daily, horizon_days, settings.INTERVAL_WIDTH)

    # Extract historical points for chart context (last 30 days)
    history_slice = daily.tail(30)
    history_points = [
        HistoryPoint(date=str(row["date"]), fare=round(float(row["fare"]), 1))
        for _, row in history_slice.iterrows()
    ]

    result = ForecastData(
        route=route,
        available=True,
        reason=None,
        history=history_points,
        forecast=points,
        interval_width=settings.INTERVAL_WIDTH,
        horizon_days=horizon_days,
        method=method_name,
    )

    _FORECAST_CACHE[cache_key] = result
    return result
