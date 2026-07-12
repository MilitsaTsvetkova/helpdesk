import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketReplyThread, type TicketReply } from "./TicketReplyThread";

const AGENT_REPLY: TicketReply = {
  id: 1,
  body: "This is an agent reply.",
  senderType: "AGENT",
  createdAt: "2024-06-01T11:00:00.000Z",
  author: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
};

const CUSTOMER_REPLY: TicketReply = {
  id: 2,
  body: "This is a customer reply.",
  senderType: "CUSTOMER",
  createdAt: "2024-06-01T12:00:00.000Z",
  author: { id: "cust-1", name: "John Doe", email: "john@example.com" },
};

const AI_REPLY: TicketReply = {
  id: 3,
  body: "This is an auto-generated reply.",
  senderType: "AI",
  createdAt: "2024-06-01T13:00:00.000Z",
  author: null,
};

describe("TicketReplyThread", () => {
  describe("empty state", () => {
    it("renders nothing when there are no replies", () => {
      const { container } = render(<TicketReplyThread replies={[]} />);
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("populated state", () => {
    it("renders the reply count heading", () => {
      render(<TicketReplyThread replies={[AGENT_REPLY, CUSTOMER_REPLY]} />);
      expect(screen.getByText("Replies (2)")).toBeInTheDocument();
    });

    it("renders each reply's body and author", () => {
      render(<TicketReplyThread replies={[AGENT_REPLY, CUSTOMER_REPLY]} />);
      expect(screen.getByText("This is an agent reply.")).toBeInTheDocument();
      expect(screen.getByText("Alice Chen")).toBeInTheDocument();
      expect(screen.getByText("This is a customer reply.")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("labels an AGENT reply as Agent", () => {
      render(<TicketReplyThread replies={[AGENT_REPLY]} />);
      expect(screen.getByText("Agent")).toBeInTheDocument();
    });

    it("labels a CUSTOMER reply as Customer", () => {
      render(<TicketReplyThread replies={[CUSTOMER_REPLY]} />);
      expect(screen.getByText("Customer")).toBeInTheDocument();
    });

    it("applies sky styling to agent replies", () => {
      render(<TicketReplyThread replies={[AGENT_REPLY]} />);
      expect(screen.getByText("Agent")).toHaveClass("bg-sky-100", "text-sky-700");
    });

    it("applies slate styling to customer replies", () => {
      render(<TicketReplyThread replies={[CUSTOMER_REPLY]} />);
      expect(screen.getByText("Customer")).toHaveClass("bg-slate-100", "text-slate-500");
    });

    it("labels an AI reply as AI Assistant and falls back to the label when author is null", () => {
      render(<TicketReplyThread replies={[AI_REPLY]} />);
      expect(screen.getByText("This is an auto-generated reply.")).toBeInTheDocument();
      expect(screen.getAllByText("AI Assistant")).toHaveLength(2);
    });

    it("applies violet styling to AI replies", () => {
      render(<TicketReplyThread replies={[AI_REPLY]} />);
      // Badge renders after the author-name fallback, which shares the same text.
      expect(screen.getAllByText("AI Assistant")[1]).toHaveClass("bg-violet-100", "text-violet-700");
    });

    it("formats createdAt as a human-readable date", () => {
      render(<TicketReplyThread replies={[AGENT_REPLY]} />);
      const formatted = new Date(AGENT_REPLY.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });
  });
});
