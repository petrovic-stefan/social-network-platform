import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import RegisterPage from "../pages/auth/RegisterPage";
import FeedPage from "../pages/app/FeedPage";
import PostDetailsPage from "../pages/app/PostDetailsPage";
import UserProfilePage from "../pages/app/UserProfilePage";
import SettingsPage from "../pages/app/SettingsPage";
import CreatePostPage from "../pages/app/CreatePostPage";
import EditPostPage from "../pages/app/EditPostPage";
import NotificationsPage from "../pages/app/NotificationsPage";
import InboxPage from "../pages/app/InboxPage";
import ChatConversationPage from "../pages/app/ChatConversationPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/app" element={<FeedPage />} />
            <Route path="/app/posts/:postId" element={<PostDetailsPage />} />
            <Route path="/app/u/:username" element={<UserProfilePage />} />
            <Route path="/app/settings" element={<SettingsPage />} />
            <Route path="/app/create" element={<CreatePostPage />} />
            <Route path="/app/posts/:postId/edit" element={<EditPostPage />} />
            <Route path="/app/notifications" element={<NotificationsPage />} />
            <Route path="/app/messages" element={<InboxPage />} />
            <Route path="/app/messages/:conversationId" element={<ChatConversationPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}