import { useParams } from "react-router-dom";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { TicketCategory, TicketStatus, TicketSource } from "core";
import {
  TicketUpdatePanel,
  type TicketDetailData,
  UNASSIGNED_VALUE,
  UNCATEGORIZED_VALUE,
} from "@/components/TicketUpdatePanel";
import { TicketReplyThread, type TicketReply } from "@/components/TicketReplyThread";
import { TicketReplyForm } from "@/components/TicketReplyForm";
import { TicketDetailSkeleton } from "@/components/TicketDetailSkeleton";
import { TicketDetails } from "@/components/TicketDetails";
import { BackLink } from "@/components/BackLink";

type AssignableUser = { id: string; name: string };

type TicketPatch = {
  assignedToId?: string | null;
  status?: TicketStatus;
  source?: TicketSource;
  category?: TicketCategory | null;
};

async function fetchTicket(id: string): Promise<TicketDetailData> {
  const res = await axios.get<TicketDetailData>(`/api/tickets/${id}`, {
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

async function patchTicket(id: string, patch: TicketPatch): Promise<TicketDetailData> {
  const res = await axios.patch<TicketDetailData>(`/api/tickets/${id}`, patch, {
    withCredentials: true,
  });
  return res.data;
}

async function fetchReplies(id: string): Promise<TicketReply[]> {
  const res = await axios.get<TicketReply[]>(`/api/tickets/${id}/replies`, {
    withCredentials: true,
  });
  return res.data;
}

async function postReply(id: string, body: string): Promise<TicketReply> {
  const res = await axios.post<TicketReply>(`/api/tickets/${id}/replies`, { body }, {
    withCredentials: true,
  });
  return res.data;
}

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: ticket, isPending, error } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  const { data: assignableUsers = [] } = useQuery({
    queryKey: ["users", "assignable"],
    queryFn: fetchAssignableUsers,
  });

  const { data: replies = [] } = useQuery({
    queryKey: ["ticket", id, "replies"],
    queryFn: () => fetchReplies(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (patch: TicketPatch) => patchTicket(id!, patch),
    onSuccess: (updated) => {
      queryClient.setQueryData(["ticket", id], updated);
    },
  });

  const replyMutation = useMutation({
    mutationFn: (body: string) => postReply(id!, body),
    onSuccess: (newReply) => {
      queryClient.setQueryData<TicketReply[]>(["ticket", id, "replies"], (old = []) => [
        ...old,
        newReply,
      ]);
      setReplyBody("");
      textareaRef.current?.focus();
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
      <BackLink to="/tickets">Back to tickets</BackLink>

      {isPending && <TicketDetailSkeleton />}

      {error && (
        <p className="text-sm text-red-600">{error.message}</p>
      )}

      {ticket && (
        <div className="grid grid-cols-[1fr_260px] gap-8 items-start">
          <div className="space-y-6">
            <TicketDetails subject={ticket.subject} body={ticket.body} />

            <TicketReplyThread replies={replies} />

            <TicketReplyForm
              replyBody={replyBody}
              onReplyBodyChange={setReplyBody}
              onSendReply={() => replyMutation.mutate(replyBody.trim())}
              isPending={replyMutation.isPending}
              isError={replyMutation.isError}
              textareaRef={textareaRef}
            />
          </div>

          <TicketUpdatePanel
            ticket={ticket}
            assignableUsers={assignableUsers}
            isSaveError={mutation.isError}
            onStatusChange={handleStatusChange}
            onSourceChange={handleSourceChange}
            onCategoryChange={handleCategoryChange}
            onAssign={handleAssign}
          />
        </div>
      )}
    </div>
  );
}
