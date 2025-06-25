from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from typing import List, Optional
from app.models.bug_models import Bug
from app.schemas.bug_schema import BugCreate, BugUpdate

class BugCRUD:
    def create(self, db: Session, bug: BugCreate) -> Bug:
        db_bug = Bug(**bug.model_dump())
        db.add(db_bug)
        db.commit()
        db.refresh(db_bug)
        return db_bug

    def get(self, db: Session, bug_id: int) -> Optional[Bug]:
        return db.query(Bug).filter(Bug.id == bug_id).first()

    def get_all(
        self, 
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        search: Optional[str] = None,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        view_id: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> tuple[List[Bug], int]:
        query = db.query(Bug)
        
        # Aplicar filtros
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Bug.title.ilike(search_term)) | 
                (Bug.description.ilike(search_term))
            )
        
        if status:
            query = query.filter(Bug.status == status)
        
        if priority:
            query = query.filter(Bug.priority == priority)
        
        if view_id:
            query = query.filter(Bug.view_id == view_id)
        
        # Contar total antes de aplicar paginación
        total = query.count()
        
        # Aplicar ordenamiento
        if sort_order.lower() == "desc":
            query = query.order_by(desc(getattr(Bug, sort_by)))
        else:
            query = query.order_by(asc(getattr(Bug, sort_by)))
        
        # Aplicar paginación
        bugs = query.offset(skip).limit(limit).all()
        
        return bugs, total

    def update(self, db: Session, bug_id: int, bug_update: BugUpdate) -> Optional[Bug]:
        db_bug = self.get(db, bug_id)
        if not db_bug:
            return None
        
        update_data = bug_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_bug, field, value)
        
        db.commit()
        db.refresh(db_bug)
        return db_bug

    def delete(self, db: Session, bug_id: int) -> bool:
        db_bug = self.get(db, bug_id)
        if not db_bug:
            return False
        
        db.delete(db_bug)
        db.commit()
        return True

    def get_by_view(self, db: Session, view_id: str) -> List[Bug]:
        return db.query(Bug).filter(Bug.view_id == view_id).all()

    def get_stats(self, db: Session) -> dict:
        total_bugs = db.query(Bug).count()
        open_bugs = db.query(Bug).filter(Bug.status == "open").count()
        in_progress_bugs = db.query(Bug).filter(Bug.status == "in_progress").count()
        resolved_bugs = db.query(Bug).filter(Bug.status == "resolved").count()
        closed_bugs = db.query(Bug).filter(Bug.status == "closed").count()
        
        critical_bugs = db.query(Bug).filter(Bug.priority == "critical").count()
        high_bugs = db.query(Bug).filter(Bug.priority == "high").count()
        medium_bugs = db.query(Bug).filter(Bug.priority == "medium").count()
        low_bugs = db.query(Bug).filter(Bug.priority == "low").count()
        
        return {
            "total_bugs": total_bugs,
            "by_status": {
                "open": open_bugs,
                "in_progress": in_progress_bugs,
                "resolved": resolved_bugs,
                "closed": closed_bugs
            },
            "by_priority": {
                "critical": critical_bugs,
                "high": high_bugs,
                "medium": medium_bugs,
                "low": low_bugs
            }
        }

bug_crud = BugCRUD() 