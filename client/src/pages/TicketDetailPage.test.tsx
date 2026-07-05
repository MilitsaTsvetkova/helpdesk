import { screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { TicketDetailPage } from "./TicketDetailPage";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, disabled, children }: React.PropsWithChildren<{
    value: string; onValueChange: (v: string) => void; disabled?: boolean;
  }>) => (
    <select
      data-testid="assignment-select"
      value={value}
      disabled={disabled}
      onChange={(e) => onValueChange(e.target.value)}
    >
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

vi.mock("axios");
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useParams: () => ({ id: "42" }) };
});

const mockedAxios = vi.mocked(axios, true);

const TICKET = {
  id: 42,
  subject: "Keyboard not working",
  body: "My keyboard stopped responding after the latest update.\n\nPlease advise.",
  fromEmail: "john@example.com",
  fromName: "John Doe",
  status: "OPEN" as const,
  source: "EMAIL" as const,
  assignedTo: null as { id: string; name: string; email: string } | null,
  createdAt: "2024-06-01T10:00:00.000Z",
  updatedAt: "2024-06-01T12:00:00.000Z",
};

const AGENTS = [
  { id: "agent-1", name: "Alice Chen" },
  { id: "agent-2", name: "Bob Martinez" },
];

function mockGet(ticket = TICKET, agents = AGENTS) {
  mockedAxios.get = vi.fn().mockImplementation((url: string) => {
    if (url === "/api/users/assignable") return Promise.resolve({ data: agents });
    return Promise.resolve({ data: ticket });
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketDetailPage", () => {
  describe("loading state", () => {
    it("shows skeleton rows while pending", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {}));
      renderWithQuery(<TicketDetailPage />);
      expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("does not render ticket content while loading", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {}));
      renderWithQuery(<TicketDetailPage />);
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows the error message when the request fails", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error("Failed to load ticket"));
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Failed to load ticket")).toBeInTheDocument();
      });
    });

    it("does not render ticket content on error", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error("oops"));
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByText("oops"));
      expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    });
  });

  describe("populated state", () => {
    it("renders the subject as a heading", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByRole("heading", { name: "Keyboard not working" })).toBeInTheDocument();
      });
    });

    it("renders the sender name and email", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText(/John Doe/)).toBeInTheDocument();
        expect(screen.getByText(/john@example\.com/)).toBeInTheDocument();
      });
    });

    it("renders the message body under a Message label", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Message")).toBeInTheDocument();
        expect(screen.getByText(/keyboard stopped responding/)).toBeInTheDocument();
      });
    });

    it("renders the source as Email", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Email")).toBeInTheDocument();
      });
    });

    it("renders the source as Web", async () => {
      mockGet({ ...TICKET, source: "WEB" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Web")).toBeInTheDocument();
      });
    });

    it("renders the back link to /tickets", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(
          screen.getByRole("link", { name: /back to tickets/i }),
        ).toHaveAttribute("href", "/tickets");
      });
    });

    it("calls GET /api/tickets/42 with withCredentials", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets/42", {
          withCredentials: true,
        });
      });
    });

    it("calls GET /api/users/assignable with withCredentials", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/assignable", {
          withCredentials: true,
        });
      });
    });
  });

  describe("status badge", () => {
    it("applies sky styling to OPEN", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Open")).toHaveClass("bg-sky-100", "text-sky-700");
      });
    });

    it("applies amber styling to IN_PROGRESS", async () => {
      mockGet({ ...TICKET, status: "IN_PROGRESS" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("In Progress")).toHaveClass("bg-amber-100", "text-amber-700");
      });
    });

    it("applies green styling to RESOLVED", async () => {
      mockGet({ ...TICKET, status: "RESOLVED" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Resolved")).toHaveClass("bg-green-100", "text-green-700");
      });
    });

    it("applies slate styling to CLOSED", async () => {
      mockGet({ ...TICKET, status: "CLOSED" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Closed")).toHaveClass("bg-slate-100", "text-slate-600");
      });
    });
  });

  describe("assignment", () => {
    it("shows 'Unassigned' when no agent is assigned", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Unassigned")).toBeInTheDocument();
      });
    });

    it("shows the assigned agent's name when assigned", async () => {
      mockGet({
        ...TICKET,
        assignedTo: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
      });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Alice Chen")).toBeInTheDocument();
      });
    });

    it("calls PATCH with the agent id when an agent is selected", async () => {
      mockGet();
      mockedAxios.patch = vi.fn().mockResolvedValue({
        data: {
          ...TICKET,
          assignedTo: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
        },
      });
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByTestId("assignment-select"));
      fireEvent.change(screen.getByTestId("assignment-select"), {
        target: { value: "agent-1" },
      });

      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/tickets/42",
          { assignedToId: "agent-1" },
          { withCredentials: true },
        );
      });
    });

    it("calls PATCH with null when Unassigned is selected", async () => {
      mockGet({
        ...TICKET,
        assignedTo: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
      });
      mockedAxios.patch = vi.fn().mockResolvedValue({
        data: { ...TICKET, assignedTo: null },
      });
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByTestId("assignment-select"));
      fireEvent.change(screen.getByTestId("assignment-select"), {
        target: { value: "unassigned" },
      });

      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/tickets/42",
          { assignedToId: null },
          { withCredentials: true },
        );
      });
    });

    it("shows 'Failed to save' when the assignment request fails", async () => {
      mockGet();
      mockedAxios.patch = vi.fn().mockRejectedValue(new Error("Server error"));
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByTestId("assignment-select"));
      fireEvent.change(screen.getByTestId("assignment-select"), {
        target: { value: "agent-1" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });
  });
});
