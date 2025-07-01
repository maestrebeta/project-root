from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.schemas.epic_schema import (
    EpicCreate, EpicUpdate, EpicOut,
    UserStoryCreate, UserStoryUpdate, UserStoryOut,
    UserStoryCreateWithAssignment,
    ProjectPlanningStats
)
from app.crud import epic_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
from app.models.epic_models import Epic, UserStory
from app.models.project_models import Project

router = APIRouter(prefix="/epics", tags=["Epics & User Stories"])

# Epic endpoints
@router.get("/", response_model=List[EpicOut])
def get_all_epics(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener todas las épicas de la organización del usuario"""
    try:
        # Obtener todas las épicas de la organización
        epics = db.query(Epic).join(Project).filter(
            Project.organization_id == current_user.organization_id
        ).offset(skip).limit(limit).all()
        
        # Calcular estadísticas para cada épica
        for epic in epics:
            epic = epic_crud.calculate_epic_stats(db, epic)
        
        return epics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener épicas: {str(e)}"
        )

@router.post("/", response_model=EpicOut, status_code=status.HTTP_201_CREATED)
def create_epic(
    epic: EpicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Crear una nueva épica"""
    try:
        return epic_crud.create_epic(db, epic)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/project/{project_id}", response_model=List[EpicOut])
def get_epics_by_project(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener épicas de un proyecto"""
    try:
        return epic_crud.get_epics_by_project(db, project_id, skip, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener épicas: {str(e)}"
        )

@router.get("/{epic_id}", response_model=EpicOut)
def get_epic(
    epic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener una épica específica"""
    epic = epic_crud.get_epic(db, epic_id)
    if not epic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Épica no encontrada"
        )
    return epic

@router.put("/{epic_id}", response_model=EpicOut)
def update_epic(
    epic_id: int,
    epic_update: EpicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar una épica"""
    try:
        updated_epic = epic_crud.update_epic(db, epic_id, epic_update)
        if not updated_epic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Épica no encontrada"
            )
        return updated_epic
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{epic_id}", response_model=EpicOut)
def delete_epic(
    epic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Eliminar una épica"""
    try:
        deleted_epic = epic_crud.delete_epic(db, epic_id)
        if not deleted_epic:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Épica no encontrada"
            )
        return deleted_epic
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# User Story endpoints
@router.get("/stories/", response_model=List[UserStoryOut])
def get_all_user_stories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener todas las historias de usuario de la organización del usuario"""
    try:
        # Obtener todas las historias de la organización
        stories = db.query(UserStory).join(Project).filter(
            Project.organization_id == current_user.organization_id
        ).offset(skip).limit(limit).all()
        
        # Calcular estadísticas para cada historia
        for story in stories:
            story = epic_crud.calculate_story_stats(db, story)
        
        return stories
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historias de usuario: {str(e)}"
        )

@router.post("/stories/", response_model=UserStoryOut, status_code=status.HTTP_201_CREATED)
def create_user_story(
    story: UserStoryCreateWithAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Crear una nueva historia de usuario"""
    try:
        # Establecer el usuario que está haciendo la asignación
        if hasattr(story, 'assigned_by_user_id') and story.assigned_by_user_id:
            # Si se proporciona assigned_by_user_id, usarlo
            pass
        else:
            # Si no se proporciona, usar el usuario actual
            story.assigned_by_user_id = current_user.user_id
        
        result = epic_crud.create_user_story(db, story)
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se pudo crear la historia de usuario"
            )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.get("/stories/epic/{epic_id}", response_model=List[UserStoryOut])
