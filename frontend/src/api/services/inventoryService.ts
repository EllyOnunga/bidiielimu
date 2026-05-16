import client from "../client";

export interface StockItem {
  id: string | number;
  name: string;
  category: "STATIONERY" | "LAB" | "LIBRARY" | "GENERAL";
  quantity: number;
  unit: string;
  min_threshold: number;
  last_restock: string;
}

export const inventoryService = {
  getItems: async (category?: string) => {
    const response = await client.get("inventory/items/", {
      params:
        category && category !== "All"
          ? { category: category.toUpperCase() }
          : {},
    });
    return response.data;
  },

  getLibraryStats: async () => {
    const response = await client.get("inventory/items/library_stats/");
    return response.data;
  },

  getAssets: async (search?: string) => {
    const response = await client.get("inventory/assets/", {
      params: { search },
    });
    return response.data;
  },

  getMyBooks: async (studentId?: number | null) => {
    const params = studentId ? { student_id: studentId } : {};
    const response = await client.get(`inventory/book-issues/my_books/`, { params });
    return response.data;
  },
};
