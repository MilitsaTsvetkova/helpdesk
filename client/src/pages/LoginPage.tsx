import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";
import "./LoginPage.css";

export function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Redirect once session is confirmed (covers both "already logged in" and post-login)
  useEffect(() => {
    if (!isPending && session) {
      navigate("/", { replace: true });
    }
  }, [session, isPending, navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await authClient.signIn.email({ email, password });
    if (err) {
      setError(err.message ?? "Login failed");
      setLoading(false);
    }
    // Navigation is handled by the useEffect above when session updates
  }

  if (isPending) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Helpdesk</h1>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
