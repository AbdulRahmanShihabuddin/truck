import { useNavigate } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";


export default function SystemStatePage({
  title = "No Records Found",
  message = "The archives are currently empty for this period. Awaiting the documentation of a new journey.",
  actionLabel = "Start New Journey",
  active = "Logs",
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col">
      <TopNav active={active} />
      <main className="flex-grow flex items-center justify-center p-8 bg-surface">
        <div className="max-w-2xl w-full flex flex-col items-center text-center space-y-8">
          <div className="relative w-48 h-48 flex items-center justify-center bg-surface-container-low rounded-full">
            <div className="absolute inset-0 rounded-full shadow-[inset_0_4px_24px_rgba(25,27,34,0.04)]" />
            <span className="material-symbols-outlined text-8xl text-outline-variant" style={{ fontVariationSettings: "'wght' 200" }}>
              history_edu
            </span>
            <div className="absolute -bottom-4 right-4 bg-surface-container-lowest p-3 rounded-full ghost-border shadow-[0_8px_32px_rgba(25,27,34,0.06)]">
              <span className="material-symbols-outlined text-tertiary">search_off</span>
            </div>
          </div>
          <div className="space-y-4 max-w-md">
            <h1 className="font-headline text-4xl text-on-surface">{title}</h1>
            <p className="font-body text-body-lg text-on-surface-variant leading-relaxed">{message}</p>
          </div>
          <div className="pt-8">
            <button
              className="btn-primary-gradient text-on-primary font-body text-label-lg px-8 py-4 rounded-md shadow-[0_4px_12px_rgba(0,54,134,0.15)] hover:shadow-[0_6px_16px_rgba(0,54,134,0.2)] transition-shadow duration-300 flex items-center gap-3"
              onClick={() => navigate("/trip/new")}
            >
              <span className="material-symbols-outlined">add_circle</span>
              {actionLabel}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
