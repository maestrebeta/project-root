from pydantic import BaseModel
from datetime import date, time, datetime
from typing import Optional

class TimeEntryBase(BaseModel):
    user_id: int
    project_id: int
    entry_date: date
    activity_type: str
    start_time: time
    end_time: Optional[time] = None
    description: Optional[str] = None
    status: str

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryUpdate(TimeEntryBase):
    pass

class TimeEntryOut(TimeEntryBase):
    entry_id: int
    duration_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
