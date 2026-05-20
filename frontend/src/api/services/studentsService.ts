import client from "../client";

export interface Guardian {
  id?: number;
  first_name: string;
  last_name: string;
  relationship:
    | "FATHER"
    | "MOTHER"
    | "STEP_FATHER"
    | "STEP_MOTHER"
    | "LEGAL_GUARDIAN"
    | "SPONSOR";
  phone_number: string;
  email?: string;
  occupation?: string;
  is_emergency_contact?: boolean;
}

export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  enrollment_date: string;
  gender: "M" | "F" | "O";
  stream?: number;
  is_active: boolean;
  email?: string;
  grade_name?: string;
  stream_name?: string;
  guardians?: Guardian[];
}

export const studentsService = {
  getAll: async (params?: any) => {
    const response = await client.get("students/", { params });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await client.get(`students/${id}/`);
    return response.data;
  },

  create: async (data: Omit<Student, "id" | "school">) => {
    const response = await client.post("students/", data);
    return response.data;
  },

  update: async (id: number, data: Partial<Student>) => {
    const response = await client.patch(`students/${id}/`, data);
    return response.data;
  },

  delete: async (id: string | number) => {
    const response = await client.delete(`students/${id}/`);
    return response.data;
  },

  getMyChildren: async () => {
    const response = await client.get("students/my_children/");
    return response.data;
  },

  getReportCard: async (id: number) => {
    const response = await client.get(`students/${id}/report_card/`);
    return response.data;
  },

  importStudents: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await client.post("students/import/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  importStatus: async (taskId: string) => {
    const response = await client.get(`students/import/status/${taskId}/`);
    return response.data;
  },

  getTemplate: async () => {
    const response = await client.get("students/import/template/", {
      responseType: "blob",
    });
    return response.data;
  },
};


