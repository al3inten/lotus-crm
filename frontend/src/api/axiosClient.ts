import axios from "axios";

export const TOKEN_STORAGE_KEY = "lotus_crm_token";

// Default to the same-origin "/api" path so requests go through the Vite dev proxy (and,
// in prod, whatever reverse-proxy serves the app) — this avoids a CORS preflight (OPTIONS)
// on every request. Trailing slashes would produce double-slash URLs — normalize them away.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/+$/, "");

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
