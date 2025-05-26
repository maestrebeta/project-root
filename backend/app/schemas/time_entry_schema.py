from pydantic import BaseModel, Field, validator
from typing import Optional, Union
from datetime import date, time, datetime

class TimeEntryBase(BaseModel):
    user_id: int = Field(..., gt=0)
    project_id: int = Field(..., gt=0)
    entry_date: Optional[date] = None
    activity_type: str = Field(default='trabajo', max_length=50)
    start_time: Union[time, str]
    end_time: Optional[Union[time, str]] = None
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field(default='completado', max_length=20)
    billable: bool = True
    ticket_id: Optional[int] = None
    organization_id: Optional[int] = None

    @validator('user_id', 'project_id', 'ticket_id', 'organization_id', pre=True)
    def convert_to_int(cls, v):
        """Convertir valores a enteros de manera segura"""
        return int(v) if v is not None else None

    @validator('start_time', 'end_time', pre=True)
    def parse_time(cls, v):
        """Parsear tiempo de diferentes formatos"""
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%H:%M:%S").time()
            except ValueError:
                raise ValueError("Invalid time format. Use HH:MM:SS")
        return v

    @validator('activity_type', 'status')
    def validate_string_fields(cls, v):
        """Validar campos de texto"""
        if not v or not isinstance(v, str):
            raise ValueError("El campo debe ser una cadena de texto no vacía")
        return v.lower().strip()

    @validator('entry_date', pre=True)
    def parse_entry_date(cls, v):
        """Parsear fecha de entrada"""
        if isinstance(v, str):
            try:
                return datetime.strptime(v, "%Y-%m-%d").date()
            except ValueError:
                raise ValueError("Invalid date format. Use YYYY-MM-DD")
        return v

class TimeEntryCreate(TimeEntryBase):
    pass

class TimeEntryUpdate(TimeEntryBase):
    pass

class TimeEntryOut(TimeEntryBase):
    entry_id: int
    created_at: datetime
    updated_at: datetime
    duration_hours: Optional[float] = None

    class Config:
        from_attributes = True
