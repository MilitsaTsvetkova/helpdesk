import sgMail from "@sendgrid/mail";
import * as Sentry from "@sentry/node";
import { boss } from "../lib/boss";
import { prisma } from "../lib/prisma";

export const SEND_REPLY_EMAIL_QUEUE = "send-reply-email";

type SendReplyEmailJobData = {
  replyId: number;
};

// Enqueues the outbound email for a reply (agent or AI). Runs after the
// caller's response has already been sent, so this must not be awaited on
// the request path.
export async function enqueueSendReplyEmail(replyId: number): Promise<void> {
  try {
    await boss.send(SEND_REPLY_EMAIL_QUEUE, { replyId } satisfies SendReplyEmailJobData);
  } catch (err) {
    console.error(`Failed to enqueue reply email for reply ${replyId}:`, err);
    Sentry.captureException(err);
  }
}

// Registers the worker that emails a queued reply to the customer via
// SendGrid. Throwing lets pg-boss retry the job per the queue's retry config.
export async function registerSendReplyEmailWorker(): Promise<void> {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

  await boss.createQueue(SEND_REPLY_EMAIL_QUEUE, {
    retryLimit: 3,
    retryBackoff: true,
  });

  await boss.work<SendReplyEmailJobData>(SEND_REPLY_EMAIL_QUEUE, async ([job]) => {
    const { replyId } = job.data;

    const reply = await prisma.ticketReply.findUnique({
      where: { id: replyId },
      select: {
        body: true,
        ticket: {
          select: { subject: true, fromEmail: true, fromName: true, messageId: true },
        },
      },
    });
    if (!reply) return;

    const { ticket } = reply;
    const subject = ticket.subject.startsWith("Re: ")
      ? ticket.subject
      : `Re: ${ticket.subject}`;
    // Threading headers so the reply lands in the same inbox thread as the
    // customer's original message.
    const reference = ticket.messageId ? `<${ticket.messageId}>` : undefined;

    await sgMail.send({
      to: { email: ticket.fromEmail, name: ticket.fromName },
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject,
      text: reply.body,
      ...(reference && {
        headers: { "In-Reply-To": reference, References: reference },
      }),
    });
  });
}
