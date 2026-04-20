import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { beforeEach, describe, expect, test, vi } from "vitest";

import App from "./App.jsx";
import { TripProvider } from "./state/TripContext.jsx";


const sampleTrip = {
  trip_id: "trip_20260420080000",
  input: {
    current_location: "New York, NY",
    pickup_location: "Chicago, IL",
    dropoff_location: "Los Angeles, CA",
    current_cycle_used: 34,
    start_at: "2026-04-20T08:00:00Z",
    manifest: {
      driver_name: "Maya Ortiz",
      vehicle_id: "TRK-402",
      trailer_id: "TRL-119A",
      co_driver_name: "",
      cargo_classification: "Dry Van - General",
    },
  },
  assumptions: {},
  summary: {
    total_distance_miles: 2440.4,
    total_duration_hours: 63.5,
    total_driving_hours: 44.3,
    total_on_duty_not_driving_hours: 3.5,
    fuel_stop_count: 2,
    day_count: 3,
    compliance_status: "Compliant",
  },
  route: {
    total_distance_miles: 2440.4,
    map_points: [
      { label: "New York, NY", latitude: 40.7128, longitude: -74.006 },
      { label: "Chicago, IL", latitude: 41.8781, longitude: -87.6298 },
      { label: "Los Angeles, CA", latitude: 34.0522, longitude: -118.2437 },
    ],
    instructions: [
      { step: 1, title: "Proceed to pickup", detail: "Travel from New York, NY to Chicago, IL." },
      { step: 2, title: "Complete pickup duty", detail: "Reserve 1 hour for pickup." },
    ],
  },
  schedule: [
    {
      start_at: "2026-04-20T08:00:00Z",
      end_at: "2026-04-20T12:00:00Z",
      status: "driving",
      status_label: "Driving",
      title: "Driving",
      description: "New York, NY to Chicago, IL",
      location: "En route to Chicago, IL",
      duration_hours: 4,
      distance_miles: 220,
      rule_tags: ["driving"],
    },
    {
      start_at: "2026-04-20T12:00:00Z",
      end_at: "2026-04-20T13:00:00Z",
      status: "on_duty",
      status_label: "On Duty, Not Driving",
      title: "Pickup",
      description: "On-duty pickup operation",
      location: "Chicago, IL",
      duration_hours: 1,
      distance_miles: 0,
      rule_tags: ["pickup"],
    },
  ],
  daily_logs: [
    {
      date: "2026-04-20",
      start_at: "2026-04-20T00:00:00Z",
      end_at: "2026-04-21T00:00:00Z",
      hos_status: "Compliant",
      totals: {
        off_duty: 19,
        sleeper_berth: 0,
        driving: 4,
        on_duty: 1,
        on_duty_total: 5,
        distance_miles: 220,
      },
      events: [
        {
          start_at: "2026-04-20T08:00:00Z",
          end_at: "2026-04-20T12:00:00Z",
          status: "driving",
          status_label: "Driving",
          title: "Driving",
          description: "New York, NY to Chicago, IL",
          location: "En route to Chicago, IL",
          duration_hours: 4,
          distance_miles: 220,
          rule_tags: ["driving"],
        },
        {
          start_at: "2026-04-20T12:00:00Z",
          end_at: "2026-04-20T13:00:00Z",
          status: "on_duty",
          status_label: "On Duty, Not Driving",
          title: "Pickup",
          description: "On-duty pickup operation",
          location: "Chicago, IL",
          duration_hours: 1,
          distance_miles: 0,
          rule_tags: ["pickup"],
        },
      ],
      graph_segments: [
        { status: "driving", row: "D", start_hour: 8, end_hour: 12, left_pct: 33.3333, width_pct: 16.6667 },
        { status: "on_duty", row: "ON", start_hour: 12, end_hour: 13, left_pct: 50, width_pct: 4.1667 },
      ],
      remarks: [],
    },
    {
      date: "2026-04-21",
      start_at: "2026-04-21T00:00:00Z",
      end_at: "2026-04-22T00:00:00Z",
      hos_status: "Compliant",
      totals: {
        off_duty: 14,
        sleeper_berth: 0,
        driving: 9,
        on_duty: 1,
        on_duty_total: 10,
        distance_miles: 495,
      },
      events: [],
      graph_segments: [],
      remarks: [],
    },
  ],
  review: {
    export_filename: "trip_20260420080000_hos_plan.json",
    checks: [
      { label: "Hours of Service Integrity", status: "pass", detail: "Schedule is generated within assumptions." },
      { label: "Fuel Cadence", status: "pass", detail: "2 fuel stops inserted." },
    ],
    ready_for_archive: true,
  },
};

const archivedSummary = {
  trip_id: sampleTrip.trip_id,
  archived_at: "2026-04-20T09:00:00Z",
  updated_at: "2026-04-20T09:00:00Z",
  current_location: sampleTrip.input.current_location,
  pickup_location: sampleTrip.input.pickup_location,
  dropoff_location: sampleTrip.input.dropoff_location,
  driver_name: sampleTrip.input.manifest.driver_name,
  vehicle_id: sampleTrip.input.manifest.vehicle_id,
  total_distance_miles: sampleTrip.summary.total_distance_miles,
  day_count: sampleTrip.summary.day_count,
  compliance_status: "Compliant",
};

