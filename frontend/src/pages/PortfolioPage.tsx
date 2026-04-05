import { api } from '@/api/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatInr, cn } from '@/lib/utils'
import type { Investment, PortfolioSummary } from '@/types/api'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

const types = [
  { value: 'stock', label: 'Stock' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'mutual_fund', label: 'Mutual fund' },
]

export default function PortfolioPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editInv, setEditInv] = useState<Investment | null>(null)

  const [form, setForm] = useState({
    asset_name: '',
    asset_type: 'stock',
    quantity: '',
    buy_price: '',
    current_price: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get<PortfolioSummary>('/portfolio')
      setSummary(data)
    } catch {
      toast.error('Could not load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => void load(), 60000)
    return () => clearInterval(id)
  }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    try {
      const qty = Number(form.quantity)
      const buy = Number(form.buy_price)
      const cur = form.current_price ? Number(form.current_price) : undefined
      await api.post('/portfolio/add', {
        asset_name: form.asset_name,
        asset_type: form.asset_type,
        quantity: qty,
        buy_price: buy,
        current_price: cur,
      })
      toast.success('Investment added')
      setAddOpen(false)
      setForm({ asset_name: '', asset_type: 'stock', quantity: '', buy_price: '', current_price: '' })
      void load()
    } catch {
      toast.error('Could not add investment')
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editInv) return
    try {
      await api.put(`/portfolio/update/${editInv.id}`, {
        quantity: form.quantity ? Number(form.quantity) : undefined,
        buy_price: form.buy_price ? Number(form.buy_price) : undefined,
        current_price: form.current_price ? Number(form.current_price) : undefined,
      })
      toast.success('Updated')
      setEditInv(null)
      void load()
    } catch {
      toast.error('Update failed')
    }
  }

  async function remove(id: string) {
    if (!confirm('Delete this investment?')) return
    try {
      await api.delete(`/portfolio/delete/${id}`)
      toast.success('Removed')
      void load()
    } catch {
      toast.error('Delete failed')
    }
  }

  function openEdit(inv: Investment) {
    setEditInv(inv)
    setForm({
      asset_name: inv.asset_name,
      asset_type: inv.asset_type,
      quantity: String(inv.quantity),
      buy_price: String(inv.buy_price),
      current_price: inv.current_price != null ? String(inv.current_price) : '',
    })
  }

  const topPl =
    summary?.investments.length && summary.investments.reduce((a, b) => (a.profit_loss >= b.profit_loss ? a : b))

  if (loading && !summary) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/30" />
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Manage positions — update live prices for accurate P/L</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add investment</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New investment</DialogTitle>
            </DialogHeader>
            <form onSubmit={add} className="grid gap-4 pt-2">
              <div className="space-y-2">
                <Label>Asset name</Label>
                <Input value={form.asset_name} onChange={(e) => setForm({ ...form, asset_name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.asset_type} onValueChange={(v) => setForm({ ...form, asset_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Buy price (₹)</Label>
                  <Input
                    type="number"
                    step="any"
                    value={form.buy_price}
                    onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Current price (₹) — optional</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="Defaults to buy price"
                  value={form.current_price}
                  onChange={(e) => setForm({ ...form, current_price: e.target.value })}
                />
              </div>
              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Invested</CardDescription>
            <CardTitle className="font-display text-2xl">{formatInr(summary?.total_invested ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Current</CardDescription>
            <CardTitle className="font-display text-2xl">{formatInr(summary?.current_value ?? 0)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>P/L</CardDescription>
            <CardTitle
              className={cn(
                'font-display text-2xl',
                (summary?.profit_loss ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {formatInr(summary?.profit_loss ?? 0)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/80 overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display">Holdings</CardTitle>
          <CardDescription>Hover rows for actions</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="p-4 font-medium">Asset</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Qty</th>
                <th className="p-4 font-medium">Buy</th>
                <th className="p-4 font-medium">Current</th>
                <th className="p-4 font-medium">Value</th>
                <th className="p-4 font-medium">P/L</th>
                <th className="p-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {(summary?.investments ?? []).map((inv) => {
                const isTop = topPl && inv.id === topPl.id && inv.profit_loss > 0
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      'group border-b border-border/60 transition-colors hover:bg-muted/40',
                      isTop && 'bg-primary/5 ring-1 ring-inset ring-primary/20'
                    )}
                  >
                    <td className="p-4 font-medium">
                      <div className="flex items-center gap-2">
                        {inv.asset_name}
                        {isTop && (
                          <Badge variant="success" className="text-[10px]">
                            Top
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4 capitalize text-muted-foreground">{inv.asset_type.replace('_', ' ')}</td>
                    <td className="p-4">{inv.quantity}</td>
                    <td className="p-4">{formatInr(inv.buy_price)}</td>
                    <td className="p-4">{formatInr(inv.current_price ?? inv.buy_price)}</td>
                    <td className="p-4">{formatInr(inv.current_value)}</td>
                    <td className={cn('p-4 font-medium', inv.profit_loss >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                      {inv.profit_loss >= 0 ? '+' : ''}
                      {formatInr(inv.profit_loss)}
                      <span className="ml-1 text-xs text-muted-foreground">({inv.profit_loss_pct}%)</span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(inv)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" onClick={() => void remove(inv.id)}>
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {summary?.investments.length === 0 && (
            <p className="p-8 text-center text-muted-foreground">No investments yet — add your first holding</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editInv} onOpenChange={(o) => !o && setEditInv(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editInv?.asset_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveEdit} className="grid gap-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Buy price</Label>
                <Input
                  type="number"
                  step="any"
                  value={form.buy_price}
                  onChange={(e) => setForm({ ...form, buy_price: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Current price (mark to market)</Label>
              <Input
                type="number"
                step="any"
                value={form.current_price}
                onChange={(e) => setForm({ ...form, current_price: e.target.value })}
              />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
