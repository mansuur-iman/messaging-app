export type User = {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
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

export type Friendship = {
  id: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "BLOCKED";
  createdAt: string;
  user?: Pick<User, "id" | "username" | "avatar">;
  friend?: Pick<User, "id" | "username" | "avatar">;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export type AuthResponse = {
  token: string;
  user: User;
  message: string;
};
