import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter } from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Card, CardContent } from "../shared/ui/Card";
import { EmptyState } from "../shared/ui/EmptyState";
import { Select } from "../shared/ui/Select";
import { TableSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { formatDate } from "../shared/lib/utils";
import { requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import type { RepairRequest, Status } from "../shared/types";

export default function TechnicianRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | "">("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await requestsApi.getAll({
        assigned_to: user.id,
        page: 1,
        limit: 50,
        status: statusFilter || undefined,
        sort: "created_at",
        order: "desc",
      });
      setRequests(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Мои заявки</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Заявки, назначенные на вас</p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 max-w-xs">
              <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
              <Select
                options={[
                  { value: "", label: "Все статусы" },
                  { value: "in_progress", label: "В процессе" },
                  { value: "paused", label: "Пауза" },
                  { value: "done", label: "Готово" },
                ]}
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as Status | "")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          {loading ? (
            <CardContent className="pt-5">
              <TableSkeleton rows={5} />
            </CardContent>
          ) : requests.length === 0 ? (
            <CardContent className="pt-5">
              <EmptyState
                title="Нет заявок"
                description="Ожидайте назначения от менеджера"
                icon="inbox"
              />
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Станок</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Клиент</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Статус</th>
                    <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Дата</th>
                    <th className="text-right py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider" />
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr
                      key={request.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-neutral-900">{request.machine_name}</td>
                      <td className="py-3 px-4 text-neutral-600 hidden sm:table-cell">{request.client_name}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">
                        {formatDate(request.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/technician/requests/${request.id}`}
                          className="text-sm text-neutral-500 hover:text-neutral-900"
                        >
                          Открыть →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}


