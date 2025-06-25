from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from decimal import Decimal
from app.models.project_models import Project, ProjectBudget, Quotation, QuotationInstallment
from app.schemas.project_schema import (
    ProjectCreate, ProjectUpdate, ProjectOut,
    QuotationCreate, QuotationUpdate, QuotationResponse, QuotationWithProjectInfo,
    QuotationInstallmentCreate, QuotationInstallmentUpdate, QuotationInstallmentResponse
)
from app.models.organization_models import Organization
from datetime import datetime, date, timedelta
from app.models.user_models import User


def calculate_estimated_hours(start_date, end_date, project_type='development', organization=None):
    """
    Calcular horas estimadas basándose en las fechas de inicio y fin del proyecto,
    usando la configuración de horas de trabajo de la organización.
    
    Args:
        start_date: Fecha de inicio del proyecto
        end_date: Fecha de fin del proyecto
        project_type: Tipo de proyecto para ajustar el cálculo
        organization: Objeto organización con configuración de horas de trabajo
    
    Returns:
        int: Número de horas estimadas o None si no se pueden calcular
    """
    if not start_date or not end_date:
        return None
    
    # Convertir a objetos date si son strings
    if isinstance(start_date, str):
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
    elif isinstance(start_date, datetime):
        start_date = start_date.date()
    
    if isinstance(end_date, str):
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
    elif isinstance(end_date, datetime):
        end_date = end_date.date()
    
    # Validar que la fecha de fin sea posterior a la de inicio
    if end_date <= start_date:
        return None
    
    # Obtener configuración de horas de trabajo de la organización
    work_config = organization.work_hours_config if organization else None
    if not work_config:
        # Configuración por defecto si no hay organización
        work_config = {
            "effective_daily_hours": 7,
            "working_days": [1, 2, 3, 4, 5]  # Lunes a Viernes
        }
    
    working_days_of_week = work_config.get('working_days', [1, 2, 3, 4, 5])
    effective_daily_hours = work_config.get('effective_daily_hours', 7)
    
    # Calcular días laborables según la configuración de la organización
    current_date = start_date
    working_days = 0
    
    while current_date < end_date:
        # weekday() devuelve 0=Lunes, 6=Domingo, pero nuestra config usa 1=Lunes, 7=Domingo
        weekday = current_date.weekday() + 1
        if weekday in working_days_of_week:
            working_days += 1
        current_date += timedelta(days=1)
    
    # Factor de dedicación según el tipo de proyecto
    project_dedication_factor = {
        'development': 0.85,   # 85% del tiempo efectivo para desarrollo
        'support': 0.60,       # 60% del tiempo efectivo para soporte
        'meeting': 0.30,       # 30% del tiempo efectivo para reuniones
        'training': 0.70,      # 70% del tiempo efectivo para capacitación
        'other': 0.50          # 50% del tiempo efectivo para otros
    }
    
    dedication_factor = project_dedication_factor.get(project_type, 0.50)
    project_hours_per_day = effective_daily_hours * dedication_factor
    estimated_hours = working_days * project_hours_per_day
    
    return int(round(estimated_hours))


def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.project_id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()


def get_projects_by_organization(db: Session, organization_id: int, skip: int = 0, limit: int = 100, client_id: int = None, status: str = None):
    """
    Obtener proyectos de una organización específica con filtros opcionales
    """
    try:
        # Verificar si la organización existe
        organization = db.query(Organization).filter(Organization.organization_id == organization_id).first()
        if not organization:
            print(f"Organización con ID {organization_id} no encontrada")
            return []

        # Buscar proyectos de la organización
        query = db.query(Project).filter(Project.organization_id == organization_id)
        
        # Aplicar filtros opcionales
        if client_id is not None:
            query = query.filter(Project.client_id == client_id)
            print(f"[DEBUG] Filtrando proyectos por client_id: {client_id}")
        
        if status is not None:
            query = query.filter(Project.status == status)
            print(f"[DEBUG] Filtrando proyectos por status: {status}")
        
        # Aplicar paginación
        query = query.offset(skip).limit(limit)
        
        proyectos = query.all()
        
        print(f"Número de proyectos encontrados: {len(proyectos)}")
        for proyecto in proyectos:
            print(f"Proyecto: {proyecto.name}, ID: {proyecto.project_id}, Org ID: {proyecto.organization_id}, Client ID: {proyecto.client_id}, Status: {proyecto.status}")
        
        return proyectos
    except Exception as e:
        print(f"Error al buscar proyectos: {str(e)}")
        return []


