import axios from "axios";
import { clearAuthToken, getAuthToken } from "./auth";

const baseURL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      clearAuthToken();
    }
    return Promise.reject(err);
  },
);
