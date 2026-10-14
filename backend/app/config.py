import os
import tempfile
from dotenv import load_dotenv

load_dotenv()

IS_VERCEL = bool(os.getenv("VERCEL"))

class Settings:
    PROJECT_NAME: str = "FindGrid — AI Missing Person Search & Coordination Platform"
    API_V1_STR: str = "/api"
    
    # Database: Supabase PostgreSQL or SQLite fallback
    # On Vercel serverless, SQLite must be stored in the writable /tmp partition
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:////tmp/findgrid.db" if IS_VERCEL else "sqlite:///./findgrid.db"
    )
    
    # Supabase credentials (optional when using direct DATABASE_URL or SQLite)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # JWT & Auth Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "findgrid-hackathon-secure-supersecret-jwt-key-2026")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    NONCE_EXPIRE_MINUTES: int = 10
    
    # Blockchain / Web3
    BLOCKCHAIN_RPC_URL: str = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
    EVIDENCE_REGISTRY_ADDRESS: str = os.getenv("EVIDENCE_REGISTRY_ADDRESS", "")
    
    # Upload storage (writable /tmp on Vercel)
    UPLOAD_DIR: str = (
        os.path.join(tempfile.gettempdir(), "findgrid_uploads") 
        if IS_VERCEL 
        else os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    )
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024 # 25 MB max evidence file

settings = Settings()

# Ensure uploads directory exists safely without crashing on read-only filesystems
try:
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
except (OSError, Exception):
    pass
