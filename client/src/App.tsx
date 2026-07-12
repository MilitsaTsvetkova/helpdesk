import { Routes, Route, Navigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TicketsPage } from "./pages/TicketsPage";
import { TicketDetailPage } from "./pages/TicketDetailPage";
import { UsersPage } from "./pages/UsersPage";
import "./index.css";

// Wrapping only the top-level <Routes> lets Sentry's tracing integration
// resolve parameterized route names (e.g. "/tickets/:id") for transactions.
const SentryRoutes = Sentry.withSentryReactRouterV7Routing(Routes);

export default function App() {
  return (
    <SentryRoutes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Navbar />
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route
                path="/users"
                element={
                  <AdminRoute>
                    <UsersPage />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ProtectedRoute>
        }
      />
    </SentryRoutes>
  );
}
