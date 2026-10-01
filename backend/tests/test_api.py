"""FastAPI TestClient integration tests for all API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200
    json_data = res.json()
    assert json_data["project"] == "FARE RADAR PRO"
    assert "explainable" in json_data["positioning"].lower()


def test_health_endpoint():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


def test_get_routes():
    res = client.get("/api/routes")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data) >= 8
    route_names = [r["route"] for r in data]
    assert "DEL-BLR" in route_names
    assert "BOM-DEL" in route_names


def test_get_airlines():
    res = client.get("/api/airlines")
    assert res.status_code == 200
    airlines = res.json()["data"]
    assert "IndiGo" in airlines
    assert "Air India" in airlines


def test_get_analysis_valid():
    res = client.get("/api/analysis?route=DEL-BLR&window=60&fare=4850")
    assert res.status_code == 200
    data = res.json()["data"]

    assert data["route"] == "DEL-BLR"
    assert data["window"] == 60
    assert data["current_fare"] == 4850.0
    assert "percentile" in data
    assert "volatility" in data
    assert "heuristic" in data
    assert data["heuristic"]["signal"] in [
        "BUY NOW",
        "CONSIDER BUYING",
        "NEUTRAL / MONITOR",
        "CONSIDER WAITING",
        "WAIT / PRICE HIGH",
    ]
    assert len(data["fare_series"]) > 0
    assert len(data["distribution"]) > 0


def test_get_analysis_invalid_route():
    res = client.get("/api/analysis?route=NON-EXISTENT")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()


def test_get_analysis_invalid_fare():
    res = client.get("/api/analysis?route=DEL-BLR&fare=-500")
    assert res.status_code == 422
    assert "positive" in res.json()["detail"].lower()


def test_get_analysis_invalid_window():
    res = client.get("/api/analysis?route=DEL-BLR&window=45")
    assert res.status_code == 422
    assert "window" in res.json()["detail"].lower()


def test_get_forecast_standard_route():
    res = client.get("/api/forecast?route=DEL-BLR&horizon=7")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["available"] is True
    assert len(data["forecast"]) == 7
    for pt in data["forecast"]:
        assert pt["yhat_lower"] <= pt["yhat"] <= pt["yhat_upper"]


def test_get_forecast_short_route_insufficient_data():
    # GOI-BLR has only 14 observations
    res = client.get("/api/forecast?route=GOI-BLR&horizon=7")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["available"] is False
    assert "at least 30 observations" in data["reason"].lower()


def test_get_validation():
    res = client.get("/api/validation?route=DEL-BLR")
    assert res.status_code == 200
    data = res.json()["data"]
    assert len(data["folds"]) > 0
    assert data["avg_mae"] > 0
    assert "baseline_comparison" in data
    assert len(data["per_route_table"]) > 0


def test_get_flight_path():
    res = client.get("/api/flight-path?route=DEL-BLR")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["total_waypoints"] == 200
    assert len(data["waypoints"]) == 200
    assert data["distance_km"] > 1600


def test_get_data_quality():
    res = client.get("/api/data-quality")
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["valid_rows"] > 0
    assert data["routes_count"] >= 8


def test_upload_csv_endpoint():
    sample_csv = (
        "date,route,origin,destination,airline,fare\n"
        "2026-09-01,DEL-BLR,DEL,BLR,IndiGo,4800\n"
    )
    files = {"file": ("test.csv", sample_csv, "text/csv")}
    res = client.post("/api/upload-csv", files=files)
    assert res.status_code == 200
    assert res.json()["data"]["valid"] is True
