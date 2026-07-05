import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  totalPages: number;
  total: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, total, itemLabel, onPageChange }: Readonly<Props>) {
  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-500">
        {total} {total === 1 ? itemLabel : `${itemLabel}s`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="bg-transparent"
        >
          Previous
        </Button>
        <span className="text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="bg-transparent"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
