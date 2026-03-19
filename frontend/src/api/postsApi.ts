import { http } from "./http";
import type { AddCommentRequest, PostDto } from "./types";

export type PostCommentDto = {
  commentId: number;
  userId: number;
  username: string;
  text: string;
  createdAt: string;
};

type RawPostCommentDto = {
  commentId?: number;
  userId?: number;
  username?: string;
  text?: string;
  commentText?: string;
  createdAt?: string;
};

function mapComment(x: RawPostCommentDto): PostCommentDto {
  return {
    commentId: Number(x.commentId ?? 0),
    userId: Number(x.userId ?? 0),
    username: x.username ?? "",
    text: x.text ?? x.commentText ?? "",
    createdAt: x.createdAt ?? "",
  };
}

export async function getFeed(take = 10, before?: string) {
  const res = await http.get<PostDto[]>("/api/posts/feed", {
    params: {
      take,
      before,
    },
  });

  return res.data;
}

export async function getPostById(postId: number) {
  const res = await http.get<PostDto>(`/api/posts/${postId}`);
  return res.data;
}

export async function getPostComments(postId: number, take = 50) {
  const res = await http.get<RawPostCommentDto[]>(
    `/api/posts/${postId}/comments?take=${take}`
  );

  const raw = res.data ?? [];
  return raw.map(mapComment);
}

export async function likePost(postId: number) {
  await http.post(`/api/social/like/${postId}`);
}

export async function unlikePost(postId: number) {
  await http.post(`/api/social/unlike/${postId}`);
}

export async function addPostComment(postId: number, commentText: string) {
  const body: AddCommentRequest = { commentText };
  await http.post(`/api/posts/${postId}/comments`, body);
}

export async function deletePost(postId: number) {
  await http.delete(`/api/posts/${postId}`);
}

export async function updatePost(postId: number, postText: string) {
  await http.put(`/api/posts/${postId}`, { postText });
}