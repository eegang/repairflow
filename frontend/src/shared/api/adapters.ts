import type { AxiosRequestConfig, AxiosResponse } from "axios";
import type {
  Attachment,
  AuditLog,
  AuthResponse,
  Comment,
  Notification,
  PaginatedResponse,
  RepairRequest,
  RequestDetail,
  StatusStats,
  User,
} from "../types";


export interface HttpClientAdapter {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
}

export class AxiosHttpClientAdapter implements HttpClientAdapter {
  constructor(
    private readonly client: {
      get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
      post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
      patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    }
  ) {}

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData extends LoginData {
  full_name: string;
  company_name?: string;
  phone?: string;
  role?: string;
}

export class AuthApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  login(data: LoginData): Promise<AuthResponse> {
    return this.http.post<AuthResponse>("/auth/login", data);
  }

  register(data: RegisterData): Promise<AuthResponse> {
    return this.http.post<AuthResponse>("/auth/register", data);
  }

  getMe(): Promise<User> {
    return this.http.get<User>("/auth/me");
  }
}

export class RequestsApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  getAll(params: Record<string, unknown> = {}): Promise<PaginatedResponse<RepairRequest>> {
    return this.http.get<PaginatedResponse<RepairRequest>>("/requests", { params });
  }

  getById(id: string): Promise<RequestDetail> {
    return this.http.get<RequestDetail>(`/requests/${id}`);
  }

  create(data: Partial<RepairRequest>): Promise<RepairRequest> {
    return this.http.post<RepairRequest>("/requests", data);
  }

  update(id: string, data: Partial<RepairRequest>): Promise<RepairRequest> {
    return this.http.patch<RepairRequest>(`/requests/${id}`, data);
  }

  updateStatus(id: string, data: { status: string; comment?: string }): Promise<RepairRequest> {
    return this.http.post<RepairRequest>(`/requests/${id}/status`, data);
  }

  assign(id: string, technician_id: string): Promise<RepairRequest> {
    return this.http.post<RepairRequest>(`/requests/${id}/assign`, { technician_id });
  }

  getStats(params: Record<string, unknown> = {}): Promise<StatusStats> {
    return this.http.get<StatusStats>("/requests/stats", { params });
  }
}

export class CommentsApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  getAll(requestId: string): Promise<Comment[]> {
    return this.http.get<Comment[]>(`/requests/${requestId}/comments`);
  }

  create(requestId: string, data: { body: string; is_internal?: boolean }): Promise<Comment> {
    return this.http.post<Comment>(`/requests/${requestId}/comments`, {
      request_id: requestId,
      ...data,
    });
  }
}

export class FilesApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  upload(requestId: string, file: File): Promise<Attachment> {
    const formData = new FormData();
    formData.append("file", file);

    return this.http.post<Attachment>(`/requests/${requestId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  getAll(requestId: string): Promise<Attachment[]> {
    return this.http.get<Attachment[]>(`/requests/${requestId}/attachments`);
  }
}

export class AuditApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  getLogs(requestId: string): Promise<AuditLog[]> {
    return this.http.get<AuditLog[]>(`/requests/${requestId}/audit`);
  }
}

export class UsersApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  getAll(): Promise<User[]> {
    return this.http.get<User[]>("/users");
  }

  getTechnicians(): Promise<User[]> {
    return this.http.get<User[]>("/users/technicians");
  }
}

export class NotificationsApiAdapter {
  constructor(private readonly http: HttpClientAdapter) {}

  getAll(): Promise<Notification[]> {
    return this.http.get<Notification[]>("/notifications");
  }

  getUnreadCount(): Promise<number> {
    return this.http.get<number>("/notifications/unread-count");
  }

  markRead(id: string): Promise<Notification> {
    return this.http.post<Notification>(`/notifications/${id}/read`);
  }

  markAllRead(): Promise<{ success: boolean }> {
    return this.http.post<{ success: boolean }>("/notifications/read-all");
  }
}
