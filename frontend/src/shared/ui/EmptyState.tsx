import type { ReactNode } from "react";
import { FolderOpen, Inbox, SearchX } from "lucide-react";
import { cn } from "../lib/utils";

export function EmptyState({
  title = "Ничего не найдено",
  description = "Попробуйте изменить параметры поиска",
  action,
  icon = "inbox",
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: "folder" | "search" | "inbox";
  className?: string;
}) {
  const icons = {
    folder: FolderOpen,
    search: SearchX,
    inbox: Inbox,
  };
  const Icon = icons[icon];

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center", className)}>
      <Icon className="h-12 w-12 text-neutral-300 mb-4" />
      <h3 className="text-base font-medium text-neutral-900 mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}


