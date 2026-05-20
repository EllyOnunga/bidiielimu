import client from "../client";

export interface DisciplineIncident {
  id: string;
  student: string;
  student_name: string;
  reported_by: string;
  reported_by_name: string;
  date: string;
  category: "MINOR" | "MAJOR" | "SEVERE";
  summary: string;
  description: string;
  action_taken?: string;
  status: "PENDING" | "RESOLVED" | "APPEALED" | "CANCELLED";
  created_at: string;
  updated_at: string;
}

export const disciplineService = {
  getIncidents: async (params?: any) => {
    const response = await client.get("discipline/incidents/", { params });
    return response.data;
  },
  getIncident: async (id: string) => {
    const response = await client.get(`discipline/incidents/${id}/`);
    return response.data;
  },
  createIncident: async (data: Partial<DisciplineIncident>) => {
    const response = await client.post("discipline/incidents/", data);
    return response.data;
  },
  updateIncident: async (id: string, data: Partial<DisciplineIncident>) => {
    const response = await client.patch(`discipline/incidents/${id}/`, data);
    return response.data;
  },
  deleteIncident: async (id: string) => {
    const response = await client.delete(`discipline/incidents/${id}/`);
    return response.data;
  },
};

export default disciplineService;
