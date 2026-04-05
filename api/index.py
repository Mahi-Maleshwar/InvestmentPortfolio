"""
Vercel Serverless Function - Main API Entry Point
This file serves as the main handler for all API routes on Vercel
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

# Import all routes
from backend.routes import admin, analytics, auth, chatbot, password_reset, portfolio
from backend.database import init_indexes, users_collection
from backend.models.user import User, user_from_doc, user_to_doc
from backend.utils.security import hash_password

app = FastAPI(title="Investment Portfolio API", version="1.0.0")

# CORS - Allow all origins for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(password_reset.router, prefix="/api")
app.include_router(portfolio.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")

@app.on_event("startup")
def on_startup():
    # Initialize indexes
    init_indexes()
    
    # Create default admin user if not exists
    try:
        if users_collection.find_one({"email": "admin@portfolio.local"}) is None:
            admin_user = User(
                name="Administrator",
                email="admin@portfolio.local",
                password_hash=hash_password("admin123"),
                role="admin",
                is_blocked=False,
            )
            users_collection.insert_one(user_to_doc(admin_user))
    except Exception:
        pass

@app.get("/health")
def health():
    return {"status": "ok"}

# Vercel handler
handler = Mangum(app, lifespan="off")
