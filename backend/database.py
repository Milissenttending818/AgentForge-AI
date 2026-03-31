import datetime
from sqlalchemy import create_engine, Column, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import uuid

# SQLite for simplicity, can be easily changed to PostgreSQL for n8n-scale production
SQLALCHEMY_DATABASE_URL = "sqlite:///./agent_forge.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Workflow(Base):
    """
    Represents an n8n-style workflow blueprint.
    Stores the visual representation of nodes and edges.
    """
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True, default="Untitled Workflow")
    nodes = Column(JSON) # Stores React Flow node data
    edges = Column(JSON) # Stores React Flow edge data
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class Execution(Base):
    """
    Represents a specific run of a workflow.
    Tracks live status, logs, and final output.
    """
    __tablename__ = "executions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String, ForeignKey("workflows.id"))
    status = Column(String, default="pending") # pending, running, completed, failed
    logs = Column(Text, default="") # Accumulates execution details
    result = Column(JSON, nullable=True) # Final CrewAI output
    started_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

# Create all tables
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
