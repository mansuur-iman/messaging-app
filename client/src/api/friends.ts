import { api } from "./client";
import type {
  Friendship,
  FriendItem,
  PendingItem,
  SentItem,
} from "../types/index";

export const friendsApi = {
  sendRequest: (userId: string) =>
    api.post<{ data: Friendship }>(`/friendships/request/${userId}`, {}),
  acceptRequest: (requestId: string) =>
    api.put<{ data: Friendship }>(`/friendships/accept/${requestId}`, {}),
  rejectRequest: (requestId: string) =>
    api.put<{ data: Friendship }>(`/friendships/reject/${requestId}`, {}),
  getFriends: () => api.get<{ data: FriendItem[] }>("/friendships"),
  getPending: () => api.get<{ data: PendingItem[] }>("/friendships/pending"),
  getSentRequests: () => api.get<{ data: SentItem[] }>("/friendships/sent"),
};
