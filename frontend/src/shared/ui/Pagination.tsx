import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex items-center justify-between gap-4 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
      >
        <ChevronLeft className="h-4 w-4" />
        Назад
      </button>

      <div className="flex items-center gap-1 flex-wrap justify-center">
        {pages.map((item) => (
          <button
            key={item}
            onClick={() => onPageChange(item)}
            className={cn(
              "h-9 min-w-9 rounded-lg px-3 text-sm transition-colors",
              item === page
                ? "bg-neutral-900 text-white"
                : "text-neutral-600 hover:bg-neutral-100"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:pointer-events-none"
      >
        Вперёд
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}


