from sqlalchemy.orm import Session
from app.models.time_entry_models import TimeEntry
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryUpdate

def create_time_entry(db: Session, entry: TimeEntryCreate):
    db_entry = TimeEntry(**entry.dict())
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def get_time_entries(db: Session, skip: int = 0, limit: int = 100):
    return db.query(TimeEntry).offset(skip).limit(limit).all()

def get_time_entry(db: Session, entry_id: int):
    return db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()

def update_time_entry(db: Session, entry_id: int, entry_data: TimeEntryUpdate):
    db_entry = db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()
    if not db_entry:
        return None
    for key, value in entry_data.dict().items():
        setattr(db_entry, key, value)
    db.commit()
    db.refresh(db_entry)
    return db_entry

def delete_time_entry(db: Session, entry_id: int):
    db_entry = db.query(TimeEntry).filter(TimeEntry.entry_id == entry_id).first()
    if not db_entry:
        return None
    db.delete(db_entry)
    db.commit()
    return db_entry
