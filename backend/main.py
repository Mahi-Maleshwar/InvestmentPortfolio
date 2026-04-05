from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_indexes, users_collection
from models.user import User, user_from_doc, user_to_doc
from routes import admin, analytics, auth, chatbot, password_reset, portfolio
from utils.security import hash_password

app = FastAPI(title="Investment Portfolio API", version="1.0.0")

import os

# Get allowed origins from environment or use defaults
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(password_reset.router)
app.include_router(portfolio.router)
app.include_router(analytics.router)
app.include_router(admin.router)
app.include_router(chatbot.router)


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
        # MongoDB may not be available yet
        pass


@app.get("/health")
def health():
    return {"status": "ok"}
