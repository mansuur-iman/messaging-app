import { useState, useEffect } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";
import type { User } from "../types/index";

const Sidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "friends">("chats");

  // Debounce logic to prevent spamming your backend
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(handler);
  }, [search]);

  // Using the debounced search term for the cache key and fetch function
  const { data } = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: () => usersApi.getUsers(1, 20, debouncedSearch),
    enabled: true, // Optional: set to false if you don't want to query on empty input
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) {
    return (
      <Container>
        <Header style={{ justifyContent: "center" }}>
          <Username style={{ textAlign: "center" }}>
            Loading profile...
          </Username>
        </Header>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Avatar onClick={() => navigate("/profile")}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            // FIX: added safe chaining to .toUpperCase()
            <Initials>{user?.username?.[0]?.toUpperCase() || "?"}</Initials>
          )}
        </Avatar>
        <Username>{user?.username}</Username>
        <LogoutButton onClick={handleLogout}>↩</LogoutButton>
      </Header>

      <SearchBar
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Tabs>
        <Tab $active={tab === "chats"} onClick={() => setTab("chats")}>
          Chats
        </Tab>
        <Tab $active={tab === "friends"} onClick={() => setTab("friends")}>
          Friends
        </Tab>
      </Tabs>

      <UserList>
        {data?.users.map((u: User) => (
          <UserItem key={u.id} onClick={() => navigate(`/messages/${u.id}`)}>
            <UserAvatar>
              {u.avatar ? (
                <img src={u.avatar} alt={u.username} />
              ) : (
                // FIX: Added safe fallback handling here too
                <Initials>{u.username?.[0]?.toUpperCase() || "?"}</Initials>
              )}
            </UserAvatar>
            <UserInfo>
              <UserName>{u.username}</UserName>
              {u.bio && <UserBio>{u.bio}</UserBio>}
            </UserInfo>
          </UserItem>
        ))}
      </UserList>
    </Container>
  );
};

// Styled components remain unchanged...
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
  color: ${({ theme, $active }) =>
    $active ? theme.colors.sentBubble : theme.colors.textLight};
  background: ${({ theme, $active }) =>
    $active ? `${theme.colors.sentBubble}15` : "transparent"};
  transition: all 0.2s;
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

export default Sidebar;
