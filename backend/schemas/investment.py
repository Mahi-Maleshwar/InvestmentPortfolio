from typing import Literal, Optional

from pydantic import BaseModel, Field

AssetType = Literal["stock", "crypto", "mutual_fund"]


class InvestmentCreate(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=255)
    asset_type: AssetType
    quantity: float = Field(..., gt=0)
    buy_price: float = Field(..., gt=0)
    current_price: Optional[float] = Field(None, gt=0)


class InvestmentUpdate(BaseModel):
    quantity: Optional[float] = Field(None, gt=0)
    buy_price: Optional[float] = Field(None, gt=0)
    current_price: Optional[float] = Field(None, gt=0)


class InvestmentOut(BaseModel):
    id: str
    user_id: str
    asset_name: str
    asset_type: str
    quantity: float
    buy_price: float
    total_value: float
    current_price: Optional[float] = None
    invested: float
    current_value: float
    profit_loss: float
    profit_loss_pct: float

    model_config = {"from_attributes": True}


class PortfolioSummary(BaseModel):
    total_invested: float
    current_value: float
    profit_loss: float
    profit_loss_pct: float
    asset_count: int
    investments: list[InvestmentOut]
