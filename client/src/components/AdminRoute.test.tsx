import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import { useSession } from "../lib/auth-client";

vi.mock("../lib/auth-client", () => ({
  useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/users"]}>
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <div>Admin Content</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdminRoute", () => {
  it("renders nothing while the session is pending", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Home Page")).not.toBeInTheDocument();
  });

  it("redirects to / when there is no session", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("redirects to / when the session user is not an admin", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: "1", role: "AGENT" } },
      isPending: false,
    } as unknown as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  it("renders the children when the session user is an admin", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: "1", role: "ADMIN" } },
      isPending: false,
    } as unknown as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });
});
