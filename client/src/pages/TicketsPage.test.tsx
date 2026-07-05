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

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TicketsPage", () => {
  describe("layout", () => {
    it("renders the Tickets heading", () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<TicketsPage />);
      expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
    });

    it("renders the search input", () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<TicketsPage />);
      expect(screen.getByPlaceholderText("Search subject, sender…")).toBeInTheDocument();
    });

    it("renders a Status dropdown trigger", () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<TicketsPage />);
      expect(screen.getByRole("button", { name: /Status/i })).toBeInTheDocument();
    });
  });

  describe("data fetching", () => {
    it("calls GET /api/tickets with default sort params and no filter params on mount", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", {
          params: { sortBy: "createdAt", sortOrder: "desc" },
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
      mockedAxios.get = vi.fn().mockResolvedValue({ data: TICKETS });
      renderWithQuery(<TicketsPage />);
      await waitFor(() => {
        expect(screen.getByText("Keyboard not working")).toBeInTheDocument();
      });
    });
  });

  describe("filter bar", () => {
    it("selecting one status updates the trigger label to that status name", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /Open/i })).toBeInTheDocument();
    });

    it("deselecting the only active status resets the trigger label to 'Status'", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /^Status$/i })).toBeInTheDocument();
    });

    it("selecting multiple statuses shows a count in the trigger label", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: /Status/i }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Open" }));
      await user.click(screen.getByRole("menuitemcheckbox", { name: "Resolved" }));
      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: /Status \(2\)/i })).toBeInTheDocument();
    });

    it("typing into the search input updates its value", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      const input = screen.getByPlaceholderText("Search subject, sender…");
      await user.type(input, "keyboard");
      expect(input).toHaveValue("keyboard");
    });
  });
});
