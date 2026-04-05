import { api } from '@/api/client'
import { DistributionChart, GrowthChart, PlBarChart } from '@/components/charts/PortfolioCharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatInr } from '@/lib/utils'
import type { Analytics, PortfolioSummary, Report } from '@/types/api'
import { Activity, ArrowDownRight, ArrowUpRight, Download, RefreshCw, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function Dashboard() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [p, a] = await Promise.all([
        api.get<PortfolioSummary>('/portfolio'),
        api.get<Analytics>('/analytics'),
      ])
      setPortfolio(p.data)
      setAnalytics(a.data)
    } catch {
      toast.error('Could not load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const id = setInterval(() => void load(true), 45000)
    return () => clearInterval(id)
  }, [load])

  async function downloadReport(kind: 'json' | 'print') {
    try {
      const { data } = await api.get<Report>('/portfolio/report')
      if (kind === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `portfolio-report-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Report downloaded')
      } else {
        const w = window.open('', '_blank')
        if (!w) return
        w.document.write(`
          <html><head><title>Portfolio Report</title>
          <style>
            body{font-family:system-ui;padding:2rem;max-width:640px;margin:auto;color:#0f172a}
            h1{font-size:1.5rem} table{width:100%;border-collapse:collapse;margin-top:1rem}
            td{padding:0.5rem;border-bottom:1px solid #e2e8f0}
          </style></head><body>
          <h1>Portfolio Report</h1>
          <p>Generated: ${data.generated_at}</p>
          <table>
            <tr><td>Total invested</td><td>₹${data.total_invested.toLocaleString('en-IN')}</td></tr>
            <tr><td>Current value</td><td>₹${data.current_value.toLocaleString('en-IN')}</td></tr>
            <tr><td>Profit / Loss</td><td>₹${data.profit_loss.toLocaleString('en-IN')} (${data.profit_loss_pct}%)</td></tr>
            <tr><td>Assets</td><td>${data.asset_count}</td></tr>
            <tr><td>Top performer</td><td>${data.top_performing_asset ?? '—'}</td></tr>
          </table>
          <script>window.onload=function(){window.print();}</script>
          </body></html>`)
        w.document.close()
      }
    } catch {
      toast.error('Could not generate report')
    }
  }

  if (loading || !portfolio || !analytics) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/30" />
        ))}
      </div>
    )
  }

  const plPositive = portfolio.profit_loss >= 0
  const topName = analytics.top_performer
  const risk = analytics.risk_level

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live view of your wealth — auto-refreshes every 45s</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={() => void downloadReport('json')} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">JSON</span>
          </Button>
          <Button size="sm" onClick={() => void downloadReport('print')} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">PDF / Print</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total value</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="font-display text-2xl sm:text-3xl font-bold tracking-tight">{formatInr(portfolio.current_value)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Current market value</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profit / Loss</CardTitle>
            {plPositive ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-400" />
            )}
          </CardHeader>
          <CardContent>
            <p className={`font-display text-2xl sm:text-3xl font-bold ${plPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {plPositive ? '+' : ''}
              {formatInr(portfolio.profit_loss)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {portfolio.profit_loss_pct >= 0 ? '+' : ''}
              {portfolio.profit_loss_pct.toFixed(2)}% overall
            </p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-border/80 bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Holdings & risk</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div>
              <p className="font-display text-2xl sm:text-3xl font-bold">{portfolio.asset_count}</p>
              <p className="text-xs text-muted-foreground">Assets</p>
            </div>
            <Badge
              variant={
                risk === 'high' ? 'danger' : risk === 'medium' ? 'warning' : 'success'
              }
              className="capitalize"
            >
              Risk: {risk}
            </Badge>
            {topName && (
              <div className="flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs text-primary">
                <Sparkles className="h-3 w-3" />
                Top: {topName}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="h-5 w-5 text-primary" />
              Portfolio growth
            </CardTitle>
            <CardDescription>Value snapshots over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.portfolio_history.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Add holdings to start your growth curve</p>
            ) : (
              <GrowthChart history={analytics.portfolio_history} />
            )}
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-display">Asset mix</CardTitle>
            <CardDescription>By asset class</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.asset_distribution.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No allocation data yet</p>
            ) : (
              <DistributionChart slices={analytics.asset_distribution} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display">P/L by asset</CardTitle>
          <CardDescription>Bar view — green positive, red negative</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.profit_loss_by_asset.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Nothing to chart yet</p>
          ) : (
            <PlBarChart bars={analytics.profit_loss_by_asset} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
