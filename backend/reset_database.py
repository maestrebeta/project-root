#!/usr/bin/env python3
"""
Script para resetear la base de datos SQLite con datos mínimos
"""

import os
import sys
import sqlite3
import json
from pathlib import Path
from datetime import datetime

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
                {"id": "pending", "label": "Pendiente", "icon": "🔴", "color": "red", "isDefault": True},
                {"id": "in_progress", "label": "En Progreso", "icon": "🔵", "color": "blue", "isDefault": True},
                {"id": "completed", "label": "Completada", "icon": "🟢", "color": "green", "isDefault": True},
                {"id": "blocked", "label": "Bloqueada", "icon": "🟠", "color": "orange", "isDefault": False}
            ],
            "default_state": "pending",
            "final_states": ["completed"]
        }
        
        default_work_hours = {
            "start_time": "08:00",
            "end_time": "17:00", 
            "lunch_break_start": "12:00",
            "lunch_break_end": "13:00",
            "working_days": [1, 2, 3, 4, 5],
            "daily_hours": 8,
            "effective_daily_hours": 7
        }
        
        # Insertar países
        cursor.execute("""
            INSERT INTO countries (country_code, country_name, continent, phone_code, currency_code, currency_symbol, is_active)
            VALUES 
            ('ES', 'España', 'Europa', '+34', 'EUR', '€', 1),
            ('MX', 'México', 'América', '+52', 'MXN', '$', 1),
            ('CO', 'Colombia', 'América', '+57', 'COP', '$', 1)
        """)
        
        # Insertar organizaciones con configuraciones y diferentes planes
        cursor.execute("""
            INSERT INTO organizations (organization_id, name, description, country_code, subscription_plan, max_users, primary_contact_email, primary_contact_name, primary_contact_phone, task_states, work_hours_config, is_active)
            VALUES 
            (1, 'SmartPlanner Corp', 'Empresa principal de desarrollo', 'ES', 'corporate', 100, 'admin@smartplanner.com', 'Super Administrador', '+34 123 456 789', ?, ?, 1),
            (2, 'Tech Solutions', 'Consultoría tecnológica', 'MX', 'premium', 25, 'contact@techsolutions.com', 'María García', '+52 987 654 321', ?, ?, 1),
            (3, 'Digital Innovations', 'Innovación digital', 'CO', 'free', 5, 'info@digitalinnovations.com', 'Carlos López', '+57 555 123 456', ?, ?, 1)
        """, (json.dumps(default_task_states), json.dumps(default_work_hours),
              json.dumps(default_task_states), json.dumps(default_work_hours),
              json.dumps(default_task_states), json.dumps(default_work_hours)))
        
        # Insertar usuarios (uno por cada rol)
        from passlib.context import CryptContext
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        password_hash = pwd_context.hash("password123")
        password_hash_test = pwd_context.hash("123456")
        ceo_password_hash = pwd_context.hash("8164")
        cursor.execute("""
            INSERT INTO users (user_id, username, full_name, email, password_hash, role, organization_id, is_active, specialization, sub_specializations, hourly_rate, weekly_capacity)
            VALUES 
            (1, 'ceo', 'Super Administrador', 'super@smartplanner.com', ?, 'super_user', 1, 1, 'management', '["project_management", "team_lead"]', 100, 40),
            (2, 'admin_user', 'Administrador', 'admin@smartplanner.com', ?, 'admin', 1, 1, 'management', '["project_management", "product_owner"]', 80, 40),
            (3, 'dev_user', 'Desarrollador', 'dev@smartplanner.com', ?, 'dev', 1, 1, 'development', '["backend", "frontend"]', 60, 40)
        """, (ceo_password_hash, password_hash, password_hash))
        
        # Insertar clientes
        cursor.execute("""
            INSERT INTO clients (client_id, name, code, organization_id, contact_email)
            VALUES 
            (1, 'Cliente A', 'CLI001', 1, 'clientea@email.com'),
            (2, 'Cliente B', 'CLI002', 1, 'clienteb@email.com'),
            (3, 'Cliente C', 'CLI003', 1, 'clientec@email.com')
        """)
        
        # Insertar proyectos
        cursor.execute("""
            INSERT INTO projects (project_id, name, code, description, project_type, status, client_id, manager_id, organization_id)
            VALUES 
            (1, 'Proyecto Web', 'PROJ001', 'Desarrollo de sitio web', 'development', 'in_progress', 1, 2, 1),
            (2, 'Soporte Técnico', 'PROJ002', 'Soporte y mantenimiento', 'support', 'in_progress', 2, 2, 1),
            (3, 'Consultoría', 'PROJ003', 'Consultoría tecnológica', 'other', 'in_planning', 3, 2, 1)
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
            INSERT INTO user_stories (story_id, epic_id, project_id, title, description, status, priority, estimated_hours, assigned_user_id, specialization, sub_specializations, is_blocked, color)
            VALUES 
            (1, 1, 1, 'Crear página de inicio', 'Desarrollar la página principal del sitio', 'in_progress', 'high', 8, 3, 'development', '["frontend"]', 0, '#10B981'),
            (2, 1, 1, 'Implementar navegación', 'Crear menú de navegación responsive', 'todo', 'medium', 6, 3, 'development', '["frontend"]', 0, '#10B981'),
            (3, 2, 1, 'Configurar API REST', 'Crear endpoints de la API', 'backlog', 'high', 12, 3, 'development', '["backend"]', 0, '#10B981')
        """)
        
        # Insertar tickets
        cursor.execute("""
            INSERT INTO tickets (ticket_id, ticket_number, title, description, project_id, client_id, organization_id, status, priority, reported_by_user_id, assigned_to_user_id, contact_email, contact_phone, contact_name, attachments)
            VALUES 
            (1, 'TICK-001', 'Error en login', 'Los usuarios no pueden iniciar sesión', 1, 1, 1, 'en_progreso', 'alta', 2, 3, 'soporte@clientea.com', '+34 123 456 789', 'Juan Pérez', '[]'),
            (2, 'TICK-002', 'Mejora de rendimiento', 'Optimizar consultas de base de datos', 1, 1, 1, 'nuevo', 'media', 2, 3, 'admin@clientea.com', '+34 987 654 321', 'María García', '[]'),
            (3, 'TICK-003', 'Nueva funcionalidad', 'Agregar exportación a PDF', 2, 2, 1, 'en_progreso', 'baja', 2, 3, 'tech@clienteb.com', '+34 555 123 456', 'Carlos López', '[]')
        """)
        
        # Insertar categorías de tickets
        cursor.execute("""
            INSERT INTO ticket_categories (category_id, organization_id, name, description, icon, color, is_active, default_title_template, default_description_template, default_priority, default_estimated_hours)
            VALUES 
            (1, 1, 'Error de Sistema', 'Problemas técnicos y errores del sistema', '🚨', '#ef4444', 1, 'Error en {componente}: {descripción}', 'Se ha detectado un error en {componente} que afecta {funcionalidad}. Detalles del error: {descripción}. Pasos para reproducir: {pasos}.', 'alta', 4),
            (2, 1, 'Mejora de Funcionalidad', 'Solicitudes de nuevas características o mejoras', '✨', '#3b82f6', 1, 'Mejora: {funcionalidad}', 'Solicitud de mejora para {funcionalidad}. Descripción: {descripción}. Beneficios esperados: {beneficios}.', 'media', 8),
            (3, 1, 'Soporte Técnico', 'Consultas y problemas de uso', '🛠️', '#f59e0b', 1, 'Soporte: {tema}', 'Consulta sobre {tema}. Descripción del problema: {descripción}. Contexto: {contexto}.', 'baja', 2),
            (4, 1, 'Solicitud de Información', 'Preguntas y solicitudes de datos', '❓', '#8b5cf6', 1, 'Consulta: {tema}', 'Necesito información sobre {tema}. Detalles de la consulta: {descripción}. Uso previsto: {uso}.', 'baja', 1),
            (5, 1, 'Problema de Rendimiento', 'Lentitud y problemas de velocidad', '⚡', '#f97316', 1, 'Problema de rendimiento: {componente}', 'El {componente} está funcionando lento. Descripción: {descripción}. Impacto: {impacto}.', 'alta', 6),
            (6, 1, 'Problema de Seguridad', 'Vulnerabilidades y problemas de seguridad', '🔒', '#dc2626', 1, 'Problema de seguridad: {tipo}', 'Se ha detectado un problema de seguridad en {componente}. Tipo: {tipo}. Descripción: {descripción}.', 'critica', 8),
            (7, 1, 'Problema de Integración', 'Problemas con APIs y servicios externos', '🔗', '#06b6d4', 1, 'Problema de integración: {servicio}', 'Problema con la integración de {servicio}. Descripción: {descripción}. Error: {error}.', 'alta', 6),
            (8, 1, 'Problema de Base de Datos', 'Errores y problemas con la base de datos', '🗄️', '#059669', 1, 'Problema de BD: {tipo}', 'Problema en la base de datos. Tipo: {tipo}. Descripción: {descripción}. Query afectada: {query}.', 'alta', 4)
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
        """, (password_hash_test, password_hash, password_hash))
        
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
        
        print("\n👥 Usuarios creados:")
        cursor.execute("SELECT username, full_name, role, organization_id FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"   • {user[0]} ({user[1]}) - Rol: {user[2]} - Org: {user[3]}")
        
        print(f"\n🔑 Credenciales de acceso:")
        print(f"   • Usuario: ceo, Contraseña: 8164")
        print(f"   • Usuario: admin_user, Contraseña: password123")
        print(f"   • Usuario: dev_user, Contraseña: password123")
        
        print(f"\n💰 Cotizaciones de ejemplo:")
        print(f"   • Proyecto Web: $15,000 USD (3 cuotas)")
        print(f"   • Soporte Técnico: $8,000 USD (2 cuotas)")
        print(f"   • Consultoría: $25,000 USD (3 cuotas)")
        
        print(f"\n🌟 Sistema de calificaciones:")
        print(f"   • Las calificaciones se crearán únicamente a través del portal externo")
        print(f"   • No hay calificaciones harcodeadas para permitir pruebas reales")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al insertar datos: {str(e)}")
        conn.rollback()
        return False
    
    finally:
        conn.close()

if __name__ == "__main__":
    print("🔄 Iniciando reset de base de datos...")
    success = reset_database()
    
    if success:
        print("\n✅ Base de datos reseteada exitosamente con datos mínimos")
        print("🚀 Puedes iniciar el backend ahora")
    else:
        print("\n❌ Error al resetear la base de datos")
        sys.exit(1) 