from pydantic import BaseModel


class ReportOut(BaseModel):
    total_invested: float
    current_value: float
    profit_loss: float
    profit_loss_pct: float
    top_performing_asset: str | None
    top_performer_pl: float | None
    generated_at: str
    asset_count: int
