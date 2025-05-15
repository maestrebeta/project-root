from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

# from backend.app.schemas.project_schema import ProjectCreate, ProjectUpdate
# from backend.app.crud import project_crud as crud
# from app.core.database import get_db

from app.schemas.project_schema import ProjectCreate, ProjectUpdate, ProjectOut
from app.crud import project_crud
from app.core.database import get_db

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.post("/", response_model=ProjectOut)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    return project_crud.create_project(db, project)

@router.get("/", response_model=List[ProjectOut])
def read_projects(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return project_crud.get_projects(db, skip=skip, limit=limit)

@router.get("/{project_id}", response_model=ProjectOut)
def read_project(project_id: int, db: Session = Depends(get_db)):
    db_project = project_crud.get_project(db, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.put("/{project_id}", response_model=ProjectOut)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    db_project = project_crud.update_project(db, project_id, project)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project

@router.delete("/{project_id}", response_model=ProjectOut)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = project_crud.delete_project(db, project_id)
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project