import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://db_user:db_password@localhost:5432/eventlogsim"
)

# Configure logging for database activities
logger = logging.getLogger("database")

# create_async_engine manages connection pooling for us automatically!
engine = create_async_engine(DATABASE_URL, echo=True)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# FastAPI DB dependency
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()

# Initialize tables using Raw SQL DDL
async def init_db():
    async with async_session() as session:
        async with session.begin():
            logger.info("Initializing database tables using raw SQL DDL...")
            
            # Create runs table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS runs (
                    id VARCHAR(36) PRIMARY KEY,
                    status VARCHAR(20) NOT NULL,
                    created_at TIMESTAMP NOT NULL,
                    config_name VARCHAR(100) NOT NULL,
                    duration INTEGER,
                    error TEXT,
                    config JSONB NOT NULL,
                    stats JSONB
                );
            """))
            
            # Create events table
            await session.execute(text("""
                CREATE TABLE IF NOT EXISTS events (
                    id SERIAL PRIMARY KEY,
                    run_id VARCHAR(36) NOT NULL,
                    case_id VARCHAR(100) NOT NULL,
                    activity VARCHAR(100) NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    is_terminal BOOLEAN DEFAULT FALSE,
                    resource VARCHAR(100),
                    role VARCHAR(100),
                    feedback TEXT,
                    attributes JSONB,
                    FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
                );
            """))
            
            # Migration helper for existing databases
            await session.execute(text("""
                ALTER TABLE events ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT FALSE;
            """))
            await session.execute(text("""
                ALTER TABLE events ADD COLUMN IF NOT EXISTS resource VARCHAR(100);
            """))
            await session.execute(text("""
                ALTER TABLE events ADD COLUMN IF NOT EXISTS role VARCHAR(100);
            """))
            await session.execute(text("""
                ALTER TABLE events ADD COLUMN IF NOT EXISTS feedback TEXT;
            """))
            
            # Create index for faster querying of events by run_id
            await session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_events_run_id ON events(run_id);
            """))

            
            logger.info("Database tables initialized successfully.")
