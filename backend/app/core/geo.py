"""Geographical calculations and Great-Circle trajectory computation."""

import json
import math
from pathlib import Path
from typing import Dict, List, Tuple
from ..config import settings
from ..schemas import Airport, FlightWaypoint, FlightPathData


def load_airports() -> Dict[str, Airport]:
    """Load airports dictionary from airports.json."""
    path = settings.AIRPORTS_JSON_PATH
    if not path.exists():
        # Fallback dictionary if file missing
        return {
            "DEL": Airport(code="DEL", name="Indira Gandhi Intl", city="New Delhi", lat=28.5562, lon=77.1000, elevation_m=237.0),
            "BLR": Airport(code="BLR", name="Kempegowda Intl", city="Bengaluru", lat=13.1986, lon=77.7066, elevation_m=915.0),
            "BOM": Airport(code="BOM", name="Chhatrapati Shivaji Maharaj Intl", city="Mumbai", lat=19.0896, lon=72.8656, elevation_m=14.0),
            "MAA": Airport(code="MAA", name="Chennai Intl", city="Chennai", lat=12.9941, lon=80.1709, elevation_m=16.0),
            "HYD": Airport(code="HYD", name="Rajiv Gandhi Intl", city="Hyderabad", lat=17.2403, lon=78.4294, elevation_m=617.0),
            "CCU": Airport(code="CCU", name="Netaji Subhash Chandra Bose Intl", city="Kolkata", lat=22.6547, lon=88.4467, elevation_m=5.0),
            "GOI": Airport(code="GOI", name="Dabolim Airport", city="Goa", lat=15.3808, lon=73.8314, elevation_m=56.0),
        }
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
        return {code: Airport(**data) for code, data in raw.items()}


AIRPORTS = load_airports()


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance in kilometers between two points on Earth."""
    r = 6371.0  # Earth radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def calculate_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate initial compass bearing from point 1 to point 2 in degrees [0, 360)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    initial_bearing = math.atan2(y, x)
    initial_bearing = math.degrees(initial_bearing)
    return (initial_bearing + 360.0) % 360.0


def lat_lon_to_cartesian(lat_deg: float, lon_deg: float) -> Tuple[float, float, float]:
    """Convert spherical latitude/longitude to 3D unit sphere Cartesian coordinates."""
    lat = math.radians(lat_deg)
    lon = math.radians(lon_deg)
    x = math.cos(lat) * math.cos(lon)
    y = math.cos(lat) * math.sin(lon)
    z = math.sin(lat)
    return (x, y, z)


def cartesian_to_lat_lon(x: float, y: float, z: float) -> Tuple[float, float]:
    """Convert 3D unit sphere Cartesian coordinates back to latitude/longitude in degrees."""
    r = math.sqrt(x * x + y * y + z * z)
    if r == 0:
        return (0.0, 0.0)
    lat = math.asin(z / r)
    lon = math.atan2(y, x)
    return (math.degrees(lat), math.degrees(lon))


def slerp_sphere(v1: Tuple[float, float, float], v2: Tuple[float, float, float], t: float) -> Tuple[float, float, float]:
    """Spherical linear interpolation between two unit vectors on a sphere."""
    dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
    dot = max(-1.0, min(1.0, dot))
    omega = math.acos(dot)

    if omega < 1e-6:
        return v1

    sin_omega = math.sin(omega)
    scale1 = math.sin((1.0 - t) * omega) / sin_omega
    scale2 = math.sin(t * omega) / sin_omega

    rx = scale1 * v1[0] + scale2 * v2[0]
    ry = scale1 * v1[1] + scale2 * v2[1]
    rz = scale1 * v1[2] + scale2 * v2[2]
    return (rx, ry, rz)


def compute_smoothstep(edge0: float, edge1: float, x: float) -> float:
    """Hermite smoothstep interpolation."""
    t = max(0.0, min(1.0, (x - edge0) / (edge1 - edge0)))
    return t * t * (3.0 - 2.0 * t)


def compute_flight_profile_altitude(fraction: float, cruise_alt_ft: float = 34000.0) -> float:
    """Calculate realistic altitude profile along flight fraction [0, 1].

    - 0% to 18%: Climb from runway to cruise altitude.
    - 18% to 82%: Cruise plateau with slight high-altitude micro-profile.
    - 82% to 100%: Smooth descent to destination runway.
    """
    if fraction <= 0.18:
        # Climb
        factor = compute_smoothstep(0.0, 0.18, fraction)
        return factor * cruise_alt_ft
    elif fraction <= 0.82:
        # Cruise
        mid_frac = (fraction - 0.18) / 0.64
        # subtle curve +1000 ft in mid flight
        variation = 800.0 * math.sin(mid_frac * math.pi)
        return cruise_alt_ft + variation
    else:
        # Descent
        desc_frac = (fraction - 0.82) / 0.18
        factor = 1.0 - compute_smoothstep(0.0, 1.0, desc_frac)
        return factor * cruise_alt_ft


def generate_flight_path(route_code: str, num_waypoints: int = 200) -> FlightPathData:
    """Generate 200 great-circle waypoints with realistic bearing and altitude."""
    parts = route_code.upper().split("-")
    if len(parts) != 2:
        raise ValueError(f"Invalid route format '{route_code}'. Expected 'ORIGIN-DEST' (e.g. DEL-BLR).")

    origin_code, dest_code = parts[0], parts[1]
    origin = AIRPORTS.get(origin_code)
    dest = AIRPORTS.get(dest_code)

    if not origin or not dest:
        raise ValueError(f"Unknown airport in route {route_code}. Known: {list(AIRPORTS.keys())}")

    total_dist = haversine_distance_km(origin.lat, origin.lon, dest.lat, dest.lon)
    cruise_alt = 35000.0 if total_dist > 800 else 28000.0

    v1 = lat_lon_to_cartesian(origin.lat, origin.lon)
    v2 = lat_lon_to_cartesian(dest.lat, dest.lon)

    coords: List[Tuple[float, float]] = []
    for i in range(num_waypoints):
        t = i / (num_waypoints - 1)
        vt = slerp_sphere(v1, v2, t)
        lat, lon = cartesian_to_lat_lon(vt[0], vt[1], vt[2])
        coords.append((lat, lon))

    waypoints: List[FlightWaypoint] = []
    for i in range(num_waypoints):
        lat, lon = coords[i]
        frac = i / (num_waypoints - 1)
        alt = compute_flight_profile_altitude(frac, cruise_alt)

        if i < num_waypoints - 1:
            next_lat, next_lon = coords[i + 1]
            bearing = calculate_bearing_deg(lat, lon, next_lat, next_lon)
        else:
            prev_lat, prev_lon = coords[i - 1]
            bearing = calculate_bearing_deg(prev_lat, prev_lon, lat, lon)

        waypoints.append(
            FlightWaypoint(
                lat=round(lat, 5),
                lon=round(lon, 5),
                alt_ft=round(alt, 1),
                distance_km=round(frac * total_dist, 1),
                fraction=round(frac, 4),
                bearing_deg=round(bearing, 1),
            )
        )

    return FlightPathData(
        route=route_code,
        origin=origin,
        destination=dest,
        distance_km=round(total_dist, 1),
        suggested_cruise_alt_ft=cruise_alt,
        waypoints=waypoints,
        total_waypoints=len(waypoints),
    )
