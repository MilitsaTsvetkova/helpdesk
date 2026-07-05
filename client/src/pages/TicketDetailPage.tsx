import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { TicketCategory, TicketStatus, TicketSource } from "core";
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
  category: TicketCategory | null;
  assignedTo: AssignedUser | null;
  createdAt: string;
  updatedAt: string;
};

type TicketPatch = {
  assignedToId?: string | null;
  status?: TicketStatus;
  source?: TicketSource;
  category?: TicketCategory | null;
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

const SOURCE_LABELS: Record<TicketSource, string> = {
  [TicketSource.EMAIL]: "Email",
  [TicketSource.WEB]: "Web",
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  [TicketCategory.HARDWARE]: "Hardware",
  [TicketCategory.SOFTWARE]: "Software",
  [TicketCategory.NETWORK]: "Network",
  [TicketCategory.ACCESS]: "Access",
  [TicketCategory.OTHER]: "Other",
};

const UNCATEGORIZED_VALUE = "uncategorized";

const UNASSIGNED_VALUE = "unassigned";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

async function patchTicket(id: string, patch: TicketPatch): Promise<TicketDetail> {
  const res = await axios.patch<TicketDetail>(`/api/tickets/${id}`, patch, {
    withCredentials: true,
  });
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
    mutationFn: (patch: TicketPatch) => patchTicket(id!, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
    },
  });

  function handleAssign(value: string) {
    mutation.mutate({ assignedToId: value === UNASSIGNED_VALUE ? null : value });
  }

  function handleStatusChange(value: string) {
    mutation.mutate({ status: value as TicketStatus });
  }

  function handleSourceChange(value: string) {
    mutation.mutate({ source: value as TicketSource });
  }

  function handleCategoryChange(value: string) {
    mutation.mutate({ category: value === UNCATEGORIZED_VALUE ? null : value as TicketCategory });
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      {isPending && (
        <div className="grid grid-cols-[1fr_260px] gap-8">
          <div className="space-y-4">
            <div className="h-7 w-2/3 bg-slate-200 rounded animate-pulse" />
            <div className="h-40 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-8 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 bg-slate-200 rounded animate-pulse" />
            <div className="h-8 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {ticket && (
        <div className="grid grid-cols-[1fr_260px] gap-8 items-start">
          {/* Left: title + message */}
          <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-slate-800">{ticket.subject}</h1>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Message</p>
              <div className="border border-slate-200 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {ticket.body}
              </div>
            </div>
          </div>

          {/* Right: all dropdowns + read-only metadata */}
          <div className="space-y-5 border-l border-slate-100 pl-8">
            {mutation.isError && (
              <p className="text-xs text-red-500">Failed to save</p>
            )}

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Status</p>
              <Select
                value={ticket.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className={`h-8 w-full text-xs font-medium ${STATUS_STYLES[ticket.status]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(TicketStatus) as TicketStatus[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Source</p>
              <Select
                value={ticket.source}
                onValueChange={handleSourceChange}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.values(TicketSource) as TicketSource[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Category</p>
              <Select
                value={ticket.category ?? UNCATEGORIZED_VALUE}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNCATEGORIZED_VALUE}>Uncategorized</SelectItem>
                  {(Object.values(TicketCategory) as TicketCategory[]).map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-1.5">Assigned To</p>
              <Select
                value={ticket.assignedTo?.id ?? UNASSIGNED_VALUE}
                onValueChange={handleAssign}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UNASSIGNED_VALUE}>Unassigned</SelectItem>
                  {assignableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">From</p>
                <p className="text-slate-700">{ticket.fromName}</p>
                <p className="text-xs text-slate-400">{ticket.fromEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">Created</p>
                <p className="text-slate-700">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-0.5">Updated</p>
                <p className="text-slate-700">{formatDate(ticket.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