function stubApi(overrides = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const href = String(url);
      if (href.endsWith("/api/trips/plan/")) {
        return { ok: true, json: async () => overrides.planTrip || sampleTrip };
      }
      if (href.endsWith("/api/trips/") && options.method === "POST") {
        return { ok: true, json: async () => ({ summary: archivedSummary, trip: sampleTrip }) };
      }
      if (href.endsWith(`/api/trips/${sampleTrip.trip_id}/remarks/`)) {
        const updated = {
          ...sampleTrip,
          daily_logs: [
            {
              ...sampleTrip.daily_logs[0],
              remarks: [{ id: "remark_1", date: "2026-04-20", text: "Dock assignment confirmed.", created_at: "2026-04-20T09:00:00Z" }],
            },
            sampleTrip.daily_logs[1],
          ],
        };
        return { ok: true, json: async () => ({ remark: updated.daily_logs[0].remarks[0], trip: updated }) };
      }
      if (href.endsWith(`/api/trips/${sampleTrip.trip_id}/`)) {
        return { ok: true, json: async () => sampleTrip };
      }
      if (href.endsWith("/api/trips/")) {
        return { ok: true, json: async () => overrides.archivedTrips || [] };
      }
      if (href.endsWith("/api/health/")) {
        return { ok: true, json: async () => ({ status: "ok" }) };
      }
      return { ok: true, json: async () => ({}) };
    }),
  );
}


function renderAt(path) {
  window.history.pushState({}, "Test page", path);
  return render(
    <BrowserRouter>
      <TripProvider>
        <App />
      </TripProvider>
    </BrowserRouter>,
  );
}


beforeEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
  stubApi();
});


describe("Truck HOS planner frontend", () => {
  test("trip form validates required fields", async () => {
    renderAt("/trip/new");
    await userEvent.clear(screen.getByLabelText(/Current Location/i));
    await userEvent.click(screen.getByRole("button", { name: /Generate Route/i }));

    expect(await screen.findByText(/Current location is required/i)).toBeInTheDocument();
  });

  test("trip form submits payload and navigates to route results", async () => {
    renderAt("/trip/new");
    await userEvent.type(screen.getByLabelText(/Assigned Driver/i), "Maya Ortiz");
    await userEvent.type(screen.getByLabelText(/Vehicle ID/i), "TRK-402");
    await userEvent.type(screen.getByLabelText(/Trailer ID/i), "TRL-119A");
    await userEvent.click(screen.getByRole("button", { name: /Generate Route/i }));

    await waitFor(() => {
      expect(screen.getByText(/Route Instructions/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("route-map")).toBeInTheDocument();
  });

  test("route results, multi-day logs, and daily log render saved trip data", () => {
    window.localStorage.setItem("alexandria.currentTrip", JSON.stringify(sampleTrip));

    renderAt("/trip/results");
    expect(screen.getByText(/Route Instructions/i)).toBeInTheDocument();
    expect(screen.getByText(/Chicago, IL to Los Angeles, CA/i)).toBeInTheDocument();

    cleanup();
    renderAt("/trip/logs");
    expect(screen.getByText(/Multi-Day Assignment/i)).toBeInTheDocument();
    expect(screen.getByText(/Day 1/i)).toBeInTheDocument();

    cleanup();
    renderAt("/trip/logs/2026-04-20");
    expect(screen.getByText(/Daily Record of Duty Status/i)).toBeInTheDocument();
    expect(screen.getByTestId("log-grid")).toBeInTheDocument();
  });

  test("review export buttons print and archive current trip", async () => {
    window.localStorage.setItem("alexandria.currentTrip", JSON.stringify(sampleTrip));
    vi.spyOn(window, "print").mockImplementation(() => {});

    renderAt("/trip/review");
    await userEvent.click(screen.getByRole("button", { name: /Export to PDF/i }));
    expect(window.print).toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Archive Trip/i }));
    expect(await screen.findByText(/Trip archived in Django/i)).toBeInTheDocument();
  });

  test("log history loads archived trip and daily remarks persist", async () => {
    stubApi({ archivedTrips: [archivedSummary] });
    renderAt("/trip/history");

    const archivedLinks = await screen.findAllByText(/Chicago, IL to Los Angeles, CA/i);
    await userEvent.click(archivedLinks[0]);
    expect(await screen.findByText(/Vehicle: TRK-402/i)).toBeInTheDocument();

    cleanup();
    window.localStorage.setItem("alexandria.currentTrip", JSON.stringify(sampleTrip));
    renderAt("/trip/logs/2026-04-20");
    await userEvent.click(screen.getByRole("button", { name: /^Add Remark$/i }));
    await userEvent.type(screen.getByPlaceholderText(/Enter log remark/i), "Dock assignment confirmed.");
    await userEvent.click(screen.getByRole("button", { name: /Save Remark/i }));
    expect(await screen.findByText(/Dock assignment confirmed/i)).toBeInTheDocument();
  });
});
