from datetime import datetime, timezone

from bson.objectid import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Response, status

from database import (
    get_db,
    investments_collection,
    portfolio_history_collection,
    transactions_collection,
)
from models.investment import Investment, investment_from_doc, investment_to_doc
from models.transaction import Transaction, transaction_to_doc
from models.user import User
from routes.deps import get_current_user
from schemas.investment import InvestmentCreate, InvestmentOut, InvestmentUpdate, PortfolioSummary
from schemas.report import ReportOut
from services.portfolio import (
    get_portfolio_summary,
    investment_to_out,
    record_portfolio_snapshot,
    top_performer_name,
)

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.post("/add", response_model=InvestmentOut)
def add_investment(body: InvestmentCreate, db=Depends(get_db), user: User = Depends(get_current_user)):
    total = body.quantity * body.buy_price
    current = body.current_price if body.current_price is not None else body.buy_price
    inv = Investment(
        user_id=user.id,
        asset_name=body.asset_name,
        asset_type=body.asset_type,
        quantity=body.quantity,
        buy_price=body.buy_price,
        total_value=total,
        current_price=current,
    )
    result = investments_collection.insert_one(investment_to_doc(inv))
    inv.id = str(result.inserted_id)
    
    # Add transaction record
    trans = Transaction(
        user_id=user.id,
        investment_id=inv.id,
        action="add",
    )
    transactions_collection.insert_one(transaction_to_doc(trans))
    
    record_portfolio_summary(db, user.id)
    return investment_to_out(inv)


@router.get("", response_model=PortfolioSummary)
def get_portfolio(db=Depends(get_db), user: User = Depends(get_current_user)):
    return get_portfolio_summary(db, user.id)


@router.get("/report", response_model=ReportOut)
def get_report(db=Depends(get_db), user: User = Depends(get_current_user)):
    summary = get_portfolio_summary(db, user.id)
    invs = list(investments_collection.find({"user_id": ObjectId(user.id)}))
    investments = [investment_from_doc(doc) for doc in invs]
    top = top_performer_name(investments)
    return ReportOut(
        total_invested=summary.total_invested,
        current_value=summary.current_value,
        profit_loss=summary.profit_loss,
        profit_loss_pct=summary.profit_loss_pct,
        top_performing_asset=top[0] if top else None,
        top_performer_pl=top[1] if top else None,
        generated_at=datetime.now(timezone.utc).isoformat(),
        asset_count=summary.asset_count,
    )


@router.put("/update/{investment_id}", response_model=InvestmentOut)
def update_investment(
    investment_id: str,
    body: InvestmentUpdate,
    db=Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        obj_id = ObjectId(investment_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    
    doc = investments_collection.find_one({"_id": obj_id})
    if not doc or str(doc.get("user_id")) != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    
    inv = investment_from_doc(doc)
    
    update_data = {}
    if body.quantity is not None:
        update_data["quantity"] = body.quantity
        inv.quantity = body.quantity
    if body.buy_price is not None:
        update_data["buy_price"] = body.buy_price
        inv.buy_price = body.buy_price
    if body.current_price is not None:
        update_data["current_price"] = body.current_price
        inv.current_price = body.current_price
    
    if update_data:
        update_data["total_value"] = float(inv.quantity) * float(inv.buy_price)
        investments_collection.update_one({"_id": obj_id}, {"$set": update_data})
        inv.total_value = update_data["total_value"]
    
    # Add transaction record
    trans = Transaction(
        user_id=user.id,
        investment_id=investment_id,
        action="update",
    )
    transactions_collection.insert_one(transaction_to_doc(trans))
    
    record_portfolio_summary(db, user.id)
    return investment_to_out(inv)


@router.delete("/delete/{investment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(investment_id: str, db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        obj_id = ObjectId(investment_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    
    doc = investments_collection.find_one({"_id": obj_id})
    if not doc or str(doc.get("user_id")) != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investment not found")
    
    # Add transaction record before deletion
    trans = Transaction(
        user_id=user.id,
        investment_id=investment_id,
        action="delete",
    )
    transactions_collection.insert_one(transaction_to_doc(trans))
    
    investments_collection.delete_one({"_id": obj_id})
    record_portfolio_summary(db, user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def record_portfolio_summary(db, user_id: str) -> None:
    """Wrapper to maintain compatibility with old function signature."""
    record_portfolio_snapshot(db, user_id)
