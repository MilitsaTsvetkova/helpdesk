import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <nav className="navbar">
      <span className="navbar-brand">Helpdesk</span>
      {user && (
        <div className="navbar-user">
          <span className="navbar-email">{user.email}</span>
          <button className="navbar-logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
