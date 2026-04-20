import { useState } from "react";
import { useNavigate } from "react-router-dom";

import TopNav from "../components/layout/TopNav.jsx";
import { useTrip } from "../state/TripContext.jsx";
import { todayAtEightIso } from "../utils/time.js";


const defaultForm = {
  current_location: "New York, NY",
  pickup_location: "Chicago, IL",
  dropoff_location: "Los Angeles, CA",
  current_cycle_used: 34,
  driver_name: "",
  vehicle_id: "",
  trailer_id: "",
  co_driver_name: "",
  cargo_classification: "Dry Van - General",
};


export default function TripInputPage() {
  const navigate = useNavigate();
  const { createTripPlan, draft, saveDraft } = useTrip();
  const [formData, setFormData] = useState(draft || defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: name === "current_cycle_used" ? value : value,
    }));
  };

  const validate = () => {
    if (!formData.current_location.trim()) return "Current location is required.";
    if (!formData.pickup_location.trim()) return "Pickup location is required.";
    if (!formData.dropoff_location.trim()) return "Drop-off location is required.";
    const cycle = Number(formData.current_cycle_used);
    if (Number.isNaN(cycle) || cycle < 0 || cycle > 70) return "Current cycle used must be between 0 and 70 hours.";
    if (!formData.driver_name.trim()) return "Driver name is required.";
    if (!formData.vehicle_id.trim()) return "Vehicle ID is required.";
    if (!formData.trailer_id.trim()) return "Trailer ID is required.";
    if (!formData.cargo_classification.trim()) return "Cargo classification is required.";
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");
    try {
      await createTripPlan({
        ...formData,
        current_cycle_used: Number(formData.current_cycle_used),
        start_at: todayAtEightIso(),
      });
      navigate("/trip/results");
    } catch (err) {
      setError(err.message || "Unable to generate trip plan.");
    } finally {
      setLoading(false);
    }
  };

  const handleDraft = () => {
    saveDraft(formData);
    setDraftSaved(true);
  };

  return (
    <div className="bg-surface text-on-surface font-body antialiased min-h-screen flex flex-col">
      <TopNav active="Planning" />
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 max-w-screen-2xl mx-auto w-full relative">
        <div className="lg:col-span-7 xl:col-span-6 p-8 lg:p-16 xl:p-24 flex flex-col justify-center">
          <header className="mb-16">
            <h1 className="font-headline text-4xl lg:text-5xl text-on-surface mb-4">New Journey Entry</h1>
            <p className="font-body text-on-surface-variant text-lg max-w-xl">
              Curate the parameters for the upcoming trip. Precise origins and destinations ensure accurate archival routing.
            </p>
          </header>
          <form className="space-y-12" onSubmit={handleSubmit}>
            <section className="relative">
              <div className="absolute -left-12 top-2 hidden lg:block">
                <span className="font-label text-tertiary text-sm tracking-widest uppercase opacity-60">01</span>
              </div>
              <h2 className="font-headline text-2xl text-on-surface mb-8 border-b border-surface-variant pb-4">Routing Parameters</h2>
              <div className="space-y-6">
                {[
                  ["current_location", "Current Location", "explore", "Enter current city or facility..."],
                  ["pickup_location", "Origin Point", "trip_origin", "Enter facility or coordinates..."],
                  ["dropoff_location", "Destination Point", "location_on", "Enter receiving facility..."],
                ].map(([name, label, icon, placeholder]) => (
                  <div key={name}>
                    <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor={name}>
                      {label}
                    </label>
                    <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                      <span className="material-symbols-outlined text-outline mr-3">{icon}</span>
                      <input
                        id={name}
                        name={name}
                        className="bg-transparent border-none w-full text-on-surface font-body placeholder:text-outline-variant focus:ring-0 p-0"
                        placeholder={placeholder}
                        type="text"
                        value={formData[name]}
                        onChange={updateField}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="relative">
              <div className="absolute -left-12 top-2 hidden lg:block">
                <span className="font-label text-tertiary text-sm tracking-widest uppercase opacity-60">02</span>
              </div>
              <h2 className="font-headline text-2xl text-on-surface mb-8 border-b border-surface-variant pb-4">Manifest Details</h2>
              <p className="font-body text-sm text-on-surface-variant mb-6">
                Locations must be one of the supported cities or latitude/longitude coordinates such as 40.7128,-74.0060.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="current_cycle_used">
                    Current Cycle Used
                  </label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">timer</span>
                    <input
                      id="current_cycle_used"
                      name="current_cycle_used"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0"
                      type="number"
                      min="0"
                      max="70"
                      step="0.25"
                      value={formData.current_cycle_used}
                      onChange={updateField}
                    />
                    <span className="font-label text-xs text-on-surface-variant">hours</span>
                  </div>
                </div>
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="driver_name">Assigned Driver</label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">person</span>
                    <input
                      id="driver_name"
                      name="driver_name"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0"
                      type="text"
                      value={formData.driver_name}
                      onChange={updateField}
                      placeholder="Driver name..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="vehicle_id">Vehicle ID</label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">local_shipping</span>
                    <input
                      id="vehicle_id"
                      name="vehicle_id"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0"
                      type="text"
                      value={formData.vehicle_id}
                      onChange={updateField}
                      placeholder="Tractor or unit..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="trailer_id">Trailer ID</label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">rv_hookup</span>
                    <input
                      id="trailer_id"
                      name="trailer_id"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0"
                      type="text"
                      value={formData.trailer_id}
                      onChange={updateField}
                      placeholder="Trailer identifier..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="co_driver_name">Co-Driver</label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">group</span>
                    <input
                      id="co_driver_name"
                      name="co_driver_name"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0"
                      type="text"
                      value={formData.co_driver_name}
                      onChange={updateField}
                      placeholder="Optional..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-label text-sm text-on-surface-variant mb-2 ml-1" htmlFor="cargo_classification">Cargo Classification</label>
                  <div className="input-ghost rounded-lg flex items-center px-4 py-3">
                    <span className="material-symbols-outlined text-outline mr-3">inventory_2</span>
                    <select
                      id="cargo_classification"
                      name="cargo_classification"
                      className="bg-transparent border-none w-full text-on-surface font-body focus:ring-0 p-0 appearance-none"
                      value={formData.cargo_classification}
                      onChange={updateField}
                    >
                      <option>Dry Van - General</option>
                      <option>Refrigerated - Perishable</option>
                      <option>Flatbed - Oversize</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {(error || draftSaved) && (
              <div className={error ? "bg-error-container text-on-error-container rounded-lg p-4 font-body" : "bg-surface-container-low text-primary rounded-lg p-4 font-body"}>
                {error || "Draft saved in this browser."}
              </div>
            )}

            <div className="pt-8 flex flex-wrap items-center gap-6">
              <button
                className="btn-primary-gradient text-on-primary font-body font-medium px-8 py-4 rounded-md shadow-[0_8px_32px_-8px_rgba(0,54,134,0.3)] hover:opacity-90 transition-opacity flex items-center gap-3 disabled:opacity-60"
                type="submit"
                disabled={loading}
              >
                <span>{loading ? "Generating..." : "Generate Route"}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <button className="text-primary font-body px-6 py-4 hover:bg-surface-container-low rounded-md transition-colors" type="button" onClick={handleDraft}>
                Save Draft
              </button>
            </div>
          </form>
        </div>
        <div className="hidden lg:block lg:col-span-5 xl:col-span-6 relative bg-surface-container-low min-h-[calc(100vh-96px)]">
          <div
            className="absolute inset-0 m-8 rounded-2xl overflow-hidden bg-surface-container-highest opacity-50 mix-blend-multiply"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDOzy2EykCb6aUty7qYk8bElb7ZrqwhoOLbUir6f6rhCcxua5jI0KgV7vmA0EL4eNKKTP1WN0YHKj7-n6aJlHCR1F_bC6owsiGb6zVzTmh2EKnFheGFMl6tP-gDzvz3xZAWPvG4uCT_e4xK1LRBrkOKQ0f1bXybqxRNBdTNbsq79ONyxGPlMpu0669MTd-CpXEz2V0XGdpoBpw66YkJ0NCExCeRsoVQwIfjExsExYex69mIb8EQtbr0YSscx6rPwPX-swbMRgRH9vKR')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "grayscale(80%) sepia(20%) opacity(0.6)",
            }}
          />
          <div className="absolute inset-0 p-16 flex flex-col justify-end pointer-events-none">
            <div className="bg-surface/80 backdrop-blur-xl p-8 rounded-xl border border-surface-variant shadow-[0_32px_64px_-16px_rgba(25,27,34,0.06)] max-w-sm">
              <p className="font-headline italic text-on-surface text-lg mb-2">
                "Planning is bringing the future into the present so that you can do something about it now."
              </p>
              <p className="font-label text-xs text-on-surface-variant tracking-wider uppercase">Curatorial Log, Vol. IV</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
