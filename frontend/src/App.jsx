import { Navigate, Route, Routes } from "react-router-dom";

import DailyLogPage from "./pages/DailyLogPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LogHistoryPage from "./pages/LogHistoryPage.jsx";
import MultiDayLogsPage from "./pages/MultiDayLogsPage.jsx";
import ReviewExportPage from "./pages/ReviewExportPage.jsx";
import RouteResultsPage from "./pages/RouteResultsPage.jsx";
import TripInputPage from "./pages/TripInputPage.jsx";


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/trip/new" element={<TripInputPage />} />
      <Route path="/trip/results" element={<RouteResultsPage />} />
      <Route path="/trip/history" element={<LogHistoryPage />} />
      <Route path="/trip/logs" element={<MultiDayLogsPage />} />
      <Route path="/trip/logs/:date" element={<DailyLogPage />} />
      <Route path="/trip/review" element={<ReviewExportPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
