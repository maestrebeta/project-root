from pydantic import BaseModel, validator, Field
from typing import Optional
from datetime import date, datetime


class ProjectBase(BaseModel):
    client_id: Optional[int] = None
    name: str = Field(..., min_length=1, max_length=100)
    code: Optional[str] = Field(None, max_length=20)
    description: Optional[str] = None
    project_type: str = Field(..., description="Tipo de proyecto")
    status: str = Field(..., description="Estado del proyecto")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    manager_id: Optional[int] = None
    estimated_hours: Optional[int] = None
    priority: Optional[str] = 'medium'
    tags: Optional[dict] = None
    organization_id: Optional[int] = None

    @validator('project_type')
    def validate_project_type(cls, v):
        # Tipos de proyecto válidos según la definición SQL
        valid_project_types = [
            'development', 'support', 'meeting', 'training', 'other'
        ]
        
        # Mapeo de tipos de proyecto
        type_mapping = {
            'desarrollo': 'development',
            'soporte': 'support',
            'reunion': 'meeting',
            'capacitacion': 'training',
            'otro': 'other'
        }
        
        # Convertir a minúsculas para comparación
        v_lower = v.lower()
        
        # Normalizar el tipo de proyecto
        normalized_type = type_mapping.get(v_lower, v_lower)
        
        # Validar tipo de proyecto
        if normalized_type not in valid_project_types:
            raise ValueError(f'Tipo de proyecto inválido. Debe ser uno de: {valid_project_types}')
        
        return normalized_type

    @validator('status')
    def validate_status(cls, v):
        # Estados válidos según la definición SQL
        valid_statuses = [
            'active', 'paused', 'completed', 'archived'
        ]
        
        # Mapeo de estados
        status_mapping = {
            'nuevo': 'active',
            'en_progreso': 'active', 
            'completado': 'completed',
            'pausado': 'paused',
            'cancelado': 'archived',
            'new': 'active',
            'in_progress': 'active',
            'completed': 'completed',
            'paused': 'paused',
            'canceled': 'archived'
        }
        
        # Convertir a minúsculas para comparación
        v_lower = v.lower()
        
        # Normalizar el estado
        normalized_status = status_mapping.get(v_lower, v_lower)
        
        # Validar estado
        if normalized_status not in valid_statuses:
            raise ValueError(f'Estado de proyecto inválido. Debe ser uno de: {valid_statuses}')
        
        return normalized_status


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
