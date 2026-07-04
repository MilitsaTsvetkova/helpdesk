import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./LoginPage";
import { signIn } from "../lib/auth-client";

vi.mock("../lib/auth-client", () => ({
  useSession: vi.fn().mockReturnValue({ data: null, isPending: false }),
  signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
}));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(signIn.email).mockResolvedValue({ error: null } as any);
});

describe("LoginPage", () => {
  describe("rendering", () => {
    it("renders the form with all required elements", () => {
      renderPage();
      expect(screen.getByRole("heading", { name: "Helpdesk" })).toBeInTheDocument();
      expect(screen.getByText("Sign in to your account")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("email input has autofocus", () => {
      renderPage();
      expect(screen.getByLabelText("Email")).toHaveFocus();
    });
  });

  describe("client-side validation", () => {
    it("shows email format error for an invalid email address", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Email"), "not-an-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      });
    });

    it("shows password length error when password is fewer than 8 characters", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "short");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
      });
    });

    it("shows both field errors when the form is submitted empty", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
        // Password value is undefined on empty submit → Zod type error; aria-invalid confirms the field is in error
        expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("shows only email error when email is invalid and password is valid", async () => {
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Email"), "bad-email");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Invalid email address")).toBeInTheDocument();
      });
      expect(screen.queryByText("Password must be at least 8 characters")).not.toBeInTheDocument();
    });
  });

  describe("submission", () => {
    it("shows 'Signing in…' on the button while the request is in flight", async () => {
      vi.mocked(signIn.email).mockImplementation(() => new Promise(() => {}));
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Signing in…" })).toBeInTheDocument();
      });
    });

    it("shows a root error when signIn returns an error", async () => {
      vi.mocked(signIn.email).mockResolvedValue({
        error: { message: "Invalid email or password" },
      } as any);
      const user = userEvent.setup();
      renderPage();
      await user.type(screen.getByLabelText("Email"), "user@example.com");
      await user.type(screen.getByLabelText("Password"), "password123");
      await user.click(screen.getByRole("button", { name: "Sign in" }));
      await waitFor(() => {
        expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
      });
    });
  });
});
