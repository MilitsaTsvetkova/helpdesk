import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "../lib/auth-client";

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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Helpdesk</h1>
        <p className="text-sm text-slate-500 mb-8">Sign in to your account</p>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="text"
              {...register("email")}
              placeholder="you@example.com"
              autoFocus
              className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none text-slate-900 transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
            />
            {errors.email && (
              <p className="text-red-600 text-xs mt-0.5">{errors.email.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg outline-none text-slate-900 transition focus:border-indigo-500 focus:ring-3 focus:ring-indigo-500/15"
            />
            {errors.password && (
              <p className="text-red-600 text-xs mt-0.5">{errors.password.message}</p>
            )}
          </div>
          {errors.root && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5">
              {errors.root.message}
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-2.5 text-sm font-semibold text-white bg-indigo-500 rounded-lg cursor-pointer transition hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
