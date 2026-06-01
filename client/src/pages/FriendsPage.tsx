import styled from "styled-components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { friendsApi } from "../api/friends";
import type { FriendItem, PendingItem } from "../types";

const FriendsPage = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const { data: friendsData, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: friendsApi.getFriends,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: friendsApi.getPending,
  });

  const { mutate: accept, isPending: accepting } = useMutation({
    mutationFn: (id: string) => friendsApi.acceptRequest(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["friends"],
      });

      queryClient.invalidateQueries({
        queryKey: ["pending"],
      });

      queryClient.invalidateQueries({
        queryKey: ["sent"],
      });
    },
  });

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: (id: string) => friendsApi.rejectRequest(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["pending"],
      });
    },
  });

  const friends = (friendsData?.data as FriendItem[]) || [];

  const pending = (pendingData?.data as PendingItem[]) || [];

  if (isLoading) {
    return <LoadingState>Loading friends...</LoadingState>;
  }

  return (
    <Container>
      <Header>
        <Title>Friends</Title>

        <Subtitle>Manage your friends and requests</Subtitle>
      </Header>

      <Section>
        <SectionHeader>
          <SectionTitle>Pending Requests</SectionTitle>

          {pending.length > 0 && <CountBadge>{pending.length}</CountBadge>}
        </SectionHeader>

        {pending.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>

            <EmptyTitle>No pending requests</EmptyTitle>

            <EmptyText>
              When someone sends you a friend request, it will appear here
            </EmptyText>
          </EmptyState>
        ) : (
          <CardList>
            {pending.map((req) => (
              <Card key={req.id}>
                <Left>
                  <Avatar>
                    {req.user?.avatar ? (
                      <img src={req.user.avatar} alt={req.user.username} />
                    ) : (
                      <span>{req.user?.username?.[0]?.toUpperCase()}</span>
                    )}
                  </Avatar>

                  <UserInfo>
                    <Name>{req.user?.username}</Name>

                    <Subtext>Wants to be your friend</Subtext>
                  </UserInfo>
                </Left>

                <Actions>
                  <AcceptButton
                    disabled={accepting || rejecting}
                    onClick={() => accept(req.id)}
                  >
                    Accept
                  </AcceptButton>

                  <RejectButton
                    disabled={accepting || rejecting}
                    onClick={() => reject(req.id)}
                  >
                    Decline
                  </RejectButton>
                </Actions>
              </Card>
            ))}
          </CardList>
        )}
      </Section>

      <Section>
        <SectionHeader>
          <SectionTitle>Friends</SectionTitle>

          <CountBadge>{friends.length}</CountBadge>
        </SectionHeader>

        {friends.length === 0 ? (
          <EmptyState>
            <EmptyIcon>👥</EmptyIcon>

            <EmptyTitle>No friends yet</EmptyTitle>

            <EmptyText>Add people to start chatting</EmptyText>
          </EmptyState>
        ) : (
          <CardList>
            {friends.map((friend) => (
              <Card key={friend.id}>
                <Left>
                  <Avatar>
                    {friend.avatar ? (
                      <img src={friend.avatar} alt={friend.username} />
                    ) : (
                      <span>{friend.username?.[0]?.toUpperCase()}</span>
                    )}
                  </Avatar>

                  <UserInfo>
                    <Name>{friend.username}</Name>

                    <Subtext>Friend</Subtext>
                  </UserInfo>
                </Left>

                <MessageButton
                  onClick={() => navigate(`/messages/${friend.id}`)}
                >
                  Message
                </MessageButton>
              </Card>
            ))}
          </CardList>
        )}
      </Section>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.background};
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
  margin-top: 4px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 0.5px solid ${({ theme }) => theme.colors.border};
`;

const SectionTitle = styled.h2`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textLight};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const CountBadge = styled.div`
  font-size: 11px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sentBubble}22;
  color: ${({ theme }) => theme.colors.sentBubble};
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: ${({ theme }) => theme.colors.sidebar};
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  transition: border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.sentBubble};
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const Avatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.sentBubble}22;
  display: flex;
  align-items: center;
  justify-content: center;

  span {
    color: ${({ theme }) => theme.colors.sentBubble};
    font-size: 15px;
    font-weight: 500;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const UserInfo = styled.div`
  min-width: 0;
`;

const Name = styled.p`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const Subtext = styled.p`
  margin-top: 2px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const AcceptButton = styled.button`
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 0.5px solid ${({ theme }) => theme.colors.sentBubble};
  background: ${({ theme }) => theme.colors.sentBubble}18;
  color: ${({ theme }) => theme.colors.sentBubble};
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textLight};
  cursor: pointer;
  transition: all 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.danger};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const MessageButton = styled.button`
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 0.5px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.sentBubble};
    color: ${({ theme }) => theme.colors.sentBubble};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 8px;
`;

const EmptyTitle = styled.h3`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 4px;
`;

const EmptyText = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
  max-width: 240px;
  line-height: 1.5;
`;

const LoadingState = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
`;

export default FriendsPage;
