import { http } from "./http";
import type { LoginRequest, RegisterRequest, AuthResponse } from "./types";

export async function login(data: LoginRequest) {
  const res = await http.post<AuthResponse>("/api/auth/login", data);
  return res.data;
}

export async function register(data: RegisterRequest) {
  const res = await http.post<AuthResponse>("/api/auth/register", data);
  return res.data;
}
