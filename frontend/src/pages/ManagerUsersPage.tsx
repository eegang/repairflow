import { useEffect, useState } from "react";
import { Building, Calendar, Mail } from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Card, CardContent } from "../shared/ui/Card";
import { TableSkeleton } from "../shared/ui/Skeleton";
import { formatDate } from "../shared/lib/utils";
import { usersApi } from "../services/api";
import type { User } from "../shared/types";

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersApi
      .getAll()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const roleColors: Record<string, { bg: string; text: string; label: string }> = {
    client: { bg: "#dbeafe", text: "#2563eb", label: "Клиент" },
    manager: { bg: "#ede9fe", text: "#7c3aed", label: "Менеджер" },
    technician: { bg: "#d1fae5", text: "#059669", label: "Техник" },
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Пользователи</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Управление учётными записями</p>
        </div>

        <Card>
          {loading ? (
            <CardContent className="pt-5">
              <TableSkeleton rows={5} />
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                      Пользователь
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                      Роль
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden md:table-cell">
                      Компания
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                      Дата регистрации
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const role = roleColors[user.role];
                    return (
                      <tr
                        key={user.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-9 w-9 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0"
                              style={{
                                backgroundColor:
                                  user.role === "manager"
                                    ? "#8b5cf6"
                                    : user.role === "technician"
                                      ? "#10b981"
                                      : "#3b82f6",
                              }}
                            >
                              {user.full_name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-neutral-900 truncate">{user.full_name}</p>
                              <p className="text-xs text-neutral-500 truncate flex items-center gap-1">
                                <Mail className="h-3 w-3 shrink-0" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                            style={{ backgroundColor: role.bg, color: role.text }}
                          >
                            {role.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-600 hidden md:table-cell">
                          {user.company_name ? (
                            <span className="flex items-center gap-1">
                              <Building className="h-3.5 w-3.5 text-neutral-400" />
                              {user.company_name}
                            </span>
                          ) : (
                            <span className="text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                            {formatDate(user.created_at)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                              user.is_active
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {user.is_active ? "Активен" : "Заблокирован"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}


