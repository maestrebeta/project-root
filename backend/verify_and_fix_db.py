#!/usr/bin/env python3
"""
Script para verificar y corregir la estructura de la base de datos
"""

import os
import sys
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

# Agregar el directorio app al path
sys.path.append(str(Path(__file__).parent / "app"))

def print_status(message, status="INFO"):
    icons = {"INFO": "[INFO]", "SUCCESS": "[OK]", "ERROR": "[ERROR]", "WARNING": "[WARN]"}
    print(f"{icons.get(status, '[INFO]')} {message}")

def check_and_fix_database():
    """Verificar y corregir la estructura de la base de datos"""
    print_status("Verificando estructura de base de datos...")
    
    db_path = Path(__file__).parent / "smartplanner.db"
    engine = create_engine(f"sqlite:///{db_path}")
    
    # Verificar tablas existentes
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print_status(f"Tablas encontradas: {len(existing_tables)}")
    for table in existing_tables:
        print(f"  - {table}")
    
    # Tablas requeridas
    required_tables = [
        'countries', 'organizations', 'users', 'clients', 'projects',
        'epics', 'user_stories', 'time_entries', 'tickets'
    ]
    
    missing_tables = [table for table in required_tables if table not in existing_tables]
    
    if missing_tables:
        print_status(f"Faltan tablas: {missing_tables}", "WARNING")
        return False
    
    # Verificar y corregir restricciones de épicas
    with engine.connect() as conn:
        # Verificar restricciones de estado en épicas
        try:
            print_status("Verificando restricciones de estado en épicas...", "INFO")
            
            # Obtener información de la tabla épicas
            result = conn.execute(text("PRAGMA table_info(epics)"))
            epic_columns = [row[1] for row in result.fetchall()]
            
            # Verificar si existe la restricción correcta
            result = conn.execute(text("SELECT sql FROM sqlite_master WHERE type='table' AND name='epics'"))
            table_sql = result.fetchone()
            
            if table_sql and 'backlog' not in table_sql[0]:
                print_status("Actualizando restricciones de estado en épicas...", "INFO")
                
                # Ejecutar el script de actualización de restricciones
                try:
                    import subprocess
                    result = subprocess.run([
                        sys.executable, "update_epic_constraints.py"
                    ], cwd=Path(__file__).parent, capture_output=True, text=True, timeout=30)
                    
                    if result.returncode == 0:
                        print_status("Restricciones de épicas actualizadas correctamente", "SUCCESS")
                    else:
                        print_status(f"Error actualizando restricciones: {result.stderr}", "WARNING")
                        
                except Exception as e:
                    print_status(f"Error ejecutando actualización de restricciones: {e}", "WARNING")
            else:
                print_status("Restricciones de épicas ya están actualizadas", "SUCCESS")
                
        except Exception as e:
            print_status(f"Error verificando restricciones de épicas: {e}", "WARNING")
        
        # Verificar campo progress en épicas
        try:
            result = conn.execute(text("PRAGMA table_info(epics)"))
            epic_columns = [row[1] for row in result.fetchall()]
            
            if 'progress' not in epic_columns:
                print_status("Agregando campo 'progress' a tabla epics", "INFO")
                conn.execute(text("ALTER TABLE epics ADD COLUMN progress INTEGER DEFAULT 0"))
                conn.commit()
                
        except Exception as e:
            print_status(f"Error verificando tabla epics: {e}", "WARNING")
        
        # Verificar campo progress en user_stories
        try:
            result = conn.execute(text("PRAGMA table_info(user_stories)"))
            story_columns = [row[1] for row in result.fetchall()]
            
            if 'progress' not in story_columns:
                print_status("Agregando campo 'progress' a tabla user_stories", "INFO")
                conn.execute(text("ALTER TABLE user_stories ADD COLUMN progress INTEGER DEFAULT 0"))
                conn.commit()
                
        except Exception as e:
            print_status(f"Error verificando tabla user_stories: {e}", "WARNING")
        
        # Verificar campos de especialización en users
        try:
            result = conn.execute(text("PRAGMA table_info(users)"))
            user_columns = [row[1] for row in result.fetchall()]
            
            fields_to_add = [
                ('specialization', 'VARCHAR(50) DEFAULT "development"'),
                ('sub_specializations', 'JSON'),
                ('hourly_rate', 'INTEGER'),
                ('weekly_capacity', 'INTEGER DEFAULT 40'),
                ('skills', 'JSON')
            ]
            
            for field_name, field_def in fields_to_add:
                if field_name not in user_columns:
                    print_status(f"Agregando campo '{field_name}' a tabla users", "INFO")
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {field_name} {field_def}"))
                    conn.commit()
                    
        except Exception as e:
            print_status(f"Error verificando tabla users: {e}", "WARNING")
        
        # Verificar datos de épicas con estado 'backlog'
        try:
            result = conn.execute(text("SELECT COUNT(*) FROM epics WHERE status = 'backlog'"))
            backlog_epics = result.fetchone()[0]
            print_status(f"Épicas con estado 'backlog': {backlog_epics}", "INFO")
            
            if backlog_epics == 0:
                print_status("No hay épicas con estado 'backlog', se crearán en la inicialización", "INFO")
                
        except Exception as e:
            print_status(f"Error verificando épicas con estado backlog: {e}", "WARNING")
    
    print_status("Verificación de estructura completada", "SUCCESS")
    return True

def verify_data_integrity():
    """Verificar integridad de los datos"""
    print_status("Verificando integridad de datos...")
    
    try:
        from app.core.database import get_db
        from app.models.organization_models import Organization
        from app.models.user_models import User
        from app.models.project_models import Project
        from app.models.epic_models import Epic, UserStory
        from app.models.time_entry_models import TimeEntry
        from app.models.ticket_models import Ticket
        
        db_gen = get_db()
        db = next(db_gen)
        
        try:
            # Contar registros
            counts = {
                'organizations': db.query(Organization).count(),
                'users': db.query(User).count(),
                'projects': db.query(Project).count(),
                'epics': db.query(Epic).count(),
                'user_stories': db.query(UserStory).count(),
                'time_entries': db.query(TimeEntry).count(),
                'tickets': db.query(Ticket).count()
            }
            
            print_status("Conteo de registros:")
            for table, count in counts.items():
                print(f"  - {table}: {count}")
            
            # Verificar relaciones básicas
            orphaned_projects = db.query(Project).filter(Project.organization_id.is_(None)).count()
            orphaned_users = db.query(User).filter(User.organization_id.is_(None)).count()
            
            if orphaned_projects > 0:
                print_status(f"Encontrados {orphaned_projects} proyectos sin organización", "WARNING")
            
            if orphaned_users > 0:
                print_status(f"Encontrados {orphaned_users} usuarios sin organización", "WARNING")
            
            return counts
            
        finally:
            db.close()
            
    except Exception as e:
        print_status(f"Error verificando integridad: {e}", "ERROR")
        return None

def initialize_missing_data():
    """Inicializar datos faltantes"""
    print_status("Inicializando datos faltantes...")
    
    try:
        from app.core.database import get_db
        from app.core.init_data import init_data
        
        db_gen = get_db()
        db = next(db_gen)
        
        try:
            init_data(db)
            print_status("Datos inicializados correctamente", "SUCCESS")
            return True
        finally:
            db.close()
            
    except Exception as e:
        print_status(f"Error inicializando datos: {e}", "ERROR")
        return False

def main():
    print_status("[TOOL] Verificación y Corrección de Base de Datos SmartPlanner")
    print("=" * 60)
    
    try:
        # 1. Verificar estructura
        if not check_and_fix_database():
            print_status("Estructura de base de datos incorrecta", "ERROR")
            return False
        
        # 2. Verificar integridad
        counts = verify_data_integrity()
        if counts is None:
            print_status("Error verificando integridad", "ERROR")
            return False
        
        # 3. Inicializar datos si es necesario
        total_records = sum(counts.values())
        if total_records < 50:  # Si hay muy pocos datos
            print_status(f"Solo {total_records} registros encontrados, inicializando más datos...", "INFO")
            if not initialize_missing_data():
                print_status("Error inicializando datos", "ERROR")
                return False
        
        # 4. Verificación final
        final_counts = verify_data_integrity()
        if final_counts:
            print_status("Verificación final completada", "SUCCESS")
            print("\n[DATA] Resumen final:")
            for table, count in final_counts.items():
                print(f"  - {table}: {count}")
        
        print("\n[OK] Base de datos verificada y corregida exitosamente")
        return True
        
    except Exception as e:
        print_status(f"Error crítico: {e}", "ERROR")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 