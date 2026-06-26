import { Navigate } from "react-router-dom";
import { Role } from "core";
import { useSession } from "../lib/auth-client";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();

  if (isPending) return null;
  if (!session || session.user.role !== Role.ADMIN) return <Navigate to="/" replace />;

  return <>{children}</>;
}
