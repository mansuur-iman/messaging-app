import { create } from "zustand";

import type { User } from "../types";

type AuthStore = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user")!)
    : null,
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),

  login: (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updatedUser) => {
    set((state) => {
      if (!state.user) return { user: null };
      const nextUser = { ...state.user, ...updatedUser };
      localStorage.setItem("user", JSON.stringify(nextUser)); // Keep localStorage synced on update
      return { user: nextUser };
    });
  },
}));
