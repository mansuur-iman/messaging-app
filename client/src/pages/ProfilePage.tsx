import { useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { usersApi } from "../api/users";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: user?.username || "",
    avatar: user?.avatar || "",
    bio: user?.bio || "",
  });

  const { mutate: update, isPending } = useMutation({
    mutationFn: () => usersApi.updateUser(user!.id, form),
    onSuccess: (data) => {
      updateUser(data);
      setSuccess("Profile updated successfully");
      setError("");
    },
    onError: (err: any) => {
      setError(err.message);
      setSuccess("");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update();
  };

  return (
    <Container>
      <Card>
        <BackButton onClick={() => navigate(-1)}>← Back</BackButton>

        <AvatarSection>
          <Avatar>
            {form.avatar ? (
              <img src={form.avatar} alt={form.username} />
            ) : (
              <Initials>{user?.username?.[0].toUpperCase()}</Initials>
            )}
          </Avatar>
          <Username>{user?.username}</Username>
          <Email>{user?.email}</Email>
        </AvatarSection>

        {success && <SuccessMsg>{success}</SuccessMsg>}
        {error && <ErrorMsg>{error}</ErrorMsg>}

        <Form onSubmit={handleSubmit}>
          <Label>Username</Label>
          <Input
            name="username"
            value={form.username}
            onChange={handleChange}
            placeholder="Username"
          />

          <Label>Avatar URL</Label>
          <Input
            name="avatar"
            value={form.avatar}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
          />

          <Label>Bio</Label>
          <TextArea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself..."
            rows={4}
          />

          <SaveButton type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </SaveButton>
        </Form>

        <DangerZone>
          <DangerTitle>Danger Zone</DangerTitle>
          <DeleteButton onClick={() => navigate("/delete-account")}>
            Delete account
          </DeleteButton>
        </DangerZone>
      </Card>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.sidebar};
  padding: 24px;
  overflow-y: auto;
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
  padding: 40px;
  width: 100%;
  max-width: 480px;
`;

const BackButton = styled.button`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.sentBubble};
  margin-bottom: 24px;
  display: block;
`;

const AvatarSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32px;
  gap: 8px;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sentBubble};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 4px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Initials = styled.span`
  color: white;
  font-size: 28px;
  font-weight: 600;
`;

const Username = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const Email = styled.p`
  font-size: 14px;
  color: ${({ theme }) => theme.colors.textLight};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textLight};
  margin-top: 8px;
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};

  &:focus {
    border-color: ${({ theme }) => theme.colors.sentBubble};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const TextArea = styled.textarea`
  padding: 10px 14px;
  border: 1.5px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 15px;
  color: ${({ theme }) => theme.colors.text};
  resize: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.sentBubble};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.textLight};
  }
`;

const SaveButton = styled.button`
  padding: 12px;
  background: ${({ theme }) => theme.colors.sentBubble};
  color: white;
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const SuccessMsg = styled.p`
  color: ${({ theme }) => theme.colors.online};
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
`;

const ErrorMsg = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;
  margin-bottom: 16px;
  text-align: center;
`;

const DangerZone = styled.div`
  margin-top: 40px;
  padding-top: 24px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const DangerTitle = styled.p`
  font-size: 13px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.danger};
  margin-bottom: 12px;
`;

const DeleteButton = styled.button`
  width: 100%;
  padding: 10px;
  border: 1.5px solid ${({ theme }) => theme.colors.danger};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.danger};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${({ theme }) => theme.colors.danger};
    color: white;
  }
`;

export default ProfilePage;
