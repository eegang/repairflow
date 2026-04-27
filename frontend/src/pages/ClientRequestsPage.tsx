import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, PlusCircle } from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Button } from "../shared/ui/Button";
import { Card, CardContent } from "../shared/ui/Card";
import { EmptyState } from "../shared/ui/EmptyState";
import { Pagination } from "../shared/ui/Pagination";
import { SearchInput } from "../shared/ui/SearchInput";
import { Select } from "../shared/ui/Select";
import { TableSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { formatDate } from "../shared/lib/utils";
import { requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import type { RepairRequest, Status } from "../shared/types";

export default function ClientRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await requestsApi.getAll({
        client_id: user.id,
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: search || undefined,
        sort: "created_at",
        order: "desc",
      });
      setRequests(response.data);
      setTotalPages(response.meta.pages || response.meta.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, user]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Мои заявки</h1>
            <p className="text-sm text-neutral-500 mt-0.5">
              Все заявки на ремонт вашей организации
            </p>
          </div>
          <Link to="/client/requests/new">
            <Button>
              <PlusCircle className="h-4 w-4" />
              Создать заявку
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="pt-5">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchInput
                value={search}
                onChange={(value) => {
                  setSearch(value);
                  setPage(1);
                }}
                placeholder="Поиск по названию, описанию..."
                className="flex-1"
              />
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-neutral-400 shrink-0" />
                <Select
                  options={[
                    { value: "", label: "Все статусы" },
                    { value: "new", label: "Новая" },
                    { value: "in_progress", label: "В процессе" },
                    { value: "paused", label: "Пауза" },
                    { value: "done", label: "Готово" },
                  ]}
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as Status | "");
                    setPage(1);
                  }}
                />
              </div>
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
                title="Заявок не найдено"
                description={search || statusFilter ? "Попробуйте изменить фильтры" : "Создайте первую заявку"}
                icon={search || statusFilter ? "search" : "inbox"}
                action={
                  !search && !statusFilter ? (
                    <Link to="/client/requests/new">
                      <Button>
                        <PlusCircle className="h-4 w-4" />
                        Создать заявку
                      </Button>
                    </Link>
                  ) : undefined
                }
              />
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Станок</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Тип</th>
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
                        <td className="py-3 px-4 text-neutral-600">{request.machine_type}</td>
                        <td className="py-3 px-4">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link
                            to={`/client/requests/${request.id}`}
                            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            Подробнее →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}


