import client from "../client";

export const hrService = {
  getStaffProfiles: async (params?: any) => {
    const response = await client.get("hr/staff-profiles/", { params });
    return response.data;
  },

  getPayrollStats: async () => {
    const response = await client.get("hr/payroll-records/stats/");
    return response.data;
  },

  getRecentLeaveRequests: async () => {
    const response = await client.get("hr/leave-requests/recent/");
    return response.data;
  },

  createStaffProfile: async (data: any) => {
    const response = await client.post("hr/staff-profiles/", data);
    return response.data;
  },

  updateStaffProfile: async (id: number, data: any) => {
    const response = await client.patch(`hr/staff-profiles/${id}/`, data);
    return response.data;
  },
};
