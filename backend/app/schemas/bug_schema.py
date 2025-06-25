from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class BugStatus(str, Enum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"

class BugPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class BugBase(BaseModel):
    view_id: str = Field(..., description="ID de la vista afectada")
    title: str = Field(..., min_length=1, max_length=500, description="Título del bug")
    description: str = Field(..., min_length=1, description="Descripción del bug")
    status: BugStatus = Field(default=BugStatus.OPEN, description="Estado del bug")
    priority: BugPriority = Field(default=BugPriority.MEDIUM, description="Prioridad del bug")

class BugCreate(BugBase):
    pass

class BugUpdate(BaseModel):
    view_id: Optional[str] = Field(None, description="ID de la vista afectada")
    title: Optional[str] = Field(None, min_length=1, max_length=500, description="Título del bug")
    description: Optional[str] = Field(None, min_length=1, description="Descripción del bug")
    status: Optional[BugStatus] = Field(None, description="Estado del bug")
    priority: Optional[BugPriority] = Field(None, description="Prioridad del bug")

class BugResponse(BugBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BugListResponse(BaseModel):
    bugs: list[BugResponse]
    total: int
    page: int
    size: int 