from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

# from backend.app.schemas.project_schema import ProjectCreate, ProjectUpdate
# from backend.app.crud import project_crud as crud
# from app.core.database import get_db

from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectOut
from app.crud import project_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization, get_current_user
from app.models.user_models import User
from app.models.organization_models import Organization
from app.models.project_models import Project
from app.models.time_entry_models import TimeEntry
from app.crud.project_crud import (
    create_project, get_projects, get_project, update_project, delete_project,
    create_quotation, get_quotation_with_calculations, get_project_quotations,
    update_quotation, delete_quotation, update_installment_payment_status,
    get_quotations_summary, get_quotations_by_client
)
from app.schemas.project_schema import (
    ProjectOut,
    QuotationCreate, QuotationUpdate, QuotationResponse, QuotationWithProjectInfo
)
from pydantic import BaseModel
from datetime import date, datetime, timedelta

router = APIRouter(prefix="/projects", tags=["Projects"])

class InstallmentPaymentUpdate(BaseModel):
    is_paid: bool
    payment_reference: Optional[str] = None

@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    project: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Crear un nuevo proyecto para la organización del usuario actual
    """
    try:
        # Usar la organización del usuario actual
        project.organization_id = current_user.organization_id
        return project_crud.create_project(db, project)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/stats", response_model=dict)
def get_projects_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener estadísticas de proyectos de la organización actual
    """
    try:
        from sqlalchemy import func
        
        organization_id = current_user.organization_id
        
        # Total de proyectos en la organización
        total_projects = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id
        ).scalar()
        
        # Proyectos activos (en planeación y en progreso)
        active_projects = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.status.in_(['in_planning', 'in_progress'])
        ).scalar()
        
        # Proyectos completados
        completed_projects = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.status == 'completed'
        ).scalar()
        
        # Proyectos atrasados (fecha de fin pasada y estado activo)
        current_date = datetime.now().date()
        overdue_projects = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.end_date < current_date,
            Project.status.in_(['in_planning', 'in_progress', 'at_risk'])
        ).scalar()
        
        # Proyectos creados este mes
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.created_at >= current_month
        ).scalar()
        
        # Proyectos completados este mes
        completed_this_month = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.status == 'completed',
            Project.updated_at >= current_month
        ).scalar()
        
        # Proyectos creados el mes pasado para calcular el cambio
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        new_last_month = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.created_at >= last_month,
            Project.created_at < current_month
        ).scalar()
        
        completed_last_month = db.query(func.count(Project.project_id)).filter(
            Project.organization_id == organization_id,
            Project.status == 'completed',
            Project.updated_at >= last_month,
            Project.updated_at < current_month
        ).scalar()
        
        # Calcular cambios
        total_change = new_this_month - new_last_month if new_last_month > 0 else new_this_month
        active_change = max(0, new_this_month - completed_this_month)  # Nuevos menos completados
        completed_change = completed_this_month - completed_last_month if completed_last_month > 0 else completed_this_month
        overdue_change = -max(0, completed_this_month)  # Negativo si se completaron proyectos atrasados
        
        return {
            "total_projects": {
                "value": str(total_projects),
                "change": f"+{total_change}" if total_change > 0 else str(total_change)
            },
            "active_projects": {
                "value": str(active_projects),
                "change": f"+{active_change}" if active_change > 0 else str(active_change)
            },
            "completed_projects": {
                "value": str(completed_projects),
                "change": f"+{completed_change}" if completed_change > 0 else str(completed_change)
            },
            "overdue_projects": {
                "value": str(overdue_projects),
                "change": f"{overdue_change}" if overdue_change != 0 else "0"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/time-analytics", response_model=Dict[str, Any])
def get_projects_time_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener analíticas de tiempo por proyecto para la organización actual
    """
    try:
        from sqlalchemy import func
        
        organization_id = current_user.organization_id
        
        # Consulta para obtener estadísticas de tiempo por proyecto
        time_stats = db.query(
            Project.project_id,
            Project.name,
            Project.status,
            Project.client_id,
            Project.estimated_hours,
            Project.start_date,
            Project.end_date,
            func.coalesce(func.sum(TimeEntry.duration_hours), 0).label('total_hours'),
            func.count(TimeEntry.entry_id).label('total_entries'),
            func.count(func.distinct(TimeEntry.user_id)).label('unique_users')
        ).outerjoin(
            TimeEntry, Project.project_id == TimeEntry.project_id
        ).filter(
            Project.organization_id == organization_id
        ).group_by(
            Project.project_id, Project.name, Project.status, Project.client_id, Project.estimated_hours, Project.start_date, Project.end_date
        ).all()
        
        # Procesar datos
        projects_analytics = []
        total_hours_all_projects = 0
        total_estimated_hours = 0
        
        for stat in time_stats:
            total_hours = float(stat.total_hours) if stat.total_hours else 0
            estimated_hours = stat.estimated_hours if stat.estimated_hours else 0
            
            # Calcular progreso basado en horas
            progress_percentage = 0
            
            # Si el proyecto está completado, el progreso siempre es 100%
            if stat.status == 'completed':
                progress_percentage = 100
            elif estimated_hours > 0:
                progress_percentage = min((total_hours / estimated_hours) * 100, 100)
            elif total_hours > 0:
                # Si no hay estimación pero hay horas trabajadas, usar lógica basada en estado
                if stat.status == 'in_progress':
                    progress_percentage = 65
                elif stat.status == 'in_planning':
                    progress_percentage = 25
                else:
                    progress_percentage = 10
            
            # Calcular eficiencia considerando fechas y horas
            efficiency = "N/A"
            today = date.today()
            
            # Función para calcular días hábiles entre dos fechas
            def get_working_days(start_date, end_date):
                """Calcula días hábiles entre dos fechas (excluyendo fines de semana)"""
                if start_date > end_date:
                    return 0
                
                working_days = 0
                current_date = start_date
                while current_date <= end_date:
                    # 0 = Lunes, 6 = Domingo
                    if current_date.weekday() < 5:  # Lunes a Viernes
                        working_days += 1
                    current_date += timedelta(days=1)
                return working_days
            
            # Si el proyecto está completado, no mostrar eficiencia
            if stat.status == 'completed':
                efficiency = None
            # Si no tiene fecha de fin, mostrar "Sin fecha límite"
            elif not stat.end_date:
                efficiency = "Sin fecha límite"
            # Si tiene fecha de fin, calcular eficiencia basándose en la fecha
            else:
                # Si la fecha de fin ya pasó y el proyecto no está completado
                if stat.end_date < today:
                    efficiency = "Retrasado"
                # Si la fecha de fin está en el futuro
                elif stat.end_date > today:
                    # Calcular días hábiles restantes
                    working_days_remaining = get_working_days(today, stat.end_date)
                    
                    # Si faltan 15 días hábiles o menos
                    if working_days_remaining <= 15:
                        efficiency = "Ligeramente retrasado"
                    else:
                        efficiency = "En tiempo"
                else:
                    # Proyecto completado en tiempo
                    efficiency = "En tiempo"
            
            project_data = {
                "project_id": stat.project_id,
                "name": stat.name,
                "status": stat.status,
                "client_id": stat.client_id,
                "estimated_hours": estimated_hours,
                "total_hours": total_hours,
                "total_entries": stat.total_entries,
                "unique_users": stat.unique_users,
                "progress_percentage": round(progress_percentage, 1),
                "efficiency": efficiency,
                "hours_remaining": max(0, estimated_hours - total_hours) if estimated_hours > 0 else 0,
                "start_date": stat.start_date.isoformat() if stat.start_date else None,
                "end_date": stat.end_date.isoformat() if stat.end_date else None
            }
            
            projects_analytics.append(project_data)
            total_hours_all_projects += total_hours
            total_estimated_hours += estimated_hours
        
        # Estadísticas generales
        overall_efficiency = 0
        if total_estimated_hours > 0:
            overall_efficiency = (total_hours_all_projects / total_estimated_hours) * 100
        
        return {
            "projects": projects_analytics,
            "summary": {
                "total_projects": len(time_stats),
                "total_hours_worked": round(total_hours_all_projects, 2),
                "total_estimated_hours": total_estimated_hours,
                "overall_efficiency": round(overall_efficiency, 1),
                "average_hours_per_project": round(total_hours_all_projects / len(time_stats), 2) if len(time_stats) > 0 else 0
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener analíticas de tiempo: {str(e)}"
        )

@router.get("/", response_model=List[ProjectOut])
def read_projects(
    skip: int = 0, 
    limit: int = 100, 
    client_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener proyectos de la organización del usuario actual con filtros opcionales
    """
    return project_crud.get_projects_by_organization(
        db, 
        current_user.organization_id, 
        skip, 
        limit,
        client_id=client_id,
        status=status
    )

@router.get("/organization/{organization_id}", response_model=List[ProjectOut])
def read_by_organization(
    organization_id: int,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Obtener proyectos de una organización específica (para formularios externos)
    """
    return project_crud.get_projects_by_organization(db, organization_id, skip, limit)

@router.get("/{project_id}", response_model=ProjectOut)
def read_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener un proyecto específico de la organización del usuario
    """
    db_project = project_crud.get_project(db, project_id)
    
    # Verificar que el proyecto pertenezca a la organización del usuario
    if not db_project or db_project.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Proyecto no encontrado o no autorizado"
        )
    
    return db_project

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int, 
    project: ProjectUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar un proyecto de la organización del usuario
    """
    try:
        # Verificar que el proyecto pertenezca a la organización del usuario
        existing_project = project_crud.get_project(db, project_id)
        if not existing_project or existing_project.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado o no autorizado"
            )

        # Mantener el organization_id original
        project.organization_id = existing_project.organization_id

        updated_project = project_crud.update_project(db, project_id, project)
        
        if not updated_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado"
            )
        
        return updated_project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/bulk-delete", response_model=Dict[str, Any])
def bulk_delete_projects(
    project_ids: List[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar múltiples proyectos a la vez (solo para super usuarios)
    """
    # Verificar que el usuario sea super_user
    if current_user.role != 'super_user':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo los super usuarios pueden eliminar proyectos masivamente"
        )
    
    if not project_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Debe proporcionar al menos un ID de proyecto"
        )
    
    try:
        deleted_projects = []
        failed_projects = []
        
        for project_id in project_ids:
            try:
                # Obtener el proyecto
                project = project_crud.get_project(db, project_id)
                if not project:
                    failed_projects.append({
                        "project_id": project_id,
                        "error": "Proyecto no encontrado"
                    })
                    continue
                
                # Verificar que el proyecto pertenezca a la organización del usuario (para super_user esto es opcional)
                # Pero mantenemos la verificación por seguridad
                if project.organization_id != current_user.organization_id:
                    failed_projects.append({
                        "project_id": project_id,
                        "error": "Proyecto no pertenece a tu organización"
                    })
                    continue
                
                # Eliminar el proyecto
                success = project_crud.delete_project(db, project_id)
                if success:
                    deleted_projects.append({
                        "project_id": project_id,
                        "name": project.name
                    })
                else:
                    failed_projects.append({
                        "project_id": project_id,
                        "error": "Error al eliminar el proyecto"
                    })
                    
            except Exception as e:
                failed_projects.append({
                    "project_id": project_id,
                    "error": str(e)
                })
        
        return {
            "message": f"Eliminación masiva completada",
            "deleted_count": len(deleted_projects),
            "failed_count": len(failed_projects),
            "deleted_projects": deleted_projects,
            "failed_projects": failed_projects
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en eliminación masiva: {str(e)}"
        )

