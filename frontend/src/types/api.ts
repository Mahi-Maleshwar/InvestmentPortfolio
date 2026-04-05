export type User = {
  id: string
  name: string
  email: string
  role: string
  is_blocked: boolean
}

export type Investment = {
  id: string
  user_id: string
  asset_name: string
  asset_type: string
  quantity: number
  buy_price: number
  total_value: number
  current_price: number | null
  invested: number
  current_value: number
  profit_loss: number
  profit_loss_pct: number
}

export type PortfolioSummary = {
  total_invested: number
  current_value: number
  profit_loss: number
  profit_loss_pct: number
  asset_count: number
  investments: Investment[]
}

export type Analytics = {
  portfolio_history: { date: string; total_value: number }[]
  asset_distribution: { label: string; value: number; asset_type: string }[]
  profit_loss_by_asset: { asset_name: string; profit_loss: number; asset_type: string }[]
  risk_level: string
  top_performer: string | null
}

export type Report = {
  total_invested: number
  current_value: number
  profit_loss: number
  profit_loss_pct: number
  top_performing_asset: string | null
  top_performer_pl: number | null
  generated_at: string
  asset_count: number
}

export type AdminUser = User & { investment_count: number }
