import { useAuth } from "../contexts/AuthContext";

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 h-14 bg-slate-800 text-slate-50 shadow">
      <span className="text-base font-semibold tracking-wide">Helpdesk</span>
      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user.name || user.email}</span>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 text-sm text-slate-50 border border-slate-500 rounded-md cursor-pointer transition hover:bg-slate-700 hover:border-slate-400"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
