import { api } from "./client";
import type { Friendship } from "../types/index";

export const friendsApi = {
  sendRequest: (userId: string) =>
    api.post<{ data: Friendship }>(`/friendships/request/${userId}`, {}),
  acceptRequest: (requestId: string) =>
    api.put<{ data: Friendship }>(`/friendships/accept/${requestId}`, {}),
  rejectRequest: (requestId: string) =>
    api.put<{ data: Friendship }>(`/friendships/reject/${requestId}`, {}),
  getFriends: () => api.get<{ data: Friendship[] }>("/friendships"),
  getPending: () => api.get<{ data: Friendship[] }>("/friendships/pending"),
};
