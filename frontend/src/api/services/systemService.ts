import client from "../client";
import axios from "axios";

export interface SystemStatus {
  status: string;
  version: string;
  environment: string;
}

export interface ServiceHealth {
  status: string;
  details: string;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database?: ServiceHealth;
    redis?: ServiceHealth;
    email?: ServiceHealth;
  };
}

export const systemService = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    const response = await client.get<SystemStatus>("ping/");
    return response.data;
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    // The health-check view is located at /health/ (not prefix by /api/v1/)
    const apiBase = client.defaults.baseURL || "";
    const rootUrl = apiBase.replace("/api/v1/", "/health/");
    const token = localStorage.getItem("token");
    const response = await axios.get<SystemHealth>(rootUrl, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  },
};
