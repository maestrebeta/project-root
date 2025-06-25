from pydantic import BaseModel, validator, Field
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal


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
            'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
            'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
        ]
        
        # Mapeo de estados desde español a inglés
        status_mapping = {
            'iniciativa_registrada': 'registered_initiative',
            'en_cotizacion': 'in_quotation',
            'propuesta_aprobada': 'proposal_approved',
            'en_planeacion': 'in_planning',
            'en_curso': 'in_progress',
            'en_riesgo': 'at_risk',
            'suspendido': 'suspended',
            'completado': 'completed',
            'cancelado': 'canceled',
            'soporte_post_entrega': 'post_delivery_support',
            # Mantener compatibilidad con estados anteriores
            'nuevo': 'registered_initiative',
            'en_progreso': 'in_progress', 
            'pausado': 'suspended',
            'active': 'in_progress',
            'paused': 'suspended',
            'archived': 'canceled'
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
    # Hacer todos los campos opcionales para updates
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    project_type: Optional[str] = Field(None, description="Tipo de proyecto")
    status: Optional[str] = Field(None, description="Estado del proyecto")


class ProjectOut(ProjectBase):
    project_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schemas para Cotizaciones
class QuotationInstallmentBase(BaseModel):
    installment_number: int = Field(..., ge=1, description="Número de la cuota")
    percentage: Decimal = Field(..., ge=0, le=100, description="Porcentaje del total")
    amount: Decimal = Field(..., ge=0, description="Monto calculado")
    due_date: Optional[date] = Field(None, description="Fecha de vencimiento")
    is_paid: bool = Field(default=False, description="Indica si la cuota está pagada")
    paid_date: Optional[date] = Field(None, description="Fecha de pago")
    payment_reference: Optional[str] = Field(None, max_length=100, description="Referencia del pago")
    notes: Optional[str] = Field(None, description="Notas adicionales")

class QuotationInstallmentCreate(QuotationInstallmentBase):
    pass

class QuotationInstallmentUpdate(BaseModel):
    installment_number: Optional[int] = Field(None, ge=1, description="Número de la cuota")
    percentage: Optional[Decimal] = Field(None, ge=0, le=100, description="Porcentaje del total")
    amount: Optional[Decimal] = Field(None, ge=0, description="Monto calculado")
    due_date: Optional[date] = Field(None, description="Fecha de vencimiento")
    is_paid: Optional[bool] = Field(None, description="Indica si la cuota está pagada")
    paid_date: Optional[date] = Field(None, description="Fecha de pago")
    payment_reference: Optional[str] = Field(None, max_length=100, description="Referencia del pago")
    notes: Optional[str] = Field(None, description="Notas adicionales")

class QuotationInstallmentResponse(QuotationInstallmentBase):
    installment_id: int
    quotation_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class QuotationBase(BaseModel):
    project_id: int = Field(..., description="ID del proyecto")
    total_amount: Decimal = Field(..., ge=0, description="Monto total de la cotización")
    currency: str = Field(default="USD", description="Moneda de la cotización")
    status: str = Field(default="draft", description="Estado de la cotización")
    description: Optional[str] = Field(None, description="Descripción de la cotización")

class QuotationCreate(QuotationBase):
    installments: List[QuotationInstallmentCreate] = Field(..., description="Lista de cuotas")

class QuotationUpdate(BaseModel):
    total_amount: Optional[Decimal] = Field(None, ge=0, description="Monto total de la cotización")
    currency: Optional[str] = Field(None, description="Moneda de la cotización")
    status: Optional[str] = Field(None, description="Estado de la cotización")
    description: Optional[str] = Field(None, description="Descripción de la cotización")
    installments: Optional[List[QuotationInstallmentCreate]] = Field(None, description="Lista de cuotas")

class QuotationResponse(QuotationBase):
    quotation_id: int
    created_by_user_id: int
    created_at: datetime
    updated_at: datetime
    installments: List[QuotationInstallmentResponse] = []
    
    # Información adicional calculada
    total_paid: Optional[Decimal] = None
    total_pending: Optional[Decimal] = None
    paid_installments: Optional[int] = None
    total_installments: Optional[int] = None

    class Config:
        from_attributes = True

class QuotationWithProjectInfo(QuotationResponse):
    project_name: Optional[str] = None
    project_code: Optional[str] = None
    created_by_name: Optional[str] = None
