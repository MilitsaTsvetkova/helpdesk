import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Pagination } from "./Pagination";

function renderPagination(overrides: Partial<React.ComponentProps<typeof Pagination>> = {}) {
  const onPageChange = vi.fn();
  render(
    <Pagination
      page={2}
      totalPages={3}
      total={25}
      itemLabel="ticket"
      onPageChange={onPageChange}
      {...overrides}
    />
  );
  return { onPageChange };
}

describe("Pagination", () => {
  it("renders the total count pluralized", () => {
    renderPagination({ total: 25 });
    expect(screen.getByText("25 tickets")).toBeInTheDocument();
  });

  it("renders the total count as singular when there is exactly one item", () => {
    renderPagination({ total: 1 });
    expect(screen.getByText("1 ticket")).toBeInTheDocument();
  });

  it("renders the current page and total pages", () => {
    renderPagination({ page: 2, totalPages: 3 });
    expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
  });

  it("disables Previous on the first page", () => {
    renderPagination({ page: 1, totalPages: 3 });
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
  });

  it("enables Previous when not on the first page", () => {
    renderPagination({ page: 2, totalPages: 3 });
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("disables Next on the last page", () => {
    renderPagination({ page: 3, totalPages: 3 });
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("enables Next when not on the last page", () => {
    renderPagination({ page: 2, totalPages: 3 });
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("calls onPageChange with page - 1 when Previous is clicked", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ page: 2, totalPages: 3 });
    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("calls onPageChange with page + 1 when Next is clicked", async () => {
    const user = userEvent.setup();
    const { onPageChange } = renderPagination({ page: 2, totalPages: 3 });
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
