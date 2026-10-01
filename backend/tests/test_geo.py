"""Tests for geographical great-circle math and flight trajectories."""

import pytest
from app.core.geo import (
    haversine_distance_km,
    calculate_bearing_deg,
    generate_flight_path,
    AIRPORTS,
)


def test_delhi_bangalore_distance():
    # Prompt benchmark: DEL-BLR ≈ 1,740 km
    del_apt = AIRPORTS["DEL"]
    blr_apt = AIRPORTS["BLR"]

    dist = haversine_distance_km(del_apt.lat, del_apt.lon, blr_apt.lat, blr_apt.lon)
    # Check within 2% of 1,740 km
    assert 1700.0 <= dist <= 1780.0


def test_mumbai_delhi_distance():
    bom_apt = AIRPORTS["BOM"]
    del_apt = AIRPORTS["DEL"]

    dist = haversine_distance_km(bom_apt.lat, bom_apt.lon, del_apt.lat, del_apt.lon)
    # BOM-DEL is approx 1,148 km
    assert 1100.0 <= dist <= 1200.0


def test_bearing_del_to_blr():
    # DEL to BLR is almost directly South (approx 178 degrees)
    del_apt = AIRPORTS["DEL"]
    blr_apt = AIRPORTS["BLR"]

    bearing = calculate_bearing_deg(del_apt.lat, del_apt.lon, blr_apt.lat, blr_apt.lon)
    assert 170.0 <= bearing <= 185.0


def test_flight_path_waypoints_and_profile():
    flight_data = generate_flight_path("DEL-BLR", num_waypoints=200)

    assert flight_data.total_waypoints == 200
    assert len(flight_data.waypoints) == 200

    wps = flight_data.waypoints

    # First waypoint: origin, altitude near 0
    assert wps[0].fraction == 0.0
    assert wps[0].alt_ft == 0.0

    # Mid flight (fraction ~ 0.5): cruise altitude >= 34,000 ft
    mid_wp = wps[100]
    assert 0.49 <= mid_wp.fraction <= 0.51
    assert mid_wp.alt_ft >= 34000.0

    # Last waypoint: destination, altitude descends to 0
    assert wps[-1].fraction == 1.0
    assert wps[-1].alt_ft == 0.0

    # Bearings valid in [0, 360)
    for wp in wps:
        assert 0.0 <= wp.bearing_deg < 360.0
