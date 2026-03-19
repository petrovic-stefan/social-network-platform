import { Navigate, Outlet } from "react-router-dom";
import { getAccessToken } from "./authStorage";

export default function ProtectedRoute() {
  const token = getAccessToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
