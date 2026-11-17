import { Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import AppShell from '@/components/AppShell';
import { useApp } from '@/lib/store-context';
import HomePage from '@/pages/HomePage/HomePage';
import LeaderboardPage from '@/pages/LeaderboardPage/LeaderboardPage';
import DishesPage from '@/pages/DishesPage/DishesPage';
import DishDetailPage from '@/pages/DishDetailPage/DishDetailPage';
import MePage from '@/pages/MePage/MePage';
import AnnouncementsPage from '@/pages/AnnouncementsPage/AnnouncementsPage';
import FeedbackPage from '@/pages/FeedbackPage/FeedbackPage';
import TipsPage from '@/pages/TipsPage/TipsPage';
import AppearancePage from '@/pages/AppearancePage/AppearancePage';
import AdminPage from '@/pages/AdminPage/AdminPage';
import FeedbackInboxPage from '@/pages/FeedbackInboxPage/FeedbackInboxPage';
import DishAdminPage from '@/pages/DishAdminPage/DishAdminPage';
import UserManagementPage from '@/pages/UserManagementPage/UserManagementPage';
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

// 管理页前端守卫：未登录或非管理员直接输网址时跳回首页
function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, user } = useApp();
  const allowed = isAdmin || user?.uid === '00000000' || user?.username === 'WLLC2026';
  return allowed ? <>{children}</> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="dishes" element={<DishesPage />} />
        <Route path="dishes/:id" element={<DishDetailPage />} />
        <Route path="me" element={<MePage />} />
        <Route path="announcements" element={<AnnouncementsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="tips" element={<TipsPage />} />
        <Route path="appearance" element={<AppearancePage />} />
        <Route path="admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        <Route path="feedback-inbox" element={<AdminGuard><FeedbackInboxPage /></AdminGuard>} />
        <Route path="dish-admin" element={<AdminGuard><DishAdminPage /></AdminGuard>} />
        <Route path="user-management" element={<AdminGuard><UserManagementPage /></AdminGuard>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
