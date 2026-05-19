import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "../api/messages";
import { usersApi } from "../api/users";
import { useAuthStore } from "../store/authStore";
import type { Message } from "../types/index";

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: receiver } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.getUser(userId!),
    enabled: !!userId,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => messagesApi.getMessages(userId!),
    enabled: !!userId,
    refetchInterval: 5000, // poll every 5 seconds
  });

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (content: string) => messagesApi.sendMessage(userId!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
      setContent("");
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.data]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <Loading>Loading...</Loading>;

  return (
    <Container>
      <Header>
        <HeaderAvatar>
          {receiver?.avatar ? (
            <img src={receiver.avatar} alt={receiver.username} />
          ) : (
            <span>{receiver?.username?.[0].toUpperCase()}</span>
          )}
        </HeaderAvatar>
        <HeaderInfo>
          <HeaderName>{receiver?.username}</HeaderName>
          {receiver?.bio && <HeaderBio>{receiver.bio}</HeaderBio>}
        </HeaderInfo>
      </Header>

      <MessageList>
        {data?.data.map((msg: Message) => (
          <MessageBubble key={msg.id} $isSent={msg.senderId === user?.id}>
            <BubbleContent $isSent={msg.senderId === user?.id}>
              {msg.content}
            </BubbleContent>
            <MessageTime $isSent={msg.senderId === user?.id}>
              {new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </MessageTime>
          </MessageBubble>
        ))}
        <div ref={bottomRef} />
      </MessageList>

      <InputArea>
        <Input
          placeholder="Message..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <SendButton
          onClick={handleSend}
          disabled={!content.trim() || isPending}
        >
          ↑
        </SendButton>
      </InputArea>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${({ theme }) => theme.colors.background};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  gap: 12px;
  background: ${({ theme }) => theme.colors.background};
`;

const HeaderAvatar = styled.div`
  width: 40px;
  height: 40px;
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

const HeaderInfo = styled.div`
  flex: 1;
`;

const HeaderName = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const HeaderBio = styled.p`
  font-size: 13px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MessageBubble = styled.div<{ $isSent: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isSent }) => ($isSent ? "flex-end" : "flex-start")};
  margin-bottom: 2px;
`;

const BubbleContent = styled.div<{ $isSent: boolean }>`
  max-width: 65%;
  padding: 8px 14px;
  border-radius: ${({ $isSent }) =>
    $isSent ? "18px 18px 4px 18px" : "18px 18px 18px 4px"};
  background: ${({ theme, $isSent }) =>
    $isSent ? theme.colors.sentBubble : theme.colors.receivedBubble};
  color: ${({ $isSent }) => ($isSent ? "white" : "#1C1C1E")};
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
`;

const MessageTime = styled.span<{ $isSent: boolean }>`
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textLight};
  margin-top: 2px;
  padding: 0 4px;
`;

const InputArea = styled.div`
  display: flex;
  align-items: flex-end;
  padding: 12px 16px;
  gap: 8px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
`;

const Input = styled.textarea`
  flex: 1;
  padding: 10px 16px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.background};
  resize: none;
  max-height: 120px;
  line-height: 1.4;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.sentBubble};
  }
`;

const SendButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.85;
  }
`;

const Loading = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 15px;
`;

export default ChatPage;
