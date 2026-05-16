import client from "../client";

export interface SupportTicket {
  id: number;
  tenant_name: string;
  user_name: string;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  created_at: string;
  updated_at: string;
}

export const supportService = {
  getTickets: async (): Promise<SupportTicket[]> => {
    const response = await client.get("support/tickets/");
    return response.data;
  },

  createTicket: async (
    data: Partial<SupportTicket>,
  ): Promise<SupportTicket> => {
    const response = await client.post("support/tickets/", data);
    return response.data;
  },

  updateTicket: async (
    id: number,
    data: Partial<SupportTicket>,
  ): Promise<SupportTicket> => {
    const response = await client.patch(`support/tickets/${id}/`, data);
    return response.data;
  },
};
