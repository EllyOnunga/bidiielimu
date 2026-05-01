import client from '../client';

export interface Notification {
  id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

export const notificationsService = {
  getAll: async () => {
    const response = await client.get('notifications/');
    return response.data;
  },

  markAsRead: async (id: number) => {
    const response = await client.post(`notifications/${id}/mark_as_read/`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await client.post('notifications/mark_all_as_read/');
    return response.data;
  }
};
