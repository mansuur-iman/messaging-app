import styled from "styled-components";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { friendsApi } from "../api/friends";

type FriendItem = { id: string; username: string; avatar?: string };
type PendingItem = {
  id: string;
  status: string;
  user: FriendItem;
};

const FriendsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: friendsData } = useQuery({
    queryKey: ["friends"],
    queryFn: friendsApi.getFriends,
  });

  const { data: pendingData } = useQuery({
    queryKey: ["pending"],
    queryFn: friendsApi.getPending,
  });

  const { mutate: accept } = useMutation({
    mutationFn: (id: string) => friendsApi.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["pending"] });
      queryClient.invalidateQueries({ queryKey: ["sent"] });
    },
  });

  const { mutate: reject } = useMutation({
    mutationFn: (id: string) => friendsApi.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending"] });
    },
  });

  return (
    <Container>
      <Section>
        <SectionTitle>
          Pending Requests
          {pendingData?.data.length ? (
            <Badge>{pendingData.data.length}</Badge>
          ) : null}
        </SectionTitle>

        {pendingData?.data.length === 0 && <Empty>No pending requests</Empty>}

        {pendingData?.data.map((req: PendingItem) => (
          <FriendItem key={req.id}>
            <FriendAvatar>
              {req.user?.avatar ? (
                <img src={req.user.avatar} alt={req.user.username} />
              ) : (
                <span>{req.user?.username?.[0].toUpperCase()}</span>
              )}
            </FriendAvatar>
            <FriendInfo>
              <FriendName>{req.user?.username}</FriendName>
              <FriendSub>Wants to be your friend</FriendSub>
            </FriendInfo>
            <Actions>
              <AcceptButton onClick={() => accept(req.id)}>Accept</AcceptButton>
              <RejectButton onClick={() => reject(req.id)}>
                Decline
              </RejectButton>
            </Actions>
          </FriendItem>
        ))}
      </Section>

      <Section>
        <SectionTitle>Friends</SectionTitle>

        {friendsData?.data.length === 0 && <Empty>No friends yet</Empty>}

        {friendsData?.data.map((f: FriendItem) => (
          <FriendItem key={f.id}>
            <FriendAvatar>
              {f.avatar ? (
                <img src={f.avatar} alt={f.username} />
              ) : (
                <span>{f.username?.[0].toUpperCase()}</span>
              )}
            </FriendAvatar>
            <FriendInfo>
              <FriendName>{f.username}</FriendName>
            </FriendInfo>
            <MessageButton onClick={() => navigate(`/messages/${f.id}`)}>
              Message
            </MessageButton>
          </FriendItem>
        ))}
      </Section>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: ${({ theme }) => theme.colors.background};
`;

const Section = styled.div`
  margin-bottom: 40px;
`;

const SectionTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
`;

const Empty = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
  padding: 16px 0;
`;

const FriendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const FriendAvatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  span {
    color: white;
    font-size: 16px;
    font-weight: 600;
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const FriendInfo = styled.div`
  flex: 1;
`;

const FriendName = styled.p`
  font-size: 15px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
`;

const FriendSub = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const AcceptButton = styled.button`
  padding: 6px 14px;
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 13px;
  font-weight: 500;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.85;
  }
`;

const RejectButton = styled.button`
  padding: 6px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textLight};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.danger};
    color: ${({ theme }) => theme.colors.danger};
  }
`;

const MessageButton = styled.button`
  padding: 6px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.sentBubble};
  color: ${({ theme }) => theme.colors.sentBubble};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.sentBubble};
    color: white;
  }
`;

export default FriendsPage;
