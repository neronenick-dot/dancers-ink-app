import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/AppShell'
import AdminShell from './components/AdminShell'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import UserHome from './pages/user/Home'
import UserClasses from './pages/user/Classes'
import UserMedia from './pages/user/Media'
import UserChat from './pages/user/Chat'
import UserProfile from './pages/user/Profile'
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminClasses from './pages/admin/Classes'
import AdminAnnouncements from './pages/admin/Announcements'
import AdminMedia from './pages/admin/Media'
import AdminSettings from './pages/admin/Settings'

function Splash() {
  return (
    <div className="splash">
      <div className="splash-logo">🩰</div>
      <div className="splash-name">Dancers Ink</div>
    </div>
  )
}

function RootRedirect() {
  const { user, profile, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Navigate to="/app/home" replace />
}

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <Splash />
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && profile?.role !== 'admin') return <Navigate to="/app/home" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/app" element={
            <ProtectedRoute><AppShell /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<UserHome />} />
            <Route path="classes" element={<UserClasses />} />
            <Route path="media" element={<UserMedia />} />
            <Route path="chat" element={<UserChat />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>

          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminShell /></ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="classes" element={<AdminClasses />} />
            <Route path="announcements" element={<AdminAnnouncements />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
