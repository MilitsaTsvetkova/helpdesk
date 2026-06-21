import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import "./index.css";

function Home() {
  return (
    <div className="page-content">
      <h2>Welcome to Helpdesk</h2>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
