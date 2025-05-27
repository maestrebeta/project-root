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

@router.get("/stats", response_model=dict)
def get_clients_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener estadísticas de clientes de la organización actual
    """
    try:
        from sqlalchemy import func
        from datetime import datetime, timedelta
        from app.models.project_models import Project
        from app.models.client_models import Client
        
        organization_id = current_user.organization_id
        
        # Total de clientes en la organización
        total_clients = db.query(func.count(Client.client_id)).filter(
            Client.organization_id == organization_id
        ).scalar()
        
        # Clientes activos
        active_clients = db.query(func.count(Client.client_id)).filter(
            Client.organization_id == organization_id,
            Client.is_active == True
        ).scalar()
        
        # Clientes inactivos
        inactive_clients = total_clients - active_clients
        
        # Clientes con proyectos activos
        clients_with_projects = db.query(func.count(func.distinct(Client.client_id))).join(
            Project, Client.client_id == Project.client_id
        ).filter(
            Client.organization_id == organization_id,
            Project.status == 'active'
        ).scalar()
        
        # Clientes creados este mes
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = db.query(func.count(Client.client_id)).filter(
            Client.organization_id == organization_id,
            Client.created_at >= current_month
        ).scalar()
        
        # Clientes creados el mes pasado para calcular el cambio
        last_month = (current_month - timedelta(days=1)).replace(day=1)
        new_last_month = db.query(func.count(Client.client_id)).filter(
            Client.organization_id == organization_id,
            Client.created_at >= last_month,
            Client.created_at < current_month
        ).scalar()
        
        # Calcular cambios
        total_change = new_this_month - new_last_month if new_last_month > 0 else new_this_month
        active_change = max(0, new_this_month)  # Asumimos que los nuevos clientes están activos
        inactive_change = max(0, inactive_clients - (total_clients - new_this_month))
        projects_change = max(0, clients_with_projects)  # Cambio positivo si hay clientes con proyectos
        
        return {
            "total_clients": {
                "value": str(total_clients),
                "change": f"+{total_change}" if total_change > 0 else str(total_change)
            },
            "active_clients": {
                "value": str(active_clients),
                "change": f"+{active_change}" if active_change > 0 else str(active_change)
            },
            "inactive_clients": {
                "value": str(inactive_clients),
                "change": f"+{inactive_change}" if inactive_change > 0 else str(inactive_change)
            },
            "clients_with_projects": {
                "value": str(clients_with_projects),
                "change": f"+{projects_change}" if projects_change > 0 else str(projects_change)
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

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
