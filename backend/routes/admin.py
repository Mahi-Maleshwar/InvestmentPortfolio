from fastapi import APIRouter, Depends, HTTPException, Response, status
from bson.objectid import ObjectId

from database import (
    get_db,
    investments_collection,
    users_collection,
)
from models.investment import investment_from_doc
from models.user import User, user_from_doc
from routes.deps import require_admin
from schemas.investment import InvestmentOut, PortfolioSummary
from schemas.user import BlockUserBody, UserAdminList
from services.portfolio import get_portfolio_summary, investment_to_out

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserAdminList])
def list_users(db=Depends(get_db), _: User = Depends(require_admin)):
    # Aggregate to get user investment counts
    pipeline = [
        {
            "$lookup": {
                "from": "investments",
                "localField": "_id",
                "foreignField": "user_id",
                "as": "investments"
            }
        },
        {
            "$addFields": {
                "investment_count": {"$size": "$investments"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    
    users = list(users_collection.aggregate(pipeline))
    
    out: list[UserAdminList] = []
    for doc in users:
        out.append(
            UserAdminList(
                id=str(doc.get("_id")),
                name=doc.get("name"),
                email=doc.get("email"),
                role=doc.get("role"),
                is_blocked=doc.get("is_blocked"),
                investment_count=doc.get("investment_count", 0),
            )
        )
    return out


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db=Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = users_collection.delete_one({"_id": obj_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/users/{user_id}/block")
def block_user(user_id: str, body: BlockUserBody, db=Depends(get_db), admin: User = Depends(require_admin)):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot block yourself")
    
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = users_collection.update_one(
        {"_id": obj_id},
        {"$set": {"is_blocked": body.blocked}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"id": user_id, "is_blocked": body.blocked}


@router.get("/investments", response_model=list[InvestmentOut])
def all_investments(db=Depends(get_db), _: User = Depends(require_admin)):
    invs = list(investments_collection.find().sort([("user_id", 1), ("_id", 1)]))
    return [investment_to_out(investment_from_doc(i)) for i in invs]


@router.get("/stats")
def admin_stats(db=Depends(get_db), _: User = Depends(require_admin)):
    n_users = users_collection.count_documents({})
    n_inv = investments_collection.count_documents({})
    return {"total_users": n_users, "total_investments": n_inv}


@router.get("/users/{user_id}/portfolio", response_model=PortfolioSummary)
def user_portfolio(user_id: str, db=Depends(get_db), _: User = Depends(require_admin)):
    try:
        obj_id = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")
    
    doc = users_collection.find_one({"_id": obj_id})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return get_portfolio_summary(db, user_id)
