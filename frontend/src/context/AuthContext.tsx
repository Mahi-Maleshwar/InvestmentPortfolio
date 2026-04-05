import { api } from '@/api/client'
import type { User } from '@/types/api'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type AuthState = {
  user: User | null
  loading: boolean
  token: string | null
  setToken: (t: string | null) => void
  refreshUser: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const setToken = useCallback((t: string | null) => {
    setTokenState(t)
    if (t) localStorage.setItem('token', t)
    else localStorage.removeItem('token')
  }, [])

  const refreshUser = useCallback(async () => {
    const t = localStorage.getItem('token')
    if (!t) {
      setUser(null)
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<User>('/auth/me')
      setUser(data)
      setTokenState(t)
    } catch {
      setUser(null)
      localStorage.removeItem('token')
      setTokenState(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setTokenState(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, token, setToken, refreshUser, logout }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
