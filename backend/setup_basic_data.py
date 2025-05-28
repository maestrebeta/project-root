#!/usr/bin/env python3
"""
Script para cargar datos básicos esenciales
"""

import os
import sys
from sqlalchemy.orm import sessionmaker
from sqlalchemy import text
import json

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import engine
    from passlib.context import CryptContext
    
    print("📊 Configurando datos básicos...")
    
    # Crear sesión
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    # Configurar encriptación de contraseñas
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    try:
        # 1. Insertar países básicos
        print("🌍 Insertando países...")
        countries_data = [
            ('CO', 'Colombia', 'South America', '+57', 'COP', '$'),
            ('US', 'Estados Unidos', 'North America', '+1', 'USD', '$'),
            ('MX', 'México', 'North America', '+52', 'MXN', '$'),
            ('ES', 'España', 'Europe', '+34', 'EUR', '€'),
            ('AR', 'Argentina', 'South America', '+54', 'ARS', '$')
        ]
        
        for code, name, continent, phone, currency_code, currency_symbol in countries_data:
            db.execute(text("""
                INSERT OR IGNORE INTO countries 
                (country_code, country_name, continent, phone_code, currency_code, currency_symbol, is_active) 
                VALUES (:code, :name, :continent, :phone, :currency_code, :currency_symbol, 1)
            """), {
                "code": code, 
                "name": name, 
                "continent": continent, 
                "phone": phone, 
                "currency_code": currency_code, 
                "currency_symbol": currency_symbol
            })
        
        # 2. Insertar organización por defecto
        print("🏢 Insertando organización por defecto...")
        
        default_task_states = {
            "states": [
                {"id": "pendiente", "label": "Pendiente", "icon": "🔴", "color": "red", "isDefault": True},
                {"id": "en_progreso", "label": "En Progreso", "icon": "🔵", "color": "blue", "isDefault": True},
                {"id": "completada", "label": "Completada", "icon": "🟢", "color": "green", "isDefault": True}
            ],
            "default_state": "pendiente",
            "final_states": ["completada"]
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
        
        db.execute(text("""
            INSERT OR IGNORE INTO organizations 
            (organization_id, name, description, is_active, country_code, timezone, subscription_plan, max_users, 
             task_states, work_hours_config) 
            VALUES (1, 'SmartPlanner Demo', 'Organización de demostración', 1, 'CO', 'America/Bogota', 'premium', 50,
                    :task_states, :work_hours)
        """), {
            "task_states": json.dumps(default_task_states),
            "work_hours": json.dumps(default_work_hours)
        })
        
        # 3. Insertar usuario administrador
        print("👤 Insertando usuario administrador...")
        admin_password = pwd_context.hash("admin123")
        
        db.execute(text("""
            INSERT OR IGNORE INTO users 
            (user_id, username, full_name, email, password_hash, role, is_active, organization_id, 
             specialization, weekly_capacity) 
            VALUES (1, 'admin', 'Administrador del Sistema', 'admin@smartplanner.com', :password, 'super_user', 1, 1,
                    'management', 40)
        """), {"password": admin_password})
        
        # 4. Insertar cliente de ejemplo
        print("🤝 Insertando cliente de ejemplo...")
        db.execute(text("""
            INSERT OR IGNORE INTO clients 
            (client_id, name, code, is_active, organization_id, country_code, contact_email) 
            VALUES (1, 'Cliente Demo', 'DEMO-001', 1, 1, 'CO', 'cliente@demo.com')
        """))
        
        # 5. Insertar proyecto de ejemplo
        print("📋 Insertando proyecto de ejemplo...")
        db.execute(text("""
            INSERT OR IGNORE INTO projects 
            (project_id, client_id, name, code, description, project_type, status, manager_id, 
             estimated_hours, priority, organization_id) 
            VALUES (1, 1, 'Proyecto Demo', 'PROJ-001', 'Proyecto de demostración del sistema', 'development', 
                    'in_progress', 1, 160, 'medium', 1)
        """))
        
        # Confirmar cambios
        db.commit()
        
        print("✅ Datos básicos cargados exitosamente")
        
        # Verificar datos cargados
        result = db.execute(text("SELECT COUNT(*) FROM countries"))
        countries_count = result.scalar()
        print(f"🌍 Países: {countries_count}")
        
        result = db.execute(text("SELECT COUNT(*) FROM organizations"))
        orgs_count = result.scalar()
        print(f"🏢 Organizaciones: {orgs_count}")
        
        result = db.execute(text("SELECT COUNT(*) FROM users"))
        users_count = result.scalar()
        print(f"👥 Usuarios: {users_count}")
        
        result = db.execute(text("SELECT COUNT(*) FROM clients"))
        clients_count = result.scalar()
        print(f"🤝 Clientes: {clients_count}")
        
        result = db.execute(text("SELECT COUNT(*) FROM projects"))
        projects_count = result.scalar()
        print(f"📋 Proyectos: {projects_count}")
        
        print("\n🔑 Credenciales de acceso:")
        print("   Usuario: admin")
        print("   Contraseña: admin123")
        print("   Email: admin@smartplanner.com")
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
    
except Exception as e:
    print(f"❌ Error al configurar datos básicos: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1) 