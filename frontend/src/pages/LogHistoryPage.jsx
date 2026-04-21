import { useState } from "react";
import { useNavigate } from "react-router-dom";

import LogGrid from "../components/eld/LogGrid.jsx";
import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatHours, formatMiles, formatShortDate, formatTime, statusClass } from "../utils/format.js";
import { logDatePath } from "../utils/time.js";
import SystemStatePage from "./SystemStatePage.jsx";


export default function LogHistoryPage() {
  const navigate = useNavigate();
  const {
    archivedTrips,
    archiveLoading,
    archiveError,
    currentTrip,
    loadArchivedTrip,
    removeArchivedTrip,
  } = useTrip();
  const [selectedDate, setSelectedDate] = useState(currentTrip?.daily_logs?.[0]?.date || "");
  const [actionError, setActionError] = useState("");

  const selectedLog =
    currentTrip?.daily_logs?.find((log) => log.date === selectedDate) ||
    currentTrip?.daily_logs?.[0] ||
    null;

  const openTrip = async (tripId) => {
    setActionError("");
    try {
      const trip = await loadArchivedTrip(tripId);
      setSelectedDate(trip.daily_logs?.[0]?.date || "");
    } catch (error) {
      setActionError(error.message || "Unable to load archived trip.");
    }
  };

  const deleteTrip = async (tripId) => {
    setActionError("");
    try {
      await removeArchivedTrip(tripId);
    } catch (error) {
      setActionError(error.message || "Unable to delete archived trip.");
    }
  };

  if (!archiveLoading && !archivedTrips.length && !currentTrip) {
    return (
      <SystemStatePage
        title="No Archived Logs"
        message="Archive a generated trip from the review screen, then its logbook will appear here."
        actionLabel="Plan New Trip"
        active="Logs"
      />
    );
  }

  return (
    <div className="bg-background text-on-background font-body antialiased min-h-screen flex flex-col md:flex-row">
      <nav className="hidden md:flex flex-col gap-8 p-8 border-r border-outline-variant/20 h-screen w-72 left-0 top-0 fixed bg-surface-dim z-40 no-print">
        <div className="mb-8">
          <h1 className="font-headline italic text-xl text-tertiary">The Curator</h1>
          <p className="text-xs text-on-surface-variant font-label tracking-widest mt-1">Fleet Intelligence</p>
        </div>
        <ul className="flex flex-col gap-6 w-full">
          {archivedTrips.map((trip) => (
            <li key={trip.trip_id}>
              <button
                className="text-left w-full flex items-center gap-4 text-on-surface-variant font-label tracking-widest text-xs hover:text-on-surface uppercase"
                onClick={() => openTrip(trip.trip_id)}
              >
                <span className="material-symbols-outlined">history_edu</span>
                <span>{trip.pickup_location} to {trip.dropoff_location}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <TopNav active="Logs" />
        <div className="p-8 md:p-12 lg:p-16 max-w-7xl mx-auto w-full flex-1">
          <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h2 className="text-display-sm font-headline text-on-surface mb-2">Log History</h2>
              <p className="text-body-lg text-on-surface-variant font-body">Review archived hours of service and compliance records.</p>
            </div>
            <div className="flex gap-4 no-print">
              <button className="px-6 py-3 rounded-md text-primary font-body font-medium hover:bg-surface-container-low transition-colors duration-300 flex items-center gap-2" onClick={() => window.print()}>
                <span className="material-symbols-outlined">print</span>
                Print Log
              </button>
              <button
                className="px-6 py-3 rounded-md btn-primary-gradient text-on-primary font-body font-medium shadow-[0_4px_14px_0_rgb(var(--color-primary)_/_0.5)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 disabled:opacity-60"
                onClick={() => selectedLog && navigate(`/trip/logs/${logDatePath(selectedLog)}`)}
                disabled={!selectedLog}
              >
                View Full Detail
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </header>

          {(archiveError || actionError) && (
            <div className="bg-error-container text-on-error-container rounded-xl p-4 mb-6 font-body">
              {archiveError || actionError}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-xl ghost-border shadow-[0_8px_30px_rgb(var(--color-shadow)_/_0.2)]">
                <h3 className="text-title-md font-body text-on-surface mb-4">Archived Trips</h3>
                <div className="space-y-3">
                  {archiveLoading && <p className="font-body text-on-surface-variant">Loading archives...</p>}
                  {archivedTrips.map((trip) => (
                    <div key={trip.trip_id} className="bg-surface-container-low rounded-lg p-4">
                      <button className="text-left w-full" onClick={() => openTrip(trip.trip_id)}>
                        <p className="font-body font-semibold text-on-surface">{trip.pickup_location} to {trip.dropoff_location}</p>
                        <p className="font-label text-xs text-on-surface-variant mt-1">
                          {trip.driver_name} - {formatMiles(trip.total_distance_miles)} - {trip.day_count} day(s)
                        </p>
                      </button>
                      <button className="mt-3 text-error font-label text-xs hover:underline" onClick={() => deleteTrip(trip.trip_id)}>
                        Delete archive
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-surface-container-lowest p-6 rounded-xl ghost-border shadow-[0_8px_30px_rgb(var(--color-shadow)_/_0.2)]">
                <h3 className="text-title-md font-body text-on-surface mb-4">Select Date</h3>
                <div className="grid grid-cols-2 gap-2 text-body-sm font-body">
                  {currentTrip?.daily_logs?.map((log) => (
                    <button
                      key={log.date}
                      className={`p-3 rounded text-left ${selectedLog?.date === log.date ? "bg-primary-container text-on-primary-container font-bold shadow-[0_2px_8px_rgb(var(--color-primary)_/_0.35)]" : "hover:bg-surface-container-low"}`}
                      onClick={() => setSelectedDate(log.date)}
                    >
                      {formatShortDate(log.date)}
                    </button>
                  ))}
                </div>
              </div>

              {selectedLog && (
                <div className="bg-surface-container-lowest p-6 rounded-xl ghost-border shadow-[0_8px_30px_rgb(var(--color-shadow)_/_0.2)]">
                  <h3 className="text-title-md font-body text-on-surface mb-6 border-b border-surface-variant pb-4">Cycle Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-label-sm font-label text-on-surface-variant mb-1">
                        <span>Driving Logged</span>
                        <span>{formatHours(selectedLog.totals.driving)}</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: `${Math.min(100, (selectedLog.totals.driving / 11) * 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-label-sm font-label text-on-surface-variant mb-1">
                        <span>On Duty Total</span>
                        <span>{formatHours(selectedLog.totals.on_duty_total)}</span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
                        <div className="bg-tertiary h-full" style={{ width: `${Math.min(100, (selectedLog.totals.on_duty_total / 14) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2 flex flex-col gap-6">
              {selectedLog ? (
                <>
                  <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-xl ghost-border">
                    <div>
                      <h2 className="text-headline-md font-headline text-on-surface">{formatShortDate(selectedLog.date)}</h2>
                      <p className="text-label-md font-label text-on-surface-variant mt-1">
                        Vehicle: {currentTrip.input.manifest.vehicle_id} - Driver: {currentTrip.input.manifest.driver_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest px-4 py-2 rounded-full border border-tertiary/20 shadow-sm">
                      <span className="material-symbols-outlined text-tertiary text-lg">check_circle</span>
                      <span className="text-label-sm font-label text-tertiary font-medium">{selectedLog.hos_status}</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-xl ghost-border shadow-[0_8px_30px_rgb(var(--color-shadow)_/_0.2)] overflow-hidden">
                    <div className="p-6 border-b border-surface-variant bg-surface-bright">
                      <LogGrid log={selectedLog} />
                    </div>
                    <div className="flex flex-col">
                      {selectedLog.events.map((event) => (
                        <div key={event.start_at} className="flex items-stretch group hover:bg-surface-container-low transition-colors duration-300">
                          <div className="w-24 p-4 border-r border-surface-variant flex flex-col justify-center items-end text-label-md font-label text-on-surface-variant">
                            <span>{formatTime(event.start_at)}</span>
                          </div>
                          <div className="flex-1 p-4 flex justify-between items-center">
                            <div>
                              <h4 className="text-title-md font-body text-on-surface flex items-center gap-2">
                                <span className={statusClass(event.status)}>{event.status_label}</span>
                              </h4>
                              <p className="text-label-sm font-label text-on-surface-variant mt-1">{event.title} - {event.location}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-label-md font-label text-on-surface">{formatHours(event.duration_hours)}</span>
                              <p className="text-[10px] font-label text-outline uppercase tracking-wider mt-1">Duration</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-surface-container-low rounded-xl p-8 font-body text-on-surface-variant">
                  Select an archived trip to inspect its daily logs.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
