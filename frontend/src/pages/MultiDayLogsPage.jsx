import { Link } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatHours, formatMiles, formatShortDate } from "../utils/format.js";
import { logDatePath } from "../utils/time.js";
import SystemStatePage from "./SystemStatePage.jsx";


export default function MultiDayLogsPage() {
  const { currentTrip } = useTrip();

  if (!currentTrip) {
    return (
      <SystemStatePage
        title="No Logs Yet"
        message="A generated trip plan will produce one or more 24-hour ELD-style log sheets."
        actionLabel="Plan New Trip"
        active="Logs"
      />
    );
  }

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col md:flex-row">
      <nav className="hidden md:flex flex-col gap-8 p-8 border-r border-surface-container bg-surface-dim h-screen w-72 left-0 top-0 fixed z-40 no-print">
        <div className="mb-4">
          <h1 className="font-headline italic text-xl text-tertiary-container">The Curator</h1>
          <p className="font-headline text-sm text-on-surface-variant italic mt-1">Fleet Intelligence</p>
        </div>
        <ul className="flex flex-col gap-6">
          <li>
            <Link className="flex items-center gap-4 text-on-surface font-headline italic translate-x-2 transition-transform" to="/trip/results">
              <span className="material-symbols-outlined">map</span>
              <span>Current Trip</span>
            </Link>
          </li>
          <li className="flex items-center gap-4 text-primary font-label uppercase tracking-widest text-xs">
            <span className="material-symbols-outlined">history_edu</span>
            <span>Logbook</span>
          </li>
        </ul>
      </nav>
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <TopNav active="Logs" />
        <div className="p-6 md:p-12 lg:p-16 max-w-5xl mx-auto w-full">
          <header className="mb-16 md:mb-24 flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-end">
            <div className="max-w-2xl">
              <p className="font-label text-sm text-tertiary mb-2 uppercase tracking-widest">Multi-Day Assignment</p>
              <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-on-surface leading-tight mb-4">
                {currentTrip.input.pickup_location} Corridor
              </h2>
              <p className="font-headline italic text-lg text-on-surface-variant">
                {currentTrip.input.current_location} to {currentTrip.input.dropoff_location}. A comprehensive overview of the generated haul.
              </p>
            </div>
            <div className="flex gap-8 bg-surface-container-low p-6 rounded-xl ghost-border">
              <div>
                <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">Total Distance</p>
                <p className="font-label text-3xl font-bold text-tertiary">
                  {Math.round(currentTrip.summary.total_distance_miles).toLocaleString()} <span className="text-lg text-on-surface-variant font-normal">mi</span>
                </p>
              </div>
              <div className="w-px bg-outline-variant/30" />
              <div>
                <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">Duration</p>
                <p className="font-label text-3xl font-bold text-tertiary">
                  {currentTrip.summary.day_count} <span className="text-lg text-on-surface-variant font-normal">Days</span>
                </p>
              </div>
            </div>
          </header>

          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-px bg-surface-dim hidden md:block" />
            {currentTrip.daily_logs.map((log, index) => (
              <Link key={log.date} to={`/trip/logs/${logDatePath(log)}`} className={`block relative ${index === currentTrip.daily_logs.length - 1 ? "" : "mb-16"} md:pl-16`}>
                <div className="absolute left-[11px] top-6 w-3 h-3 rounded-full bg-tertiary hidden md:block border-2 border-surface" />
                <div className={`bg-surface-container-lowest rounded-xl p-8 shadow-[0_8px_32px_-8px_rgb(var(--color-shadow)_/_0.3)] hover:bg-surface-container-low transition-colors duration-500 group cursor-pointer relative overflow-hidden ${index === 0 ? "border-l-4 border-l-tertiary" : "ghost-border"}`}>
                  <div className="flex flex-col lg:flex-row gap-8 justify-between">
                    <div className="flex-1">
                      <p className="font-label text-sm text-tertiary mb-1 uppercase tracking-widest">Day {index + 1} - {formatShortDate(log.date)}</p>
                      <h3 className="font-body font-semibold text-2xl text-on-surface mb-3">
                        {index === 0 ? "Departure & Pickup" : index === currentTrip.daily_logs.length - 1 ? "Final Approach" : "Linehaul Transit"}
                      </h3>
                      <p className="font-body text-on-surface-variant mb-6 leading-relaxed">
                        {log.events.filter((event) => event.status !== "off_duty").slice(0, 3).map((event) => event.title).join(", ") || "Off-duty period maintained."}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-high rounded-full font-label text-xs text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {log.events[0]?.location}
                        </span>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-surface-container-high rounded-full font-label text-xs text-on-surface">
                          <span className="material-symbols-outlined text-[16px]">flag</span>
                          {log.events[log.events.length - 1]?.location}
                        </span>
                      </div>
                    </div>
                    <div className="lg:w-48 shrink-0 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-outline-variant/15 pt-6 lg:pt-0 lg:pl-8">
                      <div>
                        <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">Miles Logged</p>
                        <p className="font-label text-xl text-on-surface">{formatMiles(log.totals.distance_miles)}</p>
                      </div>
                      <div>
                        <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">Drive Time</p>
                        <p className="font-label text-xl text-on-surface">{formatHours(log.totals.driving)}</p>
                      </div>
                      <div>
                        <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider mb-1">HOS Status</p>
                        <p className="font-label text-sm text-primary font-medium flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                          {log.hos_status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
