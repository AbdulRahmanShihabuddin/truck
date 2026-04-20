const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";


async function readError(response) {
  try {
    const data = await response.json();
    if (typeof data === "string") return data;
    if (data.detail) return data.detail;
    return Object.entries(data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
      .join(" ");
  } catch {
    return `Request failed with status ${response.status}`;
  }
}


export async function planTrip(payload) {
  const response = await fetch(`${API_BASE_URL}/trips/plan/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json();
}


export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health/`);
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}


export async function listArchivedTrips() {
  const response = await fetch(`${API_BASE_URL}/trips/`);
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}


export async function saveArchivedTrip(trip) {
  const response = await fetch(`${API_BASE_URL}/trips/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trip }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}


export async function getArchivedTrip(tripId) {
  const response = await fetch(`${API_BASE_URL}/trips/${encodeURIComponent(tripId)}/`);
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}


export async function deleteArchivedTrip(tripId) {
  const response = await fetch(`${API_BASE_URL}/trips/${encodeURIComponent(tripId)}/`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error(await readError(response));
  return true;
}


export async function addTripRemark(tripId, date, text) {
  const response = await fetch(`${API_BASE_URL}/trips/${encodeURIComponent(tripId)}/remarks/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, text }),
  });
  if (!response.ok) throw new Error(await readError(response));
  return response.json();
}
