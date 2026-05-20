import client from "../client";

export const hrService = {
  getStaffProfiles: async (params?: any) => {
    const response = await client.get("hr/staff/", { params });
    return response.data;
  },

  getPayrollStats: async () => {
    const response = await client.get("hr/payroll/stats/");
    return response.data;
  },

  getRecentLeaveRequests: async () => {
    const response = await client.get("hr/leave/recent/");
    return response.data;
  },

  createStaffProfile: async (data: any) => {
    const response = await client.post("hr/staff/", data);
    return response.data;
  },

  updateStaffProfile: async (id: number, data: any) => {
    const response = await client.patch(`hr/staff/${id}/`, data);
    return response.data;
  },

  runPayroll: async () => {
    const response = await client.post("hr/payroll/run_payroll/");
    return response.data;
  },
};
