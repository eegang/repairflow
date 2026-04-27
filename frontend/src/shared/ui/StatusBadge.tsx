import { STATUS_CONFIG } from "../lib/constants";
import { cn } from "../lib/utils";
import type { Status } from "../types";

export function StatusBadge({
  status,
  size = "sm",
}: {
  status: Status;
  size?: "sm" | "md";
}) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full",
        size === "sm" && "text-xs px-2.5 py-0.5",
        size === "md" && "text-sm px-3 py-1"
      )}
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}


