import math
import re
from dataclasses import dataclass


ROAD_CIRCUITY_FACTOR = 1.18
MIN_LEG_MILES = 5.0
COORDINATE_PATTERN = re.compile(r"^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$")


KNOWN_LOCATIONS = {
    "new york, ny": (40.7128, -74.0060),
    "chicago, il": (41.8781, -87.6298),
    "los angeles, ca": (34.0522, -118.2437),
    "seattle, wa": (47.6062, -122.3321),
    "spokane, wa": (47.6588, -117.4260),
    "denver, co": (39.7392, -104.9903),
    "portland, or": (45.5152, -122.6784),
    "atlanta, ga": (33.7490, -84.3880),
    "las vegas, nv": (36.1699, -115.1398),
    "phoenix, az": (33.4484, -112.0740),
    "memphis, tn": (35.1495, -90.0490),
    "nashville, tn": (36.1627, -86.7816),
    "little rock, ar": (34.7465, -92.2896),
    "gary, in": (41.5934, -87.3464),
    "toledo, oh": (41.6528, -83.5379),
    "billings, mt": (45.7833, -108.5007),
    "missoula, mt": (46.8721, -113.9940),
    "ellensburg, wa": (46.9965, -120.5478),
    "boise, id": (43.6150, -116.2023),
    "salt lake city, ut": (40.7608, -111.8910),
    "dallas, tx": (32.7767, -96.7970),
    "houston, tx": (29.7604, -95.3698),
    "miami, fl": (25.7617, -80.1918),
    "jacksonville, fl": (30.3322, -81.6557),
    "charlotte, nc": (35.2271, -80.8431),
    "kansas city, mo": (39.0997, -94.5786),
    "st. louis, mo": (38.6270, -90.1994),
    "minneapolis, mn": (44.9778, -93.2650),
    "san francisco, ca": (37.7749, -122.4194),
    "sacramento, ca": (38.5816, -121.4944),
    "albuquerque, nm": (35.0844, -106.6504),
    "oklahoma city, ok": (35.4676, -97.5164),
}


@dataclass(frozen=True)
class RoutePoint:
    label: str
    latitude: float
    longitude: float
    source: str

    def as_dict(self):
        return {
            "label": self.label,
            "latitude": round(self.latitude, 6),
            "longitude": round(self.longitude, 6),
            "source": self.source,
        }


def normalize_location(location):
    return " ".join(location.strip().lower().split())


class LocationResolutionError(ValueError):
    def __init__(self, location):
        super().__init__(f"Unsupported location: {location}")
        self.location = location


def parse_coordinates(location):
    match = COORDINATE_PATTERN.match(location)
    if not match:
        return None
    latitude = float(match.group(1))
    longitude = float(match.group(2))
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise LocationResolutionError(location)
    return latitude, longitude


def is_supported_location(location):
    if not location or not location.strip():
        return False
    return normalize_location(location) in KNOWN_LOCATIONS


def supported_location_hint():
    examples = ["New York, NY", "Chicago, IL", "Los Angeles, CA", "Seattle, WA", "Denver, CO"]
    return f"Use a supported city ({', '.join(examples)})."


def resolve_location(location):
    key = normalize_location(location)
    if key in KNOWN_LOCATIONS:
        latitude, longitude = KNOWN_LOCATIONS[key]
        return RoutePoint(location, latitude, longitude, "known")

    raise LocationResolutionError(location)


def resolve_location_with_coords(location, latitude=None, longitude=None):
    if latitude is not None and longitude is not None:
        return RoutePoint(location, float(latitude), float(longitude), "client")
    return resolve_location(location)


def haversine_miles(point_a, point_b):
    earth_radius_miles = 3958.7613
    lat1 = math.radians(point_a.latitude)
    lon1 = math.radians(point_a.longitude)
    lat2 = math.radians(point_b.latitude)
    lon2 = math.radians(point_b.longitude)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1
    hav = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    )
    return 2 * earth_radius_miles * math.asin(math.sqrt(hav))


def estimate_leg(origin, destination, purpose, origin_coords=None, destination_coords=None):
    origin_point = resolve_location_with_coords(origin, *(origin_coords or (None, None)))
    destination_point = resolve_location_with_coords(destination, *(destination_coords or (None, None)))
    straight_line = haversine_miles(origin_point, destination_point)
    distance = max(MIN_LEG_MILES, straight_line * ROAD_CIRCUITY_FACTOR)

    return {
        "purpose": purpose,
        "origin": origin_point.as_dict(),
        "destination": destination_point.as_dict(),
        "distance_miles": round(distance, 1),
        "straight_line_miles": round(straight_line, 1),
    }


def estimate_route(
    current_location,
    pickup_location,
    dropoff_location,
    current_coords=None,
    pickup_coords=None,
    dropoff_coords=None,
):
    legs = [
        estimate_leg(
            current_location,
            pickup_location,
            "deadhead_to_pickup",
            origin_coords=current_coords,
            destination_coords=pickup_coords,
        ),
        estimate_leg(
            pickup_location,
            dropoff_location,
            "loaded_to_dropoff",
            origin_coords=pickup_coords,
            destination_coords=dropoff_coords,
        ),
    ]
    total_distance = round(sum(leg["distance_miles"] for leg in legs), 1)
    map_points = [legs[0]["origin"], legs[0]["destination"], legs[1]["destination"]]

    instructions = [
        {
            "step": 1,
            "title": "Proceed to pickup",
            "detail": f"Travel from {current_location} to {pickup_location}.",
            "distance_miles": legs[0]["distance_miles"],
        },
        {
            "step": 2,
            "title": "Complete pickup duty",
            "detail": "Reserve 1 hour on duty, not driving, for pickup.",
            "distance_miles": 0,
        },
        {
            "step": 3,
            "title": "Run loaded route",
            "detail": f"Travel from {pickup_location} to {dropoff_location}.",
            "distance_miles": legs[1]["distance_miles"],
        },
        {
            "step": 4,
            "title": "Complete drop-off duty",
            "detail": "Reserve 1 hour on duty, not driving, for drop-off.",
            "distance_miles": 0,
        },
    ]

    return {
        "total_distance_miles": total_distance,
        "legs": legs,
        "instructions": instructions,
        "map_points": map_points,
    }
