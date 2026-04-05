import { api } from '@/api/client'
import { DistributionChart, GrowthChart, PlBarChart } from '@/components/charts/PortfolioCharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Analytics } from '@/types/api'
import { BarChart3, ShieldAlert, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: d } = await api.get<Analytics>('/analytics')
      setData(d)
    } catch {
      toast.error('Could not load analytics')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted/30" />
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-80 animate-pulse rounded-xl bg-muted/30" />
          <div className="h-80 animate-pulse rounded-xl bg-muted/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Chart.js visualizations — responsive & animated</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1 capitalize">
            <ShieldAlert className="h-3 w-3" />
            Risk: {data.risk_level}
          </Badge>
          {data.top_performer && (
            <Badge variant="success" className="gap-1">
              <Sparkles className="h-3 w-3" />
              {data.top_performer}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <BarChart3 className="h-5 w-5 text-primary" />
              Line — Growth over time
            </CardTitle>
            <CardDescription>Portfolio value from stored snapshots</CardDescription>
          </CardHeader>
          <CardContent>
            {data.portfolio_history.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Trade activity will populate this chart</p>
            ) : (
              <GrowthChart history={data.portfolio_history} />
            )}
          </CardContent>
        </Card>
        <Card className="border-border/80">
          <CardHeader>
            <CardTitle className="font-display">Pie — Distribution</CardTitle>
            <CardDescription>Share by asset class</CardDescription>
          </CardHeader>
          <CardContent>
            {data.asset_distribution.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Add holdings to see allocation</p>
            ) : (
              <DistributionChart slices={data.asset_distribution} />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display">Bar — P/L per asset</CardTitle>
          <CardDescription>Compare performance across positions</CardDescription>
        </CardHeader>
        <CardContent>
          {data.profit_loss_by_asset.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No positions</p>
          ) : (
            <PlBarChart bars={data.profit_loss_by_asset} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