def get_user_stories_by_epic(
    epic_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener historias de usuario de una épica"""
    try:
        return epic_crud.get_user_stories_by_epic(db, epic_id, skip, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historias: {str(e)}"
        )

@router.get("/stories/project/{project_id}", response_model=List[UserStoryOut])
def get_user_stories_by_project(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener todas las historias de usuario de un proyecto"""
    try:
        return epic_crud.get_user_stories_by_project(db, project_id, skip, limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener historias: {str(e)}"
        )

@router.get("/stories/{story_id}", response_model=UserStoryOut)
def get_user_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener una historia de usuario específica"""
    story = epic_crud.get_user_story(db, story_id)
    if not story:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Historia de usuario no encontrada"
        )
    return story

@router.put("/stories/{story_id}", response_model=UserStoryOut)
def update_user_story(
    story_id: int,
    story_update: UserStoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Actualizar una historia de usuario"""
    try:
        # Obtener la historia actual para saber el proyecto
        current_story = epic_crud.get_user_story(db, story_id)
        if not current_story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Historia de usuario no encontrada"
            )
        
        # Establecer el usuario que está haciendo la asignación
        if hasattr(story_update, 'assigned_user_id') and story_update.assigned_user_id:
            # Agregar el usuario que está haciendo la asignación
            story_update.assigned_by_user_id = current_user.user_id
        
        # Actualizar la historia directamente
        updated_story = epic_crud.update_user_story(db, story_id, story_update)
        
        # Actualizar horas estimadas del proyecto
        epic_crud.update_project_estimated_hours(db, current_story.project_id)
        
        return updated_story
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/stories/{story_id}", response_model=UserStoryOut)
def delete_user_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Eliminar una historia de usuario"""
    try:
        # Obtener la historia actual para saber el proyecto
        current_story = epic_crud.get_user_story(db, story_id)
        if not current_story:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Historia de usuario no encontrada"
            )
        
        deleted_story = epic_crud.delete_user_story(db, story_id)
        
        # Actualizar horas estimadas del proyecto
        epic_crud.update_project_estimated_hours(db, current_story.project_id)
        
        return deleted_story
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# Planning and Statistics endpoints
@router.get("/planning/stats", response_model=Dict[str, Any])
def get_planning_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estadísticas generales de planificación de la organización"""
    try:
        from sqlalchemy import func
        
        organization_id = current_user.organization_id
        
        # Contar épicas
        total_epics = db.query(func.count(Epic.epic_id)).join(Project).filter(
            Project.organization_id == organization_id
        ).scalar()
        
        # Contar historias de usuario
        total_stories = db.query(func.count(UserStory.story_id)).join(Project).filter(
            Project.organization_id == organization_id
        ).scalar()
        
        # Contar historias por estado
        completed_stories = db.query(func.count(UserStory.story_id)).join(Project).filter(
            Project.organization_id == organization_id,
            UserStory.status == 'done'
        ).scalar()
        
        in_progress_stories = db.query(func.count(UserStory.story_id)).join(Project).filter(
            Project.organization_id == organization_id,
            UserStory.status == 'in_progress'
        ).scalar()
        
        pending_stories = db.query(func.count(UserStory.story_id)).join(Project).filter(
            Project.organization_id == organization_id,
            UserStory.status.in_(['todo', 'pending'])
        ).scalar()
        
        return {
            "total_epics": total_epics,
            "total_stories": total_stories,
            "completed_stories": completed_stories,
            "in_progress_stories": in_progress_stories,
            "pending_stories": pending_stories,
            "completion_rate": round((completed_stories / total_stories * 100), 2) if total_stories > 0 else 0
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/planning/project/{project_id}", response_model=Dict[str, Any])
def get_project_planning_stats(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Obtener estadísticas completas de planificación de un proyecto"""
    try:
        stats = epic_crud.get_project_planning_stats(db, project_id)
        if not stats:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Proyecto no encontrado"
            )
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.post("/planning/project/{project_id}/recalculate", response_model=Dict[str, Any])
def recalculate_project_hours(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """Recalcular las horas estimadas del proyecto basándose en las historias de usuario"""
    try:
        total_hours = epic_crud.update_project_estimated_hours(db, project_id)
        
        # Actualizar estadísticas de todas las épicas del proyecto
        epics = epic_crud.get_epics_by_project(db, project_id)
        for epic in epics:
            epic_crud.update_epic_stats(db, epic.epic_id)
        
        return {
            "message": "Horas del proyecto recalculadas exitosamente",
            "project_id": project_id,
            "total_estimated_hours": float(total_hours),
            "epics_updated": len(epics)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al recalcular horas: {str(e)}"
        ) 