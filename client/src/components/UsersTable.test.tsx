import { screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UsersTable, type User } from "./UsersTable";
import { renderWithQuery } from "@/test/render-with-query";

const USERS: User[] = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "ADMIN",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "AGENT",
    createdAt: "2024-03-20T00:00:00.000Z",
  },
];

function render(props: { users?: User[]; isPending?: boolean; error?: Error | null }) {
  return renderWithQuery(
    <UsersTable
      users={props.users ?? []}
      isPending={props.isPending ?? false}
      error={props.error ?? null}
    />
  );
}

describe("UsersTable", () => {
  describe("loading state", () => {
    it("shows skeleton rows while pending", () => {
      render({ isPending: true });
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render user data while pending", () => {
      render({ users: USERS, isPending: true });
      expect(screen.queryByText("Alice Admin")).not.toBeInTheDocument();
    });

    it("renders the column headers while pending", () => {
      render({ isPending: true });
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Joined")).toBeInTheDocument();
    });
  });

  describe("error state", () => {
    it("shows the error message", () => {
      render({ error: new Error("Failed to load users") });
      expect(screen.getByText("Failed to load users")).toBeInTheDocument();
    });

    it("does not render the table on error", () => {
      render({ error: new Error("Failed to load users") });
      expect(screen.queryByText("Name")).not.toBeInTheDocument();
    });
  });

  describe("empty state", () => {
    it("shows 'No users found.' when the list is empty", () => {
      render({ users: [] });
      expect(screen.getByText("No users found.")).toBeInTheDocument();
    });

    it("renders column headers in the empty state", () => {
      render({ users: [] });
      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Role")).toBeInTheDocument();
      expect(screen.getByText("Joined")).toBeInTheDocument();
    });
  });

  describe("populated state", () => {
    it("renders a row for each user", () => {
      render({ users: USERS });
      expect(screen.getByText("Alice Admin")).toBeInTheDocument();
      expect(screen.getByText("alice@example.com")).toBeInTheDocument();
      expect(screen.getByText("Bob Agent")).toBeInTheDocument();
      expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    });

    it("formats createdAt as a human-readable date", () => {
      render({ users: USERS });
      const formatted = new Date("2024-01-15T00:00:00.000Z").toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      expect(screen.getByText(formatted)).toBeInTheDocument();
    });

    it("applies violet styling to the ADMIN badge", () => {
      render({ users: USERS });
      expect(screen.getByText("ADMIN")).toHaveClass("bg-violet-100", "text-violet-700");
    });

    it("applies slate styling to the AGENT badge", () => {
      render({ users: USERS });
      expect(screen.getByText("AGENT")).toHaveClass("bg-slate-100", "text-slate-600");
    });
  });
});
