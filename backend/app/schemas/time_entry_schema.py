from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime, timezone
from app.core.activity_types import DEFAULT_ACTIVITY_TYPES

# Estados permitidos para las entradas de tiempo
VALID_STATES = ['pendiente', 'en_progreso', 'completada']

class TimeEntryBase(BaseModel):
    user_id: int = Field(..., gt=0)
    project_id: int = Field(..., gt=0)
    entry_date: Optional[datetime] = None
    activity_type: str = Field(default='desarrollo', max_length=50)
    start_time: datetime
    end_time: Optional[datetime] = None
    description: Optional[str] = Field(None, max_length=500)
    status: str = Field(default='pendiente', max_length=50)
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
        """Validar que el tipo de actividad sea uno de los permitidos"""
        normalized = v.lower().strip()
        if normalized not in DEFAULT_ACTIVITY_TYPES:
            raise ValueError(f"Tipo de actividad inválido. Debe ser uno de: {DEFAULT_ACTIVITY_TYPES}")
        return normalized

    @validator('status')
    def validate_status(cls, v):
        """Validar que el estado sea uno de los permitidos"""
        if not v:
            return 'pendiente'
            
        normalized = v.lower().strip()
        
        # Mapeo de estados
        status_mapping = {
            'pendiente': 'pendiente',
            'pending': 'pendiente',
            'nueva': 'pendiente',
            'new': 'pendiente',
            'en_progreso': 'en_progreso',
            'en progreso': 'en_progreso',
            'in_progress': 'en_progreso',
            'progreso': 'en_progreso',
            'completada': 'completada',
            'completed': 'completada',
            'completado': 'completada',
            'done': 'completada'
        }
        
        # Normalizar el estado
        normalized_status = status_mapping.get(normalized, normalized)
        
        # Validar estado
        if normalized_status not in VALID_STATES:
            raise ValueError(f'Estado inválido. Debe ser uno de: {VALID_STATES}')
        
        return normalized_status

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
