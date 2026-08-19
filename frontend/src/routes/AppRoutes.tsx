import { Routes, Route } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from '../components/common/ProtectedRoute'
import HomePage from '../pages/HomePage'
import CatalogPage from '../pages/CatalogPage'
import ListingDetailPage from '../pages/ListingDetailPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ProfilePage from '../pages/ProfilePage'
import BecomeSellerPage from '../pages/BecomeSellerPage'
import MyListingsPage from '../pages/MyListingsPage'
import CreateListingPage from '../pages/CreateListingPage'
import SellerPage from '../pages/SellerPage'
import AboutPage from '../pages/AboutPage'
import NotFoundPage from '../pages/NotFoundPage'
import ModerationPage from '../pages/ModerationPage'
import ChatsPage from '../pages/ChatsPage'
import AdminUsersPage from '../pages/AdminUsersPage'
import AdminPromoCodesPage from '../pages/AdminPromoCodesPage'
import FavoritesPage from '../pages/FavoritesPage'
import SellerDashboardPage from '../pages/SellerDashboardPage'
import DisputesPage from '../pages/DisputesPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import OrderHistoryPage from '../pages/OrderHistoryPage'
import ListingSubmittedPage from '../pages/ListingSubmittedPage'
import TelegramCallbackPage from '../pages/TelegramCallbackPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="listing/:id" element={<ListingDetailPage />} />
        <Route path="seller/:username" element={<SellerPage />} />
        <Route path="about" element={<AboutPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="profile" element={<ProfilePage />} />
          <Route path="become-seller" element={<BecomeSellerPage />} />
          <Route path="chats" element={<ChatsPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="orders" element={<OrderHistoryPage />} />
        </Route>

        <Route element={<ProtectedRoute requireSeller />}>
          <Route path="seller-dashboard" element={<SellerDashboardPage />} />
          <Route path="my-listings" element={<MyListingsPage />} />
          <Route path="my-listings/create" element={<CreateListingPage />} />
          <Route path="my-listings/submitted/:id" element={<ListingSubmittedPage />} />
          <Route path="my-listings/:id/edit" element={<CreateListingPage />} />
        </Route>

        <Route element={<ProtectedRoute requireModerator />}>
          <Route path="moderation" element={<ModerationPage />} />
        </Route>

        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="admin/users" element={<AdminUsersPage />} />
          <Route path="admin/promocodes" element={<AdminPromoCodesPage />} />
        </Route>
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="auth/telegram/callback" element={<TelegramCallbackPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
