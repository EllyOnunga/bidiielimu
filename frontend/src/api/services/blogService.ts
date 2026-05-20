import client from "../client";

export const blogService = {
  getPosts: async (categorySlug?: string) => {
    const params = categorySlug ? { category: categorySlug } : {};
    const response = await client.get("blog/", { params });
    return response.data;
  },

  getPostDetail: async (slug: string) => {
    const response = await client.get(`blog/${slug}/`);
    return response.data;
  },

  getCategories: async () => {
    const response = await client.get("blog/categories/");
    return response.data;
  },

  // Admin CRUD operations
  adminGetPosts: async () => {
    const response = await client.get("blog/admin/posts/");
    return response.data;
  },

  adminGetPostDetail: async (id: number) => {
    const response = await client.get(`blog/admin/posts/${id}/`);
    return response.data;
  },

  adminCreatePost: async (data: any) => {
    const response = await client.post("blog/admin/posts/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  adminUpdatePost: async (id: number, data: any) => {
    const response = await client.patch(`blog/admin/posts/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  adminDeletePost: async (id: number) => {
    const response = await client.delete(`blog/admin/posts/${id}/`);
    return response.data;
  },

  adminGetCategories: async () => {
    const response = await client.get("blog/admin/categories/");
    return response.data;
  },

  adminCreateCategory: async (data: any) => {
    const response = await client.post("blog/admin/categories/", data);
    return response.data;
  },

  adminUpdateCategory: async (id: number, data: any) => {
    const response = await client.patch(`blog/admin/categories/${id}/`, data);
    return response.data;
  },

  adminDeleteCategory: async (id: number) => {
    const response = await client.delete(`blog/admin/categories/${id}/`);
    return response.data;
  },
};
