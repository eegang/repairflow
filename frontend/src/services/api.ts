import api from "../shared/api/client";
import type { RepairRequest } from "../shared/types";

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

export const authApi = {
  async login(data: LoginData) {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterData) {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  async getMe() {
    const response = await api.get("/auth/me");
    return response.data;
  },
};

export const requestsApi = {
  async getAll(params: Record<string, any> = {}) {
    const response = await api.get("/requests", { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/requests/${id}`);
    return response.data;
  },

  async create(data: Partial<RepairRequest>) {
    const response = await api.post("/requests", data);
    return response.data;
  },

  async update(id: string, data: Partial<RepairRequest>) {
    const response = await api.patch(`/requests/${id}`, data);
    return response.data;
  },

  async updateStatus(id: string, data: { status: string; comment?: string }) {
    const response = await api.post(`/requests/${id}/status`, data);
    return response.data;
  },

  async assign(id: string, technician_id: string) {
    const response = await api.post(`/requests/${id}/assign`, { technician_id });
    return response.data;
  },

  async getStats(params: Record<string, any> = {}) {
    const response = await api.get("/requests/stats", { params });
    return response.data;
  },
};

export const commentsApi = {
  async getAll(requestId: string) {
    const response = await api.get(`/requests/${requestId}/comments`);
    return response.data;
  },

  async create(requestId: string, data: { body: string; is_internal?: boolean }) {
    const response = await api.post(`/requests/${requestId}/comments`, {
      request_id: requestId,
      ...data,
    });
    return response.data;
  },
};

export const filesApi = {
  async upload(requestId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post(`/requests/${requestId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  async getAll(requestId: string) {
    const response = await api.get(`/requests/${requestId}/attachments`);
    return response.data;
  },
};

export const auditApi = {
  async getLogs(requestId: string) {
    const response = await api.get(`/requests/${requestId}/audit`);
    return response.data;
  },
};

export const usersApi = {
  async getAll() {
    const response = await api.get("/users");
    return response.data;
  },

  async getTechnicians() {
    const response = await api.get("/users/technicians");
    return response.data;
  },
};

export const notificationsApi = {
  async getAll() {
    const response = await api.get("/notifications");
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data;
  },

  async markRead(id: string) {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllRead() {
    const response = await api.post("/notifications/read-all");
    return response.data;
  },
};

