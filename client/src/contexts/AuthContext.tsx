import { useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();
  const navigate = useNavigate();

  async function login(email: string, password: string) {
    const { error } = await authClient.signIn.email({ email, password });
    if (error) throw new Error(error.message ?? "Login failed");
  }

  async function logout() {
    await authClient.signOut();
    navigate("/login", { replace: true });
  }

  return {
    user: session?.user ?? null,
    loading: isPending,
    login,
    logout,
  };
}