@router.delete("/{project_id}", response_model=ProjectOut)
def delete_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Eliminar un proyecto de la organización del usuario
    """
    try:
        # Verificar que el proyecto pertenezca a la organización del usuario
        existing_project = project_crud.get_project(db, project_id)
        if not existing_project or existing_project.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado o no autorizado"
            )

        deleted_project = project_crud.delete_project(db, project_id)
        
        if not deleted_project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Proyecto no encontrado"
            )
        
        return deleted_project
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Endpoints para Cotizaciones
@router.post("/quotations/", response_model=QuotationResponse, tags=["Cotizaciones"])
def create_project_quotation(
    quotation_data: QuotationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear una nueva cotización para un proyecto"""
    try:
        return create_quotation(db, quotation_data, current_user.user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error al crear la cotización: {str(e)}"
        )

@router.get("/quotations/summary", tags=["Cotizaciones"])
def get_quotations_summary_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener resumen de cotizaciones de la organización"""
    try:
        
        if not current_user.organization_id:
            print("Error: Usuario no tiene organización asignada")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario no tiene organización asignada"
            )
        
        result = get_quotations_summary(db, current_user.organization_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quotations_summary_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/quotations/{quotation_id}", response_model=QuotationResponse, tags=["Cotizaciones"])
def get_project_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener una cotización específica"""
    quotation = get_quotation_with_calculations(db, quotation_id)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cotización no encontrada"
        )
    return quotation

