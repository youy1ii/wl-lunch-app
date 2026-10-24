import { Routes, Route } from 'react-router-dom';
import AppShell from '@/components/AppShell';
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
import NotFoundPage from '@/pages/NotFoundPage/NotFoundPage';

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
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
