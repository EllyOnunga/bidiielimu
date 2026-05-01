import client from '../client';

export interface AttendanceStats {
  present: number;
  absent: number;
  avg: string;
  date: string;
}

export const attendanceService = {
  getStats: async () => {
    const response = await client.get('attendance/daily/stats/');
    return response.data;
  }
};
