from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Título de la tarea")
    description: Optional[str] = Field(None, description="Descripción detallada de la tarea")
    status: str = Field(default='pending', description="Estado de la tarea")
    priority: str = Field(default='medium', description="Prioridad de la tarea")
    assigned_to: Optional[int] = Field(None, description="ID del usuario asignado")
    due_date: Optional[datetime] = Field(None, description="Fecha de vencimiento")
    estimated_hours: Optional[int] = Field(None, ge=0, description="Horas estimadas")
    actual_hours: Optional[int] = Field(None, ge=0, description="Horas reales trabajadas")
    tags: Optional[List[str]] = Field(None, description="Lista de etiquetas")
    notes: Optional[str] = Field(None, description="Notas adicionales")

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['pending', 'in_progress', 'completed', 'blocked']
        if v not in valid_statuses:
            raise ValueError(f'Estado debe ser uno de: {", ".join(valid_statuses)}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if v not in valid_priorities:
            raise ValueError(f'Prioridad debe ser una de: {", ".join(valid_priorities)}')
        return v

class TaskCreate(TaskBase):
    organization_id: int = Field(..., description="ID de la organización")

class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[int] = Field(None, ge=0)
    actual_hours: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    notes: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        if v is not None:
            valid_statuses = ['pending', 'in_progress', 'completed', 'blocked']
            if v not in valid_statuses:
                raise ValueError(f'Estado debe ser uno de: {", ".join(valid_statuses)}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        if v is not None:
            valid_priorities = ['low', 'medium', 'high', 'urgent']
            if v not in valid_priorities:
                raise ValueError(f'Prioridad debe ser una de: {", ".join(valid_priorities)}')
        return v

class TaskOut(TaskBase):
    task_id: int
    assigned_by: Optional[int] = None
    organization_id: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    # Información adicional calculada
    assigned_to_name: Optional[str] = None
    assigned_by_name: Optional[str] = None
    progress_percentage: Optional[int] = None

    class Config:
        from_attributes = True

class TaskListResponse(BaseModel):
    tasks: List[TaskOut]
    total: int
    page: int
    size: int
    total_pages: int

class TaskStats(BaseModel):
    total_tasks: int
    pending_tasks: int
    blocked_tasks: int
    overdue_tasks: int
    due_soon_tasks: int 