import { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";
import { friendsApi } from "../api/friends";
import type { User, FriendItem, PendingItem, SentItem } from "../types";

// --- Custom Debounce Hook ---
function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// --- Reusable Shared Avatar Component ---
interface AvatarProps {
  avatar?: string;
  username?: string;
  showOnline?: boolean;
}

const Avatar = ({ avatar, username, showOnline }: AvatarProps) => (
  <AvatarWrapper>
    <UserAvatar>
      {avatar ? (
        <img src={avatar} alt={username || "User"} />
      ) : (
        <Initials>{username?.[0]?.toUpperCase() || "?"}</Initials>
      )}
    </UserAvatar>
    {showOnline && <OnlineDot />}
  </AvatarWrapper>
);

// --- Main Sidebar Component ---
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "people">("chats");

  const debouncedSearch = useDebounce(search, 300);

  // --- React Query Implementations ---
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: () => usersApi.getUsers(1, 20, debouncedSearch),
    enabled: tab === "people", // Optimization: Only query when looking at discover tab
  });

  const { data: friendsData } = useQuery({
    queryKey: ["friends"],
    queryFn: friendsApi.getFriends,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: friendsApi.getPending,
    refetchInterval: 5000,
  });

  const { data: sentData } = useQuery({
    queryKey: ["sent"],
    queryFn: friendsApi.getSentRequests,
  });

  const { mutate: sendRequest } = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sent"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
    },
  });

  // --- Safe Structural Type Coercions ---
  const friends = (friendsData?.data as FriendItem[]) || [];
  const users = (usersData?.users as User[]) || [];
  const pending = (pendingData?.data as PendingItem[]) || [];
  const sent = (sentData?.data as SentItem[]) || [];

  // --- Optimization: O(1) Lookups instead of inner loop iterations ---
  const lookupMaps = useMemo(() => {
    return {
      friendIds: new Set(friends.map((f) => f.id)),
      sentIds: new Set(sent.map((p) => p.friend?.id).filter(Boolean)),
      receivedIds: new Set(pending.map((p) => p.user?.id).filter(Boolean)),
    };
  }, [friends, sent, pending]);

  const getRelationship = (userId: string) => {
    if (lookupMaps.friendIds.has(userId)) return "friend";
    if (lookupMaps.sentIds.has(userId)) return "pending_sent";
    if (lookupMaps.receivedIds.has(userId)) return "pending_received";
    return "none";
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => u.id !== user?.id);
  }, [users, user?.id]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <Container>
      <TopSection>
        <Header>
          <ProfileButton
            onClick={() => navigate("/profile")}
            aria-label="View Profile"
          >
            <Avatar
              avatar={user?.avatar}
              username={user?.username}
              showOnline
            />
          </ProfileButton>

          <HeaderInfo>
            <Username>{user?.username}</Username>
            <StatusText>Online</StatusText>
          </HeaderInfo>

          <HeaderActions>
            <FriendsButton
              onClick={() => navigate("/friends")}
              aria-label="Friends requests"
            >
              <span>👥</span>
              {pending.length > 0 && <NotifBadge>{pending.length}</NotifBadge>}
            </FriendsButton>
            <LogoutButton onClick={handleLogout} aria-label="Logout">
              ↩
            </LogoutButton>
          </HeaderActions>
        </Header>

        <SearchWrapper>
          <SearchBar
            placeholder={
              tab === "chats" ? "Search chats..." : "Search people..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchWrapper>

        <Tabs>
          <Tab $active={tab === "chats"} onClick={() => setTab("chats")}>
            Chats
          </Tab>
          <Tab $active={tab === "people"} onClick={() => setTab("people")}>
            People
            {pending.length > 0 && <TabBadge>{pending.length}</TabBadge>}
          </Tab>
        </Tabs>
      </TopSection>

      <Content>
        {tab === "chats" && (
          <>
            <SectionTitle>Messages</SectionTitle>

            {/* Notes to self */}
            <ChatCard
              $active={location.pathname === `/messages/${user?.id}`}
              onClick={() => navigate(`/messages/${user?.id}`)}
            >
              <Avatar avatar={user?.avatar} username={user?.username} />
              <ChatInfo>
                <ChatTop>
                  <UserName>Notes</UserName>
                  <ChatTime>You</ChatTime>
                </ChatTop>
                <LastMessage>Message yourself</LastMessage>
              </ChatInfo>
            </ChatCard>

            {/* Active friends chats */}
            {friends.map((friend) => (
              <ChatCard
                key={friend.id}
                $active={location.pathname === `/messages/${friend.id}`}
                onClick={() => navigate(`/messages/${friend.id}`)}
              >
                <Avatar
                  avatar={friend.avatar}
                  username={friend.username}
                  showOnline
                />
                <ChatInfo>
                  <ChatTop>
                    <UserName>{friend.username}</UserName>
                    <ChatTime>Chat</ChatTime>
                  </ChatTop>
                  <LastMessage>Start a conversation</LastMessage>
                </ChatInfo>
              </ChatCard>
            ))}

            {!friends.length && (
              <EmptyState>
                <EmptyIcon>💬</EmptyIcon>
                <EmptyTitle>No conversations yet</EmptyTitle>
                <EmptyText>Add friends to start chatting</EmptyText>
              </EmptyState>
            )}
          </>
        )}

        {tab === "people" && (
          <>
            <SectionTitle>Discover People</SectionTitle>

            {filteredUsers.map((u) => {
              const rel = getRelationship(u.id);
              return (
                <PeopleCard key={u.id}>
                  <LeftSection>
                    <Avatar avatar={u.avatar} username={u.username} />
                    <UserInfo>
                      <UserName>{u.username}</UserName>
                      <UserBio>{u.bio || "No bio yet"}</UserBio>
                    </UserInfo>
                  </LeftSection>

                  {rel === "friend" && (
                    <StatusBadge $variant="friend">Friends</StatusBadge>
                  )}
                  {rel === "pending_sent" && (
                    <StatusBadge $variant="pending">Sent</StatusBadge>
                  )}
                  {rel === "pending_received" && (
                    <StatusBadge $variant="received">Pending</StatusBadge>
                  )}
                  {rel === "none" && (
                    <AddButton onClick={() => sendRequest(u.id)}>Add</AddButton>
                  )}
                </PeopleCard>
              );
            })}

            {!isLoadingUsers && filteredUsers.length === 0 && (
              <EmptyState>
                <EmptyIcon>🔍</EmptyIcon>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyText>Try searching for a different name</EmptyText>
              </EmptyState>
            )}
          </>
        )}
      </Content>
    </Container>
  );
};

