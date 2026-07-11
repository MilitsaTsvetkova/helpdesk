import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketDetailSkeleton } from "./TicketDetailSkeleton";

describe("TicketDetailSkeleton", () => {
  it("renders skeleton placeholders", () => {
    render(<TicketDetailSkeleton />);
    expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("renders a two-column layout matching the loaded ticket view", () => {
    const { container } = render(<TicketDetailSkeleton />);
    expect(container.querySelector(".grid-cols-\\[1fr_260px\\]")).toBeInTheDocument();
  });
});
