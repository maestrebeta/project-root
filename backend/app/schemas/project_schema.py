from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime


class ProjectBase(BaseModel):
    client_id: int
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    project_type: str
    status: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
