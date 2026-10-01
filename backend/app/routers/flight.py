"""Flight path and 3D trajectory waypoints endpoint."""

from fastapi import APIRouter, HTTPException, Query
from ..schemas import ApiResponse, FlightPathData
from ..core.geo import generate_flight_path

router = APIRouter(tags=["Flight"])


@router.get("/flight-path", response_model=ApiResponse[FlightPathData])
def get_flight_path(
    route: str = Query(..., description="Route code (e.g., DEL-BLR)"),
):
    """Retrieve 200 great-circle waypoints with altitude profiles, bearings, and distances for 3D flight rendering."""
    try:
        flight_data = generate_flight_path(route.strip().upper(), num_waypoints=200)
        return ApiResponse(data=flight_data)
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flight path error: {str(e)}")
