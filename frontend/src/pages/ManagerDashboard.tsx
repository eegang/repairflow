import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  PauseCircle,
  Users,
  Wrench,
} from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/ui/Card";
import { CardSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { STATUS_CONFIG } from "../shared/lib/constants";
import { formatDate } from "../shared/lib/utils";
import { requestsApi, usersApi } from "../services/api";
import type { RepairRequest, StatusStats, User } from "../shared/types";

export default function ManagerDashboard() {
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [unassigned, setUnassigned] = useState<RepairRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsResponse, allRequests, newRequests, allUsers] = await Promise.all([
          requestsApi.getStats(),
          requestsApi.getAll({ page: 1, limit: 5, sort: "created_at", order: "desc" }),
          requestsApi.getAll({ status: "new", limit: 5 }),
          usersApi.getAll(),
        ]);
        setStats(statsResponse);
        setRequests(allRequests.data);
        setUnassigned(newRequests.data.filter((item: RepairRequest) => !item.assigned_to));
        setUsers(allUsers);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const technicians = useMemo(
    () => users.filter((user) => user.role === "technician"),
    [users]
  );

  const techWorkload = useMemo(
    () =>
      technicians.map((tech) => ({
        ...tech,
        activeCount:
          requests.filter((request) => request.assigned_to === tech.id && request.status !== "done")
            .length || 0,
      })),
    [requests, technicians]
  );

  const statCards = [
    { key: "new" as const, label: "Новые", icon: FileText, color: STATUS_CONFIG.new.color },
    {
      key: "in_progress" as const,
      label: "В процессе",
      icon: Clock,
      color: STATUS_CONFIG.in_progress.color,
    },
    { key: "paused" as const, label: "На паузе", icon: PauseCircle, color: STATUS_CONFIG.paused.color },
    { key: "done" as const, label: "Готово", icon: CheckCircle, color: STATUS_CONFIG.done.color },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Панель менеджера</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Управление заявками и техниками</p>
        </div>

        {loading ? (
          <CardSkeleton count={4} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <Card key={card.key} className="relative overflow-hidden">
                <div
                  className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10"
                  style={{ backgroundColor: card.color }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <card.icon className="h-4 w-4" style={{ color: card.color }} />
                    <CardTitle className="text-sm font-medium text-neutral-600">{card.label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold" style={{ color: card.color }}>
                    {stats[card.key]}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Без техника
              </CardTitle>
              <Link
                to="/manager/requests"
                className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
              >
                Все
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="skeleton h-4 w-32" />
                      <div className="skeleton h-6 w-16 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : unassigned.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Все заявки назначены</p>
              ) : (
                <div className="space-y-2">
                  {unassigned.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900 truncate">{request.machine_name}</p>
                        <p className="text-xs text-neutral-500">
                          {request.client_name} · {formatDate(request.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <StatusBadge status={request.status} />
                        <Link
                          to={`/manager/requests/${request.id}`}
                          className="text-xs text-neutral-500 hover:text-neutral-900 shrink-0"
                        >
                          Открыть →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Загрузка техников
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="skeleton h-9 w-9 rounded-full" />
                      <div className="skeleton h-4 w-24" />
                    </div>
                  ))}
                </div>
              ) : technicians.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Нет техников</p>
              ) : (
                <div className="space-y-2">
                  {techWorkload.map((tech) => (
                    <div
                      key={tech.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-neutral-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-medium">
                          {tech.full_name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{tech.full_name}</p>
                          <p className="text-xs text-neutral-500">Техник</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-semibold text-neutral-900">
                          {tech.activeCount} активных
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последние заявки</CardTitle>
            <Link
              to="/manager/requests"
              className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
            >
              Все заявки
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex gap-4 items-center">
                    <div className="skeleton h-4 w-36" />
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                        Станок
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                        Клиент
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden md:table-cell">
                        Техник
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                        Дата
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider" />
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-neutral-900">{request.machine_name}</td>
                        <td className="py-3 px-2 text-neutral-600 hidden sm:table-cell">{request.client_name}</td>
                        <td className="py-3 px-2">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="py-3 px-2 text-neutral-600 hidden md:table-cell">
                          {request.assigned_technician_name || (
                            <span className="text-amber-600 text-xs font-medium">Не назначен</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-neutral-500 hidden sm:table-cell">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link
                            to={`/manager/requests/${request.id}`}
                            className="text-sm text-neutral-500 hover:text-neutral-900"
                          >
                            →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


