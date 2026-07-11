import type { RefObject } from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  replyBody: string;
  onReplyBodyChange: (value: string) => void;
  onSendReply: () => void;
  isPending: boolean;
  isError: boolean;
  onPolishReply: () => void;
  isPolishing: boolean;
  isPolishError: boolean;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function TicketReplyForm({
  replyBody,
  onReplyBodyChange,
  onSendReply,
  isPending,
  isError,
  onPolishReply,
  isPolishing,
  isPolishError,
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
          <div>
            {isError && <p className="text-xs text-red-500">Failed to send reply</p>}
            {isPolishError && <p className="text-xs text-red-500">Failed to polish reply</p>}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onPolishReply}
              disabled={!replyBody.trim() || isPolishing || isPending}
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {isPolishing ? "Polishing…" : "Polish"}
            </Button>
            <Button
              size="sm"
              onClick={onSendReply}
              disabled={!replyBody.trim() || isPending || isPolishing}
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {isPending ? "Sending…" : "Send reply"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
