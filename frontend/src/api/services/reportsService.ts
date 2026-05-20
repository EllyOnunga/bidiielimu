import client from "../client";

export interface StudentReportData {
  id: number;
  student: number;
  exam: number;
  term: number;
  academic_year: number;
  ai_comment_draft?: string;
  teacher_comment?: string;
  principal_comment?: string;
  status: "DRAFT" | "REVIEWED" | "APPROVED" | "PUBLISHED";
  is_ai_generated: boolean;
  generated_at?: string;
  reviewed_by?: number;
}

export const reportsService = {
  getReports: async (params?: { student?: number; exam?: number }) => {
    const response = await client.get("reports/student-reports/", { params });
    return response.data;
  },

  getReportById: async (id: number) => {
    const response = await client.get(`reports/student-reports/${id}/`);
    return response.data;
  },

  createReport: async (data: Partial<StudentReportData>) => {
    const response = await client.post("reports/student-reports/", data);
    return response.data;
  },

  updateReport: async (id: number, data: Partial<StudentReportData>) => {
    const response = await client.patch(`reports/student-reports/${id}/`, data);
    return response.data;
  },

  approveReport: async (id: number, teacherComment: string) => {
    const response = await client.post(
      `reports/student-reports/${id}/approve/`,
      {
        teacher_comment: teacherComment,
      },
    );
    return response.data;
  },

  generateAIDraft: async (id: number) => {
    const response = await client.post(
      `reports/student-reports/${id}/generate_ai_draft/`,
    );
    return response.data;
  },
};
