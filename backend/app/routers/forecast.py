"""Forecast endpoint router."""

from fastapi import APIRouter, HTTPException, Query
from ..schemas import ApiResponse, ForecastData
from ..core.data_loader import load_dataset, get_route_dataframe
from ..core.forecasting import generate_forecast

router = APIRouter(tags=["Forecast"])


@router.get("/forecast", response_model=ApiResponse[ForecastData])
def get_forecast(
    route: str = Query(..., description="Route code (e.g., DEL-BLR)"),
    horizon: int = Query(7, ge=1, le=14, description="Forecast horizon in days (default 7)"),
):
    """Retrieve 7-day indicative airfare forecast with 80% uncertainty interval."""
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

    try:
        df_route = get_route_dataframe(df, route_clean)
        forecast_result = generate_forecast(df_route, route_clean, horizon_days=horizon)
        return ApiResponse(data=forecast_result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")
