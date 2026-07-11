import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type Props = {
  to: string;
  children: React.ReactNode;
};

export function BackLink({ to, children }: Props) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  );
}
