import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TicketUpdatePanel, type TicketDetailData } from "./TicketUpdatePanel";

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: React.PropsWithChildren<{
    value: string; onValueChange: (v: string) => void;
  }>) => (
    <select value={value} onChange={(e) => onValueChange(e.target.value)}>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: React.PropsWithChildren) => <>{children}</>,
  SelectItem: ({ value, children }: React.PropsWithChildren<{ value: string }>) => (
    <option value={value}>{children}</option>
  ),
}));

const TICKET: TicketDetailData = {
  id: 42,
  subject: "Keyboard not working",
  body: "It stopped responding.",
  fromEmail: "john@example.com",
  fromName: "John Doe",
  status: "OPEN",
  source: "EMAIL",
  category: null,
  assignedTo: null,
  createdAt: "2024-06-01T10:00:00.000Z",
  updatedAt: "2024-06-01T12:00:00.000Z",
};

const AGENTS = [
  { id: "agent-1", name: "Alice Chen" },
  { id: "agent-2", name: "Bob Martinez" },
];

function renderPanel(overrides: Partial<React.ComponentProps<typeof TicketUpdatePanel>> = {}) {
  const onStatusChange = vi.fn();
  const onSourceChange = vi.fn();
  const onCategoryChange = vi.fn();
  const onAssign = vi.fn();
  render(
    <TicketUpdatePanel
      ticket={TICKET}
      assignableUsers={AGENTS}
      isSaveError={false}
      onStatusChange={onStatusChange}
      onSourceChange={onSourceChange}
      onCategoryChange={onCategoryChange}
      onAssign={onAssign}
      {...overrides}
    />
  );
  return { onStatusChange, onSourceChange, onCategoryChange, onAssign };
}

describe("TicketUpdatePanel", () => {
  describe("status select", () => {
    it("shows the current status value", () => {
      renderPanel();
      expect(screen.getByDisplayValue("Open")).toBeInTheDocument();
    });

    it("calls onStatusChange with the new value when changed", async () => {
      const user = userEvent.setup();
      const { onStatusChange } = renderPanel();
      await user.selectOptions(screen.getByDisplayValue("Open"), "RESOLVED");
      expect(onStatusChange).toHaveBeenCalledWith("RESOLVED");
    });
  });

  describe("source select", () => {
    it("shows the current source value", () => {
      renderPanel();
      expect(screen.getByDisplayValue("Email")).toBeInTheDocument();
    });

    it("calls onSourceChange with the new value when changed", async () => {
      const user = userEvent.setup();
      const { onSourceChange } = renderPanel();
      await user.selectOptions(screen.getByDisplayValue("Email"), "WEB");
      expect(onSourceChange).toHaveBeenCalledWith("WEB");
    });
  });

  describe("category select", () => {
    it("shows 'Uncategorized' when the ticket has no category", () => {
      renderPanel();
      expect(screen.getByDisplayValue("Uncategorized")).toBeInTheDocument();
    });

    it("shows the ticket's category value when set", () => {
      renderPanel({ ticket: { ...TICKET, category: "HARDWARE" } });
      expect(screen.getByDisplayValue("Hardware")).toBeInTheDocument();
    });

    it("calls onCategoryChange with the new value when changed", async () => {
      const user = userEvent.setup();
      const { onCategoryChange } = renderPanel();
      await user.selectOptions(screen.getByDisplayValue("Uncategorized"), "SOFTWARE");
      expect(onCategoryChange).toHaveBeenCalledWith("SOFTWARE");
    });
  });

  describe("assigned to select", () => {
    it("shows 'Unassigned' when the ticket has no assignee", () => {
      renderPanel();
      expect(screen.getByDisplayValue("Unassigned")).toBeInTheDocument();
    });

    it("shows the assignee's name when set", () => {
      renderPanel({
        ticket: { ...TICKET, assignedTo: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" } },
      });
      expect(screen.getByDisplayValue("Alice Chen")).toBeInTheDocument();
    });

    it("lists each assignable user as an option", () => {
      renderPanel();
      expect(screen.getByText("Alice Chen")).toBeInTheDocument();
      expect(screen.getByText("Bob Martinez")).toBeInTheDocument();
    });

    it("calls onAssign with the new value when changed", async () => {
      const user = userEvent.setup();
      const { onAssign } = renderPanel();
      await user.selectOptions(screen.getByDisplayValue("Unassigned"), "agent-2");
      expect(onAssign).toHaveBeenCalledWith("agent-2");
    });
  });

  describe("read-only metadata", () => {
    it("renders the sender's name and email", () => {
      renderPanel();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("john@example.com")).toBeInTheDocument();
    });

    it("formats createdAt and updatedAt as human-readable dates", () => {
      renderPanel();
      const formatted = new Date(TICKET.createdAt).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      expect(screen.getAllByText(formatted).length).toBeGreaterThan(0);
    });
  });

  describe("save error", () => {
    it("shows 'Failed to save' when isSaveError is true", () => {
      renderPanel({ isSaveError: true });
      expect(screen.getByText("Failed to save")).toBeInTheDocument();
    });

    it("does not show an error message when isSaveError is false", () => {
      renderPanel({ isSaveError: false });
      expect(screen.queryByText("Failed to save")).not.toBeInTheDocument();
    });
  });
});
