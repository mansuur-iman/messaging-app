import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "../api/messages";
import { usersApi } from "../api/users";
import { useAuthStore } from "../store/authStore";
import type { Message } from "../types";

interface ServerMessageResponse {
  data: Message[];
  total: number;
  page: number;
}

const ChatPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const [sendError, setSendError] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const isSelf = userId === user?.id;

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["friends"] });
  }, [userId]);

  // Fetch target user info
  const { data: receiver } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersApi.getUser(userId!),
    enabled: !!userId,
  });

  // Fetch conversations
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => messagesApi.getMessages(userId!),
    enabled: !!userId,
    refetchInterval: 4000, // Slightly extended to minimize DB locks on long queries
    retry: false,
  });

  const messages = (data?.data as Message[]) || [];

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: (text: string) => messagesApi.sendMessage(userId!, text),

    onMutate: async (newMessage) => {
      await queryClient.cancelQueries({ queryKey: ["messages", userId] });
      const previous = queryClient.getQueryData<ServerMessageResponse>([
        "messages",
        userId,
      ]);

      const optimisticMessage: Message = {
        id: crypto.randomUUID(),
        content: newMessage,
        senderId: user?.id || "",
        receiverId: userId || "",
        createdAt: new Date().toISOString(),
        read: isSelf,
      };

      // --- FIX: Safely mutate structural layout to align with paginated wrappers ---
      queryClient.setQueryData<ServerMessageResponse>(
        ["messages", userId],
        (old) => {
          if (!old) return { data: [optimisticMessage], total: 1, page: 1 };
          return {
            ...old,
            total: (old.total || 0) + 1,
            data: [...(old.data || []), optimisticMessage],
          };
        },
      );

      setContent("");
      setSendError("");
      return { previous };
    },

    onError: (err, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["messages", userId], context.previous);
      }
      const message = err?.message || "Failed to send message";
      setSendError(message);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
    },
  });

  // Auto Scroll down to view new inputs
  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // Handle auto-expanding textareas smoothly
  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [content]);

  const handleSend = () => {
    if (!content.trim() || isPending) return;
    sendMessage(content.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) return <Centered>Loading conversation...</Centered>;
  if (error)
    return (
      <Centered>You can only message yourself or accepted friends.</Centered>
    );

  return (
    <Container>
      <Header>
        <HeaderLeft>
          <Avatar>
            {isSelf ? (
              <span>📝</span>
            ) : receiver?.avatar ? (
              <img src={receiver.avatar} alt={receiver.username} />
            ) : (
              <span>{receiver?.username?.[0]?.toUpperCase()}</span>
            )}
          </Avatar>
          <HeaderInfo>
            <Name>{isSelf ? "Personal Notes" : receiver?.username}</Name>
            <Status>{isSelf ? "Organize your thoughts" : "Friend"}</Status>
          </HeaderInfo>
        </HeaderLeft>
      </Header>

      <MessagesContainer>
        {messages.length === 0 ? (
          <EmptyState>
            <EmptyIcon>💬</EmptyIcon>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyText>Start the conversation</EmptyText>
          </EmptyState>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === user?.id;
            return (
              <MessageRow key={msg.id} $isSent={isSent}>
                <MessageBubble $isSent={isSent}>{msg.content}</MessageBubble>
                <MessageMeta>
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </MessageMeta>
              </MessageRow>
            );
          })
        )}
        <div ref={bottomRef} />
      </MessagesContainer>

      <Composer>
        <ComposerInner>
          <Input
            ref={textareaRef}
            rows={1}
            placeholder={
              isSelf ? "Write a note to yourself..." : "Type a message..."
            }
            value={content}
            disabled={isPending}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              setContent(e.target.value);
              if (sendError) setSendError("");
            }}
          />
          <SendButton
            disabled={!content.trim() || isPending}
            onClick={handleSend}
          >
            ↑
          </SendButton>
        </ComposerInner>
        {sendError && <ErrorText>{sendError}</ErrorText>}
      </Composer>
    </Container>
  );
};

// --- (Keep styled components identical to your source files below this line) ---
const Container = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.background};
`;
const Header = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 22px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
  backdrop-filter: blur(8px);
`;
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
const Avatar = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  span {
    color: white;
    font-size: 16px;
    font-weight: 700;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const HeaderInfo = styled.div``;
const Name = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const Status = styled.p`
  margin-top: 3px;
  font-size: 12px;
  color: ${({ theme }) => theme.colors.textLight};
`;
const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  scroll-behavior: smooth;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.border};
    border-radius: 999px;
  }
`;
const MessageRow = styled.div<{ $isSent: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ $isSent }) => ($isSent ? "flex-end" : "flex-start")};
`;
const MessageBubble = styled.div<{ $isSent: boolean }>`
  max-width: min(70%, 520px);
  padding: 11px 15px;
  border-radius: ${({ $isSent }) =>
    $isSent ? "20px 20px 6px 20px" : "20px 20px 20px 6px"};
  background: ${({ theme, $isSent }) =>
    $isSent ? theme.colors.sentBubble : theme.colors.receivedBubble};
  color: ${({ $isSent }) => ($isSent ? "white" : "#111")};
  font-size: 15px;
  line-height: 1.45;
  word-break: break-word;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
`;
const MessageMeta = styled.span`
  margin-top: 4px;
  padding: 0 6px;
  font-size: 11px;
  color: ${({ theme }) => theme.colors.textLight};
`;
const Composer = styled.div`
  padding: 14px 18px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.background};
`;
const ComposerInner = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 10px;
`;
const Input = styled.textarea`
  flex: 1;
  min-height: 46px;
  max-height: 120px;
  padding: 12px 16px;
  border-radius: 24px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.sidebar};
  color: ${({ theme }) => theme.colors.text};
  font-size: 15px;
  line-height: 1.4;
  resize: none;
  overflow-y: auto;
  transition:
    border 0.18s ease,
    background 0.18s ease;
  &:focus {
    border-color: ${({ theme }) => theme.colors.sentBubble};
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
  &:disabled {
    opacity: 0.65;
  }
`;
const SendButton = styled.button`
  width: 46px;
  height: 46px;
  border: none;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.16s ease,
    opacity 0.16s ease;
  &:hover:not(:disabled) {
    transform: scale(1.04);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;
const ErrorText = styled.p`
  margin-top: 8px;
  margin-left: 4px;
  font-size: 13px;
  color: #ef4444;
`;
const EmptyState = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;
const EmptyIcon = styled.div`
  font-size: 46px;
`;
const EmptyTitle = styled.h3`
  margin-top: 14px;
  font-size: 20px;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
`;
const EmptyText = styled.p`
  margin-top: 8px;
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
`;
const Centered = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: 15px;
`;

export default ChatPage;
