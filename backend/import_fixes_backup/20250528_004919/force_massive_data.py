#!/usr/bin/env python3
"""
Script para forzar la creación masiva de datos de prueba
Este script NO verifica si ya existen datos, simplemente los crea
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import get_db
from app.models.user_models import User
from app.models.project_models import Project
from app.models.organization_models import Organization
from app.models.client_models import Client
from app.models.time_entry_models import TimeEntry
from app.models.ticket_models import Ticket
from app.models.epic_models import Epic, UserStory
from app.models.country_models import Country
from sqlalchemy.orm import Session
import random
from datetime import datetime, timedelta, date
from faker import Faker

fake = Faker('es_ES')

def force_create_massive_users(db: Session, count: int = 50):
    """Crear usuarios masivos sin verificar existencia"""
    print(f"🚀 Creando {count} usuarios adicionales...")
    
    # Obtener organizaciones existentes
    organizations = db.query(Organization).all()
    if not organizations:
        print("❌ No hay organizaciones disponibles")
        return
    
    specializations = [
        'development', 'ui_ux', 'testing', 'documentation', 
        'management', 'data_analysis'
    ]
    
    roles = ['admin', 'dev', 'infra', 'super_user']
    
    users_to_create = []
    
    for i in range(count):
        org = random.choice(organizations)
        specialization = random.choice(specializations)
        
        user_data = {
            'username': f"user_{fake.user_name()}_{i}",
            'email': f"user{i+100}@{fake.domain_name()}",
            'full_name': fake.name(),
            'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq/3Haa',  # password123
            'role': random.choice(roles),
            'specialization': specialization,
            'sub_specializations': [],
            'hourly_rate': random.randint(25, 150),
            'weekly_capacity': random.randint(30, 45),
            'is_active': True,
            'organization_id': org.organization_id,
            'skills': {
                'technologies': random.sample(['Python', 'JavaScript', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'FastAPI'], k=random.randint(2, 5)),
                'level': random.choice(['junior', 'mid', 'senior', 'expert'])
            }
        }
        
        users_to_create.append(User(**user_data))
    
    try:
        db.add_all(users_to_create)
        db.commit()
        print(f"✅ Creados {len(users_to_create)} usuarios exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando usuarios: {str(e)}")
        raise

def force_create_massive_clients(db: Session, count: int = 30):
    """Crear clientes masivos sin verificar existencia"""
    print(f"🚀 Creando {count} clientes adicionales...")
    
    organizations = db.query(Organization).all()
    if not organizations:
        print("❌ No hay organizaciones disponibles")
        return
    
    clients_to_create = []
    
    for i in range(count):
        org = random.choice(organizations)
        
        client_data = {
            'name': f"{fake.company()} {random.choice(['Tech', 'Solutions', 'Systems', 'Group', 'Corp'])}",
            'code': f"CLI-{i+1000:04d}",
            'is_active': True,
            'organization_id': org.organization_id,
            'address': fake.address(),
            'contact_email': f"contact{i+100}@{fake.domain_name()}",
            'contact_phone': fake.phone_number(),
            'tax_id': str(fake.random_number(digits=9))
        }
        
        clients_to_create.append(Client(**client_data))
    
    try:
        db.add_all(clients_to_create)
        db.commit()
        print(f"✅ Creados {len(clients_to_create)} clientes exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando clientes: {str(e)}")
        raise

def force_create_massive_projects(db: Session, count: int = 100):
    """Crear proyectos masivos sin verificar existencia"""
    print(f"🚀 Creando {count} proyectos adicionales...")
    
    clients = db.query(Client).all()
    users = db.query(User).all()
    organizations = db.query(Organization).all()
    
    if not clients or not users or not organizations:
        print("❌ Faltan datos base para crear proyectos")
        return
    
    project_types = ['development', 'support', 'meeting', 'training', 'other']
    project_statuses = [
        'registered_initiative', 'in_quotation', 'proposal_approved', 
        'in_planning', 'in_progress', 'at_risk', 'suspended', 
        'completed', 'canceled', 'post_delivery_support'
    ]
    priorities = ['low', 'medium', 'high', 'critical']
    
    project_names = [
        'Sistema de Gestión', 'Plataforma Digital', 'Portal Web', 'App Móvil',
        'Dashboard Analytics', 'CRM Personalizado', 'ERP Integrado', 'API Gateway',
        'Marketplace Online', 'Sistema de Pagos', 'Plataforma E-learning',
        'Sistema de Inventario', 'Portal de Clientes', 'App de Delivery'
    ]
    
    projects_to_create = []
    
    for i in range(count):
        client = random.choice(clients)
        manager = random.choice(users)
        org = random.choice(organizations)
        
        start_date = fake.date_between(start_date='-1y', end_date='+6m')
        end_date = start_date + timedelta(days=random.randint(30, 365))
        
        project_name = f"{random.choice(project_names)} {fake.company_suffix()}"
        
        project_data = {
            'client_id': client.client_id,
            'name': project_name,
            'code': f"PRJ-{i+1000:04d}",
            'description': f"Proyecto de {project_name.lower()} para {client.name}. {fake.text(max_nb_chars=150)}",
            'project_type': random.choice(project_types),
            'status': random.choice(project_statuses),
            'start_date': start_date,
            'end_date': end_date,
            'manager_id': manager.user_id,
            'estimated_hours': random.randint(40, 2000),
            'priority': random.choice(priorities),
            'organization_id': org.organization_id,
            'tags': {
                'technology': random.choice(['React', 'Vue', 'Angular', 'Python', 'Node.js', 'Java', '.NET']),
                'industry': random.choice(['Fintech', 'Healthcare', 'E-commerce', 'Education', 'Manufacturing']),
                'complexity': random.choice(['Low', 'Medium', 'High', 'Very High'])
            }
        }
        
        projects_to_create.append(Project(**project_data))
    
    try:
        db.add_all(projects_to_create)
        db.commit()
        print(f"✅ Creados {len(projects_to_create)} proyectos exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando proyectos: {str(e)}")
        raise

def force_create_massive_tickets(db: Session, count: int = 500):
    """Crear tickets masivos sin verificar existencia"""
    print(f"🚀 Creando {count} tickets adicionales...")
    
    projects = db.query(Project).all()
    users = db.query(User).all()
    clients = db.query(Client).all()
    organizations = db.query(Organization).all()
    
    if not projects or not users or not clients or not organizations:
        print("❌ Faltan datos base para crear tickets")
        return
    
    # Usar los valores correctos según las restricciones del modelo
    priorities = ['baja', 'media', 'alta', 'critica']
    statuses = ['nuevo', 'en_progreso', 'listo_pruebas', 'cerrado']
    categories = ['frontend', 'backend', 'database', 'ui_ux', 'testing', 'deployment']
    
    tickets_to_create = []
    
    for i in range(count):
        project = random.choice(projects)
        client = random.choice(clients)
        org = random.choice(organizations)
        reported_by = random.choice(users)
        assigned_to = random.choice(users)
        
        ticket_data = {
            'ticket_number': f"TKT-{i+10000:05d}",
            'title': fake.sentence(nb_words=6),
            'description': fake.text(max_nb_chars=300),
            'priority': random.choice(priorities),
            'status': random.choice(statuses),
            'category': random.choice(categories),
            'project_id': project.project_id,
            'client_id': client.client_id,
            'organization_id': org.organization_id,
            'reported_by_user_id': reported_by.user_id,
            'assigned_to_user_id': assigned_to.user_id,
            'estimated_hours': random.randint(1, 40),
            'tags': {
                'type': random.choice(['bug', 'feature', 'improvement', 'task']),
                'component': random.choice(['frontend', 'backend', 'database', 'api'])
            }
        }
        
        # Agregar fecha de vencimiento para algunos tickets
        if random.choice([True, False]):
            ticket_data['due_date'] = fake.date_time_between(start_date='now', end_date='+30d')
        
        tickets_to_create.append(Ticket(**ticket_data))
    
    try:
        db.add_all(tickets_to_create)
        db.commit()
        print(f"✅ Creados {len(tickets_to_create)} tickets exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando tickets: {str(e)}")
        raise

def force_create_massive_time_entries(db: Session, count: int = 2000):
    """Crear entradas de tiempo masivas sin verificar existencia"""
    print(f"🚀 Creando {count} entradas de tiempo adicionales...")
    
    projects = db.query(Project).all()
    users = db.query(User).all()
    tickets = db.query(Ticket).all()
    organizations = db.query(Organization).all()
    
    if not projects or not users or not organizations:
        print("❌ Faltan datos base para crear entradas de tiempo")
        return
    
    activity_types = [
        'development', 'testing', 'documentation', 'meeting', 
        'planning', 'review', 'deployment', 'support'
    ]
    
    entries_to_create = []
    
    for i in range(count):
        user = random.choice(users)
        project = random.choice(projects)
        org = random.choice(organizations)
        
        # Fecha aleatoria en los últimos 6 meses
        entry_date = fake.date_between(start_date='-6m', end_date='today')
        
        # Hora de inicio aleatoria entre 8:00 y 16:00
        start_hour = random.randint(8, 16)
        start_minute = random.choice([0, 15, 30, 45])
        start_time = datetime.combine(entry_date, datetime.min.time().replace(hour=start_hour, minute=start_minute))
        
        # Duración aleatoria entre 0.5 y 8 horas
        duration_hours = random.choice([0.5, 1, 1.5, 2, 2.5, 3, 4, 6, 8])
        end_time = start_time + timedelta(hours=duration_hours)
        
        entry_data = {
            'user_id': user.user_id,
            'project_id': project.project_id,
            'ticket_id': random.choice(tickets).ticket_id if tickets and random.choice([True, False]) else None,
            'organization_id': org.organization_id,
            'entry_date': entry_date,
            'start_time': start_time,
            'end_time': end_time,
            'description': fake.sentence(nb_words=8),
            'activity_type': random.choice(activity_types),
            'is_billable': random.choice([True, False]),
            'hourly_rate': round(random.uniform(25, 150), 2)
        }
        
        entries_to_create.append(TimeEntry(**entry_data))
    
    try:
        # Insertar en lotes para mejor rendimiento
        batch_size = 100
        total_created = 0
        
        for i in range(0, len(entries_to_create), batch_size):
            batch = entries_to_create[i:i + batch_size]
            db.add_all(batch)
            db.commit()
            total_created += len(batch)
            print(f"✅ Procesado lote {i//batch_size + 1}: {total_created}/{len(entries_to_create)} entradas")
        
        print(f"✅ Creadas {total_created} entradas de tiempo exitosamente")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creando entradas de tiempo: {str(e)}")
        raise

def main():
    """Función principal para crear datos masivos"""
    print("🚀 INICIANDO CREACIÓN MASIVA DE DATOS DE PRUEBA")
    print("=" * 60)
    
    db = next(get_db())
    
    try:
        # Mostrar conteo inicial
        print("\n📊 CONTEO INICIAL:")
        print(f"   • Organizaciones: {db.query(Organization).count()}")
        print(f"   • Usuarios: {db.query(User).count()}")
        print(f"   • Clientes: {db.query(Client).count()}")
        print(f"   • Proyectos: {db.query(Project).count()}")
        print(f"   • Tickets: {db.query(Ticket).count()}")
        print(f"   • Entradas de tiempo: {db.query(TimeEntry).count()}")
        
        print("\n🔥 CREANDO DATOS MASIVOS...")
        
        # Crear datos masivos
        force_create_massive_users(db, 50)
        force_create_massive_clients(db, 30)
        force_create_massive_projects(db, 100)
        force_create_massive_tickets(db, 500)
        force_create_massive_time_entries(db, 2000)
        
        # Mostrar conteo final
        print("\n📊 CONTEO FINAL:")
        print(f"   • Organizaciones: {db.query(Organization).count()}")
        print(f"   • Usuarios: {db.query(User).count()}")
        print(f"   • Clientes: {db.query(Client).count()}")
        print(f"   • Proyectos: {db.query(Project).count()}")
        print(f"   • Tickets: {db.query(Ticket).count()}")
        print(f"   • Entradas de tiempo: {db.query(TimeEntry).count()}")
        
        print("\n🎉 ¡DATOS MASIVOS CREADOS EXITOSAMENTE!")
        print("La aplicación ahora tiene 10x más datos para pruebas completas.")
        
    except Exception as e:
        print(f"\n❌ Error durante la creación masiva: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    main() 