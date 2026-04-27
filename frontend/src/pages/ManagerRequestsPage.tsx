import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Filter, User as UserIcon, UserPlus } from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { Button } from "../shared/ui/Button";
import { Card, CardContent } from "../shared/ui/Card";
import { EmptyState } from "../shared/ui/EmptyState";
import { Modal } from "../shared/ui/Modal";
import { Pagination } from "../shared/ui/Pagination";
import { SearchInput } from "../shared/ui/SearchInput";
import { Select } from "../shared/ui/Select";
import { TableSkeleton } from "../shared/ui/Skeleton";
import { StatusBadge } from "../shared/ui/StatusBadge";
import { formatDate } from "../shared/lib/utils";
import { requestsApi, usersApi } from "../services/api";
import type { RepairRequest, Status, User } from "../shared/types";

export default function ManagerRequestsPage() {
  const [requests, setRequests] = useState<RepairRequest[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "">("");
  const [assignModal, setAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RepairRequest | null>(null);
  const [selectedTech, setSelectedTech] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [requestsResponse, techs] = await Promise.all([
        requestsApi.getAll({
          page,
          limit: 10,
          status: statusFilter || undefined,
          search: search || undefined,
          sort: "created_at",
          order: "desc",
        }),
        usersApi.getTechnicians(),
      ]);
      setRequests(requestsResponse.data);
      setTotalPages(requestsResponse.meta.pages || requestsResponse.meta.totalPages || 1);
      setTechnicians(techs);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openAssign = (request: RepairRequest) => {
    setSelectedRequest(request);
    setSelectedTech(request.assigned_to || "");
    setAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedRequest || !selectedTech) return;
    setAssignLoading(true);
    try {
      await requestsApi.assign(selectedRequest.id, selectedTech);
      setAssignModal(false);
      setSelectedRequest(null);
      setSelectedTech("");
      await load();
    } catch (error) {
      console.error(error);
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Все заявки</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Управление заявками сервисного центра</p>
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
                placeholder="Поиск..."
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
                description={search || statusFilter ? "Измените фильтры" : undefined}
                icon={search || statusFilter ? "search" : "inbox"}
              />
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Станок</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Клиент</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Статус</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden md:table-cell">Техник</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider hidden sm:table-cell">Дата</th>
                      <th className="text-right py-3 px-4 font-medium text-neutral-500 text-xs uppercase tracking-wider">Действия</th>
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
                        <td className="py-3 px-4 hidden md:table-cell">
                          {request.assigned_technician_name ? (
                            <span className="text-neutral-700">{request.assigned_technician_name}</span>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              Не назначен
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-neutral-500 hidden sm:table-cell">
                          {formatDate(request.created_at)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openAssign(request)}
                              className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                            >
                              <UserIcon className="h-3 w-3" />
                              Назначить
                            </button>
                            <Link
                              to={`/manager/requests/${request.id}`}
                              className="text-xs text-neutral-500 hover:text-neutral-900"
                            >
                              Подробнее →
                            </Link>
                          </div>
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

        <Modal
          open={assignModal}
          onClose={() => {
            setAssignModal(false);
            setSelectedRequest(null);
            setSelectedTech("");
          }}
          title="Назначить техника"
          size="sm"
        >
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-neutral-900">{selectedRequest.machine_name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedRequest.client_name} · {selectedRequest.machine_type}
                </p>
              </div>

              <Select
                label="Техник"
                placeholder="Выберите техника..."
                options={technicians.map((tech) => ({ value: tech.id, label: tech.full_name }))}
                value={selectedTech}
                onChange={(event) => setSelectedTech(event.target.value)}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAssignModal(false);
                    setSelectedRequest(null);
                    setSelectedTech("");
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleAssign} loading={assignLoading} disabled={!selectedTech}>
                  Назначить
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppLayout>
  );
}


