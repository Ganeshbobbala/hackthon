"""Model validation and rolling-origin backtest endpoint."""

from fastapi import APIRouter, HTTPException, Query
from ..schemas import ApiResponse, ValidationData
from ..core.data_loader import load_dataset, get_route_dataframe
from ..core.validation import run_rolling_origin_validation, build_per_route_table

router = APIRouter(tags=["Validation"])

# Cache for the full per-route table
_CACHED_PER_ROUTE_TABLE = None


@router.get("/validation", response_model=ApiResponse[ValidationData])
def get_validation(
    route: str = Query(..., description="Route code (e.g., DEL-BLR)"),
):
    """Retrieve rolling-origin backtest metrics (MAE, RMSE, MAPE, coverage) and baseline comparison."""
    global _CACHED_PER_ROUTE_TABLE

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
        val_data = run_rolling_origin_validation(df_route, route_clean, k_folds=4, horizon_days=7)

        if _CACHED_PER_ROUTE_TABLE is None:
            _CACHED_PER_ROUTE_TABLE = build_per_route_table(df)

        val_data.per_route_table = _CACHED_PER_ROUTE_TABLE
        return ApiResponse(data=val_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation computation error: {str(e)}")
