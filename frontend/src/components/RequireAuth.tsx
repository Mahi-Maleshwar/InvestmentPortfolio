import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'

export function RequireAuth() {
  const { user, loading, token } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
