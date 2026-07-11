import { z } from "zod";
import { TicketCategory, TicketSource, TicketStatus } from "../tickets";

export const createReplySchema = z.object({
  body: z.string().min(1, "Reply body is required."),
});

export type CreateReplyData = z.infer<typeof createReplySchema>;

export const polishReplySchema = z.object({
  body: z
    .string()
    .min(1, "Reply body is required.")
    .max(5000, "Reply body is too long."),
});

export type PolishReplyData = z.infer<typeof polishReplySchema>;

export const patchTicketSchema = z.object({
  assignedToId: z.string().nullable().optional(),
  status: z
    .enum(Object.values(TicketStatus) as [TicketStatus, ...TicketStatus[]])
    .optional(),
  source: z
    .enum(Object.values(TicketSource) as [TicketSource, ...TicketSource[]])
    .optional(),
  category: z
    .enum(
      Object.values(TicketCategory) as [TicketCategory, ...TicketCategory[]],
    )
    .nullable()
    .optional(),
});

export type PatchTicketData = z.infer<typeof patchTicketSchema>;

// Normalized inbound-email payload — provider adapters must map to this shape.
export const inboundEmailSchema = z
  .object({
    from: z
      .email("A valid sender email is required.")
      .max(254, "Sender email is too long."),
    fromName: z
      .string()
      .min(1, "Sender name is required.")
      .max(255, "Sender name is too long."),
    subject: z
      .string()
      .min(1, "Subject is required.")
      .max(500, "Subject is too long."),
    text: z.string().max(1000, "Text body is too long.").optional(),
    html: z.string().max(2000, "HTML body is too long.").optional(),
    messageId: z.string().max(255, "Message ID is too long.").optional(),
  })
  .refine((d) => d.text || d.html, {
    message: "Either text or html body must be provided.",
  });

export type InboundEmailPayload = z.infer<typeof inboundEmailSchema>;
