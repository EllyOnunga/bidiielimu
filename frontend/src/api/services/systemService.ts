import client from "../client";

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
    // The health-check view is located at /health/ (not prefixed by /api/v1/)
    const apiBase = client.defaults.baseURL || "";
    const rootUrl = apiBase.replace("/api/v1/", "/health/");
    const response = await client.get<SystemHealth>(rootUrl);
    return response.data;
  },
};
