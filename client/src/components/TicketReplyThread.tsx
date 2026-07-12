import { ReplySenderType } from "core";
import { formatDate } from "@/lib/utils";

export type TicketReply = {
  id: number;
  body: string;
  senderType: ReplySenderType;
  createdAt: string;
  author: { id: string; name: string; email: string } | null;
};

type Props = {
  replies: TicketReply[];
};

const SENDER_STYLES: Record<ReplySenderType, { label: string; card: string; badge: string }> = {
  [ReplySenderType.AGENT]: {
    label: "Agent",
    card: "border-sky-200 bg-sky-50",
    badge: "bg-sky-100 text-sky-700",
  },
  [ReplySenderType.CUSTOMER]: {
    label: "Customer",
    card: "border-slate-200 bg-white",
    badge: "bg-slate-100 text-slate-500",
  },
  [ReplySenderType.AI]: {
    label: "AI Assistant",
    card: "border-violet-200 bg-violet-50",
    badge: "bg-violet-100 text-violet-700",
  },
};

export function TicketReplyThread({ replies }: Props) {
  if (replies.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
        Replies ({replies.length})
      </p>
      <div className="space-y-3">
        {replies.map((reply) => {
          const { label, card, badge } = SENDER_STYLES[reply.senderType];
          return (
            <div key={reply.id} className={`border rounded-lg p-4 ${card}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-700">{reply.author?.name ?? label}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${badge}`}>
                    {label}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{reply.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
