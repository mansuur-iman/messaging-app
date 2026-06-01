// types/index.ts

export type User = {
  id: string;
  username: string;
  email?: string;
  avatar?: string | null;
  bio?: string;
  createdAt?: string;
};

export type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  read: boolean;
  createdAt: string;
};

export type FriendItem = {
  id: string;
  username: string;
  avatar?: string | null;
};

export type PendingItem = {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  user: FriendItem; // person who sent YOU the request
};

export type SentItem = {
  id: string;
  status: FriendshipStatus;
  createdAt: string;
  friend: FriendItem; // person YOU sent the request to
};

export type Friendship = {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: string;
  updatedAt?: string;
  user?: FriendItem; // populated in some responses
  friend?: FriendItem; // populated in some responses
};

// reusable status type — single source of truth
export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
  message: string;
};
