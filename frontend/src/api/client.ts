import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "../store/authStore";

const getBaseURL = () => {
  const envURL = import.meta.env.VITE_API_URL;
  if (envURL && envURL.startsWith("http") && !envURL.includes("localhost")) {
    return envURL.endsWith("/") ? envURL : `${envURL}/`;
  }

  const { protocol, hostname, port } = window.location;

  // Strict subdomain detection for multi-tenancy
  // const hostParts = hostname.split(".");
  // if (hostname.endsWith(".localhost") && hostParts.length === 2) {
  //   // tenantName = hostParts[0];
  // } else if (hostParts.length > 2 && !["www", "api", "app"].includes(hostParts[0])) {
  //   // tenantName = hostParts[0];
  // }

  const envBase = import.meta.env.VITE_API_BASE;
  const host =
    envBase ||
    `${protocol}//${hostname}${
      port && port !== "80" && port !== "443" ? `:${port}` : ""
    }`;

  // Since we use subdomains, we don't need subfolder prefixes in the URL
  return `${host}/api/v1/`;
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
  }
  return config;
});

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

    // 1. Handle Security/Tenant Violations (403)
    if (error.response?.status === 403) {
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        "Access Denied";
      toast.error(`Security Alert: ${message}`, {
        id: "security-error",
        duration: 5000,
        icon: "🛡️",
      });
      // Optionally redirect if it's a persistent tenant mismatch
      if (message.toLowerCase().includes("tenant")) {
        // window.location.href = "/";
      }
    }

    // 2. Handle Token Expiration (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(`${baseURL}accounts/token/refresh/`, {
            refresh: refreshToken,
          });
          const newAccess = res.data.access;
          const newRefresh = res.data.refresh || refreshToken;

          useAuthStore.getState().setTokens(newAccess, newRefresh);
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;

          return client(originalRequest);
        } catch (refreshError) {
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    // 3. Handle Server Errors (500)
    if (error.response?.status >= 500) {
      toast.error(
        "Systems Offline: We are experiencing technical difficulties. Please try again later.",
        {
          id: "server-error",
        },
      );
    }

    return Promise.reject(error);
  },
);

export default client;
