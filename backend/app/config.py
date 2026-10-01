"""Configuration for Fare Radar Pro Backend."""

from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "FARE RADAR PRO"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    DESCRIPTION: str = "Airfare Intelligence Dashboard with Explainable Buy-Wait Signal (PS-025)"
    
    # Paths
    BASE_DIR: Path = Path(__file__).resolve().parent
    DATA_DIR: Path = BASE_DIR / "data"
    DEFAULT_CSV_PATH: Path = DATA_DIR / "airfare_history.csv"
    AIRPORTS_JSON_PATH: Path = DATA_DIR / "airports.json"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Fare sanitization / clamps
    MIN_FARE: float = 500.0
    MAX_FARE: float = 100000.0
    DEFAULT_WINDOW: int = 60
    
    # Forecasting
    MIN_OBSERVATIONS_FOR_FORECAST: int = 30
    FORECAST_HORIZON_DAYS: int = 7
    INTERVAL_WIDTH: float = 0.8  # 80% confidence interval
    
    # File upload limits (5MB)
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024

    class Config:
        case_sensitive = True


settings = Settings()
