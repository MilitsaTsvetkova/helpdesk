import { z } from "zod";

// Normalized inbound-email payload — provider adapters must map to this shape.
export const inboundEmailSchema = z
  .object({
    from: z.email("A valid sender email is required."),
    fromName: z.string().min(1, "Sender name is required."),
    subject: z.string().min(1, "Subject is required."),
    text: z.string().optional(),
    html: z.string().optional(),
    messageId: z.string().optional(),
  })
  .refine((d) => d.text || d.html, {
    message: "Either text or html body must be provided.",
  });

export type InboundEmailPayload = z.infer<typeof inboundEmailSchema>;
