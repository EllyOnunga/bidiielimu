import client from "../client";

export const authService = {
  login: async (email: string, password: string) => {
    const response = await client.post("accounts/login/", { email, password });
    return response.data;
  },

  register: async (data: {
    school_name: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    curriculum: string;
  }) => {
    const response = await client.post("accounts/register/", data);
    return response.data;
  },

  verifyEmail: async (token: string) => {
    const response = await client.get(`accounts/verify-email/${token}/`);
    return response.data;
  },

  resendVerification: async (email: string) => {
    const response = await client.post("accounts/resend-verification/", {
      email,
    });
    return response.data;
  },

  refreshToken: async (refresh?: string) => {
    const payload = refresh ? { refresh } : {};
    const response = await client.post("accounts/token/refresh/", payload);
    return response.data;
  },

  googleLogin: async (data: { access_token: string }) => {
    const response = await client.post("accounts/google/", data);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await client.post("accounts/forgot-password/", { email });
    return response.data;
  },

  resetPasswordRequest: async (email: string) => {
    const response = await client.post("auth/password/reset/", { email });
    return response.data;
  },

  confirmPasswordReset: async (data: any) => {
    const response = await client.post("auth/password/reset/confirm/", data);
    return response.data;
  },

  resetPassword: async (uid: string, token: string, newPassword: string) => {
    const response = await client.post("accounts/reset-password/", {
      uid,
      token,
      new_password: newPassword,
    });
    return response.data;
  },

  verifyOTP: async (userId: number, otp: string) => {
    const response = await client.post("accounts/otp/verify-login/", {
      user_id: userId,
      otp,
    });
    return response.data;
  },

  triggerOTP: async (userId: number, method: string) => {
    const response = await client.post("accounts/otp/trigger/", {
      user_id: userId,
      method,
    });
    return response.data;
  },

  setupSMSOTP: async (phoneNumber: string) => {
    const response = await client.post("accounts/otp/setup/", {
      phone_number: phoneNumber,
    });
    return response.data;
  },

  verifySMSOTPSetup: async (otp: string) => {
    const response = await client.post("accounts/otp/verify-setup/", { otp });
    return response.data;
  },

  updateMe: async (data: any) => {
    const response = await client.patch("accounts/me/", data);
    return response.data;
  },

  changePassword: async (data: any) => {
    const response = await client.post("auth/password/change/", data);
    return response.data;
  },
};
