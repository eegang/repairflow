import { useMemo, useState, type ElementType, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  PlusCircle,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { NotificationBell } from "../../shared/ui/NotificationBell";
import { ROLE_LABEL, ROLE_ROUTE } from "../../shared/lib/constants";
import { cn } from "../../shared/lib/utils";
import { useAuth } from "../../features/auth/model/auth";

type NavItem = {
  label: string;
  href: string;
  icon: ElementType;
};

const navMap: Record<string, NavItem[]> = {
  client: [
    { label: "Обзор", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "Мои заявки", href: "/client/requests", icon: ListChecks },
    { label: "Создать заявку", href: "/client/requests/new", icon: PlusCircle },
  ],
  manager: [
    { label: "Обзор", href: "/manager/dashboard", icon: LayoutDashboard },
    { label: "Все заявки", href: "/manager/requests", icon: ListChecks },
    { label: "Пользователи", href: "/manager/users", icon: Users },
  ],
  technician: [
    { label: "Обзор", href: "/technician/dashboard", icon: LayoutDashboard },
    { label: "Мои заявки", href: "/technician/requests", icon: ListChecks },
  ],
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const items = useMemo(() => (user ? navMap[user.role] || [] : []), [user]);

  if (!user) {
    return <>{children}</>;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="h-16 flex items-center px-6 border-b border-neutral-200">
          <Wrench className="h-5 w-5 mr-2.5 text-neutral-900" />
          <span className="text-base font-bold tracking-tight">RepairFlow</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-neutral-200 space-y-3">
          <div className="px-3">
            <p className="text-sm font-medium text-neutral-900 truncate">{user.full_name}</p>
            <p className="text-xs text-neutral-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-500 hover:text-red-600 transition-colors w-full rounded-lg hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full",
                user.role === "client" && "bg-blue-50 text-blue-700",
                user.role === "manager" && "bg-purple-50 text-purple-700",
                user.role === "technician" && "bg-emerald-50 text-emerald-700"
              )}
            >
              {ROLE_LABEL[user.role]}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

export function roleHome(role: keyof typeof ROLE_ROUTE) {
  return ROLE_ROUTE[role];
}


