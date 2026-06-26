import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

async function openModal() {
  const user = userEvent.setup();
  mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
  renderWithQuery(<UsersPage />);
  await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Create User" }));
  return user;
}

describe("UsersPage", () => {
  describe("data fetching", () => {
    it("calls GET /api/users with withCredentials on mount", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<UsersPage />);

      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledWith("/api/users", { withCredentials: true });
      });
    });

    it("shows skeleton rows while loading", () => {
      mockedAxios.get = vi.fn(() => new Promise(() => {})); // never resolves
      renderWithQuery(<UsersPage />);

      expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("shows an error message when the request fails", async () => {
      mockedAxios.get = vi.fn().mockRejectedValue(new Error("Network error"));
      renderWithQuery(<UsersPage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("renders users returned by the API", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
      renderWithQuery(<UsersPage />);

      await waitFor(() => {
        expect(screen.getByText("Alice Admin")).toBeInTheDocument();
        expect(screen.getByText("Bob Agent")).toBeInTheDocument();
      });
    });
  });

  describe("layout", () => {
    it("renders the Users heading", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<UsersPage />);

      expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    });

    it("renders the Create User button", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: [] });
      renderWithQuery(<UsersPage />);

      expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    });
  });

  describe("modal", () => {
    it("does not show the modal on initial render", async () => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
      renderWithQuery(<UsersPage />);

      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();
    });

    it("opens when Create User is clicked", async () => {
      await openModal();

      expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("closes when Cancel is clicked", async () => {
      const user = await openModal();
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();
    });

    it("closes when the backdrop is clicked", async () => {
      await openModal();

      const modalCard = screen.getByRole("heading", { name: "Create User" }).closest(".bg-white")!;
      fireEvent.click(modalCard.parentElement!);

      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();
    });

    it("does not close when the modal card itself is clicked", async () => {
      await openModal();

      const modalCard = screen.getByRole("heading", { name: "Create User" }).closest(".bg-white")!;
      fireEvent.click(modalCard);

      expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
    });

    it("closes and refetches the list after a successful submission", async () => {
      const NEW_USER = {
        id: "3",
        name: "New User",
        email: "new@example.com",
        role: "AGENT" as const,
        createdAt: new Date().toISOString(),
      };
      mockedAxios.get = vi.fn()
        .mockResolvedValueOnce({ data: USERS })
        .mockResolvedValueOnce({ data: [...USERS, NEW_USER] });
      mockedAxios.post = vi.fn().mockResolvedValue({ data: NEW_USER });

      const user = userEvent.setup();
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Create User" }));
      await user.type(screen.getByLabelText("Name"), "New User");
      await user.type(screen.getByLabelText("Email"), "new@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => {
        expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();
      });
      await waitFor(() => {
        expect(screen.getByText("New User")).toBeInTheDocument();
      });
    });
  });
});
