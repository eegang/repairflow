import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Hash,
  History,
  Image,
  MessageSquare,
  Plus,
  User,
  Wrench,
} from "lucide-react";
import { AppLayout } from "../widgets/layout/AppLayout";
import { API_BASE_URL } from "../shared/api/client";
import { Button } from "../shared/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../shared/ui/Card";
import { Modal } from "../shared/ui/Modal";
import { Skeleton } from "../shared/ui/Skeleton";
import { Textarea } from "../shared/ui/Textarea";
import { formatDateTime } from "../shared/lib/utils";
import { auditApi, commentsApi, filesApi, requestsApi } from "../services/api";
import { useAuth } from "../features/auth/model/auth";
import type { Attachment, AuditLog, Comment, RepairRequest, Status } from "../shared/types";

type RequestDetail = RepairRequest & {
  comments?: Comment[];
  audit_logs?: AuditLog[];
};

type Tab = "overview" | "comments" | "history";

const STATUS_TRANSITIONS: Record<Status, Status[]> = {
  new: ["in_progress"],
  in_progress: ["paused", "done"],
  paused: ["in_progress"],
  done: [],
};

const STATUS_LABEL: Record<Status, string> = {
  new: "Новая",
  in_progress: "В процессе",
  paused: "Пауза",
  done: "Готово",
};

const STATUS_COLORS: Record<Status, string> = {
  new: "#3b82f6",
  in_progress: "#f59e0b",
  paused: "#ef4444",
  done: "#10b981",
};

const STATUS_BACKGROUNDS: Record<Status, string> = {
  new: "#eff6ff",
  in_progress: "#fffbeb",
  paused: "#fef2f2",
  done: "#ecfdf5",
};

