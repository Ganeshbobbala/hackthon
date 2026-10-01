/**
 * Typed API Client for Fare Radar Pro
 */

export interface Airport {
  code: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
  elevation_m: number;
}

export interface RouteInfo {
  route: string;
  origin: Airport;
  destination: Airport;
  distance_km: number;
  total_records: number;
  min_date: string;
  max_date: string;
  default_fare: number;
  airlines: string[];
}

export interface WindowStatistics {
  window_days: number;
  median: number;
  mean: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  std: number;
  n: number;
}

export interface PercentileResult {
  percentile: number;
  band: string;
  sentence: string;
}

export interface VolatilityResult {
  volatility_index: number;
  category: string;
  formula: string;
  explanation: string;
}

export interface TrendResult {
  direction: string;
  change_pct: number;
  recent_median: number;
  previous_median: number;
  description: string;
}

export interface HeuristicResult {
  signal: "BUY NOW" | "CONSIDER BUYING" | "NEUTRAL / MONITOR" | "CONSIDER WAITING" | "WAIT / PRICE HIGH";
  confidence_label: string;
  reasons: string[];
  rule_trace: string[];
  disclaimer: string;
  anomaly_flag: boolean;
  caution_flag: boolean;
}

export interface ChartDataPoint {
  date: string;
  fare: number;
  rolling_median?: number;
  q1?: number;
  q3?: number;
}

export interface DistributionBin {
  bin_start: number;
  bin_end: number;
  label: string;
  count: number;
  is_current: boolean;
}

export interface AnalysisData {
  route: string;
  airline?: string;
  window: number;
  current_fare: number;
  reference_date: string;
  stats_30?: WindowStatistics;
  stats_60?: WindowStatistics;
  stats_90?: WindowStatistics;
  selected_window_stats: WindowStatistics;
  percentile: PercentileResult;
  volatility: VolatilityResult;
  direction: TrendResult;
  heuristic: HeuristicResult;
  fare_series: ChartDataPoint[];
  distribution: DistributionBin[];
}

export interface ForecastPoint {
  date: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface HistoryPoint {
  date: string;
  fare: number;
}

export interface ForecastData {
  route: string;
  available: boolean;
  reason?: string;
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  interval_width: number;
  horizon_days: number;
  method: string;
  disclaimer: string;
}

export interface ValidationFold {
  fold: number;
  train_end: string;
  test_start: string;
  test_end: string;
  mae: number;
  rmse: number;
  mape: number;
  coverage_pct: number;
}

export interface BaselineComparison {
  model_mae: number;
  baseline_mae: number;
  baseline_type: string;
  beats_baseline: boolean;
  improvement_pct: number;
}

export interface RouteValidationSummary {
  route: string;
  n_observations: number;
  mae: number;
  rmse: number;
  mape: number;
  coverage_pct: number;
  status: string;
}

export interface ValidationData {
  route: string;
  folds: ValidationFold[];
  avg_mae: number;
  avg_rmse: number;
  avg_mape: number;
  avg_coverage_pct: number;
  baseline_comparison: BaselineComparison;
  per_route_table: RouteValidationSummary[];
  disclaimer: string;
}

export interface FlightWaypoint {
  lat: number;
  lon: number;
  alt_ft: number;
  distance_km: number;
  fraction: number;
  bearing_deg: number;
}

export interface FlightPathData {
  route: string;
  origin: Airport;
  destination: Airport;
  distance_km: number;
  suggested_cruise_alt_ft: number;
  waypoints: FlightWaypoint[];
  total_waypoints: number;
}

export interface DataQualitySummary {
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  routes_count: number;
  airlines_count: number;
  start_date: string;
  end_date: string;
  missing_values: number;
  duplicate_rows: number;
  routes_list: string[];
  airlines_list: string[];
  status: string;
  issues: string[];
}

export interface CsvUploadData {
  valid: boolean;
  message: string;
  summary?: DataQualitySummary;
  errors: string[];
}

const API_BASE = "";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
      else if (errJson.error) errorMsg = errJson.error;
    } catch {
      // fallback
    }
    throw new Error(errorMsg);
  }
  const json = await res.json();
  return json.data;
}

export async function fetchRoutes(): Promise<RouteInfo[]> {
  const res = await fetch(`${API_BASE}/api/routes`);
  return handleResponse<RouteInfo[]>(res);
}

export async function fetchAirlines(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/airlines`);
  return handleResponse<string[]>(res);
}

export async function fetchAnalysis(params: {
  route: string;
  airline?: string;
  window: number;
  fare?: number;
}): Promise<AnalysisData> {
  const query = new URLSearchParams();
  query.append("route", params.route);
  if (params.airline && params.airline !== "all") query.append("airline", params.airline);
  query.append("window", params.window.toString());
  if (params.fare !== undefined && params.fare > 0) query.append("fare", params.fare.toString());

  const res = await fetch(`${API_BASE}/api/analysis?${query.toString()}`);
  return handleResponse<AnalysisData>(res);
}

export async function fetchForecast(route: string, horizon: number = 7): Promise<ForecastData> {
  const res = await fetch(`${API_BASE}/api/forecast?route=${encodeURIComponent(route)}&horizon=${horizon}`);
  return handleResponse<ForecastData>(res);
}

export async function fetchValidation(route: string): Promise<ValidationData> {
  const res = await fetch(`${API_BASE}/api/validation?route=${encodeURIComponent(route)}`);
  return handleResponse<ValidationData>(res);
}

export async function fetchFlightPath(route: string): Promise<FlightPathData> {
  const res = await fetch(`${API_BASE}/api/flight-path?route=${encodeURIComponent(route)}`);
  return handleResponse<FlightPathData>(res);
}

export async function fetchDataQuality(): Promise<DataQualitySummary> {
  const res = await fetch(`${API_BASE}/api/data-quality`);
  return handleResponse<DataQualitySummary>(res);
}

export async function uploadCsvFile(file: File): Promise<CsvUploadData> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/upload-csv`, {
    method: "POST",
    body: formData,
  });
  return handleResponse<CsvUploadData>(res);
}
