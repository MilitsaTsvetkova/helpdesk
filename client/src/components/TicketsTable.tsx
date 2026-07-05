import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TicketStatus, TicketSource } from "core";

export type AssignedUser = { id: string; name: string; email: string };

export type Ticket = {
  id: number;
  subject: string;
  fromEmail: string;
  fromName: string;
  status: TicketStatus;
  source: TicketSource;
  createdAt: string;
  assignedTo: AssignedUser | null;
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

const columns: ColumnDef<Ticket>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "#",
    enableSorting: false,
    cell: ({ getValue }) => (
      <span className="text-slate-400 text-sm font-mono">#{getValue<number>()}</span>
    ),
  },
  {
    accessorKey: "subject",
    header: "Subject",
    enableSorting: true,
    cell: ({ getValue, row }) => (
      <Link
        to={`/tickets/${row.original.id}`}
        className="font-medium text-slate-800 hover:text-blue-600 hover:underline"
      >
        {getValue<string>()}
      </Link>
    ),
  },
  {
    accessorKey: "fromName",
    header: "From",
    enableSorting: true,
    cell: ({ row }) => (
      <div className="text-slate-600">
        <div>{row.original.fromName}</div>
        <div className="text-xs text-slate-400">{row.original.fromEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ getValue }) => {
      const status = getValue<TicketStatus>();
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
      );
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    enableSorting: false,
    cell: ({ getValue }) => {
      const user = getValue<AssignedUser | null>();
      return user ? (
        <span className="text-slate-700">{user.name}</span>
      ) : (
        <span className="text-slate-400 italic">Unassigned</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Received",
    enableSorting: true,
    cell: ({ getValue }) =>
      new Date(getValue<string>()).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
  },
];

type Props = {
  tickets: Ticket[];
  isPending: boolean;
  error: Error | null;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
};

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="ml-1 h-3.5 w-3.5 shrink-0" />;
  if (sorted === "desc") return <ArrowDown className="ml-1 h-3.5 w-3.5 shrink-0" />;
  return <ArrowUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-40" />;
}

export function TicketsTable({ tickets, isPending, error, sorting, onSortingChange }: Props) {
  const table = useReactTable({
    data: tickets,
    columns,
    state: { sorting },
    onSortingChange,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) {
    return <p className="text-sm text-red-600">{error.message}</p>;
  }

  return (
    <div className="rounded-md border border-slate-200">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && (
                        <SortIcon sorted={header.column.getIsSorted()} />
                      )}
                    </span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="animate-pulse">
                <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                <TableCell><Skeleton className="h-4 w-56" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center text-slate-500 py-8">
                No tickets found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
