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

  padding: 32px;

  background: ${({ theme }) => theme.colors.background};

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const Header = styled.div`
  margin-bottom: 36px;
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 800;

  color: ${({ theme }) => theme.colors.text};
`;

const Subtitle = styled.p`
  margin-top: 8px;

  font-size: 15px;

  color: ${({ theme }) => theme.colors.textLight};
`;

const Section = styled.section`
  margin-bottom: 42px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;

  gap: 10px;

  margin-bottom: 18px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;

  color: ${({ theme }) => theme.colors.text};
`;

const CountBadge = styled.div`
  min-width: 24px;
  height: 24px;

  padding: 0 8px;

  border-radius: 999px;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 12px;
  font-weight: 700;

  background: ${({ theme }) => theme.colors.sentBubble};

  color: white;
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;

  gap: 12px;
`;

const Card = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 16px;

  padding: 16px;

  border-radius: 18px;

  background: ${({ theme }) => theme.colors.sidebar};

  border: 1px solid ${({ theme }) => theme.colors.border};

  transition:
    transform 0.18s ease,
    border 0.18s ease;

  &:hover {
    transform: translateY(-1px);

    border-color: ${({ theme }) => theme.colors.sentBubble};
  }
`;

const Left = styled.div`
  display: flex;
  align-items: center;

  gap: 14px;

  min-width: 0;
`;

const Avatar = styled.div`
  width: 52px;
  height: 52px;

  border-radius: 50%;

  overflow: hidden;
  flex-shrink: 0;

  background: ${({ theme }) => theme.colors.sentBubble};

  display: flex;
  align-items: center;
  justify-content: center;

  span {
    color: white;

    font-size: 18px;
    font-weight: 700;
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
  font-size: 15px;
  font-weight: 700;

  color: ${({ theme }) => theme.colors.text};
`;

const Subtext = styled.p`
  margin-top: 4px;

  font-size: 13px;

  color: ${({ theme }) => theme.colors.textLight};
`;

const Actions = styled.div`
  display: flex;
  align-items: center;

  gap: 8px;

  flex-shrink: 0;
`;

const AcceptButton = styled.button`
  height: 36px;

  padding: 0 16px;

  border-radius: 999px;

  font-size: 13px;
  font-weight: 700;

  color: white;

  background: ${({ theme }) => theme.colors.sentBubble};

  transition: opacity 0.2s ease;

  &:hover:not(:disabled) {
    opacity: 0.88;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const RejectButton = styled.button`
  height: 36px;

  padding: 0 16px;

  border-radius: 999px;

  border: 1px solid ${({ theme }) => theme.colors.border};

  font-size: 13px;
  font-weight: 700;

  color: ${({ theme }) => theme.colors.textLight};

  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.danger};

    color: ${({ theme }) => theme.colors.danger};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageButton = styled.button`
  height: 38px;

  padding: 0 18px;

  border-radius: 999px;

  border: 1px solid ${({ theme }) => theme.colors.sentBubble};

  background: transparent;

  color: ${({ theme }) => theme.colors.sentBubble};

  font-size: 13px;
  font-weight: 700;

  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.sentBubble};

    color: white;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  padding: 50px 20px;

  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 42px;
`;

const EmptyTitle = styled.h3`
  margin-top: 16px;

  font-size: 18px;
  font-weight: 700;

  color: ${({ theme }) => theme.colors.text};
`;

const EmptyText = styled.p`
  margin-top: 8px;

  max-width: 260px;

  font-size: 14px;
  line-height: 1.5;

  color: ${({ theme }) => theme.colors.textLight};
`;

const LoadingState = styled.div`
  flex: 1;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 15px;

  color: ${({ theme }) => theme.colors.textLight};
`;

export default FriendsPage;
