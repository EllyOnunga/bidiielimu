import client from '../client';

export interface Stream {
  id: number;
  name: string;
  grade_level: number;
  grade_level_name: string;
  teacher_name: string | null;
  student_count: number;
}

export interface GradeLevel {
  id: number;
  name: string;
  student_count: number;
  streams: Stream[];
}

export const classesService = {
  getGrades: async (search?: string) => {
    const response = await client.get('classes/grades/', { params: { search } });
    return response.data;
  },

  createGrade: async (data: { name: string }) => {
    const response = await client.post('classes/grades/', data);
    return response.data;
  },

  createStream: async (data: { grade_level: number; name: string }) => {
    const response = await client.post('classes/streams/', data);
    return response.data;
  },
  
  deleteGrade: async (id: number) => {
    const response = await client.delete(`classes/grades/${id}/`);
    return response.data;
  },

  deleteStream: async (id: number) => {
    const response = await client.delete(`classes/streams/${id}/`);
    return response.data;
  },

  getSubjects: async (search?: string) => {
    const response = await client.get('classes/subjects/', { params: { search } });
    return response.data;
  },

  createSubject: async (data: { name: string; code?: string }) => {
    const response = await client.post('classes/subjects/', data);
    return response.data;
  },

  deleteSubject: async (id: number) => {
    const response = await client.delete(`classes/subjects/${id}/`);
    return response.data;
  },

  getAssignments: async (teacherId?: number) => {
    const params = teacherId ? { teacher: teacherId } : {};
    const response = await client.get('classes/subject-assignments/', { params });
    return response.data;
  },

  createAssignment: async (data: { teacher: number; subject: number; stream: number }) => {
    const response = await client.post('classes/subject-assignments/', data);
    return response.data;
  },

  deleteAssignment: async (id: number) => {
    const response = await client.delete(`classes/subject-assignments/${id}/`);
    return response.data;
  }
};
