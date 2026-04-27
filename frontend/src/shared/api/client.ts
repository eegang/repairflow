import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { useAuth } from "../../features/auth/model/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuth.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      useAuth.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;


