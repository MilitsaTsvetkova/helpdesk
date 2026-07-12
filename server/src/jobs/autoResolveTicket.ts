import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { ReplySenderType, TicketStatus } from "core";
import { boss } from "../lib/boss";
import { prisma } from "../lib/prisma";
import { KNOWLEDGE_BASE } from "../lib/knowledgeBase";
import { type Ticket } from "../generated/prisma/client";

export const AUTO_RESOLVE_TICKET_QUEUE = "auto-resolve-ticket";

const autoResolveSchema = z.object({
  escalate: z.boolean(),
  resolvable: z.boolean(),
  reply: z.string().nullable(),
});

type AutoResolveTicketJobData = {
  ticketId: number;
  subject: string;
  body: string;
};

// Enqueues background auto-resolution. Runs after the caller's response has
// already been sent, so this must not be awaited on the request path.
export async function enqueueAutoResolveTicket(ticket: Ticket): Promise<void> {
  const { id: ticketId, subject, body } = ticket;
  try {
    await boss.send(AUTO_RESOLVE_TICKET_QUEUE, {
      ticketId,
      subject,
      body,
    } satisfies AutoResolveTicketJobData);
  } catch (err) {
    console.error(`Failed to enqueue auto-resolve for ticket ${ticketId}:`, err);
  }
}

// Registers the worker that checks queued tickets against the knowledge base
// and, when it's a confident, non-escalating match, replies and resolves the
// ticket automatically. A DB failure while applying that decision still
// throws, letting pg-boss retry the job per the queue's retry config.
export async function registerAutoResolveTicketWorker(): Promise<void> {
  await boss.createQueue(AUTO_RESOLVE_TICKET_QUEUE, {
    retryLimit: 3,
    retryBackoff: true,
  });

  await boss.work<AutoResolveTicketJobData>(AUTO_RESOLVE_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data;

    let object;
    try {
      ({ object } = await generateObject({
        model: openai("gpt-5.4-nano"),
        schema: autoResolveSchema,
        system:
          "You are an automated support assistant. You decide whether an inbound " +
          "support ticket can be fully and safely resolved automatically using ONLY " +
          "the knowledge base below, or whether it must be left for a human agent.\n\n" +
          "Knowledge base:\n" +
          '"""\n' +
          KNOWLEDGE_BASE +
          '\n"""\n\n' +
          "Rules:\n" +
          '- Set "escalate" to true if the ticket matches any rule in the knowledge ' +
          'base\'s "Escalation Rules" section, or if you are not confident the ' +
          "knowledge base fully covers the request.\n" +
          '- Set "resolvable" to true only if escalate is false AND the knowledge base ' +
          "directly and completely answers the customer's request.\n" +
          '- When resolvable is true, write "reply" as a complete, friendly, ' +
          "ready-to-send reply to the customer, grounded strictly in the knowledge " +
          "base content — never invent policies, dates, or details that aren't in it.\n" +
          '- When resolvable is false, set "reply" to null.',
        prompt: `Subject: ${subject}\n\nBody: ${body}`,
      }));
    } catch (err) {
      // Leave the ticket OPEN so a human agent can pick it up instead of
      // retrying indefinitely on a persistent AI failure.
      console.error(`Failed to auto-resolve ticket ${ticketId}:`, err);
      return;
    }

    if (!object.resolvable || object.escalate || !object.reply) return;

    await prisma.$transaction(async (tx) => {
      // Only resolve if the ticket is still OPEN — if an agent already picked
      // it up (status changed) or it was reclassified, leave it for them.
      const { count } = await tx.ticket.updateMany({
        where: { id: ticketId, status: TicketStatus.OPEN },
        data: { status: TicketStatus.RESOLVED },
      });
      if (count === 0) return;

      await tx.ticketReply.create({
        data: {
          ticketId,
          body: object.reply!,
          senderType: ReplySenderType.AI,
        },
      });
    });
  });
}
