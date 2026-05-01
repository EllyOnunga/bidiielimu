import client from '../client';

export interface Exam {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_published: boolean;
  term: string;
}

export const examsService = {
  getExams: async (search?: string) => {
    const response = await client.get('exams/exams/', { params: { search } });
    return response.data;
  },

  getAnalytics: async () => {
    const response = await client.get('exams/exams/analytics/');
    return response.data;
  },

  createExam: async (data: Omit<Exam, 'id' | 'is_published'>) => {
    const response = await client.post('exams/exams/', data);
    return response.data;
  },

  deleteExam: async (id: number) => {
    const response = await client.delete(`exams/exams/${id}/`);
    return response.data;
  },

  getGradingSystems: async (search?: string) => {
    const response = await client.get('exams/grading-systems/', { params: { search } });
    return response.data;
  },

  createGradingSystem: async (data: { name: string }) => {
    const response = await client.post('exams/grading-systems/', data);
    return response.data;
  },

  createThreshold: async (data: any) => {
    const response = await client.post('exams/thresholds/', data);
    return response.data;
  },

  deleteThreshold: async (id: number) => {
    const response = await client.delete(`exams/thresholds/${id}/`);
    return response.data;
  }
};
