import client from "../client";

export const lmsService = {
  getQuizzes: async (params?: { stream?: string | number }) => {
    const response = await client.get("lms/quizzes/", { params });
    return response.data;
  },

  getQuiz: async (id: number | string) => {
    const response = await client.get(`lms/quizzes/${id}/`);
    return response.data;
  },

  updateQuiz: async (id: number | string, data: any) => {
    const response = await client.patch(`lms/quizzes/${id}/`, data);
    return response.data;
  },

  createQuiz: async (data: any) => {
    const response = await client.post("lms/quizzes/", data);
    return response.data;
  },

  getResources: async (params?: { stream?: string | number }) => {
    const response = await client.get("lms/resources/", { params });
    return response.data;
  },

  getAssignments: async () => {
    const response = await client.get("lms/assignments/");
    return response.data;
  },

  submitQuiz: async (id: number | string, answers: any) => {
    const response = await client.post(`lms/quizzes/${id}/attempt/`, {
      answers,
    });
    return response.data;
  },

  createResource: async (formData: FormData) => {
    const response = await client.post("lms/resources/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  getSubmissions: async (assignmentId: string) => {
    const response = await client.get(
      `lms/student-submissions/?assignment=${assignmentId}`,
    );
    return response.data;
  },

  gradeSubmission: async (data: any) => {
    const response = await client.post("lms/assignments/grade/", data);
    return response.data;
  },

  createAssignment: async (formData: FormData) => {
    const response = await client.post("lms/assignments/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  submitAssignment: async (id: string, formData: FormData) => {
    const response = await client.post(
      `lms/assignments/${id}/submit/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );
    return response.data;
  },

  getDiscussions: async (params?: any) => {
    const response = await client.get("lms/discussions/", { params });
    return response.data;
  },

  createDiscussion: async (data: any) => {
    const response = await client.post("lms/discussions/", data);
    return response.data;
  },

  deleteDiscussion: async (id: string | number) => {
    const response = await client.delete(`lms/discussions/${id}/`);
    return response.data;
  },
};
