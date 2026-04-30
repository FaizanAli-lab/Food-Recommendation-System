from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URI, DATABASE_NAME

client: AsyncIOMotorClient = None
db = None
mongo_available: bool = False


async def connect_db() -> bool:
    """
    Try to connect to MongoDB. Returns True on success, False if unreachable.
    Failure is non-fatal — the app will fall back to in-memory mode.
    """
    global client, db, mongo_available
    try:
        client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Ping to confirm connection works
        await client.admin.command("ping")
        db = client[DATABASE_NAME]
        mongo_available = True
        print(f"[DB] ✓ Connected to MongoDB — database: {DATABASE_NAME}")
        return True
    except Exception as exc:
        mongo_available = False
        print(f"[DB] ⚠ MongoDB unavailable ({exc.__class__.__name__}). Running in in-memory mode.")
        return False


async def close_db():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")


def get_foods_collection():
    if not mongo_available or db is None:
        return None
    return db["foods"]


def get_users_collection():
    if not mongo_available or db is None:
        return None
    return db["users"]
