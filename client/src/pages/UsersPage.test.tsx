import { screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { UsersPage } from "./UsersPage";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const USERS = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "ADMIN" as const,
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "AGENT" as const,
    createdAt: "2024-03-20T00:00:00.000Z",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("UsersPage", () => {
  it("shows skeleton rows while loading", () => {
    mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves
    renderWithQuery(<UsersPage />);

    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
    expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
  });

  it("renders the page heading", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithQuery(<UsersPage />);

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  it("shows column headers in the table", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Name")).toBeInTheDocument();
    });
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Role")).toBeInTheDocument();
    expect(screen.getByText("Joined")).toBeInTheDocument();
  });

  it("shows 'No users found' when the list is empty", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });
  });

  it("renders a row for each user", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    });
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("displays ADMIN role badge with violet styling", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    });

    const adminBadge = screen.getByText("ADMIN");
    expect(adminBadge).toHaveClass("bg-violet-100", "text-violet-700");
  });

  it("displays AGENT role badge with slate styling", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    });

    const agentBadge = screen.getByText("AGENT");
    expect(agentBadge).toHaveClass("bg-slate-100", "text-slate-600");
  });

  it("formats createdAt as a human-readable date", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
    });

    const formatted = new Date("2024-01-15T00:00:00.000Z").toLocaleDateString(
      undefined,
      { year: "numeric", month: "short", day: "numeric" }
    );
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  it("shows an error message when the request fails", async () => {
    mockedAxios.get = vi
      .fn()
      .mockRejectedValue(new Error("Network error"));
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("calls /api/users with credentials", async () => {
    mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
    renderWithQuery(<UsersPage />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/users", {
        withCredentials: true,
      });
    });
  });
});