def create_project(db: Session, project: ProjectCreate):
    """
    Crear un proyecto, asegurando que tenga una organización
    """
    # Tipos de proyecto válidos según la definición SQL
    valid_project_types = [
        'development', 'support', 'meeting', 'training', 'other'
    ]
    
    # Estados válidos según la definición SQL
    valid_statuses = [
        'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
        'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
    ]

    # Mapeo de tipos de proyecto (si es necesario)
    project_type_mapping = {
        'desarrollo': 'development',
        'soporte': 'support',
        'reunion': 'meeting',
        'capacitacion': 'training',
        'otro': 'other'
    }

    # Mapeo de estados (si es necesario)
    status_mapping = {
        'nuevo': 'registered_initiative',
        'en_progreso': 'in_progress', 
        'completado': 'completed',
        'pausado': 'suspended',
        'cancelado': 'canceled',
        'active': 'in_progress',
        'paused': 'suspended',
        'archived': 'canceled'
    }

    # Normalizar tipo de proyecto
    normalized_project_type = project_type_mapping.get(
        project.project_type.lower(), 
        project.project_type.lower()
    )

    # Validar tipo de proyecto
    if normalized_project_type not in valid_project_types:
        raise ValueError(f"Tipo de proyecto inválido. Debe ser uno de: {valid_project_types}")

    # Normalizar estado
    normalized_status = status_mapping.get(
        project.status.lower(), 
        project.status.lower()
    )

    # Validar estado
    if normalized_status not in valid_statuses:
        raise ValueError(f"Estado de proyecto inválido. Debe ser uno de: {valid_statuses}")

    # Obtener la organización del usuario actual o la especificada
    organization = db.query(Organization).filter(Organization.organization_id == project.organization_id).first()
    if not organization:
        raise ValueError("Organización no encontrada")
    
    # Verificar si el código del proyecto ya existe (si se proporciona)
    if project.code:
        existing_project = db.query(Project).filter(Project.code == project.code).first()
        if existing_project:
            raise ValueError(f"Ya existe un proyecto con el código '{project.code}'")
    
    # Calcular horas estimadas automáticamente si se proporcionan fechas
    calculated_hours = None
    if project.start_date and project.end_date:
        calculated_hours = calculate_estimated_hours(
            project.start_date, 
            project.end_date, 
            normalized_project_type,
            organization
        )
    
    # Usar horas calculadas si no se proporcionaron horas estimadas manualmente
    final_estimated_hours = project.estimated_hours if project.estimated_hours is not None else calculated_hours
    
    # Crear el proyecto con tipos y estados normalizados
    db_project = Project(
        client_id=project.client_id,
        name=project.name,
        code=project.code,
        description=project.description,
        project_type=normalized_project_type,
        status=normalized_status,
        start_date=project.start_date,
        end_date=project.end_date,
        manager_id=project.manager_id,
        estimated_hours=final_estimated_hours,
        priority=project.priority or 'medium',
        tags=project.tags,
        organization_id=organization.organization_id
    )
    
    try:
        db.add(db_project)
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        print(f"Error de integridad al crear proyecto: {error_msg}")
        
        # Manejar errores específicos
        if 'unique_project_client' in error_msg:
            raise ValueError(f"Ya existe un proyecto con el nombre '{project.name}' para este cliente")
        elif 'projects_project_type_check' in error_msg:
            raise ValueError(f"Tipo de proyecto inválido: {project.project_type}")
        elif 'projects_status_check' in error_msg:
            raise ValueError(f"Estado de proyecto inválido: {project.status}")
        elif 'code' in error_msg and 'unique' in error_msg.lower():
            raise ValueError(f"Ya existe un proyecto con el código '{project.code}'")
        else:
            raise ValueError("No se pudo crear el proyecto. Verifique que los datos sean únicos y válidos.")


