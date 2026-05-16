import client from "../client";

export const auditService = {
  getLogs: async (search?: string) => {
    const response = await client.get("audit/logs/", {
      params: { search },
    });
    return response.data;
  },

  getStats: async () => {
    const response = await client.get("audit/logs/stats/");
    return response.data;
  },
};
