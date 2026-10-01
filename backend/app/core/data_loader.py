"""Data loading, cleaning, validation, and quality assessment."""

import io
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

from ..config import settings
from ..schemas import DataQualitySummary, Airport
from .geo import AIRPORTS, haversine_distance_km

REQUIRED_COLUMNS = ["date", "route", "origin", "destination", "airline", "fare"]

# Global in-memory cache for the primary DataFrame
_CACHED_DF: Optional[pd.DataFrame] = None
_CACHED_QUALITY: Optional[DataQualitySummary] = None


def clean_and_validate_dataframe(raw_df: pd.DataFrame) -> Tuple[pd.DataFrame, DataQualitySummary]:
    """Clean, type-coerce, validate, and compute quality summary for an airfare DataFrame."""
    issues: List[str] = []
    initial_rows = len(raw_df)

    # 1. Check required columns
    missing_cols = [col for col in REQUIRED_COLUMNS if col not in raw_df.columns]
    if missing_cols:
        raise ValueError(f"Missing required column(s): {', '.join(missing_cols)}")

    df = raw_df.copy()

    # 2. Check missing values
    missing_count = int(df[REQUIRED_COLUMNS].isna().sum().sum())
    if missing_count > 0:
        issues.append(f"Found and dropped {missing_count} missing values across required columns.")
        df = df.dropna(subset=REQUIRED_COLUMNS)

    # 3. Date parsing
    try:
        df["date"] = pd.to_datetime(df["date"]).dt.strftime("%Y-%m-%d")
    except Exception as e:
        raise ValueError(f"Date parsing failed: {str(e)}")

    # 4. Numeric fare coercion & sanitization
    df["fare"] = pd.to_numeric(df["fare"], errors="coerce")
    invalid_fares = df["fare"].isna() | (df["fare"] <= 0)
    invalid_count = int(invalid_fares.sum())
    if invalid_count > 0:
        issues.append(f"Removed {invalid_count} records with non-positive or unparseable fares.")
        df = df[~invalid_fares]

    # 5. Route normalization
    df["route"] = df["route"].astype(str).str.strip().str.upper()
    df["origin"] = df["origin"].astype(str).str.strip().str.upper()
    df["destination"] = df["destination"].astype(str).str.strip().str.upper()
    df["airline"] = df["airline"].astype(str).str.strip()

    # 6. Duplicate removal
    dup_count = int(df.duplicated(subset=["date", "route", "airline"]).sum())
    if dup_count > 0:
        issues.append(f"Deduplicated {dup_count} duplicate records for same date, route, and airline.")
        df = df.drop_duplicates(subset=["date", "route", "airline"])

    # 7. Sort by date ascending
    df = df.sort_values(by=["date", "route", "airline"]).reset_index(drop=True)

    valid_rows = len(df)
    invalid_rows = initial_rows - valid_rows

    if valid_rows == 0:
        raise ValueError("No valid records remain after dataset cleaning.")

    start_date = str(df["date"].min())
    end_date = str(df["date"].max())
    routes_list = sorted(df["route"].unique().tolist())
    airlines_list = sorted(df["airline"].unique().tolist())

    status = "valid"
    if invalid_rows > 0:
        status = "warning"

    quality = DataQualitySummary(
        total_rows=initial_rows,
        valid_rows=valid_rows,
        invalid_rows=invalid_rows,
        routes_count=len(routes_list),
        airlines_count=len(airlines_list),
        start_date=start_date,
        end_date=end_date,
        missing_values=missing_count,
        duplicate_rows=dup_count,
        routes_list=routes_list,
        airlines_list=airlines_list,
        status=status,
        issues=issues,
    )

    return df, quality


def load_dataset(csv_path: Optional[Path] = None, force_reload: bool = False) -> pd.DataFrame:
    """Load and cache the standard dataset from CSV."""
    global _CACHED_DF, _CACHED_QUALITY

    if _CACHED_DF is not None and not force_reload:
        return _CACHED_DF

    target_path = csv_path or settings.DEFAULT_CSV_PATH
    if not target_path.exists():
        raise FileNotFoundError(f"Airfare history CSV not found at {target_path}")

    raw_df = pd.read_csv(target_path)
    df, quality = clean_and_validate_dataframe(raw_df)
    _CACHED_DF = df
    _CACHED_QUALITY = quality
    return _CACHED_DF


def get_data_quality_summary() -> DataQualitySummary:
    """Return the cached data quality summary."""
    global _CACHED_QUALITY
    if _CACHED_QUALITY is None:
        load_dataset()
    return _CACHED_QUALITY


def get_reference_date(df: pd.DataFrame, route: Optional[str] = None) -> str:
    """Get the reference date: latest date in dataset (NEVER system clock)."""
    if route:
        route_df = df[df["route"] == route.upper()]
        if not route_df.empty:
            return str(route_df["date"].max())
    return str(df["date"].max())


def get_route_dataframe(
    df: pd.DataFrame,
    route: str,
    airline: Optional[str] = None,
    window_days: Optional[int] = None,
) -> pd.DataFrame:
    """Filter dataset for a route and optional airline, sliced by reference date."""
    route_upper = route.upper().strip()
    sub_df = df[df["route"] == route_upper]

    if sub_df.empty:
        raise ValueError(f"Route '{route}' not found in dataset. Available: {sorted(df['route'].unique().tolist())}")

    if airline and airline.strip() and airline.lower() != "all":
        sub_df = sub_df[sub_df["airline"].str.lower() == airline.strip().lower()]
        if sub_df.empty:
            raise ValueError(f"No records for airline '{airline}' on route '{route}'.")

    if window_days is not None and window_days > 0:
        ref_date_str = str(sub_df["date"].max())
        ref_date = pd.to_datetime(ref_date_str)
        cutoff_date = (ref_date - pd.Timedelta(days=window_days - 1)).strftime("%Y-%m-%d")
        sub_df = sub_df[sub_df["date"] >= cutoff_date]

    return sub_df.sort_values(by="date").reset_index(drop=True)


def parse_and_validate_csv_bytes(content: bytes) -> Tuple[bool, str, Optional[DataQualitySummary], List[str]]:
    """Validate uploaded CSV content in memory without persisting."""
    try:
        if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
            return False, f"File size exceeds {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB limit.", None, ["File too large"]

        decoded = content.decode("utf-8")
        raw_df = pd.read_csv(io.StringIO(decoded))
        _, quality = clean_and_validate_dataframe(raw_df)
        return True, "CSV is valid and adheres to Fare Radar schema.", quality, []
    except Exception as e:
        return False, f"Validation failed: {str(e)}", None, [str(e)]
