import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
