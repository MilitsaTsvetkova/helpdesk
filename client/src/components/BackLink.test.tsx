import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { BackLink } from "./BackLink";

function renderLink(to: string, children: React.ReactNode) {
  return render(
    <MemoryRouter>
      <BackLink to={to}>{children}</BackLink>
    </MemoryRouter>
  );
}

describe("BackLink", () => {
  it("renders the label text", () => {
    renderLink("/tickets", "Back to tickets");
    expect(screen.getByText("Back to tickets")).toBeInTheDocument();
  });

  it("links to the given destination", () => {
    renderLink("/tickets", "Back to tickets");
    expect(screen.getByRole("link", { name: /back to tickets/i })).toHaveAttribute(
      "href",
      "/tickets"
    );
  });

  it("links to a different destination when passed one", () => {
    renderLink("/users", "Back to users");
    expect(screen.getByRole("link", { name: /back to users/i })).toHaveAttribute(
      "href",
      "/users"
    );
  });
});
