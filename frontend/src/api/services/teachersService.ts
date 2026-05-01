import client from '../client';

export interface Teacher {
  id: number;
  employee_id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  specialization: string;
  is_active: boolean;
  email?: string;
  joining_date?: string;
}

export const teachersService = {
  getAll: async (search?: string) => {
    const response = await client.get('teachers/', { params: { search } });
    return response.data;
  },

  bulkUpload: async (formData: FormData) => {
    const response = await client.post('teachers/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getById: async (id: number) => {
    const response = await client.get(`teachers/${id}/`);
    return response.data;
  },

  create: async (data: Omit<Teacher, 'id' | 'name' | 'is_active'> & { password?: string }) => {
    const response = await client.post('teachers/', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Teacher>) => {
    const response = await client.patch(`teachers/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    const response = await client.delete(`teachers/${id}/`);
    return response.data;
  }
};
