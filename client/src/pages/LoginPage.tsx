import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../lib/auth-client";
import "./LoginPage.css";

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (!isPending && session) {
      navigate("/", { replace: true });
    }
  }, [session, isPending, navigate]);

  async function onSubmit(data: LoginFormData) {
    const { error: err } = await authClient.signIn.email(data);
    if (err) {
      setError("root", { message: err.message ?? "Login failed" });
    }
  }

  if (isPending) return null;

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Helpdesk</h1>
        <p className="login-subtitle">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              {...register("email")}
              placeholder="you@example.com"
              autoFocus
            />
            {errors.email && <p className="field-error">{errors.email.message}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
            />
            {errors.password && <p className="field-error">{errors.password.message}</p>}
          </div>
          {errors.root && <p className="login-error">{errors.root.message}</p>}
          <button type="submit" className="login-btn" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
