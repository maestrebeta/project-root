from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.crud.bug_crud import bug_crud
from app.schemas.bug_schema import BugCreate, BugUpdate, BugResponse, BugListResponse
from app.models.user_models import User
from app.core.security import get_current_user

router = APIRouter(prefix="/bugs", tags=["bugs"])

@router.post("/", response_model=BugResponse)
def create_bug(
    bug: BugCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo bug"""
    # Usar el username del usuario actual como reporter
    bug_data = bug.model_dump()
    bug_data["reporter"] = current_user.username
    
    db_bug = bug_crud.create(db, BugCreate(**bug_data))
    return db_bug

@router.get("/", response_model=BugListResponse)
def get_bugs(
    skip: int = Query(0, ge=0, description="Número de registros a saltar"),
    limit: int = Query(100, ge=1, le=1000, description="Número máximo de registros"),
    search: Optional[str] = Query(None, description="Término de búsqueda"),
    status: Optional[str] = Query(None, description="Filtrar por estado"),
    priority: Optional[str] = Query(None, description="Filtrar por prioridad"),
    view_id: Optional[str] = Query(None, description="Filtrar por vista"),
    sort_by: str = Query("created_at", description="Campo para ordenar"),
    sort_order: str = Query("desc", description="Orden de clasificación (asc/desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener lista de bugs con filtros y paginación"""
    bugs, total = bug_crud.get_all(
        db=db,
        skip=skip,
        limit=limit,
        search=search,
        status=status,
        priority=priority,
        view_id=view_id,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    return BugListResponse(
        bugs=bugs,
        total=total,
        page=skip // limit + 1,
        size=limit
    )

@router.get("/{bug_id}", response_model=BugResponse)
def get_bug(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener un bug específico por ID"""
    db_bug = bug_crud.get(db, bug_id)
    if not db_bug:
        raise HTTPException(status_code=404, detail="Bug no encontrado")
    return db_bug

@router.put("/{bug_id}", response_model=BugResponse)
def update_bug(
    bug_id: int,
    bug_update: BugUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un bug existente"""
    db_bug = bug_crud.update(db, bug_id, bug_update)
    if not db_bug:
        raise HTTPException(status_code=404, detail="Bug no encontrado")
    return db_bug

@router.delete("/{bug_id}")
def delete_bug(
    bug_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un bug"""
    success = bug_crud.delete(db, bug_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bug no encontrado")
    return {"message": "Bug eliminado exitosamente"}

@router.get("/stats/summary")
def get_bug_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estadísticas de bugs"""
    return bug_crud.get_stats(db)

@router.get("/views/{view_id}", response_model=list[BugResponse])
def get_bugs_by_view(
    view_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener bugs por vista específica"""
    bugs = bug_crud.get_by_view(db, view_id)
    return bugs 