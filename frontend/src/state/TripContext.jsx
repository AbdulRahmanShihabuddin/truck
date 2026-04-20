import { createContext, useContext, useEffect, useMemo, useState } from "react";

import {
  addTripRemark,
  deleteArchivedTrip,
  getArchivedTrip,
  listArchivedTrips,
  planTrip as requestTripPlan,
  saveArchivedTrip,
} from "../api/trips.js";


const CURRENT_TRIP_KEY = "alexandria.currentTrip";
const DRAFT_KEY = "alexandria.tripDraft";


function readStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}


function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local persistence is a convenience, not a hard requirement.
  }
}


const TripContext = createContext(null);


export function TripProvider({ children }) {
  const [currentTrip, setCurrentTripState] = useState(() => readStorage(CURRENT_TRIP_KEY, null));
  const [archivedTrips, setArchivedTrips] = useState([]);
  const [draft, setDraftState] = useState(() => readStorage(DRAFT_KEY, null));
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveError, setArchiveError] = useState("");

  const refreshArchivedTrips = async () => {
    setArchiveLoading(true);
    setArchiveError("");
    try {
      const trips = await listArchivedTrips();
      setArchivedTrips(trips);
      return trips;
    } catch (error) {
      setArchiveError(error.message || "Unable to load archived trips.");
      return [];
    } finally {
      setArchiveLoading(false);
    }
  };

  useEffect(() => {
    refreshArchivedTrips();
  }, []);

  const setCurrentTrip = (trip) => {
    setCurrentTripState(trip);
    writeStorage(CURRENT_TRIP_KEY, trip);
  };

  const saveDraft = (value) => {
    setDraftState(value);
    writeStorage(DRAFT_KEY, value);
  };

  const clearCurrentTrip = () => {
    setCurrentTripState(null);
    window.localStorage.removeItem(CURRENT_TRIP_KEY);
  };

  const createTripPlan = async (payload) => {
    const trip = await requestTripPlan(payload);
    setCurrentTrip(trip);
    saveDraft(payload);
    return trip;
  };

  const archiveTrip = async (trip) => {
    const result = await saveArchivedTrip(trip);
    setArchivedTrips((current) => [
      result.summary,
      ...current.filter((item) => item.trip_id !== result.summary.trip_id),
    ]);
    if (trip.trip_id === currentTrip?.trip_id) {
      setCurrentTrip(result.trip);
    }
    return result;
  };

  const archiveCurrentTrip = async () => {
    if (!currentTrip) return null;
    return archiveTrip(currentTrip);
  };

  const loadArchivedTrip = async (tripId) => {
    const trip = await getArchivedTrip(tripId);
    setCurrentTrip(trip);
    return trip;
  };

  const removeArchivedTrip = async (tripId) => {
    await deleteArchivedTrip(tripId);
    setArchivedTrips((current) => current.filter((trip) => trip.trip_id !== tripId));
    if (currentTrip?.trip_id === tripId) {
      clearCurrentTrip();
    }
  };

  const addRemarkToCurrentTrip = async (date, text) => {
    if (!currentTrip) return null;
    await archiveTrip(currentTrip);
    const result = await addTripRemark(currentTrip.trip_id, date, text);
    setCurrentTrip(result.trip);
    await refreshArchivedTrips();
    return result;
  };

  const value = useMemo(
    () => ({
      currentTrip,
      archivedTrips,
      archiveLoading,
      archiveError,
      draft,
      createTripPlan,
      setCurrentTrip,
      clearCurrentTrip,
      saveDraft,
      refreshArchivedTrips,
      archiveTrip,
      archiveCurrentTrip,
      loadArchivedTrip,
      removeArchivedTrip,
      addRemarkToCurrentTrip,
    }),
    [currentTrip, archivedTrips, archiveLoading, archiveError, draft],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}


export function useTrip() {
  const context = useContext(TripContext);
  if (!context) {
    throw new Error("useTrip must be used inside TripProvider");
  }
  return context;
}
