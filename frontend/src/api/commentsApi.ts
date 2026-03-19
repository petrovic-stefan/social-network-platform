import { http } from "./http";
import type { AddCommentRequest, CommentDto } from "./types";

export async function getCommentsForPost(postId: number) {
  const res = await http.get<CommentDto[]>(`/api/posts/${postId}/comments`);
  return res.data;
}

export async function addComment(postId: number, commentText: string) {
  const body: AddCommentRequest = { commentText };
  const res = await http.post<{ message: string }>(`/api/posts/${postId}/comments`, body);
  return res.data; // { message: "Comment added" }
}

export async function deleteComment(commentId: number) {
  const res = await http.delete<{ message: string }>(`/api/comments/${commentId}`);
  return res.data;
}
