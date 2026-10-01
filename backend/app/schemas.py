"""Pydantic v2 Schemas for Fare Radar Pro."""

from typing import Generic, List, Optional, TypeVar, Dict, Any
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    status: str = Field(default="success", description="Status code: 'success' or 'error'")
    data: Optional[T] = Field(default=None, description="Payload data when status is success")
    error: Optional[str] = Field(default=None, description="Error message when status is error")


class Airport(BaseModel):
    code: str
    name: str
    city: str
    lat: float
    lon: float
    elevation_m: float


class RouteInfo(BaseModel):
    route: str
    origin: Airport
    destination: Airport
    distance_km: float
    total_records: int
    min_date: str
    max_date: str
    default_fare: float
    airlines: List[str]


class WindowStatistics(BaseModel):
    window_days: int
    median: float
    mean: float
    min: float
    max: float
    q1: float
    q3: float
    iqr: float
    std: float
    n: int


class PercentileResult(BaseModel):
    percentile: float
    band: str
    sentence: str


class VolatilityResult(BaseModel):
    volatility_index: float
    category: str
    formula: str
    explanation: str


class TrendResult(BaseModel):
    direction: str
    change_pct: float
    recent_median: float
    previous_median: float
    description: str


class HeuristicResult(BaseModel):
    signal: str
    confidence_label: str
    reasons: List[str]
    rule_trace: List[str]
    disclaimer: str
    anomaly_flag: bool
    caution_flag: bool


class ChartDataPoint(BaseModel):
    date: str
    fare: float
    rolling_median: Optional[float] = None
    q1: Optional[float] = None
    q3: Optional[float] = None


class DistributionBin(BaseModel):
    bin_start: float
    bin_end: float
    label: str
    count: int
    is_current: bool = False


class AnalysisData(BaseModel):
    route: str
    airline: Optional[str] = None
    window: int
    current_fare: float
    reference_date: str
    stats_30: Optional[WindowStatistics] = None
    stats_60: Optional[WindowStatistics] = None
    stats_90: Optional[WindowStatistics] = None
    selected_window_stats: WindowStatistics
    percentile: PercentileResult
    volatility: VolatilityResult
    direction: TrendResult
    heuristic: HeuristicResult
    fare_series: List[ChartDataPoint]
    distribution: List[DistributionBin]


class ForecastPoint(BaseModel):
    date: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class HistoryPoint(BaseModel):
    date: str
    fare: float


class ForecastData(BaseModel):
    route: str
    available: bool
    reason: Optional[str] = None
    history: List[HistoryPoint] = []
    forecast: List[ForecastPoint] = []
    interval_width: float = 0.8
    horizon_days: int = 7
    method: str = "Prophet / Seasonal Trend"
    disclaimer: str = (
        "Indicative forecast based on historical price movements and day-of-week seasonality. "
        "Not a guarantee of future ticket prices."
    )


class ValidationFold(BaseModel):
    fold: int
    train_end: str
    test_start: str
    test_end: str
    mae: float
    rmse: float
    mape: float
    coverage_pct: float


class BaselineComparison(BaseModel):
    model_mae: float
    baseline_mae: float
    baseline_type: str = "7-day rolling median"
    beats_baseline: bool
    improvement_pct: float


class RouteValidationSummary(BaseModel):
    route: str
    n_observations: int
    mae: float
    rmse: float
    mape: float
    coverage_pct: float
    status: str


class ValidationData(BaseModel):
    route: str
    folds: List[ValidationFold]
    avg_mae: float
    avg_rmse: float
    avg_mape: float
    avg_coverage_pct: float
    baseline_comparison: BaselineComparison
    per_route_table: List[RouteValidationSummary]
    disclaimer: str = (
        "Historical validation — not a guarantee of future performance. "
        "Models were strictly evaluated on rolling-origin backtests without future data leakage."
    )


class FlightWaypoint(BaseModel):
    lat: float
    lon: float
    alt_ft: float
    distance_km: float
    fraction: float
    bearing_deg: float


class FlightPathData(BaseModel):
    route: str
    origin: Airport
    destination: Airport
    distance_km: float
    suggested_cruise_alt_ft: float
    waypoints: List[FlightWaypoint]
    total_waypoints: int


class DataQualitySummary(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    routes_count: int
    airlines_count: int
    start_date: str
    end_date: str
    missing_values: int
    duplicate_rows: int
    routes_list: List[str]
    airlines_list: List[str]
    status: str
    issues: List[str]


class CsvUploadData(BaseModel):
    valid: bool
    message: str
    summary: Optional[DataQualitySummary] = None
    errors: List[str] = []