@router.get("/{project_id}/quotations", response_model=List[QuotationWithProjectInfo], tags=["Cotizaciones"])
def get_project_quotations_list(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las cotizaciones de un proyecto"""
    return get_project_quotations(db, project_id)

@router.put("/quotations/{quotation_id}", response_model=QuotationResponse, tags=["Cotizaciones"])
def update_project_quotation(
    quotation_id: int,
    quotation_data: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar una cotización"""
    quotation = update_quotation(db, quotation_id, quotation_data)
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cotización no encontrada"
        )
    return quotation

@router.delete("/quotations/{quotation_id}", tags=["Cotizaciones"])
def delete_project_quotation(
    quotation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar una cotización"""
    success = delete_quotation(db, quotation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cotización no encontrada"
        )
    return {"message": "Cotización eliminada exitosamente"}

@router.put("/quotations/installments/{installment_id}/payment", tags=["Cotizaciones"])
def update_installment_payment(
    installment_id: int,
    payment_data: InstallmentPaymentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar el estado de pago de una cuota"""
    installment = update_installment_payment_status(
        db, 
        installment_id, 
        payment_data.is_paid, 
        payment_data.payment_reference
    )
    if not installment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cuota no encontrada"
        )
    return installment

@router.get("/quotations/by-client/{client_id}", tags=["Cotizaciones"])
def get_quotations_by_client_endpoint(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener todas las cotizaciones de un cliente específico"""
    try:
        
        if not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuario no tiene organización asignada"
            )
        
        # Verificar que el cliente pertenece a la organización del usuario
        from ..crud.client_crud import get_client
        client = get_client(db, client_id)
        if not client or client.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado"
            )
        
        # Obtener todas las cotizaciones del cliente
        result = get_quotations_by_client(db, client_id, current_user.organization_id)
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quotations_by_client_endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

@router.get("/by-client/{client_id}/info", tags=["Proyectos"])
def get_client_projects_info_endpoint(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener información detallada de proyectos de un cliente específico
    """
    try:
        info = project_crud.get_client_projects_info(db, client_id, current_user.organization_id)
        return {
            "client_id": client_id,
            "total_projects": info["total_projects"],
            "overdue_projects": info["overdue_projects"],
            "at_risk_projects": info["at_risk_projects"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener información de proyectos del cliente: {str(e)}"
        )

@router.get("/{project_id}/progress", response_model=Dict[str, Any])
def get_project_progress(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener el progreso del proyecto basado en las historias de usuario
    Esta es la fuente de verdad para el progreso del proyecto
    """
    try:
        from sqlalchemy import func
        from app.models.epic_models import UserStory
        
        # Verificar que el proyecto pertenece a la organización del usuario
        project = db.query(Project).filter(
            Project.project_id == project_id,
            Project.organization_id == current_user.organization_id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        # Obtener todas las historias del proyecto
        stories = db.query(UserStory).filter(
            UserStory.project_id == project_id
        ).all()
        
        if not stories:
            return {
                "project_id": project_id,
                "total_stories": 0,
                "completed_stories": 0,
                "total_estimated_hours": 0,
                "total_actual_hours": 0,
                "progress_percentage": 0,
                "velocity": 0,
                "points_velocity": 0
            }
        
        # Calcular estadísticas basadas en historias
        total_stories = len(stories)
        completed_stories = len([s for s in stories if s.status == 'done'])
        total_estimated_hours = sum(float(s.estimated_hours or 0) for s in stories)
        total_actual_hours = sum(float(s.actual_hours or 0) for s in stories)
        
        # Calcular progreso basado en historias completadas
        progress_percentage = (completed_stories / total_stories * 100) if total_stories > 0 else 0
        
        # Calcular velocidad (porcentaje de historias completadas)
        velocity = progress_percentage
        
        # Calcular velocidad por puntos/horas (porcentaje de horas completadas)
        points_velocity = (total_actual_hours / total_estimated_hours * 100) if total_estimated_hours > 0 else 0
        
        # Distribución por estado
        status_distribution = {}
        for story in stories:
            status = story.status
            if status not in status_distribution:
                status_distribution[status] = 0
            status_distribution[status] += 1
        
        return {
            "project_id": project_id,
            "total_stories": total_stories,
            "completed_stories": completed_stories,
            "total_estimated_hours": round(total_estimated_hours, 2),
            "total_actual_hours": round(total_actual_hours, 2),
            "progress_percentage": round(progress_percentage, 1),
            "velocity": round(velocity, 1),
            "points_velocity": round(points_velocity, 1),
            "status_distribution": status_distribution,
            "stories_by_status": {
                "backlog": len([s for s in stories if s.status == 'backlog']),
                "nuevo": len([s for s in stories if s.status == 'nuevo']),
                "en_progreso": len([s for s in stories if s.status == 'en_progreso']),
                "listo_pruebas": len([s for s in stories if s.status == 'listo_pruebas']),
                "done": len([s for s in stories if s.status == 'done']),
                "blocked": len([s for s in stories if s.status == 'blocked'])
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular progreso del proyecto: {str(e)}"
        )

@router.post("/{project_id}/update-status-from-epics", response_model=Dict[str, Any])
def update_project_status_from_epics_endpoint(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar el estado del proyecto basándose en el estado de sus épicas.
    Si todas las épicas están en estado 'done', el proyecto cambia a 'completed'.
    Si alguna épica no está en 'done', el proyecto cambia a 'in_progress'.
    """
    try:
        # Verificar que el proyecto pertenece a la organización del usuario
        project = db.query(Project).filter(
            Project.project_id == project_id,
            Project.organization_id == current_user.organization_id
        ).first()
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        
        # Importar la función del CRUD de épicas
        from app.crud.epic_crud import update_project_status_from_epics
        
        # Actualizar el estado del proyecto
        update_project_status_from_epics(db, project_id)
        
        # Obtener el proyecto actualizado
        updated_project = db.query(Project).filter(Project.project_id == project_id).first()
        
        return {
            "message": "Estado del proyecto actualizado exitosamente",
            "project_id": project_id,
            "project_name": updated_project.name,
            "new_status": updated_project.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar estado del proyecto: {str(e)}"
        )

@router.get("/by-client/{client_id}/progress", response_model=Dict[str, Any])
def get_client_projects_progress_endpoint(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener el progreso promedio de todos los proyectos de un cliente específico
    """
    try:
        from sqlalchemy import func
        from app.models.epic_models import UserStory
        
        # Verificar que el cliente pertenece a la organización del usuario
        from ..crud.client_crud import get_client
        client = get_client(db, client_id)
        if not client or client.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Cliente no encontrado o no autorizado"
            )
        
        # Obtener todos los proyectos del cliente
        projects = db.query(Project).filter(
            Project.client_id == client_id,
            Project.organization_id == current_user.organization_id
        ).all()
        
        if not projects:
            return {
                "client_id": client_id,
                "total_projects": 0,
                "average_progress": 0,
                "projects_progress": [],
                "total_stories": 0,
                "completed_stories": 0,
                "total_estimated_hours": 0,
                "total_actual_hours": 0
            }
        
        # Calcular progreso para cada proyecto
        projects_progress = []
        total_progress = 0
        total_stories = 0
        completed_stories = 0
        total_estimated_hours = 0
        total_actual_hours = 0
        
        for project in projects:
            # Obtener historias del proyecto
            stories = db.query(UserStory).filter(
                UserStory.project_id == project.project_id
            ).all()
            
            if stories:
                # Calcular estadísticas del proyecto
                project_total_stories = len(stories)
                project_completed_stories = len([s for s in stories if s.status == 'done'])
                project_total_estimated_hours = sum(float(s.estimated_hours or 0) for s in stories)
                project_total_actual_hours = sum(float(s.actual_hours or 0) for s in stories)
                
                # Calcular progreso del proyecto
                project_progress = (project_completed_stories / project_total_stories * 100) if project_total_stories > 0 else 0
                
                # Acumular totales
                total_progress += project_progress
                total_stories += project_total_stories
                completed_stories += project_completed_stories
                total_estimated_hours += project_total_estimated_hours
                total_actual_hours += project_total_actual_hours
                
                # Agregar progreso del proyecto a la lista
                projects_progress.append({
                    "project_id": project.project_id,
                    "project_name": project.name,
                    "progress_percentage": round(project_progress, 1),
                    "total_stories": project_total_stories,
                    "completed_stories": project_completed_stories,
                    "total_estimated_hours": round(project_total_estimated_hours, 2),
                    "total_actual_hours": round(project_total_actual_hours, 2)
                })
            else:
                # Proyecto sin historias
                projects_progress.append({
                    "project_id": project.project_id,
                    "project_name": project.name,
                    "progress_percentage": 0,
                    "total_stories": 0,
                    "completed_stories": 0,
                    "total_estimated_hours": 0,
                    "total_actual_hours": 0
                })
        
        # Calcular progreso promedio
        average_progress = (total_progress / len(projects)) if projects else 0
        
        return {
            "client_id": client_id,
            "total_projects": len(projects),
            "average_progress": round(average_progress, 1),
            "projects_progress": projects_progress,
            "total_stories": total_stories,
            "completed_stories": completed_stories,
            "total_estimated_hours": round(total_estimated_hours, 2),
            "total_actual_hours": round(total_actual_hours, 2)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al calcular progreso de proyectos del cliente: {str(e)}"
        )