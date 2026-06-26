import { screen, waitFor } from "@testing-library/react";
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

  describe("Create User modal", () => {
    beforeEach(() => {
      mockedAxios.get = vi.fn().mockResolvedValue({ data: USERS });
    });

    async function openModal() {
      const user = userEvent.setup();
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Create User" }));
      return user;
    }

    it("renders the Create User button", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    });

    it("does not show the modal on initial render", async () => {
      renderWithQuery(<UsersPage />);
      await waitFor(() => expect(screen.getByText("Alice Admin")).toBeInTheDocument());
      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();
    });

    it("opens the modal with Name, Email and Password fields", async () => {
      await openModal();
      expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
    });

    it("closes the modal and resets the form when Cancel is clicked", async () => {
      const user = await openModal();
      await user.type(screen.getByLabelText("Name"), "Typed name");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.queryByRole("heading", { name: "Create User" })).not.toBeInTheDocument();

      // Reopen — field should be empty
      await user.click(screen.getByRole("button", { name: "Create User" }));
      expect(screen.getByLabelText("Name")).toHaveValue("");
    });

    describe("validation", () => {
      it("shows an error and does not POST when name is fewer than 3 characters", async () => {
        mockedAxios.post = vi.fn();
        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "AB");
        await user.type(screen.getByLabelText("Email"), "test@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(screen.getByText("Name must be at least 3 characters.")).toBeInTheDocument();
        });
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });

      it("shows an error and does not POST for an invalid email", async () => {
        mockedAxios.post = vi.fn();
        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "Valid Name");
        await user.type(screen.getByLabelText("Email"), "not-an-email");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
        });
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });

      it("shows an error and does not POST when password is fewer than 8 characters", async () => {
        mockedAxios.post = vi.fn();
        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "Valid Name");
        await user.type(screen.getByLabelText("Email"), "test@example.com");
        await user.type(screen.getByLabelText("Password"), "short");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(screen.getByText("Password must be at least 8 characters.")).toBeInTheDocument();
        });
        expect(mockedAxios.post).not.toHaveBeenCalled();
      });
    });

    describe("submission", () => {
      const NEW_USER = {
        id: "3",
        name: "New User",
        email: "new@example.com",
        role: "AGENT" as const,
        createdAt: new Date().toISOString(),
      };

      it("calls POST /api/users with the form data and withCredentials", async () => {
        mockedAxios.post = vi.fn().mockResolvedValue({ data: NEW_USER });
        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "New User");
        await user.type(screen.getByLabelText("Email"), "new@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(mockedAxios.post).toHaveBeenCalledWith(
            "/api/users",
            { name: "New User", email: "new@example.com", password: "password123" },
            { withCredentials: true },
          );
        });
      });

      it("closes the modal and refetches the user list on success", async () => {
        mockedAxios.get = vi.fn()
          .mockResolvedValueOnce({ data: USERS })
          .mockResolvedValueOnce({ data: [...USERS, NEW_USER] });
        mockedAxios.post = vi.fn().mockResolvedValue({ data: NEW_USER });

        const user = await openModal();
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

      it("shows 'Creating…' on the submit button while the request is in flight", async () => {
        mockedAxios.post = vi.fn(() => new Promise(() => {})); // never resolves
        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "New User");
        await user.type(screen.getByLabelText("Email"), "new@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(screen.getByRole("button", { name: "Creating…" })).toBeInTheDocument();
        });
      });

      it("displays the server error message when the API returns an error", async () => {
        mockedAxios.post = vi.fn().mockRejectedValue({
          response: { data: { error: "A user with that email already exists." } },
        });
        mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "New User");
        await user.type(screen.getByLabelText("Email"), "alice@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(
            screen.getByText("A user with that email already exists."),
          ).toBeInTheDocument();
        });
        expect(screen.getByRole("heading", { name: "Create User" })).toBeInTheDocument();
      });

      it("displays a fallback message on a generic error", async () => {
        mockedAxios.post = vi.fn().mockRejectedValue(new Error("Network error"));
        mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

        const user = await openModal();
        await user.type(screen.getByLabelText("Name"), "New User");
        await user.type(screen.getByLabelText("Email"), "new@example.com");
        await user.type(screen.getByLabelText("Password"), "password123");
        await user.click(screen.getByRole("button", { name: "Create" }));

        await waitFor(() => {
          expect(
            screen.getByText("Something went wrong. Please try again."),
          ).toBeInTheDocument();
        });
      });
    });
  });
});
