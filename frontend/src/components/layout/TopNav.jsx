import { NavLink } from "react-router-dom";
import { useState } from "react";

import { checkHealth } from "../../api/trips.js";
import { useTrip } from "../../state/TripContext.jsx";


const navItems = [
  { to: "/", label: "Dashboard" },
  { to: "/trip/history", label: "Logs" },
  { to: "/trip/new", label: "Planning" },
  { to: "/trip/review", label: "Archive" },
];


export default function TopNav({ active = "Dashboard" }) {
  const { currentTrip, archivedTrips } = useTrip();
  const [openPanel, setOpenPanel] = useState(null);
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");

  const showNotifications = async () => {
    const next = openPanel === "notifications" ? null : "notifications";
    setOpenPanel(next);
    if (next) {
      setHealthError("");
      try {
        setHealth(await checkHealth());
      } catch (error) {
        setHealthError(error.message || "Unable to reach API.");
      }
    }
  };

  const manifest = currentTrip?.input?.manifest;

  return (
    <nav className="glass-nav docked full-width top-0 sticky z-50 no-border no-print">
      <div className="relative flex justify-between items-center px-6 md:px-12 py-5 md:py-6 w-full max-w-screen-2xl mx-auto">
        <NavLink to="/" className="text-2xl font-headline italic text-blue-900 tracking-tight">
          Alexandria
        </NavLink>
        <div className="hidden md:flex gap-8 items-center">
          {navItems.map((item) => {
            const isActive = item.label === active;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={
                  isActive
                    ? "text-blue-900 border-b-2 border-amber-600 font-medium px-3 py-2"
                    : "text-slate-500 font-normal hover:text-blue-700 hover:bg-slate-200/50 transition-colors duration-300 px-3 py-2 rounded"
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>
        <div className="flex items-center gap-3 text-blue-900">
          <button className="p-2 hover:bg-slate-200/50 rounded-full transition-colors" aria-label="Notifications" onClick={showNotifications}>
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button
            className="p-2 hover:bg-slate-200/50 rounded-full transition-colors"
            aria-label="Account"
            onClick={() => setOpenPanel(openPanel === "account" ? null : "account")}
          >
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
        {openPanel && (
          <div className="absolute right-6 md:right-12 top-full mt-2 w-80 bg-surface-container-lowest ghost-border rounded-xl shadow-[0_16px_48px_rgba(25,27,34,0.12)] p-5 z-[60]">
            {openPanel === "notifications" ? (
              <div className="space-y-4">
                <div>
                  <p className="font-label text-xs text-tertiary uppercase tracking-widest">System</p>
                  <h3 className="font-headline text-xl text-on-surface">Operational Status</h3>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="font-label text-sm text-on-surface-variant">API Health</p>
                  <p className={`font-body font-medium ${healthError ? "text-error" : "text-primary"}`}>
                    {healthError || (health?.status ? `Backend ${health.status}` : "Checking...")}
                  </p>
                </div>
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="font-label text-sm text-on-surface-variant">Archived Trips</p>
                  <p className="font-headline text-2xl text-primary">{archivedTrips.length}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-label text-xs text-tertiary uppercase tracking-widest">Manifest</p>
                  <h3 className="font-headline text-xl text-on-surface">{manifest?.driver_name || "No active driver"}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 font-label text-sm">
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <p className="text-on-surface-variant">Vehicle</p>
                    <p className="text-on-surface font-medium">{manifest?.vehicle_id || "Not set"}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3">
                    <p className="text-on-surface-variant">Trailer</p>
                    <p className="text-on-surface font-medium">{manifest?.trailer_id || "Not set"}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-3 col-span-2">
                    <p className="text-on-surface-variant">Cargo</p>
                    <p className="text-on-surface font-medium">{manifest?.cargo_classification || "Not set"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
