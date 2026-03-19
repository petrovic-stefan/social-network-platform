import { http } from "./http";

export type NotificationDto = {
  notificationId: number;
  fromUserId: number | null;
  toUserId: number | null;
  fromUsername: string | null;
  postId: number | null;
  text: string | null;
  createdAt: string | null;
  isRead: boolean;
};

type AnyNotification = Record<string, unknown>;

function pick<T>(x: AnyNotification, keys: string[], fallback: T): T {
  for (const k of keys) {
    const v = x?.[k];
    if (v !== undefined && v !== null) return v as T;
  }
  return fallback;
}

function mapNotification(x: AnyNotification): NotificationDto {
  return {
    notificationId: Number(pick(x, ["notificationId", "NotificationId"], 0)),
    fromUserId: pick<number | null>(x, ["fromUserId", "FromUserId"], null),
    toUserId: pick<number | null>(x, ["toUserId", "ToUserId"], null),
    fromUsername: pick<string | null>(x, ["fromUsername", "FromUsername"], null),
    postId: pick<number | null>(x, ["postId", "PostId"], null),
    text: pick<string | null>(x, ["text", "Text"], null),
    createdAt: pick<string | null>(x, ["createdAt", "CreatedAt"], null),
    isRead: Boolean(pick(x, ["isRead", "IsRead"], false)),
  };
}

export const notificationsApi = {
  async getUnreadCount(): Promise<number> {
    const res = await http.get<{ unreadCount: number }>("/api/notifications/unread-count");
    return res.data?.unreadCount ?? 0;
  },

  async readAll(): Promise<void> {
    await http.post("/api/notifications/read-all");
  },

  async readOne(notificationId: number): Promise<void> {
    await http.post(`/api/notifications/${notificationId}/read`);
  },

  async getLatest(take = 10): Promise<NotificationDto[]> {
    const res = await http.get<AnyNotification[]>(`/api/notifications?take=${take}`);
    const raw = res.data ?? [];
    return raw.map(mapNotification);
  },
};