import { useNavigate } from "react-router-dom";
import { useSession, signIn, signOut } from "../lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  async function login(email: string, password: string) {
    const { error } = await signIn.email({ email, password });
    if (error) throw new Error(error.message ?? "Login failed");
  }

  async function logout() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return {
    user: session?.user ?? null,
    loading: isPending,
    login,
    logout,
  };
}
