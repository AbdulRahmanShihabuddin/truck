import { useState } from "react";
import { Link } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatDate, formatHours, formatMiles } from "../utils/format.js";
import SystemStatePage from "./SystemStatePage.jsx";


function downloadJson(trip) {
  const blob = new Blob([JSON.stringify(trip, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = trip.review.export_filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}


export default function ReviewExportPage() {
  const { currentTrip, archiveCurrentTrip } = useTrip();
  const [archived, setArchived] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  if (!currentTrip) {
    return (
      <SystemStatePage
        title="Nothing To Review"
        message="The final review is populated after a route and its ELD log sheets have been generated."
        actionLabel="Plan New Trip"
        active="Archive"
      />
    );
  }

  const manifest = currentTrip.input.manifest || {};

  const handleArchive = async () => {
    setArchiveLoading(true);
    setArchiveError("");
    try {
      await archiveCurrentTrip();
      setArchived(true);
    } catch (error) {
      setArchiveError(error.message || "Unable to archive trip.");
    } finally {
      setArchiveLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col">
      <TopNav active="Archive" />
      <main className="flex-grow w-full max-w-screen-xl mx-auto px-6 md:px-12 py-16">
        <header className="mb-16 max-w-3xl">
          <h1 className="font-headline text-5xl md:text-6xl text-on-surface leading-tight tracking-tight mb-4">
            Final Curatorial Review
          </h1>
          <p className="font-headline italic text-xl text-on-surface-variant max-w-2xl leading-relaxed">
            A comprehensive summary of trip data, operational logs, and system flags prior to archival commitment.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <section className="bg-surface-container-lowest rounded-xl p-10 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-surface-dim" />
              <h2 className="font-headline text-2xl text-on-surface mb-8 border-b border-surface-container-high pb-4">Trip Manifesto</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Current Position</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{currentTrip.input.current_location}</span>
                  <span className="block font-label text-sm text-on-surface-variant mt-1">{formatDate(currentTrip.input.start_at)}</span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Destination Facility</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{currentTrip.input.dropoff_location}</span>
                  <span className="block font-label text-sm text-on-surface-variant mt-1">{currentTrip.summary.day_count} log day(s)</span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Assigned Curator</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">person</span>
                    </div>
                    <span className="font-body text-md text-on-surface">{manifest.driver_name}</span>
                  </div>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Equipment Identifier</span>
                  <span className="block font-body text-md text-on-surface mt-1">
                    Tractor {manifest.vehicle_id} - Trailer {manifest.trailer_id}
                  </span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Cargo Classification</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{manifest.cargo_classification}</span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Co-Driver</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{manifest.co_driver_name || "None"}</span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Distance</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{formatMiles(currentTrip.summary.total_distance_miles)}</span>
                </div>
                <div>
                  <span className="block font-label text-xs uppercase tracking-widest text-on-surface-variant mb-1">Driving Time</span>
                  <span className="block font-body text-lg text-on-surface font-medium">{formatHours(currentTrip.summary.total_driving_hours)}</span>
                </div>
              </div>
            </section>
            <section className="bg-surface-container-low rounded-xl p-10">
              <h3 className="font-headline text-xl text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
                Curator's Notes
              </h3>
              <p className="font-body text-on-surface-variant leading-relaxed">
                Route generated with deterministic offline estimates. HOS segments include pickup, drop-off, breaks, fuel stops, daily resets, and cycle restarts where required by the v1 assumptions.
              </p>
              <Link to="/trip/logs" className="inline-flex mt-6 text-primary font-body font-medium hover:underline">
                Inspect generated log sheets
              </Link>
            </section>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <section className="bg-surface-container-lowest rounded-xl p-8 relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary" />
              <h2 className="font-headline text-xl text-on-surface mb-6 flex justify-between items-center">
                Compliance Log
                <span className="material-symbols-outlined text-tertiary">verified</span>
              </h2>
              <div className="flex flex-col space-y-6">
                {currentTrip.review.checks.map((check) => (
                  <div key={check.label} className={check.status === "info" ? "flex items-start gap-4 p-3 bg-surface-bright rounded-md" : "flex items-start gap-4"}>
                    <span className={`material-symbols-outlined mt-0.5 ${check.status === "info" ? "text-tertiary" : "text-primary"}`}>
                      {check.status === "info" ? "info" : "check_circle"}
                    </span>
                    <div>
                      <span className="block font-label text-sm text-on-surface font-medium">{check.label}</span>
                      <span className="block font-label text-xs text-on-surface-variant mt-1">{check.detail}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4 mt-auto pt-8 no-print">
              {archived && (
                <div className="bg-surface-container-low text-primary rounded-md p-4 font-body">
                  Trip archived in Django and available in Log History.
                </div>
              )}
              {archiveError && (
                <div className="bg-error-container text-on-error-container rounded-md p-4 font-body">
                  {archiveError}
                </div>
              )}
              <button className="w-full btn-primary-gradient text-on-primary rounded-md py-4 px-6 font-body font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity" onClick={() => window.print()}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Export to PDF
              </button>
              <button className="w-full bg-secondary-container text-on-secondary-container rounded-md py-4 px-6 font-body font-medium flex items-center justify-center gap-3 hover:opacity-90 transition-opacity" onClick={() => downloadJson(currentTrip)}>
                <span className="material-symbols-outlined">download</span>
                Download JSON
              </button>
              <button className="w-full bg-surface-container-low text-on-surface rounded-md py-4 px-6 font-body font-medium flex items-center justify-center gap-3 hover:bg-surface-container transition-colors disabled:opacity-60" onClick={handleArchive} disabled={archiveLoading}>
                <span className="material-symbols-outlined">archive</span>
                {archiveLoading ? "Archiving..." : "Archive Trip"}
              </button>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