def update_project(db: Session, project_id: int, updates: ProjectUpdate):
    """
    Actualizar un proyecto, validando tipos y estados
    """
    try:
        db_project = get_project(db, project_id)
        if not db_project:
            return None
        
        # Validar tipos de proyecto si se proporcionan
        if updates.project_type:
            valid_project_types = [
                'development', 'support', 'meeting', 'training', 'other'
            ]
            
            # Mapeo de tipos de proyecto
            project_type_mapping = {
                'desarrollo': 'development',
                'soporte': 'support',
                'reunion': 'meeting',
                'capacitacion': 'training',
                'otro': 'other',
                'consultoria': 'other'  # Mapear consultoria a other
            }
            
            # Normalizar tipo de proyecto
            normalized_project_type = project_type_mapping.get(
                updates.project_type.lower(), 
                updates.project_type.lower()
            )
            
            if normalized_project_type not in valid_project_types:
                raise ValueError(f"Tipo de proyecto inválido. Debe ser uno de: {valid_project_types}")
            
            # Actualizar con el tipo normalizado
            updates.project_type = normalized_project_type
        
        if updates.status:
            valid_statuses = [
                'registered_initiative', 'in_quotation', 'proposal_approved', 'in_planning', 
                'in_progress', 'at_risk', 'suspended', 'completed', 'canceled', 'post_delivery_support'
            ]
            
            # Mapeo de estados (igual que en el schema)
            status_mapping = {
                'nuevo': 'registered_initiative',
                'en_progreso': 'in_progress', 
                'completado': 'completed',
                'pausado': 'suspended',
                'cancelado': 'canceled',
                'active': 'in_progress',
                'paused': 'suspended',
                'archived': 'canceled'
            }
            
            # Normalizar estado
            normalized_status = status_mapping.get(
                updates.status.lower(), 
                updates.status.lower()
            )
            
            if normalized_status not in valid_statuses:
                raise ValueError(f"Estado de proyecto inválido. Debe ser uno de: {valid_statuses}")
            
            # Actualizar con el estado normalizado
            updates.status = normalized_status
        
        # Actualizar campos
        update_data = updates.dict(exclude_unset=True)
        
        # Calcular horas estimadas automáticamente si se actualizan las fechas
        # y no se proporcionaron horas estimadas manualmente
        if ('start_date' in update_data or 'end_date' in update_data) and 'estimated_hours' not in update_data:
            # Obtener fechas actualizadas
            new_start_date = update_data.get('start_date', db_project.start_date)
            new_end_date = update_data.get('end_date', db_project.end_date)
            new_project_type = update_data.get('project_type', db_project.project_type)
            
            if new_start_date and new_end_date:
                # Obtener la organización del proyecto
                organization = db.query(Organization).filter(
                    Organization.organization_id == db_project.organization_id
                ).first()
                
                calculated_hours = calculate_estimated_hours(
                    new_start_date,
                    new_end_date,
                    new_project_type,
                    organization
                )
                if calculated_hours is not None:
                    update_data['estimated_hours'] = calculated_hours
        
        # Manejar estimated_hours específicamente - debe permitir None para limpiar el valor
        if hasattr(updates, 'estimated_hours') and 'estimated_hours' in updates.__fields_set__:
            update_data['estimated_hours'] = updates.estimated_hours
        
        for key, value in update_data.items():
            setattr(db_project, key, value)
        
        db.commit()
        db.refresh(db_project)
        return db_project
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al actualizar proyecto: {str(e)}")
        raise ValueError("No se pudo actualizar el proyecto. Verifique los datos.")