export default function RequestDetailPage() {
  const { id = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [request, setRequest] = useState<RequestDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [commentText, setCommentText] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Status | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const routePrefix = location.pathname.split("/")[1] || user?.role || "client";

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const requestData = (await requestsApi.getById(id)) as RequestDetail;
      setRequest(requestData);

      const [commentsResult, auditResult, attachmentsResult] = await Promise.allSettled([
        commentsApi.getAll(id),
        auditApi.getLogs(id),
        filesApi.getAll(id),
      ]);

      setComments(
        commentsResult.status === "fulfilled"
          ? commentsResult.value
          : requestData.comments ?? []
      );
      setAuditLog(
        auditResult.status === "fulfilled"
          ? auditResult.value
          : requestData.audit_logs ?? []
      );
      setAttachments(
        attachmentsResult.status === "fulfilled"
          ? attachmentsResult.value
          : requestData.attachments ?? []
      );
    } catch (error: any) {
      console.error(error);
      setRequest(null);
      setComments([]);
      setAuditLog([]);
      setAttachments([]);
      setLoadError(error.response?.data?.detail || "Не удалось загрузить заявку");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const availableTransitions = useMemo(
    () => (request ? STATUS_TRANSITIONS[request.status] : []),
    [request]
  );

  const canChangeStatus = user?.role === "manager" || user?.role === "technician";

  const tabs = [
    { key: "overview" as const, label: "Обзор", icon: Wrench },
    { key: "comments" as const, label: `Комментарии (${comments.length})`, icon: MessageSquare },
    { key: "history" as const, label: "История", icon: History },
  ];

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!commentText.trim()) return;

    setCommentLoading(true);
    try {
      const comment = await commentsApi.create(id, { body: commentText.trim() });
      setComments((prev) => [...prev, comment]);
      setCommentText("");
    } catch (error) {
      console.error(error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) return;

    setStatusLoading(true);
    try {
      const updated = await requestsApi.updateStatus(id, {
        status: newStatus,
        comment: statusComment.trim() || undefined,
      });
      setRequest((prev) => (prev ? { ...prev, ...updated } : updated));
      setStatusModal(false);
      setNewStatus("");
      setStatusComment("");
      await loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-4xl">
          <p className="text-lg text-neutral-500">{loadError || "Заявка не найдена"}</p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => navigate(`/${routePrefix}/requests`)}
          >
            Назад к списку
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/${routePrefix}/requests`}
              className="rounded-lg p-2 -ml-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
                {request.machine_name}
              </h1>
              <p className="mt-0.5 text-sm text-neutral-500">
                {request.machine_type}
                {request.serial_number && ` · ${request.serial_number}`}
              </p>
            </div>
          </div>
          {canChangeStatus && availableTransitions.length > 0 && (
            <Button onClick={() => setStatusModal(true)}>Обновить статус</Button>
          )}
        </div>

        <div
          className="flex items-center gap-4 rounded-xl border p-4"
          style={{
            backgroundColor: STATUS_BACKGROUNDS[request.status],
            borderColor: `${STATUS_COLORS[request.status]}30`,
          }}
        >
          <div
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[request.status] }}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: STATUS_COLORS[request.status] }}>
              {STATUS_LABEL[request.status]}
            </p>
            <p className="mt-0.5 text-xs text-neutral-600">
              Обновлено {formatDateTime(request.updated_at)}
            </p>
          </div>
          {request.assigned_technician_name && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-600">
              <User className="h-3.5 w-3.5" />
              {request.assigned_technician_name}
            </div>
          )}
        </div>

        <div className="border-b border-neutral-200">
          <nav className="flex gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Станок</p>
                    <p className="font-medium text-neutral-900">{request.machine_name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Hash className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Тип</p>
                    <p className="font-medium text-neutral-900">{request.machine_type}</p>
                  </div>
                </div>
                {request.serial_number && (
                  <div className="flex items-start gap-2">
                    <Hash className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                    <div>
                      <p className="text-xs text-neutral-500">Серийный номер</p>
                      <p className="font-medium text-neutral-900">{request.serial_number}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Контактное лицо</p>
                    <p className="font-medium text-neutral-900">{request.contact_person}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                  <div>
                    <p className="text-xs text-neutral-500">Дата создания</p>
                    <p className="font-medium text-neutral-900">{formatDateTime(request.created_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Описание проблемы</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                  {request.description}
                </p>
              </CardContent>
            </Card>

            {request.assigned_technician_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Назначенный техник</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 font-medium text-neutral-600">
                      {request.assigned_technician_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{request.assigned_technician_name}</p>
                      <p className="text-xs text-neutral-500">Техник</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Image className="h-4 w-4" />
                  Файлы ({attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex h-24 items-center justify-center text-sm text-neutral-400">
                    Файлы не прикреплены
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={`${API_BASE_URL}${attachment.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-video overflow-hidden rounded-lg border border-neutral-200 transition-colors hover:border-neutral-400"
                      >
                        <img
                          src={`${API_BASE_URL}${attachment.url}`}
                          alt={attachment.file_name}
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5">
                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <Textarea
                    placeholder="Напишите комментарий..."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" loading={commentLoading} disabled={!commentText.trim()}>
                      <Plus className="h-4 w-4" />
                      Отправить
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {comments.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center text-sm text-neutral-400">
                  Комментариев пока нет
                </CardContent>
              </Card>
            ) : (
              comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start gap-3">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                        style={{
                          backgroundColor:
                            comment.author.role === "manager"
                              ? "#8b5cf6"
                              : comment.author.role === "technician"
                                ? "#10b981"
                                : "#3b82f6",
                        }}
                      >
                        {comment.author.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            {comment.author.full_name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {formatDateTime(comment.created_at)}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                          {comment.body}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {activeTab === "history" && (
          <Card>
            <CardContent className="pt-5">
              {auditLog.length === 0 ? (
                <p className="py-8 text-center text-sm text-neutral-400">История изменений пуста</p>
              ) : (
                <div className="space-y-0">
                  {auditLog.map((log, index) => (
                    <div key={log.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-neutral-300" />
                        {index < auditLog.length - 1 && (
                          <div className="mt-1 w-px flex-1 bg-neutral-200" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pb-6">
                        <p className="text-sm text-neutral-900">
                          <span className="font-medium">{log.actor.full_name}</span>{" "}
                          <span className="text-neutral-500">{log.action}</span>
                        </p>
                        {log.comment && (
                          <p className="mt-1 rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
                            {log.comment}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-neutral-400">
                          {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Modal
          open={statusModal}
          onClose={() => {
            setStatusModal(false);
            setNewStatus("");
            setStatusComment("");
          }}
          title="Обновить статус"
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Новый статус
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableTransitions.map((status) => (
                  <button
                    key={status}
                    onClick={() => setNewStatus(status)}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      newStatus === status
                        ? "bg-neutral-50 ring-1 ring-neutral-900 border-neutral-900"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[status] }}
                      />
                      <span className="text-sm font-medium text-neutral-900">
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {newStatus === "paused" && (
              <Textarea
                label="Комментарий"
                placeholder="Укажите причину остановки..."
                value={statusComment}
                onChange={(event) => setStatusComment(event.target.value)}
                rows={3}
              />
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setStatusModal(false);
                  setNewStatus("");
                  setStatusComment("");
                }}
              >
                Отмена
              </Button>
              <Button onClick={handleStatusChange} loading={statusLoading} disabled={!newStatus}>
                Подтвердить
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}


