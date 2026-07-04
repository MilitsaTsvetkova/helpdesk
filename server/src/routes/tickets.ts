import { Router } from "express";
import { inboundEmailSchema } from "core";
import { prisma } from "../lib/prisma";
import { validate } from "../lib/validate";

const router = Router();

// Strips HTML tags to produce a plain-text fallback body.
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

router.post("/inbound-email", async (req, res) => {
  const secret = process.env.INBOUND_EMAIL_WEBHOOK_SECRET;
  if (secret) {
    const authHeader = req.headers["authorization"] ?? "";
    const provided =
      authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    const headerSecret = provided || req.headers["x-webhook-secret"];
    if (headerSecret !== secret) {
      res.status(401).json({ error: "Unauthorized." });
      return;
    }
  }

  const data = validate(inboundEmailSchema, req.body, res);
  if (!data) return;

  const { from, fromName, subject, text, html, messageId } = data;

  // Deduplicate: if this messageId was already processed, silently accept.
  if (messageId) {
    const existing = await prisma.ticket.findUnique({ where: { messageId } });
    if (existing) {
      res.status(200).json({ id: existing.id, duplicate: true });
      return;
    }
  }

  const body = text ?? htmlToText(html!);

  const ticket = await prisma.ticket.create({
    data: {
      subject,
      body,
      fromEmail: from,
      fromName,
      messageId: messageId ?? null,
      source: "EMAIL",
      status: "OPEN",
    },
    select: {
      id: true,
      subject: true,
      fromEmail: true,
      status: true,
      createdAt: true,
    },
  });

  res.status(201).json(ticket);
});

export default router;
