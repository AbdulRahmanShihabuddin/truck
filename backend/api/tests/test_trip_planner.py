from datetime import datetime, timezone

from django.test import SimpleTestCase
from django.urls import reverse
from rest_framework.test import APITestCase

from api.services.route_estimator import estimate_route
from api.services.trip_planner import plan_trip


START_AT = datetime(2026, 4, 20, 8, 0, tzinfo=timezone.utc)


def make_trip(**overrides):
    payload = {
        "current_location": "New York, NY",
        "pickup_location": "Chicago, IL",
        "dropoff_location": "Los Angeles, CA",
        "current_cycle_used": 12,
        "start_at": START_AT,
        "driver_name": "Maya Ortiz",
        "vehicle_id": "TRK-402",
        "trailer_id": "TRL-119A",
        "co_driver_name": "",
        "cargo_classification": "Dry Van - General",
    }
    payload.update(overrides)
    return plan_trip(payload)


class RouteEstimatorTests(SimpleTestCase):
    def test_known_and_coordinate_locations_are_deterministic(self):
        first = estimate_route("New York, NY", "Chicago, IL", "40.7128,-74.0060")
        second = estimate_route("New York, NY", "Chicago, IL", "40.7128,-74.0060")

        self.assertEqual(first["total_distance_miles"], second["total_distance_miles"])
        self.assertEqual(first["map_points"], second["map_points"])
        self.assertEqual(first["map_points"][0]["source"], "known")
        self.assertEqual(first["map_points"][2]["source"], "coordinate")


class TripPlannerTests(SimpleTestCase):
    def test_pickup_dropoff_and_daily_logs_are_generated(self):
        result = make_trip(
            current_location="Seattle, WA",
            pickup_location="Spokane, WA",
            dropoff_location="Denver, CO",
        )

        titles = [segment["title"] for segment in result["schedule"]]
        self.assertIn("Pickup", titles)
        self.assertIn("Drop-off", titles)
        self.assertEqual(result["input"]["manifest"]["driver_name"], "Maya Ortiz")
        self.assertGreaterEqual(result["summary"]["day_count"], 1)
        self.assertEqual(result["summary"]["compliance_status"], "Compliant")

    def test_fuel_stops_are_inserted_for_long_routes(self):
        result = make_trip(
            current_location="Seattle, WA",
            pickup_location="Spokane, WA",
            dropoff_location="Miami, FL",
        )

        fuel_stops = [segment for segment in result["schedule"] if "fuel" in segment["rule_tags"]]
        self.assertGreaterEqual(len(fuel_stops), 2)
        self.assertEqual(result["summary"]["fuel_stop_count"], len(fuel_stops))

    def test_breaks_and_daily_resets_are_inserted(self):
        result = make_trip(
            current_location="Seattle, WA",
            pickup_location="Spokane, WA",
            dropoff_location="Denver, CO",
        )

        breaks = [segment for segment in result["schedule"] if "break" in segment["rule_tags"]]
        rests = [segment for segment in result["schedule"] if "daily_reset" in segment["rule_tags"]]
        driving_segments = [segment for segment in result["schedule"] if segment["status"] == "driving"]

        self.assertTrue(breaks)
        self.assertTrue(rests)
        self.assertTrue(all(segment["duration_hours"] <= 8 for segment in driving_segments))

    def test_cycle_restart_is_inserted_when_remaining_cycle_is_exhausted(self):
        result = make_trip(current_cycle_used=70)

        restarts = [segment for segment in result["schedule"] if "cycle_restart" in segment["rule_tags"]]
        self.assertTrue(restarts)
        self.assertEqual(restarts[0]["duration_hours"], 34)

    def test_daily_logs_cover_full_24_hours(self):
        result = make_trip(
            current_location="Seattle, WA",
            pickup_location="Spokane, WA",
            dropoff_location="Miami, FL",
        )

        self.assertGreater(result["summary"]["day_count"], 1)
        for log in result["daily_logs"]:
            total = (
                log["totals"]["off_duty"]
                + log["totals"]["sleeper_berth"]
                + log["totals"]["driving"]
                + log["totals"]["on_duty"]
            )
            self.assertAlmostEqual(total, 24.0, places=1)


class TripPlanningAPITests(APITestCase):
    def test_plan_trip_success_response_contract(self):
        response = self.client.post(
            reverse("trip-plan"),
            {
                "current_location": "Seattle, WA",
                "pickup_location": "Spokane, WA",
                "dropoff_location": "Denver, CO",
                "current_cycle_used": 20,
                "start_at": "2026-04-20T08:00:00Z",
                "driver_name": "Maya Ortiz",
                "vehicle_id": "TRK-402",
                "trailer_id": "TRL-119A",
                "co_driver_name": "",
                "cargo_classification": "Dry Van - General",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        for key in ("trip_id", "input", "assumptions", "summary", "route", "schedule", "daily_logs", "review"):
            self.assertIn(key, body)
        self.assertEqual(body["summary"]["compliance_status"], "Compliant")
        self.assertEqual(body["input"]["manifest"]["vehicle_id"], "TRK-402")

    def test_plan_trip_validation_errors_are_clear(self):
        response = self.client.post(
            reverse("trip-plan"),
            {
                "current_location": "",
                "pickup_location": "Chicago, IL",
                "dropoff_location": "Los Angeles, CA",
                "current_cycle_used": 71,
                "driver_name": "",
                "vehicle_id": "TRK-402",
                "trailer_id": "TRL-119A",
                "co_driver_name": "",
                "cargo_classification": "Dry Van - General",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        body = response.json()
        self.assertIn("current_location", body)
        self.assertIn("current_cycle_used", body)
        self.assertIn("driver_name", body)

    def test_unknown_location_is_rejected(self):
        response = self.client.post(
            reverse("trip-plan"),
            {
                "current_location": "Unknown Yard",
                "pickup_location": "Chicago, IL",
                "dropoff_location": "Los Angeles, CA",
                "current_cycle_used": 10,
                "driver_name": "Maya Ortiz",
                "vehicle_id": "TRK-402",
                "trailer_id": "TRL-119A",
                "co_driver_name": "",
                "cargo_classification": "Dry Van - General",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("current_location", response.json())

    def test_route_guard_rejects_too_long_trip(self):
        response = self.client.post(
            reverse("trip-plan"),
            {
                "current_location": "Miami, FL",
                "pickup_location": "Seattle, WA",
                "dropoff_location": "Miami, FL",
                "current_cycle_used": 10,
                "driver_name": "Maya Ortiz",
                "vehicle_id": "TRK-402",
                "trailer_id": "TRL-119A",
                "co_driver_name": "",
                "cargo_classification": "Dry Van - General",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("route", response.json())

    def test_archive_detail_delete_and_remark_endpoints(self):
        trip = make_trip(
            current_location="Seattle, WA",
            pickup_location="Spokane, WA",
            dropoff_location="Denver, CO",
        )
        create_response = self.client.post(reverse("trip-archive-list"), {"trip": trip}, format="json")
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get(reverse("trip-archive-list"))
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

        detail_response = self.client.get(reverse("trip-archive-detail", args=[trip["trip_id"]]))
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.json()["trip_id"], trip["trip_id"])

        remark_response = self.client.post(
            reverse("trip-remark", args=[trip["trip_id"]]),
            {"date": trip["daily_logs"][0]["date"], "text": "Dock assignment confirmed."},
            format="json",
        )
        self.assertEqual(remark_response.status_code, 201)
        self.assertEqual(len(remark_response.json()["trip"]["daily_logs"][0]["remarks"]), 1)

        delete_response = self.client.delete(reverse("trip-archive-detail", args=[trip["trip_id"]]))
        self.assertEqual(delete_response.status_code, 204)

    def test_health_endpoint(self):
        response = self.client.get(reverse("health"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
