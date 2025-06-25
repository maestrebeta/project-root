from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class BugStatus(str, enum.Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class BugPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class Bug(Base):
    __tablename__ = "bugs"
    
    id = Column(Integer, primary_key=True, index=True)
    view_id = Column(String(100), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(BugStatus), default=BugStatus.OPEN, nullable=False)
    priority = Column(Enum(BugPriority), default=BugPriority.MEDIUM, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False) 