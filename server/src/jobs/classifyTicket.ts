import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { TicketCategory } from "core";
import { boss } from "../lib/boss";
import { prisma } from "../lib/prisma";
import { type Ticket } from "../generated/prisma/client";

export const CLASSIFY_TICKET_QUEUE = "classify-ticket";

const VALID_CATEGORIES = Object.values(TicketCategory) as string[];

type ClassifyTicketJobData = {
  ticketId: number;
  subject: string;
  body: string;
};

// Enqueues background classification. Runs after the caller's response has
// already been sent, so this must not be awaited on the request path.
export async function enqueueClassifyTicket(ticket: Ticket): Promise<void> {
  const { id: ticketId, subject, body } = ticket;
  try {
    await boss.send(CLASSIFY_TICKET_QUEUE, {
      ticketId,
      subject,
      body,
    } satisfies ClassifyTicketJobData);
  } catch (err) {
    console.error(`Failed to enqueue classification for ticket ${ticketId}:`, err);
  }
}

// Registers the worker that classifies queued tickets with GPT and persists
// the result. Throwing lets pg-boss retry the job per the queue's retry config.
export async function registerClassifyTicketWorker(): Promise<void> {
  await boss.createQueue(CLASSIFY_TICKET_QUEUE, {
    retryLimit: 3,
    retryBackoff: true,
  });

  await boss.work<ClassifyTicketJobData>(CLASSIFY_TICKET_QUEUE, async ([job]) => {
    const { ticketId, subject, body } = job.data;

    const { object: category } = await generateObject({
      model: openai("gpt-5.4-nano"),
      output: "enum",
      enum: VALID_CATEGORIES,
      system:
        "You classify IT helpdesk tickets into exactly one category.\n\n" +
        "- HARDWARE: physical devices (laptops, monitors, keyboards, printers, peripherals).\n" +
        "- SOFTWARE: applications, operating systems, installs, bugs, licensing.\n" +
        "- NETWORK: connectivity, VPN, wifi, DNS, internal services being unreachable.\n" +
        "- ACCESS: logins, passwords, permissions, account provisioning/deprovisioning for internal IT systems.\n" +
        "- OTHER: anything that is not clearly an IT helpdesk issue, or is ambiguous, unclear, or off-topic (e.g. billing, refunds, sales, HR, general questions). " +
        "When in doubt, choose OTHER rather than forcing a fit into one of the IT categories.",
      prompt: `Subject: ${subject}\n\nBody: ${body}`,
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category: category as TicketCategory },
    });
  });
}
