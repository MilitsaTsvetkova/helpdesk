import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketDetails } from "./TicketDetails";

describe("TicketDetails", () => {
  it("renders the subject as a heading", () => {
    render(<TicketDetails subject="Keyboard not working" body="It stopped responding." />);
    expect(screen.getByRole("heading", { name: "Keyboard not working" })).toBeInTheDocument();
  });

  it("renders the message body", () => {
    render(<TicketDetails subject="Subject" body="My keyboard stopped responding." />);
    expect(screen.getByText("My keyboard stopped responding.")).toBeInTheDocument();
  });

  it("renders the Message label", () => {
    render(<TicketDetails subject="Subject" body="Body text" />);
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("preserves whitespace in multi-line bodies", () => {
    render(<TicketDetails subject="Subject" body={"Line one\n\nLine two"} />);
    expect(screen.getByText((_, el) => el?.textContent === "Line one\n\nLine two")).toHaveClass(
      "whitespace-pre-wrap"
    );
  });
});