def delete_project(db: Session, project_id: int):
    """
    Eliminar un proyecto
    """
    try:
        db_project = get_project(db, project_id)
        if not db_project:
            return None
        
        db.delete(db_project)
        db.commit()
        return db_project
    except IntegrityError as e:
        db.rollback()
        print(f"Error de integridad al eliminar proyecto: {str(e)}")
        raise ValueError("No se pudo eliminar el proyecto. Verifique las dependencias.")


# CRUD para Cotizaciones
def create_quotation(db: Session, quotation_data: QuotationCreate, user_id: int) -> QuotationResponse:
    """Crear una nueva cotización con sus cuotas"""
    
    # Crear la cotización
    db_quotation = Quotation(
        project_id=quotation_data.project_id,
        created_by_user_id=user_id,
        total_amount=quotation_data.total_amount,
        currency=quotation_data.currency,
        status=quotation_data.status,
        description=quotation_data.description
    )
    
    db.add(db_quotation)
    db.flush()  # Para obtener el ID de la cotización
    
    # Crear las cuotas
    for installment_data in quotation_data.installments:
        db_installment = QuotationInstallment(
            quotation_id=db_quotation.quotation_id,
            installment_number=installment_data.installment_number,
            percentage=installment_data.percentage,
            amount=installment_data.amount,
            due_date=installment_data.due_date,
            is_paid=installment_data.is_paid,
            paid_date=installment_data.paid_date,
            payment_reference=installment_data.payment_reference,
            notes=installment_data.notes
        )
        db.add(db_installment)
    
    db.commit()
    db.refresh(db_quotation)
    
    return get_quotation_with_calculations(db, db_quotation.quotation_id)

def get_quotation(db: Session, quotation_id: int) -> Optional[Quotation]:
    """Obtener una cotización por ID"""
    return db.query(Quotation).filter(Quotation.quotation_id == quotation_id).first()

def get_quotation_with_calculations(db: Session, quotation_id: int) -> Optional[QuotationResponse]:
    """Obtener una cotización con cálculos de pagos"""
    quotation = db.query(Quotation).filter(Quotation.quotation_id == quotation_id).first()
    if not quotation:
        return None
    
    # Calcular totales
    installments = quotation.installments
    total_paid = sum(inst.amount for inst in installments if inst.is_paid)
    total_pending = quotation.total_amount - total_paid
    paid_installments = sum(1 for inst in installments if inst.is_paid)
    total_installments = len(installments)
    
    # Crear respuesta con cálculos
    response = QuotationResponse(
        quotation_id=quotation.quotation_id,
        project_id=quotation.project_id,
        created_by_user_id=quotation.created_by_user_id,
        total_amount=quotation.total_amount,
        currency=quotation.currency,
        status=quotation.status,
        description=quotation.description,
        created_at=quotation.created_at,
        updated_at=quotation.updated_at,
        installments=[QuotationInstallmentResponse.from_orm(inst) for inst in installments],
        total_paid=total_paid,
        total_pending=total_pending,
        paid_installments=paid_installments,
        total_installments=total_installments
    )
    
    return response

