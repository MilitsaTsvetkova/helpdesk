import type { RefObject } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSendReply: () => void;
  isPending: boolean;
  isError: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function TicketReplyForm({
  replyBody,
  onReplyBodyChange,
  onSendReply,
  isPending,
  isError,
  textareaRef,
}: Props) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Reply</p>
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          value={replyBody}
          onChange={(e) => onReplyBodyChange(e.target.value)}
          placeholder="Write a reply…"
          rows={4}
          className="text-sm resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && replyBody.trim()) {
              onSendReply();
            }
          }}
        />
        <div className="flex items-center justify-between">
          {isError && <p className="text-xs text-red-500">Failed to send reply</p>}
          <div className="ml-auto">
            <Button size="sm" onClick={onSendReply} disabled={!replyBody.trim() || isPending}>
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isPending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
