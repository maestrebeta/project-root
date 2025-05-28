from pydantic import BaseModel, validator, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class ThemePreferences(BaseModel):
    primary_color: str
    font_class: str
    font_size_class: str
    animations_enabled: bool

class OrganizationInfo(BaseModel):
    organization_id: Optional[int] = None
    name: Optional[str] = None

    @classmethod
    def from_orm(cls, obj):
        if obj is None:
            return None
        return cls(
            organization_id=obj.organization_id,
            name=obj.name
        )

class UserBase(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: EmailStr
    role: str = Field(
        ..., 
        description="Rol del usuario", 
        pattern="^(admin|dev|infra|super_user)$"
    )
    is_active: Optional[bool] = True
    profile_image: Optional[str] = None
    theme_preferences: Optional[ThemePreferences] = None
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: str = 'UTC'
    language: str = 'es'
    
    # Nuevos campos para especialización y capacidad
    specialization: Optional[str] = Field(default='development')
    sub_specializations: Optional[List[str]] = None
    hourly_rate: Optional[int] = None
    weekly_capacity: Optional[int] = Field(default=40)
    skills: Optional[Dict[str, Any]] = None

    @validator('specialization')
    def validate_specialization(cls, v):
        if v is None:
            return 'development'
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

    @validator('organization_id', pre=True, always=True)
    def set_default_organization(cls, v):
        # Si no se proporciona organization_id, devolver None
        # El backend decidirá qué hacer con este valor
        return v

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    profile_image: Optional[str] = None
    theme_preferences: Optional[ThemePreferences] = None
    organization_id: Optional[int] = None
    country_code: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    
    # Nuevos campos para especialización y capacidad
    specialization: Optional[str] = None
    sub_specializations: Optional[List[str]] = None
    hourly_rate: Optional[int] = None
    weekly_capacity: Optional[int] = None
    skills: Optional[Dict[str, Any]] = None

class UserOut(BaseModel):
    user_id: int
    username: str
    full_name: Optional[str] = None
    email: str
    role: str
    is_active: bool
    profile_image: Optional[str] = None
    theme_preferences: Optional[dict] = None
    organization_id: Optional[int] = None
    organization: Optional[OrganizationInfo] = None
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    # Nuevos campos para especialización y capacidad
    specialization: Optional[str] = None
    sub_specializations: Optional[List[str]] = None
    hourly_rate: Optional[int] = None
    weekly_capacity: Optional[int] = None
    skills: Optional[Dict[str, Any]] = None
    
    # Campos calculados para el dashboard
    current_workload: Optional[int] = None  # Horas asignadas esta semana
    efficiency_score: Optional[float] = None  # Puntuación de eficiencia
    preferred_tasks: Optional[List[str]] = None  # Tipos de tareas donde rinde mejor

    class Config:
        from_attributes = True
        arbitrary_types_allowed = True

    @validator('organization', pre=True, always=True)
    def transform_organization(cls, v):
        # Si v es None, devolver None
        if v is None:
            return None
        # Si v ya es un dict, devolverlo tal como está
        if isinstance(v, dict):
            return v
        # Si v es un objeto ORM, convertirlo
        return OrganizationInfo.from_orm(v)

class UserWithOrganization(UserOut):
    organization_name: Optional[str] = None
