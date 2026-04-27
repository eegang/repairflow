import type { Role, Status } from "../types";

export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string }
> = {
  new: { label: "Новая", color: "#3b82f6", bg: "#eff6ff" },
  in_progress: { label: "В процессе", color: "#f59e0b", bg: "#fffbeb" },
  paused: { label: "Пауза", color: "#ef4444", bg: "#fef2f2" },
  done: { label: "Готово", color: "#10b981", bg: "#ecfdf5" },
};

export const ROLE_LABEL: Record<Role, string> = {
  client: "Клиент",
  manager: "Менеджер",
  technician: "Техник",
};

export const ROLE_ROUTE: Record<Role, string> = {
  client: "/client/dashboard",
  manager: "/manager/dashboard",
  technician: "/technician/dashboard",
};

