"""Airfare statistical analysis, percentile ranking, and explainable signal router."""

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
import numpy as np
import pandas as pd

from ..config import settings
from ..schemas import ApiResponse, AnalysisData
from ..core.data_loader import load_dataset, get_route_dataframe, get_reference_date
from ..core.statistics import (
    calculate_window_statistics,
    calculate_percentile,
    build_distribution_bins,
    build_chart_series,
)
from ..core.volatility import calculate_volatility
from ..core.trend import calculate_recent_direction
from ..core.heuristic import evaluate_heuristic_signal

router = APIRouter(tags=["Analysis"])


@router.get("/analysis", response_model=ApiResponse[AnalysisData])
def get_analysis(
    route: str = Query(..., description="Route code (e.g., DEL-BLR)"),
    airline: Optional[str] = Query(None, description="Airline filter (optional or 'all')"),
    window: int = Query(60, description="Analysis window in days (30, 60, or 90)"),
    fare: Optional[float] = Query(None, description="Current fare to evaluate in INR"),
):
    """Perform statistical analysis, percentile ranking, and explainable Buy-Wait signal generation."""
    try:
        df = load_dataset()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database load error: {str(e)}")

    route_clean = route.strip().upper()
    if route_clean not in df["route"].values:
        available_routes = sorted(df["route"].unique().tolist())
        raise HTTPException(
            status_code=404,
            detail=f"Route '{route_clean}' not found. Available routes: {available_routes}",
        )

    if window not in [30, 60, 90]:
        raise HTTPException(
            status_code=422,
            detail=f"Window must be one of [30, 60, 90] days. Received: {window}",
        )

    # Validate and clamp current fare
    if fare is not None:
        if np.isnan(fare) or np.isinf(fare) or fare <= 0:
            raise HTTPException(
                status_code=422,
                detail=f"Fare must be a positive numeric value greater than zero. Received: {fare}",
            )
        # Sane clamping
        current_fare = float(max(settings.MIN_FARE, min(settings.MAX_FARE, fare)))
    else:
        # Default to latest median fare for route
        latest_date = get_reference_date(df, route_clean)
        sub_latest = df[(df["route"] == route_clean) & (df["date"] == latest_date)]
        current_fare = float(sub_latest["fare"].median()) if not sub_latest.empty else 4500.0

    ref_date = get_reference_date(df, route_clean)

    # Slice data for full route, and for 30, 60, 90 windows
    try:
        df_full_route = get_route_dataframe(df, route_clean, airline=airline)
        df_30 = get_route_dataframe(df, route_clean, airline=airline, window_days=30)
        df_60 = get_route_dataframe(df, route_clean, airline=airline, window_days=60)
        df_90 = get_route_dataframe(df, route_clean, airline=airline, window_days=90)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))

    # Window statistics
    stats_30 = calculate_window_statistics(df_30["fare"].values, 30)
    stats_60 = calculate_window_statistics(df_60["fare"].values, 60)
    stats_90 = calculate_window_statistics(df_90["fare"].values, 90)

    # Selected window
    if window == 30:
        selected_stats = stats_30
        df_selected = df_30
    elif window == 60:
        selected_stats = stats_60
        df_selected = df_60
    else:
        selected_stats = stats_90
        df_selected = df_90

    selected_fares = df_selected["fare"].values

    # Core analytics
    percentile_res = calculate_percentile(selected_fares, current_fare)
    volatility_res = calculate_volatility(selected_fares)
    direction_res = calculate_recent_direction(df_full_route)
    heuristic_res = evaluate_heuristic_signal(
        current_fare=current_fare,
        window_stats=selected_stats,
        percentile_res=percentile_res,
        volatility_res=volatility_res,
        trend_res=direction_res,
    )

    chart_series = build_chart_series(df_selected, selected_stats.q1, selected_stats.q3)
    distribution_bins = build_distribution_bins(selected_fares, current_fare, num_bins=10)

    analysis_data = AnalysisData(
        route=route_clean,
        airline=airline if airline and airline.lower() != "all" else None,
        window=window,
        current_fare=round(current_fare, 0),
        reference_date=ref_date,
        stats_30=stats_30,
        stats_60=stats_60,
        stats_90=stats_90,
        selected_window_stats=selected_stats,
        percentile=percentile_res,
        volatility=volatility_res,
        direction=direction_res,
        heuristic=heuristic_res,
        fare_series=chart_series,
        distribution=distribution_bins,
    )

    return ApiResponse(data=analysis_data)
