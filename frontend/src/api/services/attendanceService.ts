import client from "../client";
import { offlineStore } from "../offlineStore";

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
    if (!navigator.onLine) {
      await offlineStore.addToQueue("attendance/mark/", "POST", data);
      return { success: true, offline: true, message: "Saved offline." };
    }
    try {
      const response = await client.post("attendance/mark/", data);
      return response.data;
    } catch (err: any) {
      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        await offlineStore.addToQueue("attendance/mark/", "POST", data);
        return {
          success: true,
          offline: true,
          message: "Network error. Saved offline.",
        };
      }
      throw err;
    }
  },

  getDailyAttendance: async (date: string) => {
    const response = await client.get(`attendance/daily/?date=${date}`);
    return response.data;
  },

  bulkMark: async (data: { date: string; records: any[] }) => {
    if (!navigator.onLine) {
      await offlineStore.addToQueue(
        "attendance/daily/bulk_mark/",
        "POST",
        data,
      );
      return {
        success: true,
        offline: true,
        message: "Saved offline. Will sync when back online.",
      };
    }
    try {
      const response = await client.post("attendance/daily/bulk_mark/", data);
      return response.data;
    } catch (err: any) {
      if (err.message === "Network Error" || err.code === "ERR_NETWORK") {
        await offlineStore.addToQueue(
          "attendance/daily/bulk_mark/",
          "POST",
          data,
        );
        return {
          success: true,
          offline: true,
          message: "Network error. Saved offline.",
        };
      }
      throw err;
    }
  },

  getStudentStats: async (studentId: number | string) => {
    const response = await client.get(
      `attendance/daily/student_stats/?student_id=${studentId}`,
    );
    return response.data;
  },

  syncOfflineAttendance: async () => {
    if (!navigator.onLine) return { synced: 0, failed: 0 };
    const queue = await offlineStore.getQueue();
    let synced = 0;
    let failed = 0;

    for (const req of queue) {
      if (req.url.includes("attendance/")) {
        try {
          if (req.method === "POST") {
            await client.post(req.url, req.payload);
          }
          if (req.id) await offlineStore.removeFromQueue(req.id);
          synced++;
        } catch (err: any) {
          failed++;
        }
      }
    }
    return { synced, failed };
  },
};
