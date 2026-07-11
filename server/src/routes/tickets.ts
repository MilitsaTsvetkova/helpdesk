import { inboundEmailSchema, patchTicketSchema, createReplySchema, TicketCategory, TicketStatus, TicketSource } from "core";
import { Router } from "express";
import { type TicketWhereInput } from "../generated/prisma/models/Ticket";
import { prisma } from "../lib/prisma";
import { validate } from "../lib/validate";
import { requireAuth } from "../middleware/requireAuth";

const UNASSIGNED = "unassigned";

const router = Router();

const SORTABLE_FIELDS = ["subject", "fromName", "status", "createdAt", "updatedAt"] as const;
type SortableField = (typeof SORTABLE_FIELDS)[number];

const VALID_STATUSES = Object.values(TicketStatus) as string[];
const VALID_CATEGORIES = Object.values(TicketCategory) as string[];

router.get("/", requireAuth, async (req, res) => {
  const rawSortBy = req.query.sortBy as string | undefined;
  const rawSortOrder = req.query.sortOrder as string | undefined;
  const rawSearch = req.query.search as string | undefined;
  const rawStatus = req.query.status as string | undefined;
  const rawCategory = req.query.category as string | undefined;
  const rawAssignedTo = req.query.assignedTo as string | undefined;
  const rawPage = req.query.page as string | undefined;
  const rawPageSize = req.query.pageSize as string | undefined;

  const sortBy: SortableField = SORTABLE_FIELDS.includes(
    rawSortBy as SortableField,
  )
    ? (rawSortBy as SortableField)
    : "createdAt";
  const sortOrder: "asc" | "desc" = rawSortOrder === "asc" ? "asc" : "desc";

  const page = Math.max(1, parseInt(rawPage ?? "1") || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(rawPageSize ?? "10") || 10),
  );

  const andConditions: TicketWhereInput[] = [];

  const search = rawSearch?.trim();
  if (search) {
    andConditions.push({
      OR: [
        { subject: { contains: search, mode: "insensitive" } },
        { fromName: { contains: search, mode: "insensitive" } },
        { fromEmail: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  const statuses = rawStatus
    ?.split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_STATUSES.includes(s)) as TicketStatus[];
  if (statuses && statuses.length > 0) {
    andConditions.push({ status: { in: statuses } });
  }

  const categories = rawCategory
    ?.split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_CATEGORIES.includes(s)) as TicketCategory[];
  if (categories && categories.length > 0) {
    andConditions.push({ category: { in: categories } });
  }

  const assignedToTokens =
    rawAssignedTo
      ?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  if (assignedToTokens.length > 0) {
    const assignedToOr: TicketWhereInput[] = [];
    const userIds = assignedToTokens.filter((t) => t !== UNASSIGNED);
    if (userIds.length > 0)
      assignedToOr.push({ assignedToId: { in: userIds } });
    if (assignedToTokens.includes(UNASSIGNED))
      assignedToOr.push({ assignedToId: null });
    if (assignedToOr.length > 0) andConditions.push({ OR: assignedToOr });
  }

  const where: TicketWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const select = {
    id: true,
    subject: true,
    fromEmail: true,
    fromName: true,
    status: true,
    source: true,
    category: true,
    createdAt: true,
    updatedAt: true,
    assignedTo: { select: { id: true, name: true, email: true } },
  };

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      select,
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({
    tickets,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid ticket id." });
    return;
  }

  const data = validate(patchTicketSchema, req.body, res);
  if (!data) return;

  const { assignedToId, status, source, category } = data;

  if (assignedToId) {
    const user = await prisma.user.findUnique({
      where: { id: assignedToId, deletedAt: null },
    });
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status !== undefined && { status }),
      ...(source !== undefined && { source }),
      ...(category !== undefined && { category }),
    },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });

  res.json(ticket);
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket id." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { assignedTo: { select: { id: true, name: true, email: true } } },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  res.json(ticket);
});

router.get("/:id/replies", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid ticket id." });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const replies = await prisma.ticketReply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      senderType: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  res.json(replies);
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: "Invalid ticket id." });
    return;
  }

  const data = validate(createReplySchema, req.body, res);
  if (!data) return;

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found." });
    return;
  }

  const reply = await prisma.ticketReply.create({
    data: {
      ticketId: id,
      body: data.body,
      senderType: "AGENT",
      authorId: req.user!.id,
    },
    select: {
      id: true,
      body: true,
      senderType: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json(reply);
});

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
    const provided = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;
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
