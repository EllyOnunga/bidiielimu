import client from "../client";

export const analyticsService = {
  getCorrelation: async () => {
    const response = await client.get("analytics/correlation/");
    return response.data;
  },
  getDetailedAnalytics: async () => {
    const response = await client.get("schools/analytics_detailed/");
    return response.data;
  },
};
