from sqlalchemy.orm import Session
from app.models.project_models import Project
from app.models.organization_models import Organization
from app.models.client_models import Client
from datetime import datetime, timedelta

def init_projects(db: Session):
    # Primero, verificar si ya existen proyectos
    existing_projects = db.query(Project).count()
    if existing_projects > 0:
        return

    # Obtener todas las organizaciones
    organizations = db.query(Organization).all()
    if not organizations:
        raise ValueError("No hay organizaciones en la base de datos")

    # Obtener el primer cliente
    client = db.query(Client).first()
    if not client:
        raise ValueError("No hay clientes en la base de datos")

    # Crear proyectos de ejemplo
    sample_projects = [
        Project(
            client_id=client.client_id,
            name="BIL1.2 Project",
            code="PRJ-001",
            description="Desarrollo de aplicación de facturación",
            project_type="development",
            status="active",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=90),
            estimated_hours=500,
            priority="high",
            organization_id=organizations[0].organization_id  # Asociar a la primera organización
        ),
        Project(
            client_id=client.client_id,
            name="LIMS Integration",
            code="PRJ-002",
            description="Integración de sistema de gestión de laboratorio",
            project_type="support",
            status="active",
            start_date=datetime.now() - timedelta(days=30),
            end_date=datetime.now() + timedelta(days=60),
            estimated_hours=300,
            priority="medium",
            organization_id=organizations[1].organization_id if len(organizations) > 1 else organizations[0].organization_id
        ),
        Project(
            client_id=client.client_id,
            name="Promedical Support",
            code="PRJ-003",
            description="Soporte técnico para sistema médico",
            project_type="support",
            status="paused",
            start_date=datetime.now() - timedelta(days=15),
            end_date=datetime.now() + timedelta(days=45),
            estimated_hours=400,
            priority="low",
            organization_id=organizations[0].organization_id
        )
    ]

    # Asociar proyectos a las organizaciones
    for project in sample_projects:
        # Encontrar la organización correspondiente
        org = next((org for org in organizations if org.organization_id == project.organization_id), organizations[0])
        
        # Asociar el proyecto a la organización si no está ya asociado
        if org not in project.organizations:
            project.organizations.append(org)
        
        db.add(project)

    db.commit()
    print("Proyectos de ejemplo creados exitosamente.")

def init_data(db: Session):
    """
    Función principal para inicializar datos
    """
    try:
        init_projects(db)
    except Exception as e:
        print(f"Error al inicializar datos: {e}")
        db.rollback() 