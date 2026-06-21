import { useAuth } from "../contexts/AuthContext";
import "./Navbar.css";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <span className="navbar-brand">Helpdesk</span>
      {user && (
        <div className="navbar-user">
          <span className="navbar-email">{user.name || user.email}</span>
          <button className="navbar-logout" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
