import { Link, useNavigate } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { formatDate, formatMiles } from "../utils/format.js";


export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentTrip, archivedTrips } = useTrip();

  return (
    <div className="bg-background text-on-surface font-body antialiased min-h-screen flex">
      <aside className="bg-surface-dim text-primary h-screen w-72 left-0 top-0 fixed flex-col gap-8 p-8 border-r-0 shadow-[4px_0_24px_rgba(25,27,34,0.06)] z-40 hidden md:flex no-print">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-primary">The Curator</h1>
          <p className="font-label text-sm text-on-surface-variant mt-1">Fleet Intelligence</p>
        </div>
        <ul className="flex flex-col gap-4 mt-8 w-full">
          <li className="flex items-center gap-4 text-primary font-bold italic translate-x-2">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
            Current Trip
          </li>
          {[
            { icon: "history_edu", label: "Logbook", to: "/trip/logs" },
            { icon: "local_shipping", label: "Fleet Status", to: "/trip/results" },
            { icon: "verified_user", label: "Safety", to: "/trip/review" },
            { icon: "settings", label: "Settings", to: "/trip/new" },
          ].map((item) => (
            <li key={item.label}>
              <Link to={item.to} className="flex items-center gap-4 text-on-surface-variant font-label uppercase tracking-widest text-xs hover:text-primary transition-colors duration-300">
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 md:ml-72 flex flex-col min-h-screen">
        <TopNav active="Dashboard" />
        <div className="p-6 md:p-12 max-w-screen-2xl mx-auto w-full flex-1 flex flex-col gap-12">
          <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 pt-8">
            <div className="max-w-3xl">
              <h2 className="font-headline text-4xl md:text-5xl lg:text-6xl text-primary mb-4 leading-tight">State of the Fleet</h2>
              <p className="font-headline italic text-xl md:text-2xl text-on-surface-variant leading-relaxed">
                Curate a compliant trip plan, inspect the resulting HOS timeline, and export the generated log archive.
              </p>
            </div>
            <button
              className="btn-primary-gradient text-on-primary font-body font-medium px-8 py-4 rounded-xl shadow-[0_8px_24px_rgba(0,54,134,0.2)] hover:shadow-[0_12px_32px_rgba(0,54,134,0.3)] transition-all duration-300 flex items-center gap-3 group"
              onClick={() => navigate("/trip/new")}
            >
              <span className="material-symbols-outlined group-hover:rotate-90 transition-transform duration-300">add</span>
              Plan New Trip
            </button>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
            <div className="md:col-span-8 bg-surface-container-low rounded-xl p-8 relative overflow-hidden group">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="font-headline text-2xl text-on-surface">Curated Journeys</h3>
                <span className="font-label text-xs text-tertiary bg-tertiary/10 px-3 py-1 rounded-full border border-tertiary/20">Active Archive</span>
              </div>
              <div className="flex flex-col gap-8 relative z-10">
                {currentTrip ? (
                  <Link
                    to="/trip/results"
                    className="bg-surface-container-lowest rounded-lg p-6 flex flex-col md:flex-row gap-6 items-start md:items-center relative transition-colors duration-300 hover:bg-surface-bright shadow-[0_4px_24px_rgba(25,27,34,0.02)]"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary rounded-l-lg" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">{currentTrip.trip_id}</span>
                        <span className="w-1 h-1 bg-surface-dim rounded-full" />
                        <span className="font-label text-xs text-tertiary font-medium">Planned</span>
                      </div>
                      <h4 className="font-body font-semibold text-lg text-on-surface">
                        {currentTrip.input.pickup_location} to {currentTrip.input.dropoff_location}
                      </h4>
                      <p className="font-headline italic text-sm text-on-surface-variant mt-1">
                        {formatMiles(currentTrip.summary.total_distance_miles)} across {currentTrip.summary.day_count} log day(s).
                      </p>
                    </div>
                    <div className="w-full md:w-48">
                      <div className="flex items-center justify-between relative mb-2">
                        <div className="absolute left-0 right-0 top-1/2 h-px bg-surface-dim -translate-y-1/2 z-0" />
                        <div className="w-2 h-2 rounded-full bg-tertiary z-10 shadow-[0_0_8px_rgba(109,94,0,0.4)]" />
                        <div className="w-2 h-2 rounded-full bg-tertiary z-10" />
                        <div className="w-2 h-2 rounded-full bg-surface-container-highest z-10" />
                      </div>
                      <div className="flex justify-between font-label text-[10px] text-on-surface-variant uppercase">
                        <span>Start</span>
                        <span>Pick</span>
                        <span>Drop</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="bg-surface-container-lowest rounded-lg p-8 text-on-surface-variant">
                    <p className="font-headline italic text-lg">No active plan has been generated yet.</p>
                    <button className="text-primary font-body font-medium mt-4 hover:underline" onClick={() => navigate("/trip/new")}>Create the first journey</button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-4 flex flex-col gap-8">
              <div className="bg-surface-container-lowest ghost-border rounded-xl p-8 shadow-[0_8px_32px_rgba(25,27,34,0.03)] flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <span className="material-symbols-outlined text-tertiary">shield</span>
                  <h3 className="font-headline text-xl text-on-surface">Safety Overview</h3>
                </div>
                <div className="flex flex-col gap-6">
                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label text-sm text-on-surface-variant">Generated Compliance</span>
                      <span className="font-headline text-2xl text-primary">{currentTrip ? "100%" : "0%"}</span>
                    </div>
                    <div className="w-full h-1 bg-surface-dim rounded-full overflow-hidden">
                      <div className="h-full bg-tertiary" style={{ width: currentTrip ? "100%" : "0%" }} />
                    </div>
                  </div>
                  <div>
                    <span className="font-label text-xs text-on-surface-variant uppercase tracking-wider">Archived Trips</span>
                    <p className="font-headline text-4xl text-primary mt-2">{archivedTrips.length}</p>
                  </div>
                  {archivedTrips[0] && (
                    <p className="font-body text-sm text-on-surface-variant">
                      Last archived {formatDate(archivedTrips[0].archived_at)}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
