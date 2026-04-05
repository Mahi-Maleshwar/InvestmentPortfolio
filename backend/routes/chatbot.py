from fastapi import APIRouter, Depends
from pydantic import BaseModel

from database import investments_collection, portfolio_history_collection
from models.investment import investment_from_doc
from models.portfolio_history import portfolio_history_from_doc
from models.user import User
from routes.deps import get_current_user
from services.portfolio import get_portfolio_summary

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


class ChatMessage(BaseModel):
    message: str


class ChatResponse(BaseModel):
    response: str


class PortfolioInsight(BaseModel):
    total_value: float
    total_invested: float
    profit_loss: float
    profit_loss_pct: float
    asset_count: int
    top_performer: str | None
    worst_performer: str | None
    risk_level: str
    diversification_score: str
    recommendation: str


def analyze_portfolio(user_id: str, db) -> PortfolioInsight:
    """Analyze user's portfolio and generate insights."""
    summary = get_portfolio_summary(db, user_id)
    
    # Get investments
    from bson.objectid import ObjectId
    inv_docs = list(investments_collection.find({"user_id": ObjectId(user_id)}))
    investments = [investment_from_doc(doc) for doc in inv_docs]
    
    # Get portfolio history
    history_docs = list(portfolio_history_collection.find(
        {"user_id": ObjectId(user_id)}
    ).sort("date", -1).limit(7))
    history = [portfolio_history_from_doc(doc) for doc in history_docs]
    
    # Find top and worst performers
    top_performer = None
    worst_performer = None
    if investments:
        sorted_by_pl = sorted(investments, key=lambda x: 
            (x.quantity * (x.current_price or x.buy_price)) - (x.quantity * x.buy_price), 
            reverse=True)
        top_performer = sorted_by_pl[0].asset_name if sorted_by_pl else None
        worst_performer = sorted_by_pl[-1].asset_name if len(sorted_by_pl) > 1 else None
    
    # Calculate diversification
    type_counts = {}
    for inv in investments:
        type_counts[inv.asset_type] = type_counts.get(inv.asset_type, 0) + 1
    
    diversification_score = "Good" if len(type_counts) >= 3 else "Fair" if len(type_counts) >= 2 else "Poor"
    
    # Generate recommendation
    recommendation = generate_recommendation(summary, type_counts, investments)
    
    # Calculate risk level
    from services.portfolio import compute_risk_level
    risk = compute_risk_level(investments)
    
    return PortfolioInsight(
        total_value=summary.current_value,
        total_invested=summary.total_invested,
        profit_loss=summary.profit_loss,
        profit_loss_pct=summary.profit_loss_pct,
        asset_count=summary.asset_count,
        top_performer=top_performer,
        worst_performer=worst_performer,
        risk_level=risk,
        diversification_score=diversification_score,
        recommendation=recommendation
    )


def generate_recommendation(summary, type_counts, investments):
    """Generate personalized investment recommendation."""
    recommendations = []
    
    # Check diversification
    if len(type_counts) < 2:
        recommendations.append("Consider diversifying across different asset types (stocks, crypto, mutual funds) to reduce risk.")
    
    # Check profit/loss
    if summary.profit_loss_pct < -10:
        recommendations.append("Your portfolio is down significantly. Consider reviewing underperforming assets or holding for long-term recovery.")
    elif summary.profit_loss_pct > 20:
        recommendations.append("Great performance! Consider taking some profits or rebalancing to lock in gains.")
    
    # Check asset count
    if summary.asset_count < 3:
        recommendations.append("You have a concentrated portfolio. Adding more assets can help spread risk.")
    elif summary.asset_count > 15:
        recommendations.append("You have many holdings. Consider consolidating to make management easier.")
    
    # Check crypto exposure
    crypto_count = type_counts.get('crypto', 0)
    if crypto_count > len(investments) * 0.5:
        recommendations.append("You have high crypto exposure. Consider balancing with more stable assets.")
    
    if not recommendations:
        recommendations.append("Your portfolio looks balanced. Keep monitoring and stick to your investment strategy.")
    
    return " ".join(recommendations[:2])  # Return top 2 recommendations


