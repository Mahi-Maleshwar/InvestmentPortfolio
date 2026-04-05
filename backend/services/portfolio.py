from datetime import date, datetime, timezone
from typing import Optional

from bson.objectid import ObjectId

from database import investments_collection, portfolio_history_collection
from models.investment import Investment, investment_from_doc
from schemas.investment import InvestmentOut, PortfolioSummary


def effective_current_price(inv: Investment) -> float:
    if inv.current_price is not None and inv.current_price > 0:
        return float(inv.current_price)
    return float(inv.buy_price)


def investment_to_out(inv: Investment) -> InvestmentOut:
    cp = effective_current_price(inv)
    invested = float(inv.quantity) * float(inv.buy_price)
    current_value = float(inv.quantity) * cp
    pl = current_value - invested
    pct = (pl / invested * 100) if invested > 0 else 0.0
    return InvestmentOut(
        id=inv.id,
        user_id=inv.user_id,
        asset_name=inv.asset_name,
        asset_type=inv.asset_type,
        quantity=float(inv.quantity),
        buy_price=float(inv.buy_price),
        total_value=float(inv.total_value),
        current_price=inv.current_price,
        invested=round(invested, 2),
        current_value=round(current_value, 2),
        profit_loss=round(pl, 2),
        profit_loss_pct=round(pct, 2),
    )


def portfolio_current_value(db, user_id: str) -> float:
    docs = investments_collection.find({"user_id": ObjectId(user_id)})
    invs = [investment_from_doc(doc) for doc in docs]
    return sum(effective_current_price(i) * float(i.quantity) for i in invs)


def portfolio_total_invested(db, user_id: str) -> float:
    docs = investments_collection.find({"user_id": ObjectId(user_id)})
    invs = [investment_from_doc(doc) for doc in docs]
    return sum(float(i.quantity) * float(i.buy_price) for i in invs)


def record_portfolio_snapshot(db, user_id: str) -> None:
    val = portfolio_current_value(db, user_id)
    snap = {
        "user_id": ObjectId(user_id),
        "total_value": val,
        "date": datetime.combine(date.today(), datetime.min.time()),
        "recorded_at": datetime.now(timezone.utc),
    }
    portfolio_history_collection.insert_one(snap)


def get_portfolio_summary(db, user_id: str) -> PortfolioSummary:
    docs = list(investments_collection.find({"user_id": ObjectId(user_id)}))
    invs = [investment_from_doc(doc) for doc in docs]
    rows = [investment_to_out(i) for i in invs]
    invested = sum(r.invested for r in rows)
    current = sum(r.current_value for r in rows)
    pl = current - invested
    pct = (pl / invested * 100) if invested > 0 else 0.0
    return PortfolioSummary(
        total_invested=round(invested, 2),
        current_value=round(current, 2),
        profit_loss=round(pl, 2),
        profit_loss_pct=round(pct, 2),
        asset_count=len(rows),
        investments=rows,
    )


def compute_risk_level(investments: list[Investment]) -> str:
    if not investments:
        return "low"
    weights = {"crypto": 3.0, "stock": 2.0, "mutual_fund": 1.0}
    total = 0.0
    wsum = 0.0
    for inv in investments:
        w = weights.get(inv.asset_type, 2.0)
        v = float(inv.quantity) * effective_current_price(inv)
        total += w * v
        wsum += v
    score = total / wsum if wsum > 0 else 1.0
    if score >= 2.3:
        return "high"
    if score >= 1.6:
        return "medium"
    return "low"


def top_performer_name(investments: list[Investment]) -> Optional[tuple[str, float]]:
    if not investments:
        return None
    best: Optional[tuple[str, float]] = None
    for inv in investments:
        out = investment_to_out(inv)
        if best is None or out.profit_loss > best[1]:
            best = (inv.asset_name, out.profit_loss)
    return best
