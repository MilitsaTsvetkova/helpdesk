import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { useSession } from "../lib/auth-client";

vi.mock("../lib/auth-client", () => ({
  useSession: vi.fn(),
}));

const mockedUseSession = vi.mocked(useSession);

function renderRoute() {
  return render(
    <MemoryRouter initialEntries={["/tickets"]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route
          path="/tickets"
          element={
            <ProtectedRoute>
              <div>Protected Content</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute", () => {
  it("renders nothing while the session is pending", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: true } as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when there is no session", () => {
    mockedUseSession.mockReturnValue({ data: null, isPending: false } as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders the children when a session exists", () => {
    mockedUseSession.mockReturnValue({
      data: { user: { id: "1", role: "AGENT" } },
      isPending: false,
    } as unknown as ReturnType<typeof useSession>);
    renderRoute();
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });
});
