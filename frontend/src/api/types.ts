export type Gender = "Male" | "Female" | "Other";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}
export type PostDto = {
  postId: number;
  userId: number;
  username: string;
  profilePic: string | null;
  content: string | null;
  postImg: string | null;
  createdAt: string; 
  likeCount: number;
  commentCount: number;
  isLikedByMe: boolean;
};
export type AddCommentRequest = {
  commentText: string;
};
export type CommentDto = {
  commentId: number;
  postId: number;
  userId: number;
  username: string;
  profilePic: string | null;
  commentText: string;
  createdAt: string;
};
export type UserProfileDto = {
  userId: number;
  username: string;
  profilePic: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe: boolean;
};
export type SearchUserDto = {
  userId: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  profilePic: string | null;
  isFollowedByMe: boolean;
};
export type MyProfileDto = {
  users_Id: number;
  username: string;
  email: string;
  first_Name: string;
  last_Name: string;
  gender: string | null;
  bio: string | null;
  profile_Pic: string | null;
  profilePicUrl: string | null;
};

export type UpdateMeRequest = {
  firstName: string;
  lastName: string;
  gender: string | null;
  bio: string | null;
};
export interface AuthResponse {
  accessToken: string;
}
