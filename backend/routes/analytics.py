from fastapi import APIRouter, Depends
from bson.objectid import ObjectId

from database import get_db, investments_collection, portfolio_history_collection
from models.investment import investment_from_doc
from models.portfolio_history import portfolio_history_from_doc
from models.user import User
from routes.deps import get_current_user
from schemas.analytics import AnalyticsOut, AssetSlice, BarPoint, HistoryPoint
from services.portfolio import compute_risk_level, effective_current_price, investment_to_out, top_performer_name

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("", response_model=AnalyticsOut)
def analytics(db=Depends(get_db), user: User = Depends(get_current_user)):
    # Get portfolio history
    history_docs = portfolio_history_collection.find(
        {"user_id": ObjectId(user.id)}
    ).sort([("date", 1), ("recorded_at", 1)])
    
    history = [
        HistoryPoint(
            date=str(doc.get("date")),
            total_value=round(float(doc.get("total_value", 0)), 2)
        )
        for doc in history_docs
    ]

    # Get investments
    invs_docs = list(investments_collection.find({"user_id": ObjectId(user.id)}))
    invs = [investment_from_doc(doc) for doc in invs_docs]
    
    # Calculate asset distribution by type
    type_totals: dict[str, float] = {}
    for inv in invs:
        cv = float(inv.quantity) * effective_current_price(inv)
        type_totals[inv.asset_type] = type_totals.get(inv.asset_type, 0) + cv
    
    distribution = [
        AssetSlice(label=k.replace("_", " ").title(), value=round(v, 2), asset_type=k)
        for k, v in sorted(type_totals.items(), key=lambda x: -x[1])
    ]

    # Calculate profit/loss by asset
    bars = [
        BarPoint(
            asset_name=inv.asset_name,
            profit_loss=investment_to_out(inv).profit_loss,
            asset_type=inv.asset_type,
        )
        for inv in invs
    ]
    bars.sort(key=lambda b: b.profit_loss, reverse=True)

    top = top_performer_name(invs)
    risk = compute_risk_level(invs)

    return AnalyticsOut(
        portfolio_history=history,
        asset_distribution=distribution,
        profit_loss_by_asset=bars,
        risk_level=risk,
        top_performer=top[0] if top else None,
    )
