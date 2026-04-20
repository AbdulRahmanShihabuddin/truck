export function formatMiles(value) {
  const number = Number(value || 0);
  return `${Math.round(number).toLocaleString()} mi`;
}


export function formatHours(value) {
  const totalMinutes = Math.round(Number(value || 0) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}


export function formatDate(value, options = {}) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}


export function formatShortDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}


export function formatTime(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}


export function statusClass(status) {
  if (status === "driving") return "bg-primary/10 text-primary";
  if (status === "on_duty") return "bg-secondary-container text-on-secondary-fixed-variant";
  if (status === "sleeper_berth") return "bg-surface-container-high text-on-surface";
  return "bg-surface-dim text-on-surface";
}


export function statusIcon(status) {
  if (status === "driving") return "local_shipping";
  if (status === "on_duty") return "work";
  if (status === "sleeper_berth") return "hotel";
  return "schedule";
}
