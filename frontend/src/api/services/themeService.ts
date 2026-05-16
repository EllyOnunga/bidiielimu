import client from "../client";

export const themeService = {
  getTheme: async () => {
    const response = await client.get("theme/");
    return response.data;
  },
};
