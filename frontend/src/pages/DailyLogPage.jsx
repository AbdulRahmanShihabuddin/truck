import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import LogGrid from "../components/eld/LogGrid.jsx";
import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatDate, formatHours, formatMiles, formatTime, statusClass, statusIcon } from "../utils/format.js";
import { findLogByDate } from "../utils/time.js";
import SystemStatePage from "./SystemStatePage.jsx";


export default function DailyLogPage() {
  const navigate = useNavigate();
  const { date } = useParams();
  const { currentTrip, addRemarkToCurrentTrip } = useTrip();
  const [remarkOpen, setRemarkOpen] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [remarkError, setRemarkError] = useState("");
  const [remarkLoading, setRemarkLoading] = useState(false);
  const log = findLogByDate(currentTrip, date);
  const manifest = currentTrip?.input?.manifest || {};

  if (!currentTrip || !log) {
    return (
      <SystemStatePage
        title="Daily Log Unavailable"
        message="Generate a trip plan first, then select one of its daily HOS sheets."
        actionLabel="Plan New Trip"
        active="Logs"
      />
    );
  }

  const saveRemark = async (event) => {
    event.preventDefault();
    if (!remarkText.trim()) {
      setRemarkError("Remark cannot be blank.");
      return;
    }
    setRemarkLoading(true);
    setRemarkError("");
    try {
      await addRemarkToCurrentTrip(log.date, remarkText.trim());
      setRemarkText("");
      setRemarkOpen(false);
    } catch (error) {
      setRemarkError(error.message || "Unable to save remark.");
    } finally {
      setRemarkLoading(false);
    }
  };

  const remarkPanel = (
    <div className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-[80] flex items-center justify-center p-4 no-print">
      <form className="bg-surface-container-lowest rounded-xl ghost-border p-6 max-w-lg w-full shadow-[0_32px_64px_rgba(25,27,34,0.18)]" onSubmit={saveRemark}>
        <h2 className="font-headline text-2xl text-on-surface mb-2">Add Remark</h2>
        <p className="font-body text-sm text-on-surface-variant mb-4">Attach a dated note to {formatDate(`${log.date}T00:00:00`)}.</p>
        <textarea
          className="w-full min-h-32 bg-surface-container-low rounded-lg border border-outline-variant/30 focus:ring-primary focus:border-primary"
          value={remarkText}
          onChange={(event) => setRemarkText(event.target.value)}
          placeholder="Enter log remark..."
        />
        {remarkError && <p className="mt-3 text-error font-body text-sm">{remarkError}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button className="px-4 py-2 text-primary hover:bg-surface-container-low rounded-md" type="button" onClick={() => setRemarkOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary-gradient text-on-primary px-5 py-2 rounded-md disabled:opacity-60" type="submit" disabled={remarkLoading}>
            {remarkLoading ? "Saving..." : "Save Remark"}
          </button>
        </div>
      </form>
    </div>
  );

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <div className="hidden md:block">
        <TopNav active="Logs" />
      </div>
      {remarkOpen && remarkPanel}

      <div className="md:hidden max-w-md mx-auto relative pb-28 w-full">
        <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl px-6 py-5 flex items-center justify-between no-print">
          <button className="text-primary hover:text-primary-container transition-colors" onClick={() => navigate("/trip/logs")} aria-label="Back to logs">
            <span className="material-symbols-outlined text-2xl">arrow_back</span>
          </button>
          <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface">{formatDate(`${log.date}T00:00:00`, { month: "short", day: "numeric", year: "numeric" })}</h1>
          <span className="font-headline italic text-tertiary text-sm">{log.hos_status}</span>
        </header>
        <main className="px-4 flex flex-col gap-8 mt-2">
          <section className="bg-surface-container-lowest p-6 rounded-xl shadow-[0_8px_32px_rgba(25,27,34,0.03)] flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-label text-sm text-on-surface-variant mb-1">Total Driving</p>
                <p className="font-headline text-3xl font-bold text-primary">{formatHours(log.totals.driving)}</p>
              </div>
              <div className="text-right">
                <p className="font-label text-sm text-on-surface-variant mb-1">Distance</p>
                <p className="font-body text-lg font-medium text-on-surface">{formatMiles(log.totals.distance_miles)}</p>
              </div>
            </div>
            <div className="h-14 relative w-full bg-surface-container-high rounded-full overflow-hidden flex">
              {log.graph_segments.map((segment, index) => (
                <div
                  key={`${segment.start_hour}-${index}`}
                  className={segment.status === "driving" ? "h-full bg-primary" : segment.status === "on_duty" ? "h-full bg-secondary-container" : "h-full bg-surface-dim"}
                  style={{ width: `${segment.width_pct}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between font-label text-xs text-on-surface-variant">
              <span>M</span><span>3A</span><span>6A</span><span>9A</span><span>N</span><span>3P</span><span>6P</span><span>9P</span>
            </div>
          </section>
          <section className="flex flex-col gap-4">
            <h2 className="font-headline text-lg font-semibold text-on-surface px-2">Log Entries</h2>
            <div className="flex flex-col gap-3">
              {log.events.map((event, index) => (
                <div key={`${event.start_at}-${index}`} className={`bg-surface-container-lowest p-5 rounded-xl shadow-[0_4px_24px_rgba(25,27,34,0.02)] flex gap-4 items-center ${event.status === "driving" ? "border-l-4 border-tertiary" : ""}`}>
                  <div className="w-12 text-center">
                    <span className={`font-label text-sm font-medium block ${event.status === "driving" ? "text-primary" : "text-on-surface-variant"}`}>{formatTime(event.start_at)}</span>
                  </div>
                  {event.status !== "driving" && <div className="h-10 w-1 bg-surface-dim rounded-full" />}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`material-symbols-outlined text-lg ${event.status === "driving" ? "text-primary" : "text-on-surface-variant"}`}>{statusIcon(event.status)}</span>
                      <h3 className={event.status === "driving" ? "font-headline font-bold text-primary" : "font-body font-medium text-on-surface"}>{event.status_label}</h3>
                    </div>
                    <p className="font-label text-xs text-on-surface-variant">{formatHours(event.duration_hours)} - {event.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-2xl pt-4 pb-8 px-6 shadow-[0_-10px_40px_rgba(25,27,34,0.05)] border-t border-surface-container-high no-print">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              className="flex-1 bg-surface-container-low text-primary py-4 rounded-xl font-body font-medium text-lg flex justify-center items-center gap-2"
              onClick={() => setRemarkOpen(true)}
            >
              <span className="material-symbols-outlined">add_comment</span>
              Remark
            </button>
            <button
              className="flex-1 btn-primary-gradient text-on-primary py-4 rounded-xl font-body font-medium text-lg shadow-[0_8px_24px_rgba(9,76,178,0.2)] hover:shadow-[0_12px_32px_rgba(9,76,178,0.3)] transition-all duration-300 flex justify-center items-center gap-2"
              onClick={() => navigate("/trip/review")}
            >
              <span className="material-symbols-outlined">verified</span>
              Verify Log
            </button>
          </div>
        </div>
      </div>

      <div className="hidden md:flex flex-1 max-w-screen-2xl mx-auto w-full">
        <aside className="hidden md:flex h-screen w-72 left-0 top-0 fixed bg-slate-100 text-blue-900 font-serif text-lg flex-col gap-8 p-8 border-r border-slate-200/10 z-40 pt-32 no-print">
          <div>
            <h2 className="font-headline italic text-xl text-amber-700 mb-1">The Curator</h2>
            <p className="text-sm text-slate-500 font-label tracking-widest uppercase">Fleet Intelligence</p>
          </div>
          <nav className="flex flex-col gap-4">
            <Link className="flex items-center gap-3 text-slate-500 font-label uppercase tracking-widest text-xs hover:text-blue-800 group" to="/trip/results">
              <span className="material-symbols-outlined group-hover:text-blue-800 transition-colors">map</span>
              Current Trip
            </Link>
            <Link className="flex items-center gap-3 text-blue-900 font-bold italic translate-x-2 transition-transform group" to="/trip/logs">
              <span className="material-symbols-outlined text-blue-900">history_edu</span>
              Logbook
            </Link>
          </nav>
        </aside>
        <main className="flex-1 px-8 py-12 md:ml-72 bg-surface">
          <div className="mb-12 flex justify-between items-end">
            <div className="w-2/3">
              <p className="font-label text-sm text-tertiary mb-2 uppercase tracking-widest">Daily Record of Duty Status</p>
              <h1 className="font-headline text-4xl text-on-surface mb-4">{formatDate(`${log.date}T00:00:00`)}</h1>
              <p className="font-body text-on-surface-variant text-lg">
                Driver: {manifest.driver_name} - Vehicle: {manifest.vehicle_id} - Co-Driver: {manifest.co_driver_name || "None"}
              </p>
            </div>
            <div className="flex gap-4 items-center no-print">
              <button className="font-body text-primary hover:underline px-4 py-2 transition-all" onClick={() => setRemarkOpen(true)}>Add Remark</button>
              <button className="btn-primary-gradient text-on-primary font-body font-medium px-6 py-3 rounded-md hover:opacity-90 transition-opacity shadow-[0_4px_14px_0_rgba(0,54,134,0.39)]" onClick={() => navigate("/trip/review")}>Verify Log</button>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl p-8 mb-12 relative overflow-hidden ring-1 ring-outline-variant/15">
            <h2 className="font-headline text-2xl text-on-surface mb-6 border-b border-surface-container pb-4">24-Hour Duty Status</h2>
            <LogGrid log={log} />
          </div>
          <div className="bg-surface-container-low rounded-xl p-8 ring-1 ring-outline-variant/15">
            <h3 className="font-headline text-xl text-on-surface mb-6 border-b border-surface-dim pb-4">Event Narrative</h3>
            <div className="space-y-8">
              {log.remarks?.map((remark) => (
                <div key={remark.id} className="flex gap-6 group bg-surface-container-lowest p-4 -m-4 rounded-lg">
                  <div className="w-24 font-label text-sm text-tertiary flex-shrink-0 pt-1">Remark</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-tertiary/10 text-tertiary text-xs px-2 py-0.5 rounded font-label uppercase tracking-wide">Note</span>
                      <h4 className="font-body font-medium text-on-surface">Driver Remark</h4>
                    </div>
                    <p className="font-body text-sm text-on-surface-variant">{remark.text}</p>
                  </div>
                </div>
              ))}
              {log.events.map((event, index) => (
                <div key={`${event.start_at}-${index}`} className="flex gap-6 group hover:bg-surface-container-lowest p-4 -m-4 rounded-lg transition-colors duration-300 relative">
                  {event.status === "driving" && <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity" />}
                  <div className="w-24 font-label text-sm text-on-surface-variant flex-shrink-0 pt-1">{formatTime(event.start_at)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`${statusClass(event.status)} text-xs px-2 py-0.5 rounded font-label uppercase tracking-wide`}>{event.status_label}</span>
                      <h4 className="font-body font-medium text-on-surface">{event.title}</h4>
                    </div>
                    <p className="font-body text-sm text-on-surface-variant mb-2">{event.description}</p>
                    <div className="flex items-center gap-2 text-xs text-tertiary font-label">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      {event.location} - {formatHours(event.duration_hours)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
