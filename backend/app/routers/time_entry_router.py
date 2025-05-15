from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.time_entry_schema import TimeEntryCreate, TimeEntryUpdate, TimeEntryOut
from app.crud import time_entry_crud as crud

router = APIRouter(prefix="/time-entries", tags=["Time Entries"])

@router.post("/", response_model=TimeEntryOut)
def create(entry: TimeEntryCreate, db: Session = Depends(get_db)):
    return crud.create_time_entry(db, entry)

@router.get("/", response_model=List[TimeEntryOut])
def read_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_time_entries(db, skip, limit)

@router.get("/{entry_id}", response_model=TimeEntryOut)
def read(entry_id: int, db: Session = Depends(get_db)):
    db_entry = crud.get_time_entry(db, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_entry

@router.put("/{entry_id}", response_model=TimeEntryOut)
def update(entry_id: int, entry: TimeEntryUpdate, db: Session = Depends(get_db)):
    db_entry = crud.update_time_entry(db, entry_id, entry)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_entry

@router.delete("/{entry_id}", response_model=TimeEntryOut)
def delete(entry_id: int, db: Session = Depends(get_db)):
    db_entry = crud.delete_time_entry(db, entry_id)
    if not db_entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_entry
