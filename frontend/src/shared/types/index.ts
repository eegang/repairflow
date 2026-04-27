export type Role = "client" | "manager" | "technician";
export type Status = "new" | "in_progress" | "paused" | "done";

export interface User {
  id: string;
  email: string;
  full_name: string;
  company_name?: string;
  phone?: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RepairRequest {
  id: string;
  client_id: string;
  client_name?: string;
  machine_name: string;
  machine_type: string;
  serial_number?: string;
  description: string;
  contact_person: string;
  status: Status;
  assigned_to?: string;
  assigned_technician_name?: string;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
  attachments?: Attachment[];
}

export interface RequestDetail extends RepairRequest {
  comments?: Comment[];
  audit_logs?: AuditLog[];
}

export interface Comment {
  id: string;
  request_id: string;
  author: {
    id: string;
    full_name: string;
    role: Role;
  };
  body: string;
  is_internal: boolean;
  created_at: string;
}

export interface Attachment {
  id: string;
  request_id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  url: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  request_id: string;
  actor: {
    full_name: string;
    role: Role;
  };
  action: string;
  old_status?: string;
  new_status?: string;
  old_value?: string;
  new_value?: string;
  comment?: string;
  created_at: string;
}

export type NotificationType =
  | "request_created"
  | "technician_assigned"
  | "status_changed"
  | "comment_added"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  request_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface StatusStats {
  new: number;
  in_progress: number;
  paused: number;
  done: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

