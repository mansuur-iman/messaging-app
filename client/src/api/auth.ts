import { api } from "./client";

import type { AuthResponse } from "../types/index";

type RegisterData = {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
};

type LoginData = {
  username: string;
  password: string;
};

export const authApi = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>("/auth/register", data),
  login: (data: LoginData) => api.post<AuthResponse>("/auth/login", data),
};
