from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal

# Epic Schemas
class EpicBase(BaseModel):
    project_id: int
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = Field(default='backlog')
    priority: str = Field(default='medium')
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

    tags: Optional[Dict[str, Any]] = None
    acceptance_criteria: Optional[str] = None
    business_value: Optional[str] = None

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['backlog', 'planning', 'in_progress', 'review', 'done', 'blocked']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if v not in valid_priorities:
            raise ValueError(f'Priority must be one of: {valid_priorities}')
        return v

class EpicCreate(EpicBase):
    pass

class EpicUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    tags: Optional[Dict[str, Any]] = None
    acceptance_criteria: Optional[str] = None
    business_value: Optional[str] = None

class EpicOut(EpicBase):
    epic_id: int
    estimated_hours: Optional[Decimal] = None
    actual_hours: Optional[Decimal] = None
    progress_percentage: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    
    # Estadísticas calculadas
    total_stories: Optional[int] = 0
    completed_stories: Optional[int] = 0
    
    class Config:
        from_attributes = True

# User Story Schemas
class UserStoryBase(BaseModel):
    epic_id: Optional[int] = None
    project_id: int
    title: str = Field(..., min_length=1, max_length=300)
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    status: str = Field(default='backlog')
    priority: str = Field(default='medium')
    
    # Especialización y sub-especializaciones
    specialization: str = Field(default='development')
    sub_specializations: Optional[List[str]] = None
    estimated_hours: Optional[Decimal] = Field(default=8, ge=0)
    
    # Estimaciones por tipo de trabajo
    ui_hours: Optional[Decimal] = Field(default=0, ge=0)
    development_hours: Optional[Decimal] = Field(default=0, ge=0)
    testing_hours: Optional[Decimal] = Field(default=0, ge=0)
    documentation_hours: Optional[Decimal] = Field(default=0, ge=0)
    
    # Asignación
    assigned_user_id: Optional[int] = None
    sprint_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    
    # Metadatos - permitir tanto arrays como objetos para tags
    tags: Optional[List[str]] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    color: Optional[str] = Field(default='#10B981', pattern=r'^#[0-9A-Fa-f]{6}$')
    is_blocked: bool = False
    blocked_reason: Optional[str] = None
    business_value: Optional[str] = None

    @validator('specialization')
    def validate_specialization(cls, v):
        valid_specializations = ['development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis']
        if v not in valid_specializations:
            raise ValueError(f'Specialization must be one of: {valid_specializations}')
        return v

    @validator('sub_specializations')
    def validate_sub_specializations(cls, v, values):
        if v is None:
            return v
        
        # Sub-especializaciones válidas por especialización principal
        valid_sub_specs = {
            'development': ['backend', 'frontend', 'automation', 'data_bi'],
            'ui_ux': ['ui_design', 'ux_research', 'prototyping', 'user_testing'],
            'testing': ['unit_testing', 'integration_testing', 'e2e_testing', 'performance_testing'],
            'documentation': ['technical_docs', 'user_docs', 'api_docs', 'training_materials'],
            'management': ['project_management', 'team_lead', 'product_owner', 'scrum_master'],
            'data_analysis': ['data_modeling', 'reporting', 'analytics', 'business_intelligence']
        }
        
        specialization = values.get('specialization', 'development')
        allowed_subs = valid_sub_specs.get(specialization, [])
        
        for sub in v:
            if sub not in allowed_subs:
                raise ValueError(f'Sub-specialization "{sub}" not valid for specialization "{specialization}". Valid options: {allowed_subs}')
        
        return v

    @validator('tags', pre=True)
    def validate_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            # Convertir array de strings a formato que espera la DB
            return v
        if isinstance(v, dict):
            # Si ya es un dict, mantenerlo
            return list(v.keys()) if v else None
        return v

    @validator('status')
    def validate_status(cls, v):
        valid_statuses = ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'blocked']
        if v not in valid_statuses:
            raise ValueError(f'Status must be one of: {valid_statuses}')
        return v

    @validator('priority')
    def validate_priority(cls, v):
        valid_priorities = ['low', 'medium', 'high', 'critical']
        if v not in valid_priorities:
            raise ValueError(f'Priority must be one of: {valid_priorities}')
        return v

class UserStoryCreate(UserStoryBase):
    pass

class UserStoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=300)
    description: Optional[str] = None
    acceptance_criteria: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    
    # Especialización y sub-especializaciones
    specialization: Optional[str] = None
    sub_specializations: Optional[List[str]] = None
    estimated_hours: Optional[Decimal] = Field(None, ge=0)
    
    # Estimaciones por tipo de trabajo
    ui_hours: Optional[Decimal] = Field(None, ge=0)
    development_hours: Optional[Decimal] = Field(None, ge=0)
    testing_hours: Optional[Decimal] = Field(None, ge=0)
    documentation_hours: Optional[Decimal] = Field(None, ge=0)
    
    # Asignación
    assigned_user_id: Optional[int] = None
    sprint_id: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    
    # Metadatos
    tags: Optional[List[str]] = None
    checklist: Optional[List[Dict[str, Any]]] = None
    comments: Optional[List[Dict[str, Any]]] = None
    color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    is_blocked: Optional[bool] = None
    blocked_reason: Optional[str] = None
    business_value: Optional[str] = None

    @validator('tags', pre=True)
    def validate_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return v
        if isinstance(v, dict):
            return list(v.keys()) if v else None
        return v

class UserStoryOut(UserStoryBase):
    story_id: int
    actual_hours: Optional[Decimal] = None
    completed_date: Optional[datetime] = None
    comments: Optional[List[Dict[str, Any]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime
    
    # Información calculada
    total_estimated_hours: Optional[Decimal] = None
    progress_percentage: Optional[Decimal] = None
    
    # Información del usuario asignado
    assigned_user: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
    
    @validator('assigned_user', pre=True)
    def transform_assigned_user(cls, v):
        if v is None:
            return None
        if hasattr(v, '__dict__'):
            # Es un objeto User, convertir a diccionario
            return {
                'user_id': v.user_id,
                'username': v.username,
                'full_name': v.full_name,
                'email': v.email,
                'role': v.role,
                'specialization': getattr(v, 'specialization', None),
                'sub_specializations': getattr(v, 'sub_specializations', None)
            }
        return v

# Schemas para estadísticas y reportes
class EpicStats(BaseModel):
    epic_id: int
    name: str
    total_stories: int
    completed_stories: int
    total_estimated_hours: Decimal
    total_actual_hours: Decimal
    progress_percentage: Decimal
    status: str

class ProjectPlanningStats(BaseModel):
    project_id: int
    project_name: str
    total_epics: int
    total_stories: int
    completed_stories: int
    total_estimated_hours: Decimal
    total_actual_hours: Decimal
    overall_progress: Decimal
    epics: List[EpicStats] 