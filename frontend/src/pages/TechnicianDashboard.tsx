import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, Clock, PauseCircle, Wrench } from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/ui/Card";
import { EmptyState } from "../shared/ui/EmptyState";
import { CardSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { STATUS_CONFIG } from "../shared/lib/constants";
import { formatDate } from "../shared/lib/utils";
import { requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import type { RepairRequest, StatusStats } from "../shared/types";

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<StatusStats | null>(null);
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [statsResponse, requestsResponse] = await Promise.all([
          requestsApi.getStats({ filter_id: user.id, filter_type: "technician" }),
          requestsApi.getAll({
            assigned_to: user.id,
            page: 1,
            limit: 10,
            sort: "created_at",
            order: "desc",
          }),
        ]);
        setStats(statsResponse);
        setRequests(requestsResponse.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const statCards = [
    {
      key: "in_progress" as const,
      label: "В процессе",
      icon: Clock,
      color: STATUS_CONFIG.in_progress.color,
    },
    { key: "paused" as const, label: "На паузе", icon: PauseCircle, color: STATUS_CONFIG.paused.color },
    { key: "done" as const, label: "Выполнено", icon: CheckCircle, color: STATUS_CONFIG.done.color },
  ];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Панель техника</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Ваши назначенные заявки</p>
        </div>

        {loading ? (
          <CardSkeleton count={3} />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Мои заявки
            </CardTitle>
            <Link
              to="/technician/requests"
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
                  <div key={index} className="flex gap-4 items-center">
                    <div className="skeleton h-4 w-36" />
                    <div className="skeleton h-6 w-20 rounded-full" />
                    <div className="skeleton h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                title="Нет назначенных заявок"
                description="Ожидайте назначения от менеджера"
                icon="inbox"
              />
            ) : (
              <div className="space-y-2">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    to={`/technician/requests/${request.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-neutral-100 hover:bg-neutral-50 hover:border-neutral-200 transition-all"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900 truncate">{request.machine_name}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {request.client_name} · {request.machine_type} · {formatDate(request.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <StatusBadge status={request.status} />
                      <span className="text-neutral-400">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}


