from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_organization
from app.models.user_models import User
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskOut, TaskStats, TaskListResponse
from app.crud import task_crud

router = APIRouter(prefix="/tasks", tags=["Tareas"])

@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Crear una nueva tarea"""
    # Verificar permisos
    if current_user.role not in ['super_user', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear tareas"
        )
    
    # Verificar que la organización coincida
    if task.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear tareas para otra organización"
        )
    
    db_task = task_crud.create_task(db, task, current_user.user_id)
    
    # Crear notificación si la tarea se asigna a un usuario
    if db_task.assigned_to and db_task.assigned_to != current_user.user_id:
        
        # Crear notificación de asignación
        from app.crud import notification_crud
        try:
            notification = notification_crud.create_task_assignment_notification(
                db=db,
                task_id=db_task.task_id,
                assigned_user_id=db_task.assigned_to,
                assigned_by_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                task_title=db_task.title
            )
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            import traceback
            traceback.print_exc()
            # No fallar la creación de la tarea si falla la notificación
    
    return db_task

@router.get("/", response_model=List[TaskOut])
def get_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener lista de tareas"""
    # Determinar si el usuario puede ver todas las tareas o solo las suyas
    user_id = None
    if current_user.role not in ['super_user', 'admin']:
        user_id = current_user.user_id
    
    if search:
        tasks = task_crud.search_tasks(db, current_user.organization_id, search, user_id)
    else:
        tasks = task_crud.get_tasks_by_organization(
            db, 
            current_user.organization_id, 
            skip, 
            limit, 
            user_id, 
            status, 
            priority
        )
    
    return tasks

@router.get("/stats", response_model=TaskStats)
def get_task_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estadísticas de tareas"""
    user_id = None
    if current_user.role not in ['super_user', 'admin']:
        user_id = current_user.user_id
    
    stats = task_crud.get_task_stats(db, current_user.organization_id, user_id)
    return stats

@router.get("/{task_id}", response_model=TaskOut)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener una tarea específica"""
    task = task_crud.get_task(db, task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    # Verificar permisos
    if task.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta tarea"
        )
    
    if current_user.role not in ['super_user', 'admin'] and task.assigned_to != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes ver las tareas asignadas a ti"
        )
    
    return task

@router.put("/{task_id}", response_model=TaskOut)
def update_task(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar una tarea"""
    task = task_crud.get_task(db, task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    # Verificar permisos
    if task.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta tarea"
        )
    
    # Solo super usuarios y admins pueden editar tareas, o el usuario asignado puede cambiar su estado
    can_edit = current_user.role in ['super_user', 'admin']
    can_update_status = task.assigned_to == current_user.user_id
    
    if not can_edit and not can_update_status:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para editar esta tarea"
        )
    
    # GUARDAR EL VALOR ORIGINAL ANTES DE ACTUALIZAR
    original_assigned_user_id = task.assigned_to
    
    # Si no es admin/super_user, solo puede cambiar el estado
    if not can_edit:
        update_data = task_update.dict(exclude_unset=True)
        allowed_fields = {'status', 'actual_hours'}
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        task_update = TaskUpdate(**filtered_data)
    
    updated_task = task_crud.update_task(db, task_id, task_update)
    
    if not updated_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    # Verificar si se cambió la asignación de la tarea usando el valor ORIGINAL
    
    if (task_update.assigned_to and 
        task_update.assigned_to != original_assigned_user_id):
        
        # Crear notificación de asignación
        from app.crud import notification_crud
        try:
            notification = notification_crud.create_task_assignment_notification(
                db=db,
                task_id=task_id,
                assigned_user_id=task_update.assigned_to,
                assigned_by_user_id=current_user.user_id,
                organization_id=current_user.organization_id,
                task_title=updated_task.title
            )
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            import traceback
            traceback.print_exc()
            # No fallar la actualización de la tarea si falla la notificación
    else:
        pass
    
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Eliminar una tarea"""
    # Verificar permisos
    if current_user.role not in ['super_user', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar tareas"
        )
    
    task = task_crud.get_task(db, task_id)
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )
    
    if task.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a esta tarea"
        )
    
    success = task_crud.delete_task(db, task_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tarea no encontrada"
        )

@router.get("/with-details/", response_model=List[dict])
def get_tasks_with_details(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener tareas con información detallada de usuarios y proyectos"""
    user_id = None
    if current_user.role not in ['super_user', 'admin']:
        user_id = current_user.user_id
    
    tasks = task_crud.get_tasks_with_details(db, current_user.organization_id, user_id)
    return tasks

@router.get("/task-states/", response_model=dict)
def get_task_states(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estados de tareas configurados para la organización"""
    from app.models.organization_models import Organization
    
    org = db.query(Organization).filter(Organization.organization_id == current_user.organization_id).first()
    if not org:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organización no encontrada"
        )
    # Filtrar si por error hay 'cancelled'
    estados = [s for s in org.task_states["states"] if s["id"] != "cancelled"]
    return {**org.task_states, "states": estados}

@router.get("/task-priorities/", response_model=List[dict])
def get_task_priorities():
    """Obtener prioridades de tareas disponibles"""
    return [
        {"id": "low", "label": "Baja", "color": "green", "icon": "🟢"},
        {"id": "medium", "label": "Media", "color": "yellow", "icon": "🟡"},
        {"id": "high", "label": "Alta", "color": "red", "icon": "🔴"},
        {"id": "urgent", "label": "Urgente", "color": "red", "icon": "🚨"}
    ] 