import { create } from "zustand";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  role_details?: {
    id: number;
    name: string;
    permissions: Record<string, boolean | any>;
    description?: string;
  };
  school: number;
  phone_number?: string;
  school_details?: {
    id: number;
    name: string;
    logo?: string;
    curriculum?: string;
    schema_name?: string;
    domain?: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string | null, refreshToken?: string | null) => void;
  setTokens: (token: string | null, refreshToken: string | null) => void;
  logout: () => void;
}

const getStoredUser = () => {
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch (_) {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: null,
  refreshToken: null,
  setAuth: (user, token, refreshToken) => {
    // Persist only non-sensitive user object; tokens are kept in-memory or as HttpOnly cookies
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token: token || null, refreshToken: refreshToken || null });
  },
  setTokens: (token, refreshToken) => {
    // Keep tokens in-memory; cookie-based refresh will be used for long-lived refresh tokens
    set({ token, refreshToken });
  },
  logout: () => {
    // Clear local user data and in-memory tokens; backend should clear cookies on logout
    localStorage.removeItem("user");
    set({ user: null, token: null, refreshToken: null });
  },
}));
