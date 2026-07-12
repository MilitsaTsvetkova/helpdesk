export const TicketCategory = {
  HARDWARE: "HARDWARE",
  SOFTWARE: "SOFTWARE",
  NETWORK: "NETWORK",
  ACCESS: "ACCESS",
  OTHER: "OTHER",
} as const;

export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;

export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketSource = {
  EMAIL: "EMAIL",
  WEB: "WEB",
} as const;

export type TicketSource = (typeof TicketSource)[keyof typeof TicketSource];

export const ReplySenderType = {
  AGENT: "AGENT",
  CUSTOMER: "CUSTOMER",
  AI: "AI",
} as const;

export type ReplySenderType = (typeof ReplySenderType)[keyof typeof ReplySenderType];

