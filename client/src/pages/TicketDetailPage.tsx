import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { TicketStatus, TicketSource } from "core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AssignedUser = { id: string; name: string; email: string };
type AssignableUser = { id: string; name: string };

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

const UNASSIGNED_VALUE = "unassigned";

async function fetchTicket(id: string): Promise<TicketDetail> {
  const res = await axios.get<TicketDetail>(`/api/tickets/${id}`, {
    withCredentials: true,
  });
  return res.data;
}

async function fetchAssignableUsers(): Promise<AssignableUser[]> {
  const res = await axios.get<AssignableUser[]>("/api/users/assignable", {
    withCredentials: true,
  });
  return res.data;
}

async function assignTicket(id: string, assignedToId: string | null): Promise<TicketDetail> {
  const res = await axios.patch<TicketDetail>(
    `/api/tickets/${id}`,
    { assignedToId },
    { withCredentials: true },
  );
  return res.data;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["users", "assignable"],
    queryFn: fetchAssignableUsers,
  });

  const mutation = useMutation({
    mutationFn: (assignedToId: string | null) => assignTicket(id!, assignedToId),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
    },
  });

  function handleAssign(value: string) {
    const assignedToId = value === UNASSIGNED_VALUE ? null : value;
    mutation.mutate(assignedToId);
  }

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
          {/* Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-800">{ticket.subject}</h1>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[ticket.status]}`}
              >
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className="text-xs text-slate-400">
                {ticket.source === TicketSource.EMAIL ? "Email" : "Web"}
              </span>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm border-b border-slate-200 pb-4">
            {/* Row 1 */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">From</p>
              <p className="text-slate-700">
                {ticket.fromName}{" "}
                <span className="text-slate-400">&lt;{ticket.fromEmail}&gt;</span>
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">Assigned To</p>
              <div className="flex items-center gap-2">
                <Select
                  value={ticket.assignedTo?.id ?? UNASSIGNED_VALUE}
                  onValueChange={handleAssign}
                  disabled={mutation.isPending}
                >
                <SelectTrigger className="h-7 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>
                    <span className="italic text-slate-400">Unassigned</span>
                  </SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
                </Select>
                {mutation.isError && (
                  <span className="text-xs text-red-500">Failed to save</span>
                )}
              </div>
            </div>

            {/* Row 2 */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">Created</p>
              <p className="text-slate-700">
                {new Date(ticket.createdAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">Updated</p>
              <p className="text-slate-700">
                {new Date(ticket.updatedAt).toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Message</p>
            <div className="border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {ticket.body}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
