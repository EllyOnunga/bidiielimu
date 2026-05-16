import client from "../client";

export const schoolsService = {
  getProfile: async (id: number | string) => {
    const response = await client.get(`schools/${id}/`);
    return response.data;
  },

  updateProfile: async (id: number | string, data: any) => {
    const response = await client.patch(`schools/${id}/`, data);
    return response.data;
  },

  getSettings: async () => {
    const response = await client.get("schools/settings/");
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await client.patch("schools/settings/", data);
    return response.data;
  },

  getAll: async () => {
    const response = await client.get("schools/");
    return response.data;
  },

  getStats: async () => {
    const response = await client.get("schools/super_admin_stats/");
    return response.data;
  },
};
