from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

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

router = APIRouter(prefix="/projects", tags=["Projects"])

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
        from datetime import datetime, timedelta
        
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
            func.coalesce(func.sum(TimeEntry.duration_hours), 0).label('total_hours'),
            func.count(TimeEntry.entry_id).label('total_entries'),
            func.count(func.distinct(TimeEntry.user_id)).label('unique_users')
        ).outerjoin(
            TimeEntry, Project.project_id == TimeEntry.project_id
        ).filter(
            Project.organization_id == organization_id
        ).group_by(
            Project.project_id, Project.name, Project.status, Project.client_id, Project.estimated_hours
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
            if estimated_hours > 0:
                progress_percentage = min((total_hours / estimated_hours) * 100, 100)
            elif total_hours > 0:
                # Si no hay estimación pero hay horas trabajadas, usar lógica basada en estado
                if stat.status == 'completed':
                    progress_percentage = 100
                elif stat.status == 'in_progress':
                    progress_percentage = 65
                elif stat.status == 'in_planning':
                    progress_percentage = 25
                else:
                    progress_percentage = 10
            
            # Calcular eficiencia
            efficiency = "N/A"
            if estimated_hours > 0 and total_hours > 0:
                if total_hours <= estimated_hours:
                    efficiency = "En tiempo"
                elif total_hours <= estimated_hours * 1.1:
                    efficiency = "Ligeramente retrasado"
                else:
                    efficiency = "Retrasado"
            
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
                "hours_remaining": max(0, estimated_hours - total_hours) if estimated_hours > 0 else 0
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener proyectos de la organización del usuario actual
    """
    try:
        # Verificar si el usuario tiene una organización
        if not current_user or not current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="El usuario no tiene una organización asignada"
            )

        # Obtener la organización
        organization = db.query(Organization).filter(
            Organization.organization_id == current_user.organization_id
        ).first()

        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organización no encontrada"
            )

        proyectos = project_crud.get_projects_by_organization(
            db, 
            current_user.organization_id, 
            skip=skip, 
            limit=limit
        )
        
        return proyectos
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error al obtener proyectos: {str(e)}"
        )

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