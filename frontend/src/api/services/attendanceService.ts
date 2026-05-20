import client from "../client";

export interface AttendanceStats {
  present: number;
  absent: number;
  avg: string;
  date: string;
}

export const attendanceService = {
  getStats: async () => {
    const response = await client.get("attendance/daily/stats/");
    return response.data;
  },
  saveAttendance: async (data: any) => {
    const response = await client.post("attendance/mark/", data);
    return response.data;
  },

  getDailyAttendance: async (date: string) => {
    const response = await client.get(`attendance/daily/?date=${date}`);
    return response.data;
  },

  bulkMark: async (data: { date: string; records: any[] }) => {
    const response = await client.post("attendance/daily/bulk_mark/", data);
    return response.data;
  },

  getStudentStats: async (studentId: number | string) => {
    const response = await client.get(
      `attendance/daily/student_stats/?student_id=${studentId}`,
    );
    return response.data;
  },
};
