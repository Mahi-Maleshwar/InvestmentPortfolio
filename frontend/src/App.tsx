import { AppShell } from '@/components/layout/AppShell'
import { RequireAuth } from '@/components/RequireAuth'
import { useAuth } from '@/context/AuthContext'
import AdminPage from '@/pages/AdminPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import Dashboard from '@/pages/Dashboard'
import ForgotPassword from '@/pages/ForgotPassword'
import Login from '@/pages/Login'
import PortfolioPage from '@/pages/PortfolioPage'
import ProfilePage from '@/pages/ProfilePage'
import Register from '@/pages/Register'
import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

function PublicOnly({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }
  if (token) return <Navigate to="/" replace />
  return <>{children}</>
}

function AdminRoute() {
  const { user } = useAuth()
  if (user?.role !== 'admin') return <Navigate to="/" replace />
  return <AdminPage />
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnly>
            <Login />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <Register />
          </PublicOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicOnly>
            <ForgotPassword />
          </PublicOnly>
        }
      />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="portfolio" element={<PortfolioPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="admin" element={<AdminRoute />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
