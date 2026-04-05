from pydantic import BaseModel


class HistoryPoint(BaseModel):
    date: str
    total_value: float


class AssetSlice(BaseModel):
    label: str
    value: float
    asset_type: str


class BarPoint(BaseModel):
    asset_name: str
    profit_loss: float
    asset_type: str


class AnalyticsOut(BaseModel):
    portfolio_history: list[HistoryPoint]
    asset_distribution: list[AssetSlice]
    profit_loss_by_asset: list[BarPoint]
    risk_level: str
    top_performer: str | None
