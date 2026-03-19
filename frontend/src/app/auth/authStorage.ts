const TOKEN_KEY = "sn_access_token";
const USER_ID_KEY = "userId";
const USERNAME_KEY = "username";

type JwtPayload = {
  userId?: string;
  nameid?: string;
  unique_name?: string;
  username?: string;
  sub?: string;
  [key: string]: unknown;
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);

  const payload = parseJwt(token);
  if (!payload) return;

  const rawUserId =
    typeof payload.userId === "string"
      ? payload.userId
      : typeof payload.nameid === "string"
      ? payload.nameid
      : typeof payload.sub === "string"
      ? payload.sub
      : null;

  const rawUsername =
    typeof payload.unique_name === "string"
      ? payload.unique_name
      : typeof payload.username === "string"
      ? payload.username
      : null;

  if (rawUserId && rawUserId.trim()) {
    localStorage.setItem(USER_ID_KEY, rawUserId);
  }

  if (rawUsername && rawUsername.trim()) {
    localStorage.setItem(USERNAME_KEY, rawUsername);
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getAuthUserId() {
  const value = localStorage.getItem(USER_ID_KEY);
  return value ? Number(value) : null;
}

export function getAuthUsername() {
  return localStorage.getItem(USERNAME_KEY);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USERNAME_KEY);
}