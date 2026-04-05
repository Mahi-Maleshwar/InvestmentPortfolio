import { api } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/context/AuthContext'
import { formatInr } from '@/lib/utils'
import type { AdminUser, Investment } from '@/types/api'
import { Ban, Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Stats = { total_users: number; total_investments: number }

export default function AdminPage() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [investments, setInvestments] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [u, s, i] = await Promise.all([
        api.get<AdminUser[]>('/admin/users'),
        api.get<Stats>('/admin/stats'),
        api.get<Investment[]>('/admin/investments'),
      ])
      setUsers(u.data)
      setStats(s.data)
      setInvestments(i.data)
    } catch {
      toast.error('Admin data failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function toggleBlock(u: AdminUser) {
    try {
      await api.patch(`/admin/users/${u.id}/block`, { blocked: !u.is_blocked })
      toast.success(u.is_blocked ? 'User unblocked' : 'User blocked')
      void load()
    } catch {
      toast.error('Action failed')
    }
  }

  async function deleteUser(id: string) {
    if (!confirm('Permanently delete this user and their data?')) return
    try {
      await api.delete(`/admin/users/${id}`)
      toast.success('User deleted')
      void load()
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e && e.response && typeof e.response === 'object' && 'data' in e.response
        ? String((e.response as { data?: { detail?: string } }).data?.detail)
        : 'Delete failed'
      toast.error(msg)
    }
  }

  if (loading && !stats) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">Users, platform stats, and all investments</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Total users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{stats?.total_users ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Total investments</CardTitle>
            <Badge variant="secondary">DB rows</Badge>
          </CardHeader>
          <CardContent>
            <p className="font-display text-4xl font-bold">{stats?.total_investments ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display">Users</CardTitle>
          <CardDescription>Block or remove accounts</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">ID</th>
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Investments</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="p-4">{u.id}</td>
                  <td className="p-4 font-medium">{u.name}</td>
                  <td className="p-4 text-muted-foreground">{u.email}</td>
                  <td className="p-4 capitalize">{u.role}</td>
                  <td className="p-4">{u.investment_count}</td>
                  <td className="p-4">
                    {u.is_blocked ? <Badge variant="danger">Blocked</Badge> : <Badge variant="success">Active</Badge>}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => void toggleBlock(u)} className="gap-1">
                        <Ban className="h-3 w-3" />
                        {u.is_blocked ? 'Unblock' : 'Block'}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => void deleteUser(u.id)} disabled={u.id === me?.id}>
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-border/80 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display">All investments</CardTitle>
          <CardDescription>Across every user</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          <table className="w-full min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Value</th>
                <th className="p-4 font-medium">P/L</th>
              </tr>
            </thead>
            <tbody>
              {investments.map((inv) => (
                <tr key={inv.id} className="border-b border-border/60 hover:bg-muted/30">
                  <td className="p-4 text-muted-foreground">#{inv.user_id}</td>
                  <td className="p-4 font-medium">{inv.asset_name}</td>
                  <td className="p-4 capitalize">{inv.asset_type.replace('_', ' ')}</td>
                  <td className="p-4">{formatInr(inv.current_value)}</td>
                  <td className={`p-4 font-medium ${inv.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatInr(inv.profit_loss)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {investments.length === 0 && <p className="p-8 text-center text-muted-foreground">No investments</p>}
        </CardContent>
      </Card>
    </div>
  )
}
