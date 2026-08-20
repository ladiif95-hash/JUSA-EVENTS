import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home'; import Seminars from './pages/Seminars'; import SeminarDetails from './pages/SeminarDetails'; import Login from './pages/Login'; import Register from './pages/Register'; import CompleteProfile from './pages/CompleteProfile'; import MyEvents from './pages/MyEvents'; import QRPass from './pages/QRPass'; import Profile from './pages/Profile'; import AboutJUSA from './pages/AboutJUSA'; import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword'; import ResetPassword from './pages/ResetPassword'; import OAuthCallback from './pages/OAuthCallback'; import RolePlaceholder from './pages/RolePlaceholder'; import AdminDashboard from './pages/AdminDashboard'; import AdminSeminars from './pages/AdminSeminars'; import AdminSeminarForm from './pages/AdminSeminarForm'; import AdminCheckIn from './pages/AdminCheckIn'; import AdminParticipants from './pages/AdminParticipants'; import AdminReports from './pages/AdminReports'; import AdminSettings from './pages/AdminSettings'; import AdminUsers from './pages/AdminUsers';
import Vote from './pages/Vote';
import AdminVoting from './pages/AdminVoting';
export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/seminars" element={<Seminars />} />
        <Route path="/seminars/:slug" element={<SeminarDetails />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/my-events" element={<MyEvents />} />
        <Route path="/qr-pass/:registrationId" element={<QRPass />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/about" element={<AboutJUSA />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ORGANIZER', 'ADMIN']} />}>
        <Route path="/organizer/dashboard" element={<RolePlaceholder title="Organizer dashboard" />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'STAFF']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="check-in" element={<AdminCheckIn />} />

          {/* Admin & Super Admin Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="seminars" element={<AdminSeminars />} />
            <Route path="seminars/new" element={<AdminSeminarForm />} />
            <Route path="seminars/:id/edit" element={<AdminSeminarForm />} />
            <Route path="seminars/:id/participants" element={<AdminParticipants />} />
            <Route path="voting" element={<AdminVoting />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
