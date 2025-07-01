#!/usr/bin/env python3
"""
Script para resetear la base de datos SQLite con datos mínimos
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone
import random
import string

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Importar modelos y base fuera de la función
from app.core.database import engine, Base
from app.models import *
from app.models.user_models import User, ExternalUser
from app.models.organization_models import Organization
from app.models.client_models import Client
from app.models.project_models import Project
from app.models.task_models import Task
from app.models.time_entry_models import TimeEntry
from app.models.ticket_models import Ticket, TicketCategory
from app.models.external_form_models import ExternalForm
from app.core.database import SessionLocal, engine
from app.core.security import get_password_hash
from app.core.config import settings

def generate_random_string(length=8):
    """Genera una cadena aleatoria de caracteres"""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))

def create_default_users_for_organization(cursor, organization_id, organization_name):
    """Crea los 3 usuarios por defecto para una organización"""
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    # Generar nombres de usuario únicos basados en la organización
    org_prefix = organization_name.lower().replace(' ', '').replace('.', '')[:10]
    
    # Super Usuario (CEO) - siempre el mismo para todas las organizaciones
    ceo_password_hash = pwd_context.hash("8164")
    cursor.execute("""
        INSERT INTO users (username, full_name, email, password_hash, role, organization_id, is_active, specialization, sub_specializations, hourly_rate, weekly_capacity)
        VALUES (?, ?, ?, ?, 'super_user', ?, 1, 'management', '["project_management", "team_lead"]', 100, 40)
    """, (
        f"ceo_{org_prefix}",
        f"Super Administrador - {organization_name}",
        f"ceo@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        ceo_password_hash,
        organization_id
    ))
    
    # Administrador
    admin_username = f"admin_{org_prefix}"
    admin_password = generate_random_string(10)
    admin_password_hash = pwd_context.hash(admin_password)
    cursor.execute("""
        INSERT INTO users (username, full_name, email, password_hash, role, organization_id, is_active, specialization, sub_specializations, hourly_rate, weekly_capacity)
        VALUES (?, ?, ?, ?, 'admin', ?, 1, 'management', '["project_management", "product_owner"]', 80, 40)
    """, (
        admin_username,
        f"Administrador - {organization_name}",
        f"admin@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        admin_password_hash,
        organization_id
    ))
    
    # Desarrollador
    dev_username = f"dev_{org_prefix}"
    dev_password = generate_random_string(10)
    dev_password_hash = pwd_context.hash(dev_password)
    cursor.execute("""
        INSERT INTO users (username, full_name, email, password_hash, role, organization_id, is_active, specialization, sub_specializations, hourly_rate, weekly_capacity)
        VALUES (?, ?, ?, ?, 'dev', ?, 1, 'development', '["backend", "frontend"]', 60, 40)
    """, (
        dev_username,
        f"Desarrollador - {organization_name}",
        f"dev@{organization_name.lower().replace(' ', '').replace('.', '')}.com",
        dev_password_hash,
        organization_id
    ))
    
    return {
        'ceo': {'username': f"ceo_{org_prefix}", 'password': '8164'},
        'admin': {'username': admin_username, 'password': admin_password},
        'dev': {'username': dev_username, 'password': dev_password}
    }

def reset_database():
    """Resetear la base de datos con datos mínimos"""
    
    db_path = "smartplanner.db"
    
    # 1. Eliminar la base de datos existente
    if os.path.exists(db_path):
        print("🗑️ Eliminando base de datos existente...")
        os.remove(db_path)
        print("✅ Base de datos eliminada")
    
    # 2. Crear nueva base de datos
    print("🔧 Creando nueva base de datos...")
    try:
        # Crear todas las tablas
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error al crear las tablas: {str(e)}")
        return False
    
    # 3. Insertar datos mínimos
    print("📝 Insertando datos mínimos...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Configuraciones por defecto
        default_task_states = {
            "states": [
                {"id": 1, "label": "Pendiente", "icon": "🔴", "color": "red", "isDefault": True, "isProtected": True},
                {"id": 2, "label": "En Progreso", "icon": "🔵", "color": "blue", "isDefault": False, "isProtected": False},
                {"id": 3, "label": "Completada", "icon": "🟢", "color": "green", "isDefault": False, "isProtected": True}
            ],
            "default_state": 1,
            "final_states": [3]
        }
        
        # Estados kanban predeterminados
        default_kanban_states = {
            "states": [
                {"id": 1, "key": "backlog", "label": "Backlog", "color": "bg-gray-100", "textColor": "text-gray-700", "isDefault": True, "isProtected": True},
                {"id": 2, "key": "nuevo", "label": "Nuevo", "color": "bg-blue-50", "textColor": "text-blue-700", "isDefault": True},
                {"id": 3, "key": "en_progreso", "label": "En Progreso", "color": "bg-yellow-50", "textColor": "text-yellow-700", "isDefault": True},
                {"id": 4, "key": "listo_pruebas", "label": "Listo para Pruebas", "color": "bg-orange-50", "textColor": "text-orange-700", "isDefault": True},
                {"id": 5, "key": "done", "label": "Completado", "color": "bg-green-50", "textColor": "text-green-700", "isDefault": True, "isProtected": True}
            ],
            "default_state": 2,
            "final_states": [5]
        }
        
        default_activity_categories = [
            {"id": 1, "name": "Desarrollo", "description": "Desarrollo de software y programación", "isDefault": True},
            {"id": 2, "name": "BPO", "description": "Business Process Outsourcing y servicios administrativos", "isDefault": True},
            {"id": 3, "name": "Soporte", "description": "Soporte técnico y mantenimiento", "isDefault": True},
            {"id": 4, "name": "Reunión", "description": "Reuniones y coordinación", "isDefault": True},
            {"id": 5, "name": "Capacitación", "description": "Capacitación y aprendizaje", "isDefault": True},
            {"id": 6, "name": "Documentación", "description": "Documentación técnica y de usuario", "isDefault": True},
            {"id": 7, "name": "Otra", "description": "Otras actividades", "isDefault": True}
        ]
        
        default_work_hours = {
            "start_time": "08:00",
            "end_time": "17:00", 
            "lunch_break_start": "12:00",
            "lunch_break_end": "13:00",
            "working_days": [1, 2, 3, 4, 5],
            "daily_hours": 8,
            "effective_daily_hours": 7
        }
        
        default_notification_settings = {
            "trial_expiry_warning": True,
            "subscription_expiry_warning": True,
            "payment_failed": True,
            "plan_upgrade": True,
            "plan_downgrade": True
        }
        
        # Insertar países
        cursor.execute("""
            INSERT INTO countries (country_code, country_name, continent, phone_code, currency_code, currency_symbol, is_active)
            VALUES 
            ('ES', 'España', 'Europa', '+34', 'EUR', '€', 1),
            ('MX', 'México', 'América', '+52', 'MXN', '$', 1),
            ('CO', 'Colombia', 'América', '+57', 'COP', '$', 1)
        """)
        
        # Fechas de suscripción
        now = datetime.now(timezone.utc)
        trial_start = now
        trial_end = now + timedelta(days=14)
        subscription_start = now
        subscription_end = now + timedelta(days=365)  # 1 año
        
        # Lista de organizaciones con sus configuraciones
        organizations_data = [
            {
                'name': 'SmartPlanner Corp',
                'description': 'Empresa principal de desarrollo',
                'country_code': 'ES',
                'subscription_plan': 'corporate',
                'max_users': 100,
                'contact_email': 'admin@smartplanner.com',
                'contact_name': 'Super Administrador',
                'contact_phone': '+34 123 456 789',
                'subscription_duration_months': 12,
                'subscription_status': 'active',
                'trial_start_date': None,
                'trial_end_date': None,
                'subscription_start_date': subscription_start,
                'subscription_end_date': subscription_end
            },
            {
                'name': 'Tech Solutions',
                'description': 'Consultoría tecnológica',
                'country_code': 'MX',
                'subscription_plan': 'premium',
                'max_users': 25,
                'contact_email': 'contact@techsolutions.com',
                'contact_name': 'María García',
                'contact_phone': '+52 987 654 321',
                'subscription_duration_months': 6,
                'subscription_status': 'active',
                'trial_start_date': None,
                'trial_end_date': None,
                'subscription_start_date': subscription_start,
                'subscription_end_date': subscription_start + timedelta(days=180)  # 6 meses
            },
            {
                'name': 'Digital Innovations',
                'description': 'Innovación digital',
                'country_code': 'CO',
                'subscription_plan': 'free',
                'max_users': 5,
                'contact_email': 'info@digitalinnovations.com',
                'contact_name': 'Carlos López',
                'contact_phone': '+57 555 123 456',
                'subscription_duration_months': 1,
                'subscription_status': 'trial',
                'trial_start_date': trial_start,
                'trial_end_date': trial_end,
                'subscription_start_date': None,
                'subscription_end_date': None
            }
        ]
        
        # Insertar organizaciones y crear usuarios para cada una
        organization_users = {}
        for i, org_data in enumerate(organizations_data, 1):
            cursor.execute("""
                INSERT INTO organizations (
                    organization_id, name, description, country_code, subscription_plan, max_users,
                    primary_contact_email, primary_contact_name, primary_contact_phone,
                    task_states, kanban_states, work_hours_config, activity_categories, is_active,
                    subscription_status, trial_start_date, trial_end_date, 
                    subscription_start_date, subscription_end_date, notification_settings,
                    subscription_duration_months
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                i, org_data['name'], org_data['description'], org_data['country_code'],
                org_data['subscription_plan'], org_data['max_users'],
                org_data['contact_email'], org_data['contact_name'], org_data['contact_phone'],
                json.dumps(default_task_states), json.dumps(default_kanban_states), json.dumps(default_work_hours), json.dumps(default_activity_categories), True,
                org_data['subscription_status'], org_data['trial_start_date'], org_data['trial_end_date'],
                org_data['subscription_start_date'], org_data['subscription_end_date'], 
                json.dumps(default_notification_settings), org_data['subscription_duration_months']
            ))
            
            # Crear usuarios por defecto para esta organización
            users = create_default_users_for_organization(cursor, i, org_data['name'])
            organization_users[org_data['name']] = users
            
        # Insertar clientes para la primera organización
        cursor.execute("""
            INSERT INTO clients (client_id, name, code, organization_id, contact_email, is_active)
            VALUES 
            (1, 'Cliente A', 'CLI001', 1, 'clientea@email.com', 1),
            (2, 'Cliente B', 'CLI002', 1, 'clienteb@email.com', 1),
            (3, 'Cliente C', 'CLI003', 1, 'clientec@email.com', 1)
        """)
        
        # Insertar proyectos
        cursor.execute("""
            INSERT INTO projects (project_id, name, code, description, project_type, status, client_id, manager_id, organization_id)
            VALUES 
            (1, 'Proyecto Web', 'PROJ001', 'Desarrollo de sitio web', 'web_development', 'in_progress', 1, 2, 1),
            (2, 'Soporte Técnico', 'PROJ002', 'Soporte y mantenimiento', 'maintenance_support', 'in_progress', 2, 2, 1),
            (3, 'Consultoría', 'PROJ003', 'Consultoría tecnológica', 'consulting', 'in_planning', 3, 2, 1)
        """)
        
        # Insertar epics
        cursor.execute("""
            INSERT INTO epics (epic_id, project_id, name, description, status, priority, estimated_hours)
            VALUES 
            (1, 1, 'Frontend Development', 'Desarrollo de interfaz de usuario', 'in_progress', 'high', 40),
            (2, 1, 'Backend Development', 'Desarrollo de API y base de datos', 'planning', 'high', 60),
            (3, 2, 'Bug Fixes', 'Corrección de errores reportados', 'in_progress', 'medium', 20)
        """)
        
        # Insertar user stories
        cursor.execute("""
            INSERT INTO user_stories (story_id, epic_id, project_id, title, description, status, priority, estimated_hours, actual_hours, assigned_user_id, specialization, sub_specializations, is_blocked, color, start_date, end_date, completed_date)
            VALUES 
            (1, 1, 1, 'Crear página de inicio', 'Desarrollar la página principal del sitio', 'en_progreso', 'high', 8, 0, 3, 'development', '["frontend"]', 0, '#10B981', '2024-01-15', '2024-01-25', NULL),
            (2, 1, 1, 'Implementar navegación', 'Crear menú de navegación responsive', 'done', 'medium', 6, 6, 3, 'development', '["frontend"]', 0, '#10B981', '2024-01-20', '2024-01-30', '2024-01-28 15:30:00'),
            (3, 2, 1, 'Configurar API REST', 'Crear endpoints de la API', 'backlog', 'high', 12, 0, 3, 'development', '["backend"]', 0, '#10B981', '2024-01-25', '2024-02-10', NULL)
        """)
        
        # Insertar tickets
        cursor.execute("""
            INSERT INTO tickets (ticket_id, ticket_number, title, description, project_id, client_id, organization_id, status, priority, reported_by_user_id, assigned_to_user_id, contact_email, contact_name, attachments)
            VALUES 
            (1, 'TICK-001', 'Error en login', 'Los usuarios no pueden iniciar sesión', 1, 1, 1, 'en_progreso', 'alta', 2, 3, 'soporte@clientea.com', 'Juan Pérez', '[]'),
            (2, 'TICK-002', 'Mejora de rendimiento', 'Optimizar consultas de base de datos', 1, 1, 1, 'nuevo', 'media', 2, 3, 'admin@clientea.com', 'María García', '[]'),
            (3, 'TICK-003', 'Nueva funcionalidad', 'Agregar exportación a PDF', 2, 2, 1, 'en_progreso', 'baja', 2, 3, 'tech@clienteb.com', 'Carlos López', '[]')
        """)
        
        # Insertar categorías de tickets
        cursor.execute("""
            INSERT INTO ticket_categories (category_id, organization_id, name, description, icon, color, is_active, default_title_template, default_description_template, default_priority)
            VALUES 
            (1, 1, 'Error de Sistema', 'Problemas técnicos y errores del sistema', '🚨', '#ef4444', 1, 'Error en {componente}: {descripción}', 'Se ha detectado un error en {componente} que afecta {funcionalidad}. Detalles del error: {descripción}. Pasos para reproducir: {pasos}.', 'alta'),
            (2, 1, 'Mejora de Funcionalidad', 'Solicitudes de nuevas características o mejoras', '✨', '#3b82f6', 1, 'Mejora: {funcionalidad}', 'Solicitud de mejora para {funcionalidad}. Descripción: {descripción}. Beneficios esperados: {beneficios}.', 'media'),
            (3, 1, 'Soporte Técnico', 'Consultas y problemas de uso', '🛠️', '#f59e0b', 1, 'Soporte: {tema}', 'Consulta sobre {tema}. Descripción del problema: {descripción}. Contexto: {contexto}.', 'baja'),
            (4, 1, 'Solicitud de Información', 'Preguntas y solicitudes de datos', '❓', '#8b5cf6', 1, 'Consulta: {tema}', 'Necesito información sobre {tema}. Detalles de la consulta: {descripción}. Uso previsto: {uso}.', 'baja'),
            (5, 1, 'Problema de Rendimiento', 'Lentitud y problemas de velocidad', '⚡', '#f97316', 1, 'Problema de rendimiento: {componente}', 'El {componente} está funcionando lento. Descripción: {descripción}. Impacto: {impacto}.', 'alta'),
            (6, 1, 'Problema de Seguridad', 'Vulnerabilidades y problemas de seguridad', '🔒', '#dc2626', 1, 'Problema de seguridad: {tipo}', 'Se ha detectado un problema de seguridad en {componente}. Tipo: {tipo}. Descripción: {descripción}.', 'critica'),
            (7, 1, 'Problema de Integración', 'Problemas con APIs y servicios externos', '🔗', '#06b6d4', 1, 'Problema de integración: {servicio}', 'Problema con la integración de {servicio}. Descripción: {descripción}. Error: {error}.', 'alta'),
            (8, 1, 'Problema de Base de Datos', 'Errores y problemas con la base de datos', '🗄️', '#059669', 1, 'Problema de BD: {tipo}', 'Problema en la base de datos. Tipo: {tipo}. Descripción: {descripción}. Query afectada: {query}.', 'alta')
        """)
        
        # Actualizar tickets existentes con categorías
        cursor.execute("""
            UPDATE tickets SET category_id = 1 WHERE ticket_id = 1
        """)
        cursor.execute("""
            UPDATE tickets SET category_id = 2 WHERE ticket_id = 2
        """)
        cursor.execute("""
            UPDATE tickets SET category_id = 3 WHERE ticket_id = 3
        """)
        
        # Insertar time entries
        cursor.execute("""
            INSERT INTO time_entries (entry_id, user_id, project_id, organization_id, activity_type, start_time, end_time, description, status, billable)
            VALUES 
            (1, 3, 1, 1, 'desarrollo', '2024-01-15 09:00:00', '2024-01-15 17:00:00', 'Desarrollo de página de inicio', 'completado', 1),
            (2, 3, 1, 1, 'desarrollo', '2024-01-16 09:00:00', '2024-01-16 17:00:00', 'Implementación de navegación', 'completado', 1),
            (3, 2, 2, 1, 'reunión', '2024-01-17 10:00:00', '2024-01-17 11:00:00', 'Reunión de planificación', 'completado', 1)
        """)
        
        # Limpiar datos antiguos de time_entries
        clean_old_time_entries_data(cursor)
        
        # Insertar cotizaciones de ejemplo
        cursor.execute("""
            INSERT INTO quotations (quotation_id, project_id, created_by_user_id, total_amount, currency, status, description, created_at, updated_at)
            VALUES 
            (1, 1, 2, 15000.00, 'USD', 'approved', 'Cotización para desarrollo de sitio web completo', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
            (2, 2, 2, 8000.00, 'USD', 'sent', 'Cotización para soporte técnico mensual', '2024-01-16 14:30:00', '2024-01-16 14:30:00'),
            (3, 3, 2, 25000.00, 'USD', 'draft', 'Cotización para consultoría tecnológica', '2024-01-17 09:15:00', '2024-01-17 09:15:00')
        """)
        
        # Insertar cuotas de ejemplo
        cursor.execute("""
            INSERT INTO quotation_installments (installment_id, quotation_id, installment_number, percentage, amount, due_date, is_paid, paid_date, payment_reference, notes, created_at, updated_at)
            VALUES 
            (1, 1, 1, 30.00, 4500.00, '2024-01-20', 1, '2024-01-18', 'PAY-001', 'Pago inicial', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
            (2, 1, 2, 40.00, 6000.00, '2024-02-15', 0, NULL, NULL, 'Pago por avance', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
            (3, 1, 3, 30.00, 4500.00, '2024-03-15', 0, NULL, NULL, 'Pago final', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
            (4, 2, 1, 50.00, 4000.00, '2024-01-25', 0, NULL, NULL, 'Pago inicial', '2024-01-16 14:30:00', '2024-01-16 14:30:00'),
            (5, 2, 2, 50.00, 4000.00, '2024-02-25', 0, NULL, NULL, 'Pago final', '2024-01-16 14:30:00', '2024-01-16 14:30:00'),
            (6, 3, 1, 20.00, 5000.00, '2024-01-30', 0, NULL, NULL, 'Pago inicial', '2024-01-17 09:15:00', '2024-01-17 09:15:00'),
            (7, 3, 2, 40.00, 10000.00, '2024-02-28', 0, NULL, NULL, 'Pago por avance', '2024-01-17 09:15:00', '2024-01-17 09:15:00'),
            (8, 3, 3, 40.00, 10000.00, '2024-03-30', 0, NULL, NULL, 'Pago final', '2024-01-17 09:15:00', '2024-01-17 09:15:00')
        """)
        
        # Insertar usuarios externos de ejemplo
        cursor.execute("""
            INSERT INTO external_users (external_user_id, username, full_name, email, hashed_password, phone, organization_id, client_id, is_active)
            VALUES 
            (1, 'prueba1', 'Jose Maestre', 'jose.maestre@prueba.com', ?, '+34 123 456 789', 1, 1, 1),
            (2, 'cliente_b_user', 'María García', 'maria.garcia@clienteb.com', ?, '+34 987 654 321', 1, 2, 1),
            (3, 'cliente_c_user', 'Carlos López', 'carlos.lopez@clientec.com', ?, '+34 555 123 456', 1, 3, 1)
        """, (get_password_hash("123456"), get_password_hash("123456"), get_password_hash("123456")))
        
        # NOTA: No se insertan calificaciones harcodeadas para permitir que el sistema de calificaciones funcione correctamente
        # Las calificaciones se crearán únicamente a través del portal externo por usuarios reales
        
        # Actualizar algunos tickets para que estén asociados a usuarios externos
        cursor.execute("""
            UPDATE tickets SET external_user_id = 1 WHERE ticket_id = 1
        """)
        cursor.execute("""
            UPDATE tickets SET external_user_id = 2 WHERE ticket_id = 2
        """)
        cursor.execute("""
            UPDATE tickets SET external_user_id = 3 WHERE ticket_id = 3
        """)
        
        # Insertar tareas de ejemplo
        cursor.execute("""
            INSERT INTO tasks (task_id, title, description, status, priority, assigned_to, assigned_by, organization_id, due_date, estimated_hours, actual_hours, tags, notes, created_at, updated_at)
            VALUES 
            (1, 'Revisar documentación del proyecto', 'Revisar y actualizar la documentación técnica del proyecto web', 'pending', 'medium', 3, 2, 1, '2024-01-25 17:00:00', 4, NULL, '["documentation", "review"]', 'Prioridad media', '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
            (2, 'Corregir bug en login', 'El formulario de login no valida correctamente las credenciales', 'in_progress', 'high', 3, 2, 1, '2024-01-20 17:00:00', 2, 1, '["bug", "frontend"]', 'Bug crítico reportado por usuarios', '2024-01-16 14:30:00', '2024-01-16 14:30:00'),
            (3, 'Implementar nueva funcionalidad', 'Agregar sistema de notificaciones en tiempo real', 'blocked', 'high', 3, 2, 1, '2024-01-30 17:00:00', 8, NULL, '["feature", "websockets"]', 'Esperando aprobación del cliente', '2024-01-17 09:15:00', '2024-01-17 09:15:00'),
            (4, 'Optimizar consultas de BD', 'Revisar y optimizar las consultas más lentas de la base de datos', 'pending', 'medium', 3, 2, 1, '2024-01-28 17:00:00', 6, NULL, '["optimization", "database"]', 'Mejora de rendimiento', '2024-01-18 11:00:00', '2024-01-18 11:00:00'),
            (5, 'Actualizar dependencias', 'Actualizar todas las dependencias del proyecto a las últimas versiones estables', 'completed', 'low', 3, 2, 1, '2024-01-22 17:00:00', 3, 2, '["maintenance", "dependencies"]', 'Actualización completada exitosamente', '2024-01-19 16:00:00', '2024-01-19 16:00:00'),
            (6, 'Crear tests unitarios', 'Desarrollar tests unitarios para los módulos principales', 'pending', 'high', 3, 2, 1, '2024-01-26 17:00:00', 10, NULL, '["testing", "quality"]', 'Cobertura de tests requerida', '2024-01-20 10:00:00', '2024-01-20 10:00:00'),
            (7, 'Revisar código de seguridad', 'Auditoría de seguridad del código fuente', 'blocked', 'urgent', 3, 2, 1, '2024-01-24 17:00:00', 4, NULL, '["security", "audit"]', 'Esperando herramientas de análisis', '2024-01-21 13:00:00', '2024-01-21 13:00:00'),
            (8, 'Preparar presentación', 'Crear presentación para la demo del cliente', 'pending', 'medium', 2, 1, 1, '2024-01-23 17:00:00', 2, NULL, '["presentation", "demo"]', 'Demo programada para el viernes', '2024-01-22 09:00:00', '2024-01-22 09:00:00')
        """)
        
        # Crear tabla de notificaciones
        cursor.execute("DROP TABLE IF EXISTS notifications")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient_user_id INTEGER NOT NULL,
                sender_user_id INTEGER,
                organization_id INTEGER NOT NULL,
                type VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                priority VARCHAR(20) DEFAULT 'medium',
                status VARCHAR(20) DEFAULT 'unread',
                ticket_id INTEGER,
                task_id INTEGER,
                user_story_id INTEGER,
                project_id INTEGER,
                notification_metadata TEXT,
                read_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (recipient_user_id) REFERENCES users(user_id),
                FOREIGN KEY (sender_user_id) REFERENCES users(user_id),
                FOREIGN KEY (organization_id) REFERENCES organizations(organization_id),
                FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id),
                FOREIGN KEY (task_id) REFERENCES tasks(task_id),
                FOREIGN KEY (user_story_id) REFERENCES user_stories(story_id),
                FOREIGN KEY (project_id) REFERENCES projects(project_id)
            )
        """)
        
        # Commit de todos los cambios
        conn.commit()
        print("✅ Datos mínimos insertados exitosamente")
        
        # Verificar datos insertados
        print("\n📊 Resumen de datos insertados:")
        
        tables = ['countries', 'organizations', 'users', 'clients', 'projects', 'epics', 'user_stories', 'tickets', 'time_entries', 'quotations', 'quotation_installments', 'tasks', 'external_users']
        
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   • {table}: {count} registros")
        
        print("\n👥 Usuarios creados por organización:")
        for org_name, users in organization_users.items():
            print(f"\n🏢 {org_name}:")
            print(f"   • Super Usuario: {users['ceo']['username']} (Contraseña: {users['ceo']['password']})")
            print(f"   • Administrador: {users['admin']['username']} (Contraseña: {users['admin']['password']})")
            print(f"   • Desarrollador: {users['dev']['username']} (Contraseña: {users['dev']['password']})")
        
        print(f"\n🔑 Credenciales de acceso:")
        print(f"   • Super Usuario: Siempre 'ceo_[prefijo]' con contraseña '8164'")
        print(f"   • Administrador y Desarrollador: Contraseñas generadas aleatoriamente")
        
        print(f"\n💰 Cotizaciones de ejemplo:")
        print(f"   • Proyecto Web: $15,000 USD (3 cuotas)")
        print(f"   • Soporte Técnico: $8,000 USD (2 cuotas)")
        print(f"   • Consultoría: $25,000 USD (3 cuotas)")
        
        print(f"\n🌟 Sistema de calificaciones:")
        print(f"   • Las calificaciones se crearán únicamente a través del portal externo")
        print(f"   • No hay calificaciones harcodeadas para permitir pruebas reales")
        
        print(f"\n📅 Información de suscripciones:")
        print(f"   • SmartPlanner Corp: Plan Corporate (activo)")
        print(f"   • Tech Solutions: Plan Premium (activo)")
        print(f"   • Digital Innovations: Plan Free (prueba gratuita - 14 días)")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al insertar datos: {str(e)}")
        conn.rollback()
        return False
    
    finally:
        conn.close()

def clean_old_time_entries_data(cursor):
    """Limpia los datos antiguos de time_entries que tienen strings en lugar de IDs enteros"""
    print("Limpiando datos antiguos de time_entries...")
    
    # Mapeo de strings antiguos a IDs nuevos
    activity_type_mapping = {
        'desarrollo': 1,
        'reunión': 2,
        'capacitación': 3,
        'documentación': 4,
        'soporte': 5,
        'testing': 6,
        'diseño': 7,
        'otra': 8
    }
    
    status_mapping = {
        'pendiente': 1,
        'en_progreso': 2,
        'completada': 3,
        'completado': 3
    }
    
    # Actualizar activity_type
    for old_value, new_id in activity_type_mapping.items():
        cursor.execute("""
            UPDATE time_entries 
            SET activity_type = ? 
            WHERE activity_type = ?
        """, (new_id, old_value))
    
    # Actualizar status
    for old_value, new_id in status_mapping.items():
        cursor.execute("""
            UPDATE time_entries 
            SET status = ? 
            WHERE status = ?
        """, (new_id, old_value))
    
    print("Datos de time_entries limpiados correctamente")

if __name__ == "__main__":
    print("🔄 Iniciando reset de base de datos...")
    success = reset_database()
    
    if success:
        print("\n✅ Base de datos reseteada exitosamente con datos mínimos")
        print("🚀 Puedes iniciar el backend ahora")
    else:
        print("\n❌ Error al resetear la base de datos")
        sys.exit(1) 