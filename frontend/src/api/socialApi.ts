// src/api/socialApi.ts
import { http } from "./http";

export async function follow(toUserId: number): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>(`/api/social/follow/${toUserId}`);
  return res.data;
}

export async function unfollow(toUserId: number): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>(`/api/social/unfollow/${toUserId}`);
  return res.data;
}

export async function like(postId: number): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>(`/api/social/like/${postId}`);
  return res.data;
}

export async function unlike(postId: number): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>(`/api/social/unlike/${postId}`);
  return res.data;
}

export async function markNotificationsRead(): Promise<{ message: string }> {
  const res = await http.post<{ message: string }>(`/api/social/notifications/read`);
  return res.data;
}
export const socialApi = {
  follow: async (toUserId: number) => {
    await http.post(`/api/social/follow/${toUserId}`);
  },

  unfollow: async (toUserId: number) => {
    await http.post(`/api/social/unfollow/${toUserId}`);
  },
}
