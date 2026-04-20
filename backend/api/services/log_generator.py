from collections import defaultdict
from datetime import datetime, time, timedelta


STATUS_LABELS = {
    "off_duty": "Off Duty",
    "sleeper_berth": "Sleeper Berth",
    "driving": "Driving",
    "on_duty": "On Duty, Not Driving",
}

STATUS_ROWS = {
    "off_duty": "OFF",
    "sleeper_berth": "SB",
    "driving": "D",
    "on_duty": "ON",
}


def _midnight(value):
    return datetime.combine(value.date(), time.min, tzinfo=value.tzinfo)


def _overlap(start_a, end_a, start_b, end_b):
    start = max(start_a, start_b)
    end = min(end_a, end_b)
    if end <= start:
        return None
    return start, end


def _duration_hours(start_at, end_at):
    return (end_at - start_at).total_seconds() / 3600


def _serialize_event(segment, start_at, end_at):
    source_hours = max(_duration_hours(segment["start_at"], segment["end_at"]), 0.0001)
    overlap_hours = _duration_hours(start_at, end_at)
    distance_ratio = overlap_hours / source_hours
    distance = segment.get("distance_miles", 0.0) * distance_ratio

    status = segment["status"]
    return {
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
        "status": status,
        "status_label": STATUS_LABELS[status],
        "title": segment["title"],
        "description": segment["description"],
        "location": segment["location"],
        "duration_hours": round(overlap_hours, 4),
        "distance_miles": round(distance, 1),
        "rule_tags": segment.get("rule_tags", []),
    }


def _off_duty_gap(start_at, end_at, location):
    return {
        "start_at": start_at.isoformat(),
        "end_at": end_at.isoformat(),
        "status": "off_duty",
        "status_label": STATUS_LABELS["off_duty"],
        "title": "Off Duty",
        "description": "No scheduled duty activity",
        "location": location,
        "duration_hours": round(_duration_hours(start_at, end_at), 4),
        "distance_miles": 0,
        "rule_tags": ["gap_fill"],
    }


def _build_graph_segments(events, day_start):
    graph = []
    for event in events:
        start_at = datetime.fromisoformat(event["start_at"])
        end_at = datetime.fromisoformat(event["end_at"])
        start_hour = _duration_hours(day_start, start_at)
        end_hour = _duration_hours(day_start, end_at)
        graph.append(
            {
                "status": event["status"],
                "row": STATUS_ROWS[event["status"]],
                "start_hour": round(start_hour, 4),
                "end_hour": round(end_hour, 4),
                "left_pct": round(start_hour / 24 * 100, 4),
                "width_pct": round(max(0, end_hour - start_hour) / 24 * 100, 4),
            }
        )
    return graph


def generate_daily_logs(schedule, start_at):
    if not schedule:
        return []

    trip_start = min(segment["start_at"] for segment in schedule)
    trip_end = max(segment["end_at"] for segment in schedule)
    day_start = _midnight(trip_start)
    final_day_start = _midnight(trip_end)
    logs = []

    while day_start <= final_day_start:
        day_end = day_start + timedelta(days=1)
        day_events = []
        cursor = day_start
        last_location = schedule[0]["location"]

        for segment in schedule:
            overlap = _overlap(segment["start_at"], segment["end_at"], day_start, day_end)
            if not overlap:
                continue

            event_start, event_end = overlap
            if event_start > cursor:
                day_events.append(_off_duty_gap(cursor, event_start, last_location))

            event = _serialize_event(segment, event_start, event_end)
            day_events.append(event)
            cursor = event_end
            last_location = event["location"]

        if cursor < day_end:
            day_events.append(_off_duty_gap(cursor, day_end, last_location))

        totals = defaultdict(float)
        miles = 0.0
        for event in day_events:
            totals[event["status"]] += event["duration_hours"]
            miles += event["distance_miles"]

        log = {
            "date": day_start.date().isoformat(),
            "label": day_start.strftime("%B %-d, %Y") if hasattr(day_start, "strftime") else day_start.date().isoformat(),
            "start_at": day_start.isoformat(),
            "end_at": day_end.isoformat(),
            "totals": {
                "off_duty": round(totals["off_duty"], 2),
                "sleeper_berth": round(totals["sleeper_berth"], 2),
                "driving": round(totals["driving"], 2),
                "on_duty": round(totals["on_duty"], 2),
                "on_duty_total": round(totals["driving"] + totals["on_duty"], 2),
                "distance_miles": round(miles, 1),
            },
            "events": day_events,
            "graph_segments": _build_graph_segments(day_events, day_start),
            "hos_status": "Compliant",
        }
        logs.append(log)
        day_start = day_end

    return logs
