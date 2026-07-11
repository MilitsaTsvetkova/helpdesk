import { TicketCategory, TicketStatus, TicketSource } from "core";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AssignedUser = { id: string; name: string; email: string };
export type AssignableUser = { id: string; name: string };

export type TicketDetailData = {
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

export const UNCATEGORIZED_VALUE = "uncategorized";

export const UNASSIGNED_VALUE = "unassigned";

type Props = {
  ticket: TicketDetailData;
  assignableUsers: AssignableUser[];
  isSaveError: boolean;
  onStatusChange: (value: string) => void;
  onSourceChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onAssign: (value: string) => void;
};

export function TicketUpdatePanel({
  ticket,
  assignableUsers,
  isSaveError,
  onStatusChange,
  onSourceChange,
  onCategoryChange,
  onAssign,
}: Props) {
  return (
    <div className="space-y-5 border-l border-slate-100 pl-8">
      {isSaveError && <p className="text-xs text-red-500">Failed to save</p>}

      <div>
        <p className="text-xs font-medium text-slate-400 mb-1.5">Status</p>
        <Select value={ticket.status} onValueChange={onStatusChange}>
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
        <Select value={ticket.source} onValueChange={onSourceChange}>
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
        <Select value={ticket.category ?? UNCATEGORIZED_VALUE} onValueChange={onCategoryChange}>
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
        <Select value={ticket.assignedTo?.id ?? UNASSIGNED_VALUE} onValueChange={onAssign}>
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
  );
}
