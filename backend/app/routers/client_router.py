from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.schemas import client_schema
from app.crud import client_crud
from app.core.database import get_db

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("/", response_model=client_schema.ClientOut)
def create(client: client_schema.ClientCreate, db: Session = Depends(get_db)):
    return client_crud.create_client(db, client)

@router.get("/", response_model=list[client_schema.ClientOut])
def read_all(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return client_crud.get_clients(db, skip, limit)

@router.get("/{client_id}", response_model=client_schema.ClientOut)
def read(client_id: int, db: Session = Depends(get_db)):
    db_client = client_crud.get_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.put("/{client_id}", response_model=client_schema.ClientOut)
def update(client_id: int, client: client_schema.ClientUpdate, db: Session = Depends(get_db)):
    db_client = client_crud.update_client(db, client_id, client)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@router.delete("/{client_id}", response_model=client_schema.ClientOut)
def delete(client_id: int, db: Session = Depends(get_db)):
    db_client = client_crud.delete_client(db, client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client
