import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import axios from "axios";
import { CreateUserForm } from "./CreateUserForm";
import { renderWithQuery } from "@/test/render-with-query";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const NEW_USER = {
  id: "3",
  name: "New User",
  email: "new@example.com",
  role: "AGENT" as const,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

function setup() {
  const onClose = vi.fn();
  const user = userEvent.setup();
  renderWithQuery(<CreateUserForm onClose={onClose} />);
  return { user, onClose };
}

async function fillAndSubmit(
  user: ReturnType<typeof userEvent.setup>,
  { name = "New User", email = "new@example.com", password = "password123" } = {}
) {
  if (name) await user.type(screen.getByLabelText("Name"), name);
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Create" }));
}

describe("CreateUserForm", () => {
  describe("rendering", () => {
    it("renders Name, Email and Password fields", () => {
      setup();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("renders Cancel and Create buttons", () => {
      setup();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    });
  });

  describe("validation", () => {
    it("shows an error and does not POST when name is fewer than 3 characters", async () => {
      mockedAxios.post = vi.fn();
      const { user } = setup();
      await fillAndSubmit(user, { name: "AB" });

      await waitFor(() => {
        expect(screen.getByText("Name must be at least 3 characters.")).toBeInTheDocument();
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("shows an error and does not POST for an invalid email", async () => {
      mockedAxios.post = vi.fn();
      const { user } = setup();
      await fillAndSubmit(user, { email: "not-an-email" });

      await waitFor(() => {
        expect(screen.getByText("A valid email is required.")).toBeInTheDocument();
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it("shows an error and does not POST when password is fewer than 8 characters", async () => {
      mockedAxios.post = vi.fn();
      const { user } = setup();
      await fillAndSubmit(user, { password: "short" });

      await waitFor(() => {
        expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
      });
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe("submission", () => {
    it("calls POST /api/users with form data and withCredentials", async () => {
      mockedAxios.post = vi.fn().mockResolvedValue({ data: NEW_USER });
      const { user } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
          "/api/users",
          { name: "New User", email: "new@example.com", password: "password123" },
          { withCredentials: true },
        );
      });
    });

    it("calls onClose after a successful submission", async () => {
      mockedAxios.post = vi.fn().mockResolvedValue({ data: NEW_USER });
      const { user, onClose } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledOnce();
      });
    });

    it("shows 'Creating…' on the submit button while the request is in flight", async () => {
      mockedAxios.post = vi.fn(() => new Promise(() => {})); // never resolves
      const { user } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Creating…" })).toBeInTheDocument();
      });
    });

    it("disables both buttons while the request is in flight", async () => {
      mockedAxios.post = vi.fn(() => new Promise(() => {}));
      const { user } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
      });
    });

    it("displays the server error message and does not call onClose on API error", async () => {
      mockedAxios.post = vi.fn().mockRejectedValue({
        response: { data: { error: "A user with that email already exists." } },
      });
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);
      const { user, onClose } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText("A user with that email already exists.")
        ).toBeInTheDocument();
      });
      expect(onClose).not.toHaveBeenCalled();
    });

    it("displays a fallback message on a generic error", async () => {
      mockedAxios.post = vi.fn().mockRejectedValue(new Error("Network error"));
      mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);
      const { user } = setup();
      await fillAndSubmit(user);

      await waitFor(() => {
        expect(
          screen.getByText("Something went wrong. Please try again.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("cancel", () => {
    it("calls onClose when Cancel is clicked", async () => {
      const { user, onClose } = setup();
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onClose).toHaveBeenCalledOnce();
    });
  });
});
