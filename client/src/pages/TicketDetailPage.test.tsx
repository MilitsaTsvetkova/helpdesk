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
  category: null as string | null,
  assignedTo: null as { id: string; name: string; email: string } | null,
  createdAt: "2024-06-01T10:00:00.000Z",
  updatedAt: "2024-06-01T12:00:00.000Z",
};

const AGENTS = [
  { id: "agent-1", name: "Alice Chen" },
  { id: "agent-2", name: "Bob Martinez" },
];

const AGENT_REPLY = {
  id: 1,
  body: "This is an agent reply.",
  senderType: "AGENT" as const,
  createdAt: "2024-06-01T11:00:00.000Z",
  author: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
};

const CUSTOMER_REPLY = {
  id: 2,
  body: "This is a customer reply.",
  senderType: "CUSTOMER" as const,
  createdAt: "2024-06-01T12:00:00.000Z",
  author: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
};

function mockGet(
  ticket = TICKET,
  agents = AGENTS,
  replies: typeof AGENT_REPLY[] = [],
) {
  mockedAxios.get = vi.fn().mockImplementation((url: string) => {
    if (url === "/api/users/assignable") return Promise.resolve({ data: agents });
    if (url === "/api/tickets/42/replies") return Promise.resolve({ data: replies });
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

    it("renders the source as Email in the source select", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Email")).toBeInTheDocument();
      });
    });

    it("renders the source as Web in the source select", async () => {
      mockGet({ ...TICKET, source: "WEB" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Web")).toBeInTheDocument();
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

  describe("status select", () => {
    it("shows Open for OPEN status", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => expect(screen.getByDisplayValue("Open")).toBeInTheDocument());
    });

    it("shows In Progress for IN_PROGRESS status", async () => {
      mockGet({ ...TICKET, status: "IN_PROGRESS" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => expect(screen.getByDisplayValue("In Progress")).toBeInTheDocument());
    });

    it("shows Resolved for RESOLVED status", async () => {
      mockGet({ ...TICKET, status: "RESOLVED" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => expect(screen.getByDisplayValue("Resolved")).toBeInTheDocument());
    });

    it("shows Closed for CLOSED status", async () => {
      mockGet({ ...TICKET, status: "CLOSED" });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => expect(screen.getByDisplayValue("Closed")).toBeInTheDocument());
    });

    it("calls PATCH with the new status when changed", async () => {
      mockGet();
      mockedAxios.patch = vi.fn().mockResolvedValue({
        data: { ...TICKET, status: "RESOLVED" },
      });
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByDisplayValue("Open"));
      fireEvent.change(screen.getByDisplayValue("Open"), {
        target: { value: "RESOLVED" },
      });

      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/tickets/42",
          { status: "RESOLVED" },
          { withCredentials: true },
        );
      });
    });

    it("shows 'Failed to save' when the status request fails", async () => {
      mockGet();
      mockedAxios.patch = vi.fn().mockRejectedValue(new Error("Server error"));
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByDisplayValue("Open"));
      fireEvent.change(screen.getByDisplayValue("Open"), {
        target: { value: "RESOLVED" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });
  });

  describe("source select", () => {
    it("shows the current source as selected", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Email")).toBeInTheDocument();
      });
    });

    it("calls PATCH with the new source when changed", async () => {
      mockGet();
      mockedAxios.patch = vi.fn().mockResolvedValue({
        data: { ...TICKET, source: "WEB" },
      });
      renderWithQuery(<TicketDetailPage />);

      await waitFor(() => screen.getByDisplayValue("Email"));
      fireEvent.change(screen.getByDisplayValue("Email"), {
        target: { value: "WEB" },
      });

      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith(
          "/api/tickets/42",
          { source: "WEB" },
          { withCredentials: true },
        );
      });
    });
  });

  describe("assignment", () => {
    it("shows 'Unassigned' when no agent is assigned", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Unassigned")).toBeInTheDocument();
      });
    });

    it("shows the assigned agent's name when assigned", async () => {
      mockGet({
        ...TICKET,
        assignedTo: { id: "agent-1", name: "Alice Chen", email: "alice@example.com" },
      });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByDisplayValue("Alice Chen")).toBeInTheDocument();
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

      await waitFor(() => screen.getByDisplayValue("Unassigned"));
      fireEvent.change(screen.getByDisplayValue("Unassigned"), {
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

      await waitFor(() => screen.getByDisplayValue("Alice Chen"));
      fireEvent.change(screen.getByDisplayValue("Alice Chen"), {
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

      await waitFor(() => screen.getByDisplayValue("Unassigned"));
      fireEvent.change(screen.getByDisplayValue("Unassigned"), {
        target: { value: "agent-1" },
      });

      await waitFor(() => {
        expect(screen.getByText("Failed to save")).toBeInTheDocument();
      });
    });
  });

  describe("reply thread", () => {
    it("does not show the replies section when there are no replies", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      expect(screen.queryByText(/Replies \(/)).not.toBeInTheDocument();
    });

    it("shows the replies count when there are replies", async () => {
      mockGet(TICKET, AGENTS, [AGENT_REPLY]);
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Replies (1)")).toBeInTheDocument();
      });
    });

    it("renders the reply body and author name", async () => {
      mockGet(TICKET, AGENTS, [AGENT_REPLY]);
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("This is an agent reply.")).toBeInTheDocument();
        // Alice Chen also appears in the assignment dropdown, so check for multiple
        expect(screen.getAllByText("Alice Chen").length).toBeGreaterThan(0);
      });
    });

    it("shows an Agent badge for AGENT replies", async () => {
      mockGet(TICKET, AGENTS, [AGENT_REPLY]);
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Agent")).toBeInTheDocument();
      });
    });

    it("shows a Customer badge for CUSTOMER replies", async () => {
      mockGet(TICKET, AGENTS, [CUSTOMER_REPLY]);
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(screen.getByText("Customer")).toBeInTheDocument();
      });
    });

    it("calls GET /api/tickets/42/replies with withCredentials", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets/42/replies", {
          withCredentials: true,
        });
      });
    });
  });

  describe("reply form", () => {
    it("renders the Reply label and textarea", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      expect(screen.getByText("Reply")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Write a reply…")).toBeInTheDocument();
    });

    it("disables the Send reply button when the textarea is empty", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      expect(screen.getByRole("button", { name: /send reply/i })).toBeDisabled();
    });

    it("enables the Send reply button when the textarea has text", async () => {
      mockGet();
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), {
        target: { value: "Hello!" },
      });
      expect(screen.getByRole("button", { name: /send reply/i })).not.toBeDisabled();
    });

    it("calls POST /api/tickets/42/replies with the body and withCredentials", async () => {
      mockGet();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { ...AGENT_REPLY, body: "Hello!" } });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), {
        target: { value: "Hello!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/tickets/42/replies",
          { body: "Hello!" },
          { withCredentials: true },
        );
      });
    });

    it("clears the textarea after a successful reply", async () => {
      mockGet();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { ...AGENT_REPLY, body: "Hello!" } });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      const textarea = screen.getByPlaceholderText("Write a reply…");
      fireEvent.change(textarea, { target: { value: "Hello!" } });
      fireEvent.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("appends the new reply to the thread after a successful submit", async () => {
      mockGet();
      mockedAxios.post = vi.fn().mockResolvedValue({ data: { ...AGENT_REPLY, body: "New reply!" } });
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), {
        target: { value: "New reply!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(screen.getByText("New reply!")).toBeInTheDocument();
      });
    });

    it("shows 'Failed to send reply' when the POST fails", async () => {
      mockGet();
      mockedAxios.post = vi.fn().mockRejectedValue(new Error("Server error"));
      renderWithQuery(<TicketDetailPage />);
      await waitFor(() => screen.getByRole("heading", { name: "Keyboard not working" }));
      fireEvent.change(screen.getByPlaceholderText("Write a reply…"), {
        target: { value: "Hello!" },
      });
      fireEvent.click(screen.getByRole("button", { name: /send reply/i }));
      await waitFor(() => {
        expect(screen.getByText("Failed to send reply")).toBeInTheDocument();
      });
    });
  });
});
