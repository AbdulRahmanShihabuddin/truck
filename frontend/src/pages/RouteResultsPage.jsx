import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";
import RouteMap from "../components/route/RouteMap.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatHours, formatMiles, formatTime, statusIcon } from "../utils/format.js";
import SystemStatePage from "./SystemStatePage.jsx";


function timelineTone(segment, index, total) {
  if (index === 0) return "border-tertiary";
  if (index === total - 1) return "border-primary";
  if (segment.rule_tags?.includes("fuel")) return "border-surface-dim";
  if (segment.rule_tags?.includes("daily_reset") || segment.rule_tags?.includes("cycle_restart")) return "border-tertiary";
  return "border-surface-dim";
}


export default function RouteResultsPage() {
  const navigate = useNavigate();
  const { currentTrip, saveDraft } = useTrip();
  const [filter, setFilter] = useState("all");
  const schedule = currentTrip?.schedule || [];
  const itinerary = useMemo(() => {
    if (filter === "all") return schedule;
    if (filter === "fuel") return schedule.filter((segment) => segment.rule_tags?.includes("fuel"));
    if (filter === "rests") return schedule.filter((segment) => segment.rule_tags?.includes("daily_reset") || segment.rule_tags?.includes("cycle_restart") || segment.rule_tags?.includes("break"));
    if (filter === "stops") return schedule.filter((segment) => segment.status !== "driving");
    return schedule;
  }, [schedule, filter]);

  if (!currentTrip) {
    return (
      <SystemStatePage
        title="No Route Planned"
        message="Generate a journey first, then the route, stops, rests, and log sheets will appear here."
        actionLabel="Plan New Trip"
        active="Planning"
      />
    );
  }

  const modifyRoute = () => {
    saveDraft({
      ...currentTrip.input,
      ...(currentTrip.input.manifest || {}),
    });
    navigate("/trip/new");
  };

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col">
      <TopNav active="Planning" />
      <main className="flex-1 flex flex-col md:flex-row w-full max-w-screen-2xl mx-auto overflow-hidden">
        <aside className="w-full md:w-[28rem] bg-surface-container-lowest flex flex-col shrink-0 overflow-y-auto" style={{ boxShadow: "1px 0 0 rgba(195, 198, 213, 0.15)" }}>
          <div className="p-8 pb-4">
            <h1 className="font-headline text-3xl text-on-surface mb-2">Current Trip</h1>
            <p className="font-headline italic text-on-surface-variant">
              {currentTrip.input.pickup_location} to {currentTrip.input.dropoff_location}.
            </p>
          </div>
          <div className="px-8 py-4 flex gap-4">
            <button
              className="btn-primary-gradient text-on-primary font-body font-medium px-4 py-2 rounded-DEFAULT flex-1 text-center transition-opacity hover:opacity-90"
              onClick={() => navigate("/trip/logs")}
            >
              Review Logs
            </button>
            <button
              className="bg-secondary-container text-on-secondary-container font-body font-medium px-4 py-2 rounded-DEFAULT flex-1 text-center transition-opacity hover:opacity-90"
              onClick={modifyRoute}
            >
              Modify Route
            </button>
          </div>
          <div className="px-8 py-2 flex flex-wrap gap-2">
            {[
              ["all", "All"],
              ["stops", "Stops"],
              ["rests", "Rests"],
              ["fuel", "Fuel"],
            ].map(([value, label]) => (
              <button
                key={value}
                className={`px-3 py-1 rounded-full font-label text-xs transition-colors ${filter === value ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`}
                onClick={() => setFilter(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="px-8 py-4 grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Distance</p>
              <p className="font-label text-2xl text-tertiary font-bold">{formatMiles(currentTrip.summary.total_distance_miles)}</p>
            </div>
            <div className="bg-surface-container-low p-4 rounded-xl">
              <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Duration</p>
              <p className="font-label text-2xl text-tertiary font-bold">{formatHours(currentTrip.summary.total_duration_hours)}</p>
            </div>
          </div>
          <div className="flex-1 px-8 py-6">
            {itinerary.length === 0 && (
              <div className="bg-surface-container-low p-4 rounded-lg font-body text-on-surface-variant">
                No schedule items match this filter.
              </div>
            )}
            {itinerary.map((segment, index) => {
              const isLast = index === itinerary.length - 1;
              return (
                <div key={`${segment.start_at}-${index}`} className={`relative pl-8 ${isLast ? "" : "pb-10"}`}>
                  {!isLast && <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-surface-dim" />}
                  <div className={`absolute left-1 top-1 w-6 h-6 rounded-full bg-surface border-2 ${timelineTone(segment, index, itinerary.length)} flex items-center justify-center z-10`}>
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">{statusIcon(segment.status)}</span>
                  </div>
                  <div className="bg-surface-container-lowest p-4 ghost-border rounded-lg relative overflow-hidden group hover:bg-surface-container-low transition-colors duration-300">
                    {(segment.rule_tags?.includes("pickup") || segment.rule_tags?.includes("dropoff")) && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary group-hover:w-2 transition-all duration-300" />
                    )}
                    <div className="flex justify-between items-start mb-1 gap-4">
                      <h3 className="font-body font-semibold text-on-surface text-lg">{segment.title}</h3>
                      <span className="font-label text-sm text-on-surface-variant whitespace-nowrap">{formatTime(segment.start_at)}</span>
                    </div>
                    <p className="font-body text-on-surface-variant mb-2">{segment.location}</p>
                    <div className="flex gap-2 items-center text-xs font-label text-outline">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      <span>{formatHours(segment.duration_hours)} {segment.distance_miles ? `- ${formatMiles(segment.distance_miles)}` : ""}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-8 py-6 bg-surface-container-low">
            <h2 className="font-headline text-xl text-on-surface mb-4">Route Instructions</h2>
            <div className="space-y-4">
              {currentTrip.route.instructions.map((instruction) => (
                <div key={instruction.step} className="bg-surface-container-lowest p-4 rounded-lg ghost-border">
                  <p className="font-label text-xs text-tertiary uppercase tracking-widest mb-1">Step {instruction.step}</p>
                  <h3 className="font-body font-semibold text-on-surface">{instruction.title}</h3>
                  <p className="font-body text-sm text-on-surface-variant">{instruction.detail}</p>
                </div>
              ))}
            </div>
            <Link to="/trip/review" className="mt-6 inline-flex text-primary font-body font-medium hover:underline">
              Continue to final review
            </Link>
          </div>
        </aside>
        <RouteMap route={currentTrip.route} schedule={currentTrip.schedule} />
      </main>
    </div>
  );
}
