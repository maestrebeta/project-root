from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.schemas import client_schema
from app.crud import client_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User

router = APIRouter(prefix="/clients", tags=["Clients"])

@router.post("/", response_model=client_schema.ClientOut, status_code=status.HTTP_201_CREATED)
def create(
    client: client_schema.ClientCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Crear un nuevo cliente para la organización del usuario actual
    """
    try:
        # Asignar automáticamente la organización del usuario
        client.organization_id = current_user.organization_id
        return client_crud.create_client(db, client)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=list[client_schema.ClientOut])
def read_all(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener clientes de la organización del usuario actual
    """
    return client_crud.get_clients_by_organization(db, current_user.organization_id, skip, limit)

@router.get("/{client_id}", response_model=client_schema.ClientOut)
def read(
    client_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener un cliente específico de la organización del usuario
    """
    db_client = client_crud.get_client(db, client_id)
    
    # Verificar que el cliente pertenezca a la organización del usuario
    if not db_client or db_client.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Cliente no encontrado o no autorizado"
        )
    
    return db_client

@router.put("/{client_id}", response_model=client_schema.ClientOut)
def update(
    client_id: int, 
    client: client_schema.ClientUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Actualizar un cliente de la organización del usuario
    """
    try:
        # Verificar que el cliente pertenezca a la organización del usuario
        existing_client = client_crud.get_client(db, client_id)
        if not existing_client or existing_client.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Cliente no encontrado o no autorizado"
            )

        # Mantener el organization_id original
        updated_client = client_crud.update_client(db, client_id, client)
        
        if not updated_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Cliente no encontrado"
            )
        
        return updated_client
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{client_id}", response_model=client_schema.ClientOut)
def delete(
    client_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Eliminar un cliente de la organización del usuario
    """
    try:
        # Verificar que el cliente pertenezca a la organización del usuario
        existing_client = client_crud.get_client(db, client_id)
        if not existing_client or existing_client.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Cliente no encontrado o no autorizado"
            )

        deleted_client = client_crud.delete_client(db, client_id)
        
        if not deleted_client:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Cliente no encontrado"
            )
        
        return deleted_client
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
