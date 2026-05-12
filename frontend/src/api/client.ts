import axios from "axios";
import { useAuthStore } from "../store/authStore";

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL) return envURL.endsWith("/") ? envURL : `${envURL}/`;

  const { protocol, hostname, port } = window.location;

  // In production (Nginx), API is served from the same host under /api/v1/
  if (port === "" || port === "80" || port === "443") {
    return `${protocol}//${hostname}/api/v1/`;
  }

  // Use the same host and port as the current page
  // Nginx will handle routing /api/v1/ to the backend
  return `${protocol}//${hostname}${port ? `:${port}` : ""}/api/v1/`;
};

const baseURL = getBaseURL();

const client = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    const isAuthRequest =
      config.url?.includes("accounts/login/") ||
      config.url?.includes("accounts/register/") ||
      config.url?.includes("accounts/verify-email/") ||
      config.url?.includes("theme/");
    if (!isAuthRequest) {
      console.warn(`[API] No token found for request to ${config.url}`);
    }
  }
  return config;
});

// Catch "False Successes" where the server returns index.html instead of JSON
client.interceptors.response.use(
  (response) => {
    const contentType = response.headers["content-type"];
    if (
      contentType &&
      typeof contentType === "string" &&
      contentType.includes("text/html")
    ) {
      return Promise.reject({
        message: "Received HTML instead of JSON. Check your API URL.",
        response: response,
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          // Use base axios to avoid interceptor loops
          const res = await axios.post(`${baseURL}accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          const newRefresh = res.data.refresh || refreshToken;

          useAuthStore.getState().setTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return client(originalRequest);
        } catch (refreshError) {
          // Refresh token failed or expired
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token available
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default client;
