"""Routes and airlines metadata endpoints."""

from typing import List
from fastapi import APIRouter, HTTPException
import pandas as pd

from ..schemas import ApiResponse, RouteInfo
from ..core.data_loader import load_dataset
from ..core.geo import AIRPORTS, haversine_distance_km

router = APIRouter(tags=["Routes"])


@router.get("/routes", response_model=ApiResponse[List[RouteInfo]])
def get_routes():
    """Retrieve all available domestic routes with geographic metadata."""
    try:
        df = load_dataset()
        route_list: List[RouteInfo] = []
        unique_routes = sorted(df["route"].unique().tolist())

        for r in unique_routes:
            sub = df[df["route"] == r]
            origin_code = sub["origin"].iloc[0]
            dest_code = sub["destination"].iloc[0]

            origin = AIRPORTS.get(origin_code)
            dest = AIRPORTS.get(dest_code)

            if not origin or not dest:
                continue

            dist = haversine_distance_km(origin.lat, origin.lon, dest.lat, dest.lon)
            min_date = str(sub["date"].min())
            max_date = str(sub["date"].max())
            default_fare = float(sub[sub["date"] == max_date]["fare"].median())
            airlines = sorted(sub["airline"].unique().tolist())

            route_list.append(
                RouteInfo(
                    route=r,
                    origin=origin,
                    destination=dest,
                    distance_km=round(dist, 1),
                    total_records=len(sub),
                    min_date=min_date,
                    max_date=max_date,
                    default_fare=round(default_fare, 0),
                    airlines=airlines,
                )
            )

        return ApiResponse(data=route_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/airlines", response_model=ApiResponse[List[str]])
def get_airlines():
    """Retrieve all distinct airlines present in the airfare dataset."""
    try:
        df = load_dataset()
        airlines = sorted(df["airline"].unique().tolist())
        return ApiResponse(data=airlines)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
