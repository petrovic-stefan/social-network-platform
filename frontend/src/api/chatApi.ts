import { http } from "./http";

export type InboxItemDto = {
  conversationId: number;
  peerUserId: number;
  peerUsername: string;
  peerProfilePic: string | null;
  lastMessageText: string | null;
  lastSentAt: string | null;
  unreadCount: number;
};

export type MessageDto = {
  messages_Id: number;
  conversation_Id: number;
  from_Users_Id: number;
  to_Users_Id: number | null;
  message_Text: string;
  sent_At: string;
};

type CreateDmResponse = {
  conversationId: number;
};

/*type SendMessageResponse = {
  messageId: number;
};*/

export const chatApi = {
  async getInbox() {
    const res = await http.get<InboxItemDto[]>("/api/chat/inbox");
    return res.data ?? [];
  },

  async getOrCreateDm(otherUserId: number) {
    const res = await http.post<CreateDmResponse>(`/api/chat/dm/${otherUserId}`);
    return res.data;
  },

  async getMessages(conversationId: number, take = 50) {
    const res = await http.get<MessageDto[]>(
      `/api/chat/${conversationId}/messages`,
      { params: { take } }
    );
    return res.data ?? [];
  },

  async sendMessage(conversationId: number, text: string) {
  try {
    const res = await http.post<{ messageId: number }>(
      `/api/chat/${conversationId}/messages`,
      { text }
    );
    return res.data;
  } catch (err) {
    console.error("chatApi.sendMessage error:", err);
    throw err;
  }
},

  async markRead(conversationId: number) {
    await http.post(`/api/chat/${conversationId}/read`);
  },

  async markDelivered(conversationId: number) {
    await http.post(`/api/chat/${conversationId}/delivered`);
  },

  async deleteMessage(messageId: number) {
    await http.delete(`/api/chat/messages/${messageId}`);
  },
};