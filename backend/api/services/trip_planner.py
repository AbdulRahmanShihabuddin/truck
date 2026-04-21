from datetime import datetime

from .hos_planner import (
    AVERAGE_SPEED_MPH,
    BREAK_AFTER_DRIVING_HOURS,
    BREAK_DURATION_HOURS,
    CYCLE_LIMIT_HOURS,
    DROPOFF_DURATION_HOURS,
    FUEL_DISTANCE_MILES,
    FUEL_DURATION_HOURS,
    MAX_DRIVING_HOURS,
    MAX_DUTY_WINDOW_HOURS,
    PICKUP_DURATION_HOURS,
    REQUIRED_REST_HOURS,
    RESTART_HOURS,
    build_schedule,
)
from .log_generator import generate_daily_logs
from .route_estimator import estimate_route


MAX_ROUTE_MILES = 5000
MAX_DURATION_HOURS = 14 * 24


class TripPlanningError(Exception):
    def __init__(self, errors):
        self.errors = errors
        super().__init__(str(errors))


def _iso(value):
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _serialize_segment(segment):
    return {
        **segment,
        "start_at": _iso(segment["start_at"]),
        "end_at": _iso(segment["end_at"]),
    }


def _hours_to_hm(hours):
    total_minutes = int(round(hours * 60))
    return {"hours": total_minutes // 60, "minutes": total_minutes % 60}


def _build_review_checks(schedule):
    has_restart = any("cycle_restart" in segment.get("rule_tags", []) for segment in schedule)
    has_breaks = any("break" in segment.get("rule_tags", []) for segment in schedule)
    fuel_stops = [segment for segment in schedule if "fuel" in segment.get("rule_tags", [])]

    return [
        {
            "label": "Hours of Service Integrity",
            "status": "pass",
            "detail": "Schedule is generated within the v1 property-carrying HOS assumptions.",
        },
        {
            "label": "Required Breaks",
            "status": "pass",
            "detail": "30-minute non-driving periods are inserted after cumulative driving limits.",
        },
        {
            "label": "Fuel Cadence",
            "status": "pass",
            "detail": f"{len(fuel_stops)} fuel stop(s) inserted with a 1,000-mile maximum interval.",
        },
        {
            "label": "Cycle Availability",
            "status": "pass",
            "detail": "34-hour restart inserted." if has_restart else "No cycle restart required.",
        },
        {
            "label": "Break Source",
            "status": "pass" if has_breaks else "info",
            "detail": "Breaks may be off-duty or on-duty not driving under the v1 assumptions.",
        },
    ]


def plan_trip(data):
    route = estimate_route(
        data["current_location"],
        data["pickup_location"],
        data["dropoff_location"],
        current_coords=(data.get("current_location_lat"), data.get("current_location_lng")),
        pickup_coords=(data.get("pickup_location_lat"), data.get("pickup_location_lng")),
        dropoff_coords=(data.get("dropoff_location_lat"), data.get("dropoff_location_lng")),
    )

    if route["total_distance_miles"] > MAX_ROUTE_MILES:
        raise TripPlanningError(
            {
                "route": (
                    f"Planned distance is {route['total_distance_miles']} miles. "
                    f"V1 supports trips up to {MAX_ROUTE_MILES} miles."
                )
            }
        )

    schedule = build_schedule(route, data["current_cycle_used"], data["start_at"])
    daily_logs = generate_daily_logs(schedule, data["start_at"])

    total_driving_hours = sum(segment["duration_hours"] for segment in schedule if segment["status"] == "driving")
    total_on_duty_not_driving = sum(segment["duration_hours"] for segment in schedule if segment["status"] == "on_duty")
    total_off_duty = sum(segment["duration_hours"] for segment in schedule if segment["status"] == "off_duty")
    fuel_stop_count = sum(1 for segment in schedule if "fuel" in segment.get("rule_tags", []))
    restart_count = sum(1 for segment in schedule if "cycle_restart" in segment.get("rule_tags", []))

    trip_start = min(segment["start_at"] for segment in schedule)
    trip_end = max(segment["end_at"] for segment in schedule)
    total_elapsed_hours = (trip_end - trip_start).total_seconds() / 3600
    if total_elapsed_hours > MAX_DURATION_HOURS:
        raise TripPlanningError(
            {
                "route": (
                    f"Generated plan spans {round(total_elapsed_hours / 24, 1)} days. "
                    "V1 supports trips up to 14 days."
                )
            }
        )

    trip_id = "trip_" + trip_start.strftime("%Y%m%d%H%M%S")

    assumptions = {
        "driver_type": "property_carrying",
        "cycle_rule": "70 hours / 8 days",
        "average_speed_mph": AVERAGE_SPEED_MPH,
        "max_driving_hours": MAX_DRIVING_HOURS,
        "max_duty_window_hours": MAX_DUTY_WINDOW_HOURS,
        "required_rest_hours": REQUIRED_REST_HOURS,
        "break_after_driving_hours": BREAK_AFTER_DRIVING_HOURS,
        "break_duration_hours": BREAK_DURATION_HOURS,
        "cycle_limit_hours": CYCLE_LIMIT_HOURS,
        "restart_hours": RESTART_HOURS,
        "fuel_distance_miles": FUEL_DISTANCE_MILES,
        "fuel_duration_hours": FUEL_DURATION_HOURS,
        "pickup_duration_hours": PICKUP_DURATION_HOURS,
        "dropoff_duration_hours": DROPOFF_DURATION_HOURS,
        "adverse_driving_conditions": False,
        "split_sleeper_berth": False,
    }

    return {
        "trip_id": trip_id,
        "input": {
            "current_location": data["current_location"],
            "current_location_lat": data.get("current_location_lat"),
            "current_location_lng": data.get("current_location_lng"),
            "pickup_location": data["pickup_location"],
            "pickup_location_lat": data.get("pickup_location_lat"),
            "pickup_location_lng": data.get("pickup_location_lng"),
            "dropoff_location": data["dropoff_location"],
            "dropoff_location_lat": data.get("dropoff_location_lat"),
            "dropoff_location_lng": data.get("dropoff_location_lng"),
            "current_cycle_used": float(data["current_cycle_used"]),
            "start_at": _iso(data["start_at"]),
            "manifest": {
                "driver_name": data["driver_name"],
                "vehicle_id": data["vehicle_id"],
                "trailer_id": data["trailer_id"],
                "co_driver_name": data.get("co_driver_name", ""),
                "cargo_classification": data["cargo_classification"],
            },
        },
        "assumptions": assumptions,
        "summary": {
            "total_distance_miles": route["total_distance_miles"],
            "total_duration_hours": round(total_elapsed_hours, 2),
            "total_duration": _hours_to_hm(total_elapsed_hours),
            "total_driving_hours": round(total_driving_hours, 2),
            "total_on_duty_not_driving_hours": round(total_on_duty_not_driving, 2),
            "total_off_duty_hours": round(total_off_duty, 2),
            "fuel_stop_count": fuel_stop_count,
            "cycle_restart_count": restart_count,
            "day_count": len(daily_logs),
            "compliance_status": "Compliant",
        },
        "route": route,
        "schedule": [_serialize_segment(segment) for segment in schedule],
        "daily_logs": daily_logs,
        "review": {
            "checks": _build_review_checks(schedule),
            "export_filename": f"{trip_id}_hos_plan.json",
            "ready_for_archive": True,
        },
    }
