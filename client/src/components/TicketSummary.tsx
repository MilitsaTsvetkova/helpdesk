import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  summary: string | null;
  onSummarize: () => void;
  isPending: boolean;
  isError: boolean;
};

export function TicketSummary({ summary, onSummarize, isPending, isError }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div>{isError && <p className="text-xs text-red-500">Failed to summarize ticket</p>}</div>
        <Button size="sm" variant="outline" onClick={onSummarize} disabled={isPending}>
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          {isPending ? "Summarizing…" : "Summarize"}
        </Button>
      </div>
      {summary && (
        <div className="border border-violet-200 bg-violet-50 rounded-lg p-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
          {summary}
        </div>
      )}
    </div>
  );
}
