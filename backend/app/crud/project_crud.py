from sqlalchemy.orm import Session
from app.models.project_models import Project
from app.schemas.project_schema import ProjectCreate, ProjectUpdate


def get_project(db: Session, project_id: int):
    return db.query(Project).filter(Project.project_id == project_id).first()


def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Project).offset(skip).limit(limit).all()


def create_project(db: Session, project: ProjectCreate):
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


def update_project(db: Session, project_id: int, updates: ProjectUpdate):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    for key, value in updates.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project


def delete_project(db: Session, project_id: int):
    db_project = get_project(db, project_id)
    if not db_project:
        return None
    db.delete(db_project)
    db.commit()
    return db_project
