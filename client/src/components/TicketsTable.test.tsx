import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketsTable, type Ticket } from "./TicketsTable";
import { renderWithQuery } from "@/test/render-with-query";

const TICKETS: Ticket[] = [
  {
    id: 1,
    subject: "Keyboard not working",
    fromEmail: "alice@example.com",
    fromName: "Alice Smith",
    status: "OPEN",
    source: "EMAIL",
    createdAt: "2024-06-01T10:00:00.000Z",
  },
  {
    id: 2,
    subject: "Screen flickering",
    fromEmail: "bob@example.com",
    fromName: "Bob Jones",
    status: "RESOLVED",
    source: "EMAIL",
    createdAt: "2024-06-02T10:00:00.000Z",
  },
];

function render_(props: { tickets?: Ticket[]; isPending?: boolean; error?: Error | null }) {
  return renderWithQuery(
    <TicketsTable
      tickets={props.tickets ?? []}
      isPending={props.isPending ?? false}
      error={props.error ?? null}
    />
  );
}

describe("TicketsTable", () => {
  describe("loading state", () => {
    it("shows skeleton rows while pending", () => {
      render_({ isPending: true });
      expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("renders column headers while pending", () => {
      render_({ isPending: true });
      expect(screen.getByText("#")).toBeInTheDocument();
      expect(screen.getByText("Subject")).toBeInTheDocument();
      expect(screen.getByText("From")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Received")).toBeInTheDocument();
    });

    it("does not render ticket data while pending", () => {
      render_({ tickets: TICKETS, isPending: true });
      expect(screen.queryByText("Keyboard not working")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows the error message", () => {
      render_({ error: new Error("Failed to load tickets") });
      expect(screen.getByText("Failed to load tickets")).toBeInTheDocument();
    });

    it("does not render the table on error", () => {
      render_({ error: new Error("oops") });
      expect(screen.queryByText("Subject")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows 'No tickets found.' when the list is empty", () => {
      render_({ tickets: [] });
      expect(screen.getByText("No tickets found.")).toBeInTheDocument();
    });
  });

  describe("populated state", () => {
    it("renders a row for each ticket", () => {
      render_({ tickets: TICKETS });
      expect(screen.getByText("Keyboard not working")).toBeInTheDocument();
      expect(screen.getByText("Screen flickering")).toBeInTheDocument();
    });

    it("renders the ticket id prefixed with #", () => {
      render_({ tickets: TICKETS });
      expect(screen.getByText("#1")).toBeInTheDocument();
      expect(screen.getByText("#2")).toBeInTheDocument();
    });

    it("renders fromName and fromEmail for each ticket", () => {
      render_({ tickets: TICKETS });
      expect(screen.getByText("Alice Smith")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    it("formats createdAt as a human-readable date", () => {
      render_({ tickets: [TICKETS[0]] });
      const formatted = new Date("2024-06-01T10:00:00.000Z").toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });
  });

  describe("status badges", () => {
    it("applies sky styling to the OPEN badge", () => {
      render_({ tickets: [TICKETS[0]] });
      expect(screen.getByText("Open")).toHaveClass("bg-sky-100", "text-sky-700");
    });

    it("applies green styling to the RESOLVED badge", () => {
      render_({ tickets: [TICKETS[1]] });
      expect(screen.getByText("Resolved")).toHaveClass("bg-green-100", "text-green-700");
    });

    it("applies amber styling to the IN_PROGRESS badge", () => {
      render_({ tickets: [{ ...TICKETS[0], id: 3, status: "IN_PROGRESS" }] });
      expect(screen.getByText("In Progress")).toHaveClass("bg-amber-100", "text-amber-700");
    });

    it("applies slate styling to the CLOSED badge", () => {
      render_({ tickets: [{ ...TICKETS[0], id: 4, status: "CLOSED" }] });
      expect(screen.getByText("Closed")).toHaveClass("bg-slate-100", "text-slate-600");
    });
  });
});
