import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";
import { friendsApi } from "../api/friends";
import type { User } from "../types/index";

type FriendItem = { id: string; username: string; avatar?: string };
type SentItem = { id: string; status: string; friend: FriendItem };
type PendingItem = { id: string; status: string; user: FriendItem };

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "users">("chats");
  const queryClient = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ["users", search],
    queryFn: () => usersApi.getUsers(1, 20, search),
  });

  const { data: friendsData } = useQuery({
    queryKey: ["friends"],
    queryFn: friendsApi.getFriends,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: friendsApi.getPending,
  });

  const { data: sentData } = useQuery({
    queryKey: ["sent"],
    queryFn: friendsApi.getSentRequests,
  });

  const { mutate: sendRequest } = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent"] });
    },
    onError: (err: any) => {
      alert(err.message);
    },
  });

  const getRelationship = (userId: string) => {
    const isFriend = friendsData?.data.some((f: FriendItem) => f.id === userId);
    const isPendingSent = sentData?.data.some(
      (p: SentItem) => p.friend?.id === userId,
    );
    const isPendingReceived = pendingData?.data.some(
      (p: PendingItem) => p.user?.id === userId,
    );
    if (isFriend) return "friend";
    if (isPendingSent) return "pending_sent";
    if (isPendingReceived) return "pending_received";
    return "none";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Container>
      // in Sidebar.tsx Header
      <Header>
        <Avatar onClick={() => navigate("/profile")}>...</Avatar>
        <Username>{user?.username}</Username>
        <FriendsLink onClick={() => navigate("/friends")}>
          👥
          {pendingData?.data.length ? (
            <NotifDot>{pendingData.data.length}</NotifDot>
          ) : null}
        </FriendsLink>
        <LogoutButton onClick={handleLogout}>↩</LogoutButton>
      </Header>
      <SearchBar
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <Tabs>
        <Tab $active={tab === "chats"} onClick={() => setTab("chats")}>
          Chats
        </Tab>
        <Tab
          $active={tab === "users"}
          onClick={() => {
            setTab("users");
            navigate("/friends");
          }}
        >
          People
          {pendingData?.data.length ? (
            <Badge>{pendingData.data.length}</Badge>
          ) : null}
        </Tab>
      </Tabs>
      <UserList>
        {tab === "chats" && (
          <>
            <UserItem onClick={() => navigate(`/messages/${user?.id}`)}>
              <UserAvatar>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <Initials>{user?.username?.[0].toUpperCase()}</Initials>
                )}
              </UserAvatar>
              <UserInfo>
                <UserName>You (Notes)</UserName>
                <UserBio>Message yourself</UserBio>
              </UserInfo>
            </UserItem>

            {friendsData?.data.map((f: FriendItem) => (
              <UserItem
                key={f.id}
                onClick={() => navigate(`/messages/${f.id}`)}
              >
                <UserAvatar>
                  {f.avatar ? (
                    <img src={f.avatar} alt={f.username} />
                  ) : (
                    <Initials>{f.username?.[0].toUpperCase()}</Initials>
                  )}
                </UserAvatar>
                <UserInfo>
                  <UserName>{f.username}</UserName>
                </UserInfo>
              </UserItem>
            ))}

            {friendsData?.data.length === 0 && (
              <Empty>No friends yet — go to People to add some</Empty>
            )}
          </>
        )}

        {tab === "users" && (
          <>
            {usersData?.users
              .filter((u: User) => u.id !== user?.id)
              .map((u: User) => (
                <UserItem key={u.id}>
                  <UserAvatar onClick={() => navigate(`/messages/${u.id}`)}>
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.username} />
                    ) : (
                      <Initials>{u.username[0].toUpperCase()}</Initials>
                    )}
                  </UserAvatar>
                  <UserInfo onClick={() => navigate(`/messages/${u.id}`)}>
                    <UserName>{u.username}</UserName>
                    {u.bio && <UserBio>{u.bio}</UserBio>}
                  </UserInfo>
                  {(() => {
                    const rel = getRelationship(u.id);
                    if (rel === "friend")
                      return (
                        <StatusBadge $color="green">✓ Friends</StatusBadge>
                      );
                    if (rel === "pending_sent")
                      return <StatusBadge $color="gray">⏳ Sent</StatusBadge>;
                    if (rel === "pending_received")
                      return <StatusBadge $color="blue">📩 Accept</StatusBadge>;
                    return (
                      <AddButton onClick={() => sendRequest(u.id)}>+</AddButton>
                    );
                  })()}
                </UserItem>
              ))}
          </>
        )}
      </UserList>
    </Container>
  );
};

const Container = styled.aside`
  width: 300px;
  min-width: 300px;
  background: ${({ theme }) => theme.colors.sidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 10px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;
const FriendsLink = styled.button`
  position: relative;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textLight};
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const NotifDot = styled.span`
  position: absolute;
  top: -4px;
  right: -4px;
  background: ${({ theme }) => theme.colors.danger};
  color: white;
  font-size: 10px;
  font-weight: 600;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Initials = styled.span`
  color: white;
  font-size: 14px;
  font-weight: 600;
`;

const Username = styled.span`
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const LogoutButton = styled.button`
  font-size: 18px;
  color: ${({ theme }) => theme.colors.textLight};
  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const SearchBar = styled.input`
  margin: 12px;
  padding: 8px 12px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  font-size: 14px;
  color: ${({ theme }) => theme.colors.text};

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const Tabs = styled.div`
  display: flex;
  padding: 0 12px;
  gap: 8px;
  margin-bottom: 8px;
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.sentBubble : theme.colors.textLight};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.sentBubble}15` : "transparent"};
  transition: all 0.2s;
`;

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.danger};
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const UserList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
`;

const UserItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const UserAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const UserName = styled.p`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const UserBio = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Empty = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 20px 16px;
  text-align: center;
`;

const AddButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

const StatusBadge = styled.span<{ $color: string }>`
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  white-space: nowrap;
  color: ${({ $color, theme }) =>
    $color === "green"
      ? theme.colors.online
      : $color === "blue"
        ? theme.colors.sentBubble
        : theme.colors.textLight};
  background: ${({ $color, theme }) =>
    $color === "green"
      ? `${theme.colors.online}15`
      : $color === "blue"
        ? `${theme.colors.sentBubble}15`
        : theme.colors.border};
`;

export default Sidebar;
