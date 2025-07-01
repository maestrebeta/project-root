from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timezone
from app.core.activity_types import DEFAULT_ACTIVITY_TYPES, normalize_activity_type

# Estados permitidos para las entradas de tiempo
VALID_STATES = ['pendiente', 'en_progreso', 'completada']

class TimeEntryBase(BaseModel):
    user_id: int = Field(..., gt=0)
    project_id: int = Field(..., gt=0)
    entry_date: Optional[datetime] = None
    activity_type: int = Field(default=1, gt=0)  # ID de la categoría de actividad
    start_time: datetime
    end_time: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=500)
    status: int = Field(default=1, gt=0)  # ID del estado
    billable: bool = True
    ticket_id: Optional[int] = None
    organization_id: Optional[int] = None

    @validator('user_id', 'project_id', 'ticket_id', 'organization_id', pre=True)
    def convert_to_int(cls, v):
        """Convertir valores a enteros de manera segura"""
        return int(v) if v is not None else None

    @validator('entry_date', 'start_time', 'end_time', pre=True)
    def ensure_timezone(cls, v):
        """Asegurar que todas las fechas tengan zona horaria"""
        if v is None:
            return None
            
        if isinstance(v, datetime):
            # Si no tiene zona horaria, asumir UTC
            if v.tzinfo is None:
                return v.replace(tzinfo=timezone.utc)
            return v
            
        if isinstance(v, str):
            try:
                # Intentar parsear el formato ISO
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                raise ValueError("Formato de fecha/hora inválido. Use formato ISO con zona horaria")
        
        raise ValueError("Tipo de fecha/hora inválido")

    @validator('entry_date', pre=True)
    def set_default_entry_date(cls, v):
        """Si no se proporciona fecha de entrada, usar la fecha actual"""
        if v is None:
            return datetime.now(timezone.utc)
        return v

    @validator('activity_type')
    def validate_activity_type(cls, v):
        """Validar que el tipo de actividad sea un ID válido"""
        if not isinstance(v, int) or v <= 0:
            raise ValueError('activity_type debe ser un ID entero positivo')
        return v

    @validator('status')
    def validate_status(cls, v):
        """Validar que el estado sea un ID válido"""
        if not isinstance(v, int) or v <= 0:
            raise ValueError('status debe ser un ID entero positivo')
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

    # Validadores para manejar valores None desde la base de datos
    @validator('billable', pre=True)
    def validate_billable(cls, v):
        if v is None:
            return True
        return bool(v)

    class Config:
        from_attributes = True

    @validator('start_time', 'end_time', 'entry_date', 'created_at', 'updated_at', pre=True)
    def ensure_timezone(cls, v):
        """Asegurar que todos los campos de fecha/hora tengan zona horaria"""
        if v is None:
            return None
            
        if isinstance(v, datetime):
            if v.tzinfo is None:
                return v.replace(tzinfo=timezone.utc)
            return v
            
        if isinstance(v, str):
            try:
                # Intentar parsear el formato ISO
                dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=timezone.utc)
                return dt
            except ValueError:
                raise ValueError("Invalid datetime format. Use ISO format with timezone")
