from dataclasses import dataclass
from datetime import timedelta


AVERAGE_SPEED_MPH = 55.0
MAX_DRIVING_HOURS = 11.0
MAX_DUTY_WINDOW_HOURS = 14.0
REQUIRED_REST_HOURS = 10.0
BREAK_AFTER_DRIVING_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
CYCLE_LIMIT_HOURS = 70.0
RESTART_HOURS = 34.0
FUEL_DISTANCE_MILES = 1000.0
FUEL_DURATION_HOURS = 0.5
PICKUP_DURATION_HOURS = 1.0
DROPOFF_DURATION_HOURS = 1.0
MIN_PROGRESS_HOURS = 0.1


@dataclass
class PlannerState:
    current_time: object
    location: str
    duty_window_remaining: float = MAX_DUTY_WINDOW_HOURS
    driving_remaining: float = MAX_DRIVING_HOURS
    driving_since_break: float = 0.0
    cycle_remaining: float = CYCLE_LIMIT_HOURS
    miles_since_fuel: float = 0.0


class HOSPlanner:
    def __init__(self, route, current_cycle_used, start_at):
        self.route = route
        self.state = PlannerState(
            current_time=start_at,
            location=route["legs"][0]["origin"]["label"],
            cycle_remaining=max(0.0, CYCLE_LIMIT_HOURS - float(current_cycle_used)),
        )
        self.segments = []

    def build_schedule(self):
        if self.state.cycle_remaining <= 0:
            self._add_restart("Cycle restart before dispatch")

        first_leg, second_leg = self.route["legs"]
        self._drive_leg(first_leg)
        self._add_duty_activity(
            PICKUP_DURATION_HOURS,
            first_leg["destination"]["label"],
            "Pickup",
            "On-duty pickup operation",
            ["pickup"],
        )
        self._drive_leg(second_leg)
        self._add_duty_activity(
            DROPOFF_DURATION_HOURS,
            second_leg["destination"]["label"],
            "Drop-off",
            "On-duty drop-off operation",
            ["dropoff"],
        )
        return self.segments

    def _segment(self, status, hours, location, title, description, distance_miles=0.0, rule_tags=None):
        if hours <= 0:
            return None

        start_at = self.state.current_time
        end_at = start_at + timedelta(hours=hours)
        segment = {
            "start_at": start_at,
            "end_at": end_at,
            "status": status,
            "title": title,
            "description": description,
            "location": location,
            "duration_hours": round(hours, 4),
            "distance_miles": round(distance_miles, 1),
            "rule_tags": rule_tags or [],
        }
        self.segments.append(segment)
        self.state.current_time = end_at
        self.state.location = location
        return segment

    def _add_duty_activity(self, hours, location, title, description, rule_tags):
        remaining = hours
        while remaining > 0:
            if self.state.cycle_remaining <= MIN_PROGRESS_HOURS:
                self._add_restart("Cycle restart before on-duty work")
                continue
            if self.state.duty_window_remaining <= MIN_PROGRESS_HOURS:
                self._add_daily_rest("10-hour reset before on-duty work")
                continue

            chunk = min(remaining, self.state.cycle_remaining, self.state.duty_window_remaining)
            self._segment("on_duty", chunk, location, title, description, rule_tags=rule_tags)
            self.state.cycle_remaining -= chunk
            self.state.duty_window_remaining -= chunk
            if chunk >= BREAK_DURATION_HOURS:
                self.state.driving_since_break = 0.0
            remaining -= chunk

    def _drive_leg(self, leg):
        remaining_distance = float(leg["distance_miles"])
        origin = leg["origin"]["label"]
        destination = leg["destination"]["label"]
        self.state.location = origin

        while remaining_distance > 0.05:
            if self.state.cycle_remaining <= MIN_PROGRESS_HOURS:
                self._add_restart("70-hour cycle restart")
                continue
            if (
                self.state.driving_remaining <= MIN_PROGRESS_HOURS
                or self.state.duty_window_remaining <= MIN_PROGRESS_HOURS
            ):
                self._add_daily_rest("10-hour off-duty reset")
                continue
            if self.state.driving_since_break >= BREAK_AFTER_DRIVING_HOURS - 0.0001:
                self._add_break("30-minute HOS driving break")
                continue
            if self.state.miles_since_fuel >= FUEL_DISTANCE_MILES - 0.05:
                self._add_fuel_stop()
                continue

            hours_until_break = BREAK_AFTER_DRIVING_HOURS - self.state.driving_since_break
            hours_until_fuel = (FUEL_DISTANCE_MILES - self.state.miles_since_fuel) / AVERAGE_SPEED_MPH
            distance_hours = remaining_distance / AVERAGE_SPEED_MPH

            drive_hours = min(
                distance_hours,
                self.state.driving_remaining,
                self.state.duty_window_remaining,
                self.state.cycle_remaining,
                hours_until_break,
                hours_until_fuel,
            )

            if drive_hours <= MIN_PROGRESS_HOURS / 10:
                self._add_break("30-minute HOS driving break")
                continue

            distance = min(remaining_distance, drive_hours * AVERAGE_SPEED_MPH)
            location = destination if remaining_distance - distance <= 0.05 else f"En route to {destination}"
            self._segment(
                "driving",
                drive_hours,
                location,
                "Driving",
                f"{origin} to {destination}",
                distance_miles=distance,
                rule_tags=["driving"],
            )
            self.state.driving_remaining -= drive_hours
            self.state.duty_window_remaining -= drive_hours
            self.state.cycle_remaining -= drive_hours
            self.state.driving_since_break += drive_hours
            self.state.miles_since_fuel += distance
            remaining_distance -= distance

    def _add_break(self, title):
        if self.state.duty_window_remaining < BREAK_DURATION_HOURS:
            self._add_daily_rest("10-hour off-duty reset")
            return
        self._segment(
            "off_duty",
            BREAK_DURATION_HOURS,
            self.state.location,
            title,
            "Required non-driving period after 8 cumulative driving hours",
            rule_tags=["break"],
        )
        self.state.duty_window_remaining -= BREAK_DURATION_HOURS
        self.state.driving_since_break = 0.0

    def _add_fuel_stop(self):
        if self.state.cycle_remaining < FUEL_DURATION_HOURS:
            self._add_restart("Cycle restart before fuel")
            return
        if self.state.duty_window_remaining < FUEL_DURATION_HOURS:
            self._add_daily_rest("10-hour off-duty reset before fuel")
            return
        self._segment(
            "on_duty",
            FUEL_DURATION_HOURS,
            self.state.location,
            "Fuel Stop",
            "Fuel stop required within each 1,000 miles",
            rule_tags=["fuel", "break"],
        )
        self.state.cycle_remaining -= FUEL_DURATION_HOURS
        self.state.duty_window_remaining -= FUEL_DURATION_HOURS
        self.state.miles_since_fuel = 0.0
        self.state.driving_since_break = 0.0

    def _add_daily_rest(self, title):
        self._segment(
            "off_duty",
            REQUIRED_REST_HOURS,
            self.state.location,
            title,
            "10 consecutive hours off duty resets daily driving availability",
            rule_tags=["daily_reset"],
        )
        self.state.duty_window_remaining = MAX_DUTY_WINDOW_HOURS
        self.state.driving_remaining = MAX_DRIVING_HOURS
        self.state.driving_since_break = 0.0

    def _add_restart(self, title):
        self._segment(
            "off_duty",
            RESTART_HOURS,
            self.state.location,
            title,
            "34 consecutive hours off duty restarts the 70-hour/8-day cycle",
            rule_tags=["cycle_restart"],
        )
        self.state.cycle_remaining = CYCLE_LIMIT_HOURS
        self.state.duty_window_remaining = MAX_DUTY_WINDOW_HOURS
        self.state.driving_remaining = MAX_DRIVING_HOURS
        self.state.driving_since_break = 0.0
        self.state.miles_since_fuel = 0.0


def build_schedule(route, current_cycle_used, start_at):
    return HOSPlanner(route, current_cycle_used, start_at).build_schedule()
