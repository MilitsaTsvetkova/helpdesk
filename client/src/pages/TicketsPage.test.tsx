import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { TicketsPage } from "./TicketsPage";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const TICKETS = [
  {
    id: 1,
    subject: "Keyboard not working",
    fromEmail: "alice@example.com",
    fromName: "Alice Smith",
    status: "OPEN" as const,
    source: "EMAIL" as const,
    createdAt: "2024-06-01T10:00:00.000Z",
  },
];

function mockEmpty() {
  mockedAxios.get = vi
    .fn()
    .mockResolvedValue({ data: { tickets: [], total: 0, page: 1, pageSize: 10, totalPages: 1 } });
}

function mockWithTickets() {
  mockedAxios.get = vi.fn().mockResolvedValue({
    data: { tickets: TICKETS, total: 1, page: 1, pageSize: 10, totalPages: 1 },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsPage", () => {
  describe("layout", () => {
    it("renders the Tickets heading", () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
    });

    it("renders the search input", () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      expect(screen.getByPlaceholderText("Search subject, sender…")).toBeInTheDocument();
    });

    it("renders a Status dropdown trigger", () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      expect(screen.getByRole("button", { name: /Status/i })).toBeInTheDocument();
    });
  });

  describe("data fetching", () => {
    it("calls GET /api/tickets with default params on mount", async () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", {
          params: { sortBy: "createdAt", sortOrder: "desc", page: 1, pageSize: 10 },
          withCredentials: true,
        });
      });
    });

    it("shows skeleton rows while loading", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {}));
      renderWithQuery(<TicketsPage />);
      expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("shows an error message when the request fails", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error("Network error"));
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("renders tickets returned by the API", async () => {
      mockWithTickets();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("Keyboard not working")).toBeInTheDocument();
      });
    });
  });

  describe("filter bar", () => {
    it("selecting one status updates the trigger label to that status name", async () => {
      mockEmpty();
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /Open/i })).toBeInTheDocument();
    });

    it("deselecting the only active status resets the trigger label to 'Status'", async () => {
      mockEmpty();
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /^Status$/i })).toBeInTheDocument();
    });

    it("selecting multiple statuses shows a count in the trigger label", async () => {
      mockEmpty();
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Resolved" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /Status \(2\)/i })).toBeInTheDocument();
    });

    it("typing into the search input updates its value", async () => {
      mockEmpty();
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      const input = screen.getByPlaceholderText("Search subject, sender…");
      await user.type(input, "keyboard");
      expect(input).toHaveValue("keyboard");
    });
  });

  describe("pagination", () => {
    it("shows the total ticket count", async () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("0 tickets")).toBeInTheDocument();
      });
    });

    it("shows singular 'ticket' for a single result", async () => {
      mockWithTickets();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("1 ticket")).toBeInTheDocument();
      });
    });

    it("shows Page 1 of 1 by default", async () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("Page 1 of 1")).toBeInTheDocument();
      });
    });

    it("Previous button is disabled on page 1", async () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
      });
    });

    it("Next button is disabled when on the last page", async () => {
      mockEmpty();
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      });
    });

    it("Next button is enabled when more pages exist", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({
        data: { tickets: TICKETS, total: 15, page: 1, pageSize: 10, totalPages: 2 },
      });
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
        expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
      });
    });
  });
});
