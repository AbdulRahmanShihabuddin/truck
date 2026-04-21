# API Contract

## Health

`GET /api/health/`

```json
{
  "status": "ok"
}
```

## Plan Trip

`POST /api/trips/plan/`

### Request

```json
{
  "current_location": "New York, NY",
  "pickup_location": "Chicago, IL",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 34,
  "start_at": "2026-04-20T08:00:00Z",
  "driver_name": "Maya Ortiz",
  "vehicle_id": "TRK-402",
  "trailer_id": "TRL-119A",
  "co_driver_name": "",
  "cargo_classification": "Dry Van - General"
}
```

`start_at` is optional. If omitted, the backend uses the current server time.
Locations must be supported city names from the offline table. The frontend submits the matching latitude/longitude values for the selected locations.

### Response

```json
{
  "trip_id": "trip_...",
  "input": {},
  "assumptions": {},
  "summary": {},
  "route": {
    "legs": [],
    "instructions": [],
    "map_points": []
  },
  "schedule": [],
  "daily_logs": [],
  "review": {}
}
```

Requests over 5,000 planned miles or 14 generated days return `400` with a `route` error.

## Archive Trips

`GET /api/trips/` returns archived trip summaries.

`POST /api/trips/`

```json
{
  "trip": {
    "trip_id": "trip_20260420080000"
  }
}
```

The posted `trip` must be a full generated trip payload from `POST /api/trips/plan/`.

`GET /api/trips/<trip_id>/` returns the full archived trip payload.

`DELETE /api/trips/<trip_id>/` deletes the archived trip.

`POST /api/trips/<trip_id>/remarks/`

```json
{
  "date": "2026-04-20",
  "text": "Dock assignment confirmed."
}
```

### HOS Assumptions

- Property-carrying driver.
- 70 hours / 8 days cycle.
- 11-hour driving limit after 10 consecutive hours off duty.
- 14-hour driving window.
- 30-minute break after 8 cumulative driving hours.
- No adverse driving conditions.
- No split sleeper berth.
- 34-hour restart is inserted when the 70-hour cycle is exhausted.
- Pickup and drop-off are each 1 hour on-duty not driving.
- Fuel stop is inserted at least every 1,000 miles; fuel duration is 30 minutes on-duty not driving.
- Average planning speed is 55 mph.
