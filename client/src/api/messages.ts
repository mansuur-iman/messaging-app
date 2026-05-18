import { api } from "./client";
import type { Message, PaginatedResponse } from "../types/index";

export const messagesApi = {
  getMessages: (userId: string, page = 1, limit = 20) =>
    api.get<PaginatedResponse<Message>>(
      `/messages/${userId}?page=${page}&limit=${limit}`,
    ),
  sendMessage: (userId: string, content: string) =>
    api.post<{ data: Message }>(`/messages/${userId}`, { content }),
};
