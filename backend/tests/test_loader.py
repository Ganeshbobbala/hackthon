"""Tests for data loader, quality verification, and dataset reference date."""

import io
import pandas as pd
import pytest

from app.core.data_loader import (
    load_dataset,
    clean_and_validate_dataframe,
    get_reference_date,
    get_route_dataframe,
    parse_and_validate_csv_bytes,
)


def test_load_dataset_success():
    df = load_dataset()
    assert not df.empty
    assert set(["date", "route", "origin", "destination", "airline", "fare"]).issubset(df.columns)
    assert len(df["route"].unique()) >= 8


def test_reference_date_is_dataset_max_never_system_clock():
    df = load_dataset()
    ref_date = get_reference_date(df)
    # Ensure it's a valid string matching the maximum date in the CSV
    assert ref_date == str(df["date"].max())


def test_window_slicing_by_reference_date():
    df = load_dataset()
    df_30 = get_route_dataframe(df, "DEL-BLR", window_days=30)
    df_60 = get_route_dataframe(df, "DEL-BLR", window_days=60)
    df_90 = get_route_dataframe(df, "DEL-BLR", window_days=90)

    # Number of unique dates should reflect window bounds
    assert df_30["date"].nunique() <= 30
    assert df_60["date"].nunique() <= 60
    assert df_90["date"].nunique() <= 90
    assert df_30["date"].nunique() <= df_60["date"].nunique() <= df_90["date"].nunique()


def test_clean_and_validate_rejects_negative_and_zero_fares():
    raw_data = {
        "date": ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"],
        "route": ["DEL-BLR", "DEL-BLR", "DEL-BLR", "DEL-BLR"],
        "origin": ["DEL", "DEL", "DEL", "DEL"],
        "destination": ["BLR", "BLR", "BLR", "BLR"],
        "airline": ["IndiGo", "IndiGo", "IndiGo", "IndiGo"],
        "fare": [4500, -100, 0, "not_a_number"],
    }
    raw_df = pd.DataFrame(raw_data)
    cleaned_df, quality = clean_and_validate_dataframe(raw_df)

    assert len(cleaned_df) == 1
    assert cleaned_df["fare"].iloc[0] == 4500.0
    assert quality.invalid_rows == 3


def test_csv_upload_validation_in_memory():
    valid_csv = (
        "date,route,origin,destination,airline,fare\n"
        "2026-09-01,DEL-BLR,DEL,BLR,IndiGo,4500\n"
        "2026-09-02,DEL-BLR,DEL,BLR,IndiGo,4600\n"
    ).encode("utf-8")

    is_valid, msg, quality, errors = parse_and_validate_csv_bytes(valid_csv)
    assert is_valid is True
    assert quality is not None
    assert quality.valid_rows == 2

    invalid_csv = (
        "random_col,another_col\n"
        "1,2\n"
    ).encode("utf-8")

    is_valid2, msg2, quality2, errors2 = parse_and_validate_csv_bytes(invalid_csv)
    assert is_valid2 is False
    assert len(errors2) > 0
