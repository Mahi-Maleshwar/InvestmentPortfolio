import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient

# Load backend/.env if present (does not override existing OS env vars)
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mongodb://localhost:27017/portfolio_db",
)

# Synchronous client for non-async operations
client = MongoClient(DATABASE_URL, serverSelectionTimeoutMS=5000)
db = client.get_default_database()

# Async client for async operations
async_client = AsyncIOMotorClient(DATABASE_URL, serverSelectionTimeoutMS=5000)
async_db = async_client.get_default_database()

# Collections
users_collection = db["users"]
investments_collection = db["investments"]
transactions_collection = db["transactions"]
portfolio_history_collection = db["portfolio_history"]
password_reset_otp_collection = db["password_reset_otp"]


def init_indexes():
    """Initialize database indexes. Call this after MongoDB is available."""
    try:
        users_collection.create_index("email", unique=True)
        investments_collection.create_index("user_id")
        transactions_collection.create_index("user_id")
        transactions_collection.create_index("investment_id")
        portfolio_history_collection.create_index("user_id")
        portfolio_history_collection.create_index([("user_id", 1), ("date", 1)])
        password_reset_otp_collection.create_index("email")
        password_reset_otp_collection.create_index("expires_at", expireAfterSeconds=0)
    except Exception:
        # Indexes may fail if MongoDB is not available yet
        pass


def get_db():
    """Get database instance for dependency injection."""
    return db


def get_async_db():
    """Get async database instance for dependency injection."""
    return async_db