def get_response_to_query(message: str, user: User, db) -> str:
    """Generate response based on user query and their portfolio data."""
    message_lower = message.lower()
    
    # Get portfolio analysis
    insight = analyze_portfolio(user.id, db)
    
    # Handle different types of queries
    if any(word in message_lower for word in ['hello', 'hi', 'hey']):
        return f"Hello {user.name}! I'm your portfolio assistant. I can help you understand your investments. You currently have {insight.asset_count} assets worth ₹{insight.total_value:,.2f}. What would you like to know?"
    
    if any(word in message_lower for word in ['portfolio', 'summary', 'overview']):
        pl_status = "profit" if insight.profit_loss >= 0 else "loss"
        return f"Your portfolio summary:\n• Total Value: ₹{insight.total_value:,.2f}\n• Invested: ₹{insight.total_invested:,.2f}\n• {pl_status.title()}: ₹{abs(insight.profit_loss):,.2f} ({insight.profit_loss_pct:+.2f}%)\n• Assets: {insight.asset_count}\n• Risk Level: {insight.risk_level.title()}\n• Diversification: {insight.diversification_score}"
    
    if any(word in message_lower for word in ['profit', 'loss', 'performance', 'gain']):
        if insight.profit_loss >= 0:
            return f"Great news! You're making a profit of ₹{insight.profit_loss:,.2f} ({insight.profit_loss_pct:+.2f}%). Your best performer is {insight.top_performer or 'N/A'}. Keep up the good work!"
        else:
            return f"Your portfolio is currently at a loss of ₹{abs(insight.profit_loss):,.2f} ({insight.profit_loss_pct:.2f}%). Don't worry - markets fluctuate. Your worst performer is {insight.worst_performer or 'N/A'}. Consider holding for recovery or reviewing your strategy."
    
    if any(word in message_lower for word in ['recommend', 'advice', 'suggestion', 'tip']):
        return f"Based on your portfolio analysis:\n{insight.recommendation}\n\nYour current risk level is {insight.risk_level.title()} and diversification is {insight.diversification_score}."
    
    if any(word in message_lower for word in ['risk', 'safe', 'dangerous']):
        risk_desc = {
            'low': "Your portfolio has LOW risk with stable assets. Good for conservative investors.",
            'medium': "Your portfolio has MEDIUM risk with balanced exposure. Suitable for moderate investors.",
            'high': "Your portfolio has HIGH risk with volatile assets. Be prepared for significant ups and downs."
        }
        return f"{risk_desc.get(insight.risk_level, 'Risk analysis unavailable')}\n\nTip: Diversifying across asset types can help manage risk."
    
    if any(word in message_lower for word in ['top', 'best', 'performer']):
        if insight.top_performer:
            return f"Your top performer is {insight.top_performer}! This asset is contributing most to your portfolio's gains. Consider if you want to take profits or let it grow further."
        return "Add some investments to see which performs best!"
    
    if any(word in message_lower for word in ['worst', 'bad', 'loser']):
        if insight.worst_performer:
            return f"Your worst performer is {insight.worst_performer}. This doesn't necessarily mean you should sell - consider your long-term strategy and whether the fundamentals have changed."
        return "Add more investments to compare performance."
    
    if any(word in message_lower for word in ['diversify', 'diversification', 'spread']):
        return f"Your diversification score: {insight.diversification_score}\n\nYou have investments in: {', '.join(type_counts.keys()) if type_counts else 'None yet'}.\n\nTip: A well-diversified portfolio typically includes stocks, mutual funds, and limited crypto exposure."
    
    if any(word in message_lower for word in ['stock', 'stocks']):
        stock_count = type_counts.get('stock', 0)
        return f"You have {stock_count} stock investment(s). Stocks are great for long-term growth but can be volatile. Consider blue-chip stocks for stability and growth stocks for higher returns."
    
    if any(word in message_lower for word in ['crypto', 'bitcoin', 'cryptocurrency']):
        crypto_count = type_counts.get('crypto', 0)
        if crypto_count > 0:
            return f"You have {crypto_count} crypto investment(s). Crypto is highly volatile - never invest more than you can afford to lose. Consider limiting crypto to 5-10% of your total portfolio."
        return "You don't have any crypto investments yet. Crypto can provide high returns but comes with significant risk. Research thoroughly before investing."
    
    if any(word in message_lower for word in ['mutual fund', 'funds']):
        fund_count = type_counts.get('mutual_fund', 0)
        return f"You have {fund_count} mutual fund investment(s). Mutual funds are great for diversification and are managed by professionals. They're ideal for beginners and long-term investors."
    
    if any(word in message_lower for word in ['add', 'buy', 'invest']):
        return "To add a new investment, go to the Portfolio page and click 'Add investment'. Make sure to research the asset and consider how it fits your overall strategy."
    
    if any(word in message_lower for word in ['help', 'what can you do', 'commands']):
        return """I can help you with:\n• Portfolio summary and performance\n• Profit/loss analysis\n• Risk assessment\n• Investment recommendations\n• Diversification tips\n• Top/worst performers\n• Asset type information\n\nJust ask me anything about your investments!"""
    
    # Default response with recommendation
    return f"I can help analyze your portfolio! Here's what I see:\n\n• Total Value: ₹{insight.total_value:,.2f}\n• Performance: {insight.profit_loss_pct:+.2f}%\n• Risk Level: {insight.risk_level.title()}\n• Assets: {insight.asset_count}\n\n{insight.recommendation}\n\nAsk me about 'portfolio', 'risk', 'recommendations', or type 'help' for more options."


@router.post("/chat", response_model=ChatResponse)
def chat(body: ChatMessage, user: User = Depends(get_current_user)):
    """Send a message to the AI assistant and get a response based on portfolio analysis."""
    from database import get_db
    db = get_db()
    
    response = get_response_to_query(body.message, user, db)
    return ChatResponse(response=response)


@router.get("/status")
def chatbot_status():
    """Check if the chatbot is available."""
    return {
        "available": True,
        "message": "Portfolio AI assistant is ready - analyzes your investment data directly",
        "type": "rule_based"
    }
