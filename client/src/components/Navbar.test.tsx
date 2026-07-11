import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Navbar } from "./Navbar";
import { useAuth } from "../contexts/AuthContext";

vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function mockAuth(overrides: {
  user?: { id: string; name: string; email: string; role: string } | null;
  logout?: () => void;
}) {
  mockedUseAuth.mockReturnValue({
    user: overrides.user ?? null,
    loading: false,
    login: vi.fn(),
    logout: overrides.logout ?? vi.fn(),
  } as unknown as ReturnType<typeof useAuth>);
}

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Navbar", () => {
  describe("no user", () => {
    it("does not render the user's name or a logout button", () => {
      mockAuth({ user: null });
      renderNavbar();
      expect(screen.queryByRole("button", { name: "Logout" })).not.toBeInTheDocument();
    });

    it("does not show the Users link", () => {
      mockAuth({ user: null });
      renderNavbar();
      expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    });
  });

  describe("agent user", () => {
    beforeEach(() => {
      mockAuth({ user: { id: "1", name: "Bob Agent", email: "bob@example.com", role: "AGENT" } });
    });

    it("shows the Tickets link", () => {
      renderNavbar();
      expect(screen.getByRole("link", { name: "Tickets" })).toHaveAttribute("href", "/tickets");
    });

    it("does not show the Users link", () => {
      renderNavbar();
      expect(screen.queryByRole("link", { name: "Users" })).not.toBeInTheDocument();
    });

    it("shows the user's name", () => {
      renderNavbar();
      expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    });
  });

  describe("admin user", () => {
    beforeEach(() => {
      mockAuth({ user: { id: "1", name: "Alice Admin", email: "alice@example.com", role: "ADMIN" } });
    });

    it("shows the Users link", () => {
      renderNavbar();
      expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/users");
    });

    it("falls back to email when the user has no name", () => {
      mockAuth({ user: { id: "1", name: "", email: "alice@example.com", role: "ADMIN" } });
      renderNavbar();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    it("calls logout when the Logout button is clicked", async () => {
      const logout = vi.fn();
      mockAuth({
        user: { id: "1", name: "Alice Admin", email: "alice@example.com", role: "ADMIN" },
        logout,
      });
      const user = userEvent.setup();
      renderNavbar();
      await user.click(screen.getByRole("button", { name: "Logout" }));
      expect(logout).toHaveBeenCalled();
    });
  });
});