def get_project_quotations(db: Session, project_id: int) -> List[QuotationWithProjectInfo]:
    """Obtener todas las cotizaciones de un proyecto"""
    quotations = db.query(Quotation).filter(Quotation.project_id == project_id).all()
    
    result = []
    for quotation in quotations:
        # Obtener información del proyecto y usuario
        project = db.query(Project).filter(Project.project_id == quotation.project_id).first()
        user = db.query(User).filter(User.user_id == quotation.created_by_user_id).first()
        
        # Calcular totales
        installments = quotation.installments
        total_paid = sum(inst.amount for inst in installments if inst.is_paid)
        total_pending = quotation.total_amount - total_paid
        paid_installments = sum(1 for inst in installments if inst.is_paid)
        total_installments = len(installments)
        
        response = QuotationWithProjectInfo(
            quotation_id=quotation.quotation_id,
            project_id=quotation.project_id,
            created_by_user_id=quotation.created_by_user_id,
            total_amount=quotation.total_amount,
            currency=quotation.currency,
            status=quotation.status,
            description=quotation.description,
            created_at=quotation.created_at,
            updated_at=quotation.updated_at,
            installments=[QuotationInstallmentResponse.from_orm(inst) for inst in installments],
            total_paid=total_paid,
            total_pending=total_pending,
            paid_installments=paid_installments,
            total_installments=total_installments,
            project_name=project.name if project else None,
            project_code=project.code if project else None,
            created_by_name=user.full_name if user else None
        )
        result.append(response)
    
    return result

def update_quotation(db: Session, quotation_id: int, quotation_data: QuotationUpdate) -> Optional[QuotationResponse]:
    """Actualizar una cotización"""
    quotation = get_quotation(db, quotation_id)
    if not quotation:
        return None
    
    # Actualizar campos básicos
    for field, value in quotation_data.dict(exclude_unset=True, exclude={'installments'}).items():
        setattr(quotation, field, value)
    
    # Si se incluyen cuotas, actualizarlas
    if quotation_data.installments is not None:
        # Eliminar cuotas existentes
        db.query(QuotationInstallment).filter(QuotationInstallment.quotation_id == quotation_id).delete()
        
        # Crear nuevas cuotas
        for installment_data in quotation_data.installments:
            db_installment = QuotationInstallment(
                quotation_id=quotation_id,
                installment_number=installment_data.installment_number,
                percentage=installment_data.percentage,
                amount=installment_data.amount,
                due_date=installment_data.due_date,
                is_paid=installment_data.is_paid,
                paid_date=installment_data.paid_date,
                payment_reference=installment_data.payment_reference,
                notes=installment_data.notes
            )
            db.add(db_installment)
    
    db.commit()
    db.refresh(quotation)
    
    return get_quotation_with_calculations(db, quotation_id)

def delete_quotation(db: Session, quotation_id: int) -> bool:
    """Eliminar una cotización"""
    quotation = get_quotation(db, quotation_id)
    if not quotation:
        return False
    
    db.delete(quotation)
    db.commit()
    return True

def update_installment_payment_status(db: Session, installment_id: int, is_paid: bool, payment_reference: Optional[str] = None) -> Optional[QuotationInstallmentResponse]:
    """Actualizar el estado de pago de una cuota"""
    installment = db.query(QuotationInstallment).filter(QuotationInstallment.installment_id == installment_id).first()
    if not installment:
        return None
    
    installment.is_paid = is_paid
    installment.paid_date = datetime.now().date() if is_paid else None
    if payment_reference:
        installment.payment_reference = payment_reference
    
    db.commit()
    db.refresh(installment)
    
    return QuotationInstallmentResponse.from_orm(installment)

def get_quotations_summary(db: Session, organization_id: int) -> Dict[str, Any]:
    """Obtener resumen de cotizaciones para una organización"""
    # Obtener todas las cotizaciones de proyectos de la organización
    quotations = db.query(Quotation).join(Project).filter(Project.organization_id == organization_id).all()
    
    total_quotations = len(quotations)
    total_amount = sum(q.total_amount for q in quotations)
    total_paid = 0
    total_pending = 0
    
    for quotation in quotations:
        installments = quotation.installments
        paid_amount = sum(inst.amount for inst in installments if inst.is_paid)
        total_paid += paid_amount
        total_pending += quotation.total_amount - paid_amount
    
    return {
        "total_quotations": total_quotations,
        "total_amount": total_amount,
        "total_paid": total_paid,
        "total_pending": total_pending,
        "payment_percentage": (total_paid / total_amount * 100) if total_amount > 0 else 0
    }

def get_project_by_name(db: Session, name: str):
    return db.query(Project).filter(Project.name.ilike(f"%{name}%")).first()