// --- Updated & Cleaned Styled Elements ---
const Container = styled.aside`
  width: 340px;
  max-width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.sidebar};
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const TopSection = styled.div`
  position: sticky;
  top: 0;
  z-index: 20;
  background: ${({ theme }) => theme.colors.sidebar};
  backdrop-filter: blur(8px);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 18px 16px;
  gap: 12px;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ProfileButton = styled.button`
  position: relative;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
`;

const OnlineDot = styled.div`
  position: absolute;
  right: 2px;
  bottom: 2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid ${({ theme }) => theme.colors.sidebar};
`;

const HeaderInfo = styled.div`
  flex: 1;
  overflow: hidden;
`;

const Username = styled.p`
  font-size: 15px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const StatusText = styled.p`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const FriendsButton = styled.button`
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  span {
    font-size: 18px;
  }
  &:hover {
    transform: translateY(-1px);
    background: ${({ theme }) => theme.colors.border};
  }
`;

const LogoutButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: ${({ theme }) => theme.colors.background};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-1px);
    background: ${({ theme }) => theme.colors.border};
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const NotifBadge = styled.div`
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.danger};
  color: white;
  font-size: 10px;
  font-weight: 700;
  border: 2px solid ${({ theme }) => theme.colors.sidebar};
`;

const SearchWrapper = styled.div`
  padding: 0 16px 14px;
`;

const SearchBar = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 14px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 14px;
  transition: all 0.2s ease;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.sentBubble};
    background: ${({ theme }) => theme.colors.sidebar};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: 6px;
  margin: 0 16px 14px;
  padding: 4px;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.background};
`;

const Tab = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: ${({ theme, $active }) =>
    $active ? theme.colors.sentBubble : "transparent"};
  color: ${({ theme, $active }) =>
    $active ? "white" : theme.colors.textLight};
`;

const TabBadge = styled.span`
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.18);
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 20px;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 999px;
  }
`;

const SectionTitle = styled.h3`
  padding: 4px 18px 10px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textLight};
`;

// Shifting ChatCard to a Div style container eliminates HTML hierarchy issues
const ChatCard = styled.div<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  cursor: pointer;
  transition: all 0.18s ease;
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.sentBubble}12` : "transparent"};
  &:hover {
    background: ${({ theme, $active }) =>
      $active ? `${theme.colors.sentBubble}18` : theme.colors.border};
  }
`;

const AvatarWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const UserAvatar = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Initials = styled.span`
  color: white;
  font-size: 16px;
  font-weight: 700;
`;

const ChatInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

const ChatTime = styled.span`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const LastMessage = styled.p`
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const PeopleCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 18px;
  transition: background 0.18s ease;
  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
`;

const UserInfo = styled.div`
  min-width: 0;
`;

const UserName = styled.p`
  font-size: 15px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const UserBio = styled.p`
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const AddButton = styled.button`
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  color: white;
  background: ${({ theme }) => theme.colors.sentBubble};
  transition: opacity 0.2s ease;
  &:hover {
    opacity: 0.88;
  }
`;

const StatusBadge = styled.div<{ $variant: "friend" | "pending" | "received" }>`
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme, $variant }) =>
    $variant === "friend"
      ? theme.colors.online
      : $variant === "received"
        ? theme.colors.sentBubble
        : theme.colors.textLight};
  background: ${({ theme, $variant }) =>
    $variant === "friend"
      ? `${theme.colors.online}15`
      : $variant === "received"
        ? `${theme.colors.sentBubble}15`
        : theme.colors.border};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 70px 20px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 44px;
`;

const EmptyTitle = styled.h4`
  margin-top: 16px;
  font-size: 18px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  margin-top: 8px;
  max-width: 220px;
  font-size: 14px;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textLight};
`;

export default Sidebar;
