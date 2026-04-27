import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  PauseCircle,
  PlusCircle,
} from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Button } from "../shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/ui/Card";
import { EmptyState } from "../shared/ui/EmptyState";
import { CardSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { STATUS_CONFIG } from "../shared/lib/constants";
import { formatDate } from "../shared/lib/utils";
import { requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import type { RepairRequest, StatusStats } from "../shared/types";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [recent, setRecent] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [statsResponse, requestsResponse] = await Promise.all([
          requestsApi.getStats({ filter_id: user.id, filter_type: "client" }),
          requestsApi.getAll({ client_id: user.id, page: 1, limit: 5 }),
        ]);
        setStats(statsResponse);
        setRecent(requestsResponse.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Обзор</h1>
            <p className="text-sm text-neutral-500 mt-0.5">Сводка по заявкам вашей организации</p>
          </div>
          <Link to="/client/requests/new">
            <Button>
              <PlusCircle className="h-4 w-4" />
              Создать заявку
            </Button>
          </Link>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Последние заявки</CardTitle>
            <Link
              to="/client/requests"
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
                  <div
                    key={index}
                    className="flex gap-4 items-center py-3 border-b border-neutral-100 last:border-0"
                  >
                    <div className="skeleton h-4 w-20" />
                    <div className="skeleton h-6 w-24 rounded-full" />
                    <div className="skeleton h-4 w-32" />
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                title="Заявок пока нет"
                description="Создайте первую заявку на ремонт"
                icon="inbox"
                action={
                  <Link to="/client/requests/new">
                    <Button>
                      <PlusCircle className="h-4 w-4" />
                      Создать заявку
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                        Станок
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider">
                        Статус
                      </th>
                      <th className="text-left py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">
                        Дата
                      </th>
                      <th className="text-right py-3 px-2 font-medium text-neutral-500 text-xs uppercase tracking-wider" />
                    </tr>
                  </thead>
                  <tbody>
                    {recent.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-3 px-2 font-medium text-neutral-900">{request.machine_name}</td>
                        <td className="py-3 px-2">
                          <StatusBadge status={request.status} />
                        </td>
                        <td className="py-3 px-2 text-neutral-500 hidden sm:table-cell">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <Link
                            to={`/client/requests/${request.id}`}
                            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
                          >
                            Подробнее
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