def get_project_by_name_and_organization(db: Session, name: str, organization_id: int):
    """Buscar proyecto por nombre dentro de una organización específica"""
    return db.query(Project).filter(
        Project.name.ilike(f"%{name}%"),
        Project.organization_id == organization_id
    ).first()

def get_quotations_by_client(db: Session, client_id: int, organization_id: int) -> List[Dict[str, Any]]:
    """Obtener todas las cotizaciones de un cliente específico con cálculos"""
    try:
        # Obtener todas las cotizaciones de proyectos del cliente
        quotations = db.query(Quotation).join(Project).filter(
            Project.client_id == client_id,
            Project.organization_id == organization_id
        ).all()
        
        print(f"Debug: Found {len(quotations)} quotations for client {client_id}")
        
        result = []
        for quotation in quotations:
            # Obtener las cuotas de la cotización
            installments = quotation.installments
            
            # Calcular totales
            total_paid = sum(inst.amount for inst in installments if inst.is_paid)
            total_pending = quotation.total_amount - total_paid
            paid_installments = len([inst for inst in installments if inst.is_paid])
            total_installments = len(installments)
            
            # Crear el objeto de respuesta
            quotation_data = {
                "quotation_id": quotation.quotation_id,
                "project_id": quotation.project_id,
                "description": quotation.description,
                "total_amount": quotation.total_amount,
                "total_paid": total_paid,
                "total_pending": total_pending,
                "paid_installments": paid_installments,
                "total_installments": total_installments,
                "status": quotation.status,
                "created_at": quotation.created_at,
                "installments": [
                    {
                        "installment_id": inst.installment_id,
                        "installment_number": inst.installment_number,
                        "amount": inst.amount,
                        "percentage": inst.percentage,
                        "due_date": inst.due_date,
                        "is_paid": inst.is_paid,
                        "payment_reference": inst.payment_reference
                    } for inst in installments
                ]
            }
            
            result.append(quotation_data)
            print(f"Debug: Quotation {quotation.quotation_id} - Total: {quotation.total_amount}, Paid: {total_paid}, Pending: {total_pending}")
        
        return result
        
    except Exception as e:
        print(f"Error in get_quotations_by_client: {str(e)}")
        raise e

def get_client_projects_info(db: Session, client_id: int, organization_id: int):
    """
    Obtener información detallada de proyectos de un cliente específico
    """
    try:
        from datetime import datetime
        
        # Obtener todos los proyectos del cliente
        projects = db.query(Project).filter(
            Project.client_id == client_id,
            Project.organization_id == organization_id
        ).all()
        
        # Estados que se consideran activos para calcular proyectos atrasados
        active_statuses = ['in_planning', 'in_progress', 'at_risk', 'suspended']
        
        # Estados que se consideran en riesgo
        at_risk_statuses = ['at_risk', 'suspended']
        
        current_date = datetime.now().date()
        
        total_projects = len(projects)
        overdue_projects = 0
        at_risk_projects = 0
        
        for project in projects:
            # Proyecto atrasado: fecha de fin pasada y estado activo
            if (project.end_date and 
                project.end_date < current_date and 
                project.status in active_statuses):
                overdue_projects += 1
                
            # Proyecto en riesgo: estado específico de riesgo
            if project.status in at_risk_statuses:
                at_risk_projects += 1
        
        print(f"[DEBUG] Cliente {client_id} - Total proyectos: {total_projects}, Atrasados: {overdue_projects}, En riesgo: {at_risk_projects}")
        
        return {
            "total_projects": total_projects,
            "overdue_projects": overdue_projects,
            "at_risk_projects": at_risk_projects,
            "projects": projects
        }
        
    except Exception as e:
        print(f"Error al obtener información de proyectos del cliente {client_id}: {str(e)}")
        return {
            "total_projects": 0,
            "overdue_projects": 0,
            "at_risk_projects": 0,
            "projects": []
        }
