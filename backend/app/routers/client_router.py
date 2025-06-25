from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.schemas import client_schema
from app.crud import client_crud
from app.core.database import get_db
from app.core.security import get_current_user_organization
from app.models.user_models import User
from app.models.client_models import Client

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
    clients = client_crud.get_clients_by_organization(db, current_user.organization_id, skip, limit)
    
    # Agregar promedio de calificaciones a cada cliente
    for client in clients:
        client.rating_average = client_crud.get_client_rating_average(db, client.client_id)
    
    return clients

@router.get("/organization/{organization_id}", response_model=list[client_schema.ClientOut])
def read_by_organization(
    organization_id: int,
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db)
):
    """
    Obtener clientes de una organización específica (para formularios externos)
    """
    clients = client_crud.get_clients_by_organization(db, organization_id, skip, limit)
    
    # Agregar promedio de calificaciones a cada cliente
    for client in clients:
        client.rating_average = client_crud.get_client_rating_average(db, client.client_id)
    
    return clients

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
            Project.status.in_(['in_progress', 'in_planning'])
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
        
        # Calcular ingresos y valor promedio
        from app.models.project_models import Project
        from sqlalchemy import func
        
        # Calcular ingresos totales de proyectos activos
        total_revenue_query = db.query(func.sum(Project.estimated_hours * 50)).filter(  # Asumiendo $50/hora
            Project.client_id.in_(
                db.query(Client.client_id).filter(Client.organization_id == organization_id)
            ),
            Project.status.in_(['in_progress', 'completed'])
        ).scalar()
        
        total_revenue = total_revenue_query or 0
        avg_project_value = total_revenue / active_clients if active_clients > 0 else 0
        client_satisfaction = 85.5  # Simulado por ahora
        
        return {
            "total_clients": {
                "value": str(total_clients),
                "change": f"+{total_change}" if total_change > 0 else str(total_change)
            },
            "active_clients": {
                "value": str(active_clients),
                "change": f"+{active_change}" if active_change > 0 else str(active_change)
            },
            "total_revenue": {
                "value": f"${int(total_revenue):,}",
                "change": "+$15,250"
            },
            "avg_project_value": {
                "value": f"${int(avg_project_value):,}",
                "change": "+$2,100"
            },
            "clients_with_projects": {
                "value": str(clients_with_projects),
                "change": f"+{projects_change}" if projects_change > 0 else str(projects_change)
            },
            "client_satisfaction": {
                "value": f"{client_satisfaction}%",
                "change": "+2.3%"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener estadísticas: {str(e)}"
        )

@router.get("/analytics", response_model=Dict[str, Any])
def get_clients_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_organization)
):
    """
    Obtener análisis detallado de clientes con valor, proyectos y satisfacción
    """
    try:
        from app.models.project_models import Project
        from sqlalchemy import func
        from datetime import datetime, timedelta
        import random
        
        organization_id = current_user.organization_id
        
        # Obtener clientes con sus datos de proyectos
        clients_query = db.query(Client).filter(
            Client.organization_id == organization_id,
            Client.is_active == True
        ).all()
        
        clients_analytics = []
        revenue_analysis = []
        
        # Segmentos simulados para demostración
        segments = ['enterprise', 'corporate', 'small_business', 'startup', 'government']
        
        for client in clients_query:
            # Obtener proyectos del cliente
            client_projects = db.query(Project).filter(
                Project.client_id == client.client_id
            ).all()
            
            active_projects = len([p for p in client_projects if p.status in ['in_progress', 'in_planning']])
            total_projects = len(client_projects)
            
            # Calcular valor total (estimado)
            total_value = sum([
                (p.estimated_hours or 0) * 50  # $50/hora estimado
                for p in client_projects 
                if p.status in ['in_progress', 'completed']
            ])
            
            # Datos simulados para demostración
            segment = random.choice(segments)
            satisfaction_score = random.randint(70, 95)
            successful_projects = max(0, total_projects - random.randint(0, 2))
            
            client_data = {
                'client_id': client.client_id,
                'name': client.name,
                'segment': segment,
                'total_value': int(total_value),
                'active_projects': active_projects,
                'total_projects': total_projects,
                'satisfaction_score': satisfaction_score,
                'successful_projects': successful_projects,
                'avg_delivery_time': f"{random.randint(15, 45)} días",
                'last_project': client_projects[-1].name if client_projects else None,
                'last_interaction': f"Hace {random.randint(1, 30)} días"
            }
            
            clients_analytics.append(client_data)
            
            # Agregar a análisis de ingresos
            if total_value > 0:
                revenue_analysis.append({
                    'client_name': client.name,
                    'total_revenue': int(total_value),
                    'project_count': total_projects
                })
        
        return {
            'clients': clients_analytics,
            'revenue_analysis': revenue_analysis,
            'summary': {
                'total_clients': len(clients_analytics),
                'avg_satisfaction': round(sum([c['satisfaction_score'] for c in clients_analytics]) / len(clients_analytics), 1) if clients_analytics else 0,
                'total_revenue': sum([c['total_value'] for c in clients_analytics]),
                'high_value_clients': len([c for c in clients_analytics if c['total_value'] > 50000])
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener análisis de clientes: {str(e)}"
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
    
    # Agregar promedio de calificaciones
    db_client.rating_average = client_crud.get_client_rating_average(db, client_id)
    
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
