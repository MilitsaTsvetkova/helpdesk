import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TicketReplyForm } from "./TicketReplyForm";

function renderForm(overrides: Partial<React.ComponentProps<typeof TicketReplyForm>> = {}) {
  const textareaRef = createRef<HTMLTextAreaElement>();
  const onReplyBodyChange = vi.fn();
  const onSendReply = vi.fn();
  render(
    <TicketReplyForm
      replyBody=""
      onReplyBodyChange={onReplyBodyChange}
      onSendReply={onSendReply}
      isPending={false}
      isError={false}
      textareaRef={textareaRef}
      {...overrides}
    />
  );
  return { onReplyBodyChange, onSendReply };
}

describe("TicketReplyForm", () => {
  it("renders the textarea and send button", () => {
    renderForm();
    expect(screen.getByPlaceholderText("Write a reply…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reply" })).toBeInTheDocument();
  });

  it("disables the send button when the reply body is empty", () => {
    renderForm({ replyBody: "" });
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });

  it("disables the send button when the reply body is only whitespace", () => {
    renderForm({ replyBody: "   " });
    expect(screen.getByRole("button", { name: "Send reply" })).toBeDisabled();
  });

  it("enables the send button when the reply body has content", () => {
    renderForm({ replyBody: "Thanks for reaching out" });
    expect(screen.getByRole("button", { name: "Send reply" })).toBeEnabled();
  });

  it("calls onReplyBodyChange when typing in the textarea", async () => {
    const user = userEvent.setup();
    const { onReplyBodyChange } = renderForm();
    await user.type(screen.getByPlaceholderText("Write a reply…"), "H");
    expect(onReplyBodyChange).toHaveBeenCalledWith("H");
  });

  it("calls onSendReply when the send button is clicked", async () => {
    const user = userEvent.setup();
    const { onSendReply } = renderForm({ replyBody: "Thanks for reaching out" });
    await user.click(screen.getByRole("button", { name: "Send reply" }));
    expect(onSendReply).toHaveBeenCalled();
  });

  it("calls onSendReply on Cmd+Enter when the reply body has content", async () => {
    const user = userEvent.setup();
    const { onSendReply } = renderForm({ replyBody: "Thanks for reaching out" });
    screen.getByPlaceholderText("Write a reply…").focus();
    await user.keyboard("{Meta>}{Enter}{/Meta}");
    expect(onSendReply).toHaveBeenCalled();
  });

  it("does not call onSendReply on Enter alone", async () => {
    const user = userEvent.setup();
    const { onSendReply } = renderForm({ replyBody: "Thanks for reaching out" });
    screen.getByPlaceholderText("Write a reply…").focus();
    await user.keyboard("{Enter}");
    expect(onSendReply).not.toHaveBeenCalled();
  });

  it("shows 'Sending…' and disables the button while pending", () => {
    renderForm({ replyBody: "Thanks for reaching out", isPending: true });
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  });

  it("shows an error message when isError is true", () => {
    renderForm({ isError: true });
    expect(screen.getByText("Failed to send reply")).toBeInTheDocument();
  });

  it("does not show an error message when isError is false", () => {
    renderForm({ isError: false });
    expect(screen.queryByText("Failed to send reply")).not.toBeInTheDocument();
  });
});
