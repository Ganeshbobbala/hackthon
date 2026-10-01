"""Seeded Realistic Synthetic Airfare Data Generator for Fare Radar Pro.

Generates realistic domestic Indian airfare data across 8 major routes + 1 short route.
Includes weekly seasonality (weekend uplift), trends, demand spikes, promo drops,
and airline tier offsets.

DISCLOSURE: This is synthetic demonstration data designed for predictive analytics
and explainable heuristic visualization (PS-025). Not actual live airline booking data.
"""

import csv
from datetime import datetime, timedelta
from pathlib import Path
import numpy as np

# Seed for deterministic reproducibility
SEED = 42
np.random.seed(SEED)

ROUTES_CONFIG = {
    "DEL-BLR": {"origin": "DEL", "destination": "BLR", "base_fare": 4950, "volatility": 0.12, "days": 120},
    "BOM-DEL": {"origin": "BOM", "destination": "DEL", "base_fare": 4400, "volatility": 0.10, "days": 120},
    "MAA-BLR": {"origin": "MAA", "destination": "BLR", "base_fare": 2400, "volatility": 0.08, "days": 120},
    "HYD-DEL": {"origin": "HYD", "destination": "DEL", "base_fare": 4100, "volatility": 0.11, "days": 120},
    "BLR-BOM": {"origin": "BLR", "destination": "BOM", "base_fare": 3800, "volatility": 0.09, "days": 120},
    "DEL-BOM": {"origin": "DEL", "destination": "BOM", "base_fare": 4350, "volatility": 0.11, "days": 120},
    "MAA-DEL": {"origin": "MAA", "destination": "DEL", "base_fare": 5100, "volatility": 0.13, "days": 120},
    "CCU-DEL": {"origin": "CCU", "destination": "DEL", "base_fare": 4600, "volatility": 0.14, "days": 120},
    # Deliberately short route to test "forecast unavailable" (<30 observations required)
    "GOI-BLR": {"origin": "GOI", "destination": "BLR", "base_fare": 2900, "volatility": 0.09, "days": 14},
}

AIRLINES_CONFIG = {
    "IndiGo": {"offset_pct": 0.0, "weight": 0.40},
    "Air India": {"offset_pct": 0.08, "weight": 0.25},
    "Vistara": {"offset_pct": 0.12, "weight": 0.20},
    "Akasa Air": {"offset_pct": -0.06, "weight": 0.15},
}

# Day of week seasonality factors (0=Monday, 6=Sunday)
DOW_MULTIPLIERS = {
    0: 0.98,  # Monday: normal
    1: 0.94,  # Tuesday: lowest
    2: 0.95,  # Wednesday: low
    3: 1.00,  # Thursday: average
    4: 1.12,  # Friday: high (weekend travel starts)
    5: 1.05,  # Saturday: elevated
    6: 1.15,  # Sunday: peak (return travel)
}


def generate_dataset(end_date_str: str = "2026-09-30") -> list:
    """Generate deterministic synthetic airfare records."""
    np.random.seed(SEED)
    end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
    records = []

    for route_code, cfg in ROUTES_CONFIG.items():
        days_count = cfg["days"]
        start_date = end_date - timedelta(days=days_count - 1)
        base = cfg["base_fare"]
        vol = cfg["volatility"]

        # Generate smooth multi-week trend curve
        t = np.linspace(0, 4 * np.pi, days_count)
        macro_trend = 1.0 + 0.06 * np.sin(t / 2) + 0.03 * np.cos(t)

        for day_idx in range(days_count):
            curr_date = start_date + timedelta(days=day_idx)
            dow = curr_date.weekday()
            dow_factor = DOW_MULTIPLIERS[dow]
            trend_factor = macro_trend[day_idx]

            # Spikes & Promos at specific predictable calendar points
            event_factor = 1.0
            if day_idx in [32, 33, 75, 76]:  # holiday surge
                event_factor = 1.28
            elif day_idx in [15, 62, 102]:   # flash promo sale
                event_factor = 0.82

            # Route daily baseline fare
            daily_noise = np.random.normal(0, vol * 0.4)
            route_day_fare = base * trend_factor * dow_factor * event_factor * (1.0 + daily_noise)

            # Generate records across airlines
            for airline_name, air_cfg in AIRLINES_CONFIG.items():
                airline_noise = np.random.normal(0, 0.03)
                airline_fare = route_day_fare * (1.0 + air_cfg["offset_pct"] + airline_noise)
                # Round to realistic 10-rupee ticket increment
                final_fare = round(airline_fare / 10.0) * 10.0
                final_fare = max(1200.0, final_fare)

                records.append({
                    "date": curr_date.strftime("%Y-%m-%d"),
                    "route": route_code,
                    "origin": cfg["origin"],
                    "destination": cfg["destination"],
                    "airline": airline_name,
                    "fare": float(final_fare),
                })

    return records


def save_to_csv(filepath: Path, records: list):
    """Write records to CSV."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["date", "route", "origin", "destination", "airline", "fare"])
        writer.writeheader()
        writer.writerows(records)


if __name__ == "__main__":
    out_path = Path(__file__).resolve().parent / "airfare_history.csv"
    data = generate_dataset()
    save_to_csv(out_path, data)
    print(f"Generated {len(data)} synthetic records to {out_path}")
