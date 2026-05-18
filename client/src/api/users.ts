import { api } from "./client";
import type { User, PaginatedResponse } from "../types/index";

export const usersApi = {
  getUsers: (page = 1, limit = 20, search = "") =>
    api.get<PaginatedResponse<User>>(
      `/users?page=${page}&limit=${limit}&search=${search}`,
    ),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  getMe: () => api.get<User>("/users/me"),
  updateUser: (id: string, data: Partial<User>) =>
    api.put<User>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete<void>(`/users/${id}`),
};
