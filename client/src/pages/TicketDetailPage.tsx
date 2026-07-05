import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { TicketStatus, TicketSource } from "core";

type AssignedUser = { id: string; name: string; email: string };

type TicketDetail = {
  id: number;
  subject: string;
  body: string;
  fromEmail: string;
  fromName: string;
  status: TicketStatus;
  source: TicketSource;
  assignedTo: AssignedUser | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "bg-sky-100 text-sky-700",
  [TicketStatus.IN_PROGRESS]: "bg-amber-100 text-amber-700",
  [TicketStatus.RESOLVED]: "bg-green-100 text-green-700",
  [TicketStatus.CLOSED]: "bg-slate-100 text-slate-600",
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: "Open",
  [TicketStatus.IN_PROGRESS]: "In Progress",
  [TicketStatus.RESOLVED]: "Resolved",
  [TicketStatus.CLOSED]: "Closed",
};

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await axios.get<TicketDetail>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {isPending && (
        <div className="space-y-4">
          <div className="h-7 w-2/3 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse" />
          <div className="h-40 bg-slate-200 rounded animate-pulse" />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {ticket && (
        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold text-slate-800">{ticket.subject}</h1>
            <span
              className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
            >
              {STATUS_LABELS[ticket.status]}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500 border-b border-slate-200 pb-4">
            <div>
              <span className="font-medium text-slate-700">From</span>{" "}
              {ticket.fromName}{" "}
              <span className="text-slate-400">&lt;{ticket.fromEmail}&gt;</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Received</span>{" "}
              {new Date(ticket.createdAt).toLocaleString(undefined, {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div>
              <span className="font-medium text-slate-700">Source</span>{" "}
              {ticket.source === TicketSource.EMAIL ? "Email" : "Web"}
            </div>
            <div>
              <span className="font-medium text-slate-700">Assigned To</span>{" "}
              {ticket.assignedTo ? (
                ticket.assignedTo.name
              ) : (
                <span className="italic text-slate-400">Unassigned</span>
              )}
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {ticket.body}
          </div>
        </div>
      )}
    </div>
  );
}
