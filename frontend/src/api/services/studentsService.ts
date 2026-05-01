import client from '../client';

export interface Student {
  id: number;
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  stream?: number;
  parent_name: string;
  parent_phone: string;
  parent_email?: string;
  is_active: boolean;
  school: number;
  grade_name?: string;
  stream_name?: string;
}

export const studentsService = {
  getAll: async (search?: string) => {
    const response = await client.get('students/', { params: { search } });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await client.get(`students/${id}/`);
    return response.data;
  },

  create: async (data: Omit<Student, 'id' | 'school'>) => {
    const response = await client.post('students/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Student>) => {
    const response = await client.patch(`students/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await client.delete(`students/${id}/`);
    return response.data;
  },

  getReportCard: async (id: number) => {
    const response = await client.get(`students/${id}/report_card/`);
    return response.data;
  }
};
