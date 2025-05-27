from sqlalchemy.orm import Session
from app.models.project_models import Project
from app.models.organization_models import Organization
from app.models.client_models import Client
from app.models.country_models import Country
from app.models.user_models import User
from app.core.security import get_password_hash
from datetime import datetime, timedelta

def init_countries(db: Session):
    """Inicializar países básicos"""
    existing_countries = db.query(Country).count()
    if existing_countries > 0:
        return

    countries = [
        Country(
            country_code="ES",
            country_name="España",
            continent="Europa",
            phone_code="+34",
            currency_code="EUR",
            currency_symbol="€",
            is_active=True
        ),
        Country(
            country_code="US",
            country_name="Estados Unidos",
            continent="América",
            phone_code="+1",
            currency_code="USD",
            currency_symbol="$",
            is_active=True
        )
    ]
    
    for country in countries:
        db.add(country)
    db.commit()
    print("Países de ejemplo creados exitosamente.")

def init_organizations(db: Session):
    """Inicializar organizaciones"""
    existing_organizations = db.query(Organization).count()
    if existing_organizations > 0:
        return

    organizations = [
        Organization(
            name="Suiphar",
            description="Empresa farmacéutica",
            is_active=True,
            country_code="ES",
            timezone="Europe/Madrid",
            subscription_plan="enterprise",
            max_users=50
        ),
        Organization(
            name="Promedical",
            description="Empresa de dispositivos médicos",
            is_active=True,
            country_code="ES",
            timezone="Europe/Madrid",
            subscription_plan="professional",
            max_users=20
        )
    ]
    
    for org in organizations:
        db.add(org)
    db.commit()
    print("Organizaciones de ejemplo creadas exitosamente.")

def init_clients(db: Session):
    """Inicializar clientes"""
    existing_clients = db.query(Client).count()
    if existing_clients > 0:
        return

    # Obtener las organizaciones
    organizations = db.query(Organization).all()
    if not organizations:
        raise ValueError("No hay organizaciones en la base de datos")

    clients = [
        Client(
            name="Hospital La Fe",
            is_active=True,
            organization_id=organizations[0].organization_id,  # Asignar a Suiphar
            country_code="ES",
            address="Avda. Fernando Abril Martorell, 106, 46026 Valencia",
            contact_email="info@lafe.es",
            contact_phone="+34 961 24 40 00",
            tax_id="B12345678"
        ),
        Client(
            name="Clínica Quirón",
            is_active=True,
            organization_id=organizations[1].organization_id if len(organizations) > 1 else organizations[0].organization_id,  # Asignar a Promedical o Suiphar
            country_code="ES",
            address="Av. Blasco Ibáñez, 14, 46010 Valencia",
            contact_email="info@quiron.es",
            contact_phone="+34 963 69 06 00",
            tax_id="B87654321"
        )
    ]
    
    for client in clients:
        db.add(client)
    db.commit()
    print("Clientes de ejemplo creados exitosamente.")

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

    # Crear proyectos de ejemplo con los nuevos estados válidos
    sample_projects = [
        Project(
            client_id=client.client_id,
            name="BIL1.2 Project",
            code="PRJ-001",
            description="Desarrollo de aplicación de facturación",
            project_type="development",
            status="in_progress",
            start_date=datetime.now(),
            end_date=datetime.now() + timedelta(days=90),
            estimated_hours=500,
            priority="high",
            organization_id=organizations[0].organization_id
        ),
        Project(
            client_id=client.client_id,
            name="LIMS Integration",
            code="PRJ-002",
            description="Integración de sistema de gestión de laboratorio",
            project_type="support",
            status="in_planning",
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
            status="suspended",
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

def init_users(db: Session):
    """Inicializar usuarios básicos del sistema"""
    existing_users = db.query(User).count()
    if existing_users > 0:
        return

    # Obtener las organizaciones
    organizations = db.query(Organization).all()
    if not organizations:
        raise ValueError("No hay organizaciones en la base de datos")

    users = [
        # Usuarios para Suiphar (primera organización)
        User(
            username="ceo",
            email="ceo@suiphar.com",
            full_name="Director Ejecutivo",
            password_hash=get_password_hash("8164"),
            is_active=True,
            organization_id=organizations[0].organization_id,
            role="super_user"
        ),
        User(
            username="project_manager",
            email="pm@suiphar.com",
            full_name="Gerente de Proyectos",
            password_hash=get_password_hash("Suiphar2024!"),
            is_active=True,
            organization_id=organizations[0].organization_id,
            role="admin"
        ),
        User(
            username="developer1",
            email="dev1@suiphar.com",
            full_name="Desarrollador Senior",
            password_hash=get_password_hash("Suiphar2024!"),
            is_active=True,
            organization_id=organizations[0].organization_id,
            role="dev"
        ),
        # Usuarios para Promedical (segunda organización)
        User(
            username="promedical_admin",
            email="admin@promedical.com",
            full_name="Administrador Promedical",
            password_hash=get_password_hash("Promedical2024!"),
            is_active=True,
            organization_id=organizations[1].organization_id if len(organizations) > 1 else organizations[0].organization_id,
            role="admin"
        ),
        User(
            username="promedical_dev",
            email="dev@promedical.com",
            full_name="Desarrollador Promedical",
            password_hash=get_password_hash("Promedical2024!"),
            is_active=True,
            organization_id=organizations[1].organization_id if len(organizations) > 1 else organizations[0].organization_id,
            role="dev"
        )
    ]

    for user in users:
        db.add(user)
    db.commit()
    print("Usuarios de ejemplo creados exitosamente.")

def init_data(db: Session):
    """
    Función principal para inicializar datos
    """
    try:
        init_countries(db)
        init_organizations(db)
        init_clients(db)
        init_projects(db)
        init_users(db)
        print("Todos los datos de ejemplo fueron creados exitosamente.")
    except Exception as e:
        print(f"Error al inicializar datos: {e}")
        db.rollback() 