import client from "../client";

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: "info" | "success" | "warning" | "error";
  is_read: boolean;
  created_at: string;
}

export const notificationsService = {
  getAll: async () => {
    const response = await client.get("notifications/");
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await client.post(`notifications/${id}/mark_as_read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await client.post("notifications/mark_all_as_read/");
    return response.data;
  },
  getCommunicationStats: async () => {
    const response = await client.get("notifications/communication_stats/");
    return response.data;
  },

  getRecipientGroups: async () => {
    const response = await client.get("notifications/recipient_groups/");
    return response.data;
  },

  sendBulkEmail: async (data: { subject: string; message: string; recipients: string[] }) => {
    const response = await client.post("notifications/bulk_email/", data);
    return response.data;
  },

  sendBulkSms: async (data: { message: string; phones: string[] }) => {
    const response = await client.post("notifications/bulk_sms/", data);
    return response.data;
  },

  getGroupRecipients: async (groupId: string, type: string) => {
    const response = await client.get(`notifications/${groupId}/group-recipients/`, {
      params: { type },
    });
    return response.data;
  },

  getNotices: async (params?: any) => {
    const response = await client.get("notifications/notices/", { params });
    return response.data;
  },

  getEvents: async () => {
    const response = await client.get("notifications/events/");
    return response.data;
  },

  broadcastSms: async (data: { message: string }) => {
    const response = await client.post("notifications/notices/broadcast_sms/", data);
    return response.data;
  },
};
