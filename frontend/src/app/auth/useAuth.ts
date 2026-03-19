import { useMemo } from "react";
import { getAccessToken } from "./authStorage";

export function useAuth() {
  const token = getAccessToken();
  return useMemo(() => ({ isAuthed: !!token }), [token]);
}
