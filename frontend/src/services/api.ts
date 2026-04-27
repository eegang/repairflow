import api from "../shared/api/client";
import {
  AuditApiAdapter,
  AuthApiAdapter,
  AxiosHttpClientAdapter,
  CommentsApiAdapter,
  FilesApiAdapter,
  NotificationsApiAdapter,
  RequestsApiAdapter,
  UsersApiAdapter,
} from "../shared/api/adapters";

const httpClientAdapter = new AxiosHttpClientAdapter(api);

export const authApi = new AuthApiAdapter(httpClientAdapter);
export const requestsApi = new RequestsApiAdapter(httpClientAdapter);
export const commentsApi = new CommentsApiAdapter(httpClientAdapter);
export const filesApi = new FilesApiAdapter(httpClientAdapter);
export const auditApi = new AuditApiAdapter(httpClientAdapter);
export const usersApi = new UsersApiAdapter(httpClientAdapter);
export const notificationsApi = new NotificationsApiAdapter(httpClientAdapter);
