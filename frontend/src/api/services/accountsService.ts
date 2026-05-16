import client from "../client";

export const accountsService = {
  getSchools: async () => {
    const response = await client.get("accounts/schools/");
    return response.data.schools || response.data;
  },
};
