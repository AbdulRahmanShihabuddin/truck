export function todayAtEightIso() {
  const value = new Date();
  value.setHours(8, 0, 0, 0);
  return value.toISOString();
}


export function findLogByDate(trip, date) {
  if (!trip?.daily_logs?.length) return null;
  return trip.daily_logs.find((log) => log.date === date) || trip.daily_logs[0];
}


export function logDatePath(log) {
  return encodeURIComponent(log.date);
}
