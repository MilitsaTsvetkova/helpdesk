import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { TicketsTable, type Ticket } from "@/components/TicketsTable";

async function fetchTickets(): Promise<Ticket[]> {
  const res = await axios.get<Ticket[]>("/api/tickets", { withCredentials: true });
  return res.data;
}

export function TicketsPage() {
  const { data: tickets = [], isPending, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: fetchTickets,
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Tickets</h1>
      </div>
      <TicketsTable tickets={tickets} isPending={isPending} error={error} />
    </div>
  );
}
