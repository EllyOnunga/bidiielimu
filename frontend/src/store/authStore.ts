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
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
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
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  setAuth: (user, token, refreshToken) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({ user, token, refreshToken: refreshToken || null });
  },
  setTokens: (token, refreshToken) => {
    localStorage.setItem("token", token);
    localStorage.setItem("refreshToken", refreshToken);
    set({ token, refreshToken });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    set({ user: null, token: null, refreshToken: null });
  },
}));
