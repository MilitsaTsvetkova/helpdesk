import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 h-14 bg-slate-800 text-slate-50 shadow">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-base font-semibold tracking-wide">Helpdesk</Link>
        {user?.role === "ADMIN" && (
          <Link to="/users" className="text-sm text-slate-300 hover:text-slate-50">
            Users
          </Link>
        )}
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.name || user.email}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="bg-transparent border-slate-500 text-slate-50 hover:bg-slate-700 hover:text-slate-50 hover:border-slate-400"
          >
            Logout
          </Button>
        </div>
      )}
    </nav>
  );
}
