import { Navigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;
  if (!session || session.user.role !== "ADMIN") return <Navigate to="/" replace />;

  return <>{children}</>;
}
