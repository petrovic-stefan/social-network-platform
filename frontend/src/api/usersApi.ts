import { http } from "./http";
import type {
  UserProfileDto,
  PostDto,
  SearchUserDto,
  MyProfileDto,
  UpdateMeRequest,
} from "./types";

type UploadProfilePhotoResponse = {
  fileName: string;
  relativePath: string;
  url: string;
};

export const usersApi = {
  async getMe() {
    const res = await http.get<MyProfileDto>("/api/users/me");
    return res.data;
  },

  async updateMe(payload: UpdateMeRequest) {
    const res = await http.put("/api/users/me", payload);
    return res.data;
  },

  async updateProfilePic(profilePic: string) {
    const res = await http.put("/api/users/me/profile-pic", { profilePic });
    return res.data;
  },

  async uploadProfilePhoto(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await http.post<UploadProfilePhotoResponse>(
      "/api/files/upload-profile",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  },

  async getProfile(username: string) {
    const res = await http.get<UserProfileDto>(
      `/api/users/${encodeURIComponent(username)}/profile`
    );
    return res.data;
  },

  async getPosts(username: string, take = 24) {
    const res = await http.get<PostDto[]>(
      `/api/users/${encodeURIComponent(username)}/posts`,
      { params: { take } }
    );
    return res.data;
  },

  async search(query: string, take = 8) {
    const q = query.trim();
    if (!q) return [];

    const res = await http.get<SearchUserDto[]>("/api/users/search", {
      params: { q, take },
    });

    return res.data ?? [];
  },
  async createPostMultipart(content: string, file?: File) {
  const formData = new FormData();
  formData.append("postText", content);

  if (file) {
    formData.append("file", file);
  }

  const res = await http.post("/api/posts/multipart", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
},
};