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

    it("renders a status filter button for each status", () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<TicketsPage />);
      expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "In Progress" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Resolved" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Closed" })).toBeInTheDocument();
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
    it("clicking a status button gives it the active style", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      const openButton = screen.getByRole("button", { name: "Open" });
      expect(openButton).not.toHaveClass("bg-slate-800");

      await user.click(openButton);
      expect(openButton).toHaveClass("bg-slate-800");
    });

    it("clicking an active status button deactivates it", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      const openButton = screen.getByRole("button", { name: "Open" });
      await user.click(openButton);
      await user.click(openButton);
      expect(openButton).not.toHaveClass("bg-slate-800");
    });

    it("multiple status buttons can be active at the same time", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      const user = userEvent.setup();
      renderWithQuery(<TicketsPage />);

      await user.click(screen.getByRole("button", { name: "Open" }));
      await user.click(screen.getByRole("button", { name: "Resolved" }));

      expect(screen.getByRole("button", { name: "Open" })).toHaveClass("bg-slate-800");
      expect(screen.getByRole("button", { name: "Resolved" })).toHaveClass("bg-slate-800");
      expect(screen.getByRole("button", { name: "In Progress" })).not.toHaveClass("bg-slate-800");
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
