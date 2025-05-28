#!/usr/bin/env python3
"""
Script completo para reiniciar la base de datos con migración consolidada
Garantiza un estado limpio y consistente con datos de prueba inteligentes
"""

import os
import sys
import subprocess
from pathlib import Path

# Agregar el directorio backend al path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.database import get_db
from app.core.init_data import init_data
from app.models import *  # Importar todos los modelos

# Configuración de la base de datos
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/smartplanner_db"

def run_command(command, description):
    """Ejecutar comando y mostrar resultado"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, cwd=backend_dir)
        if result.returncode == 0:
            print(f"✅ {description} completado exitosamente")
            if result.stdout.strip():
                print(f"📝 Salida: {result.stdout.strip()}")
        else:
            print(f"❌ Error en {description}")
            print(f"📝 Error: {result.stderr.strip()}")
            return False
        return True
    except Exception as e:
        print(f"❌ Excepción en {description}: {str(e)}")
        return False

def reset_database_complete():
    """Reinicio completo de la base de datos con migración consolidada"""
    
    print("🚀 REINICIO COMPLETO DE BASE DE DATOS")
    print("=" * 50)
    print("Este script realizará:")
    print("1. Eliminación completa de la base de datos")
    print("2. Recreación de la base de datos")
    print("3. Aplicación de migración consolidada")
    print("4. Carga inteligente de datos de prueba")
    print("=" * 50)
    
    # Confirmar acción
    confirm = input("\n¿Continuar con el reinicio completo? (s/N): ").lower().strip()
    if confirm != 's':
        print("❌ Operación cancelada por el usuario")
        return False
    
    try:
        # 1. Eliminar base de datos existente
        print("\n🗑️  PASO 1: Eliminando base de datos existente...")
        engine = create_engine("postgresql://postgres:postgres@localhost:5432/postgres")
        with engine.connect() as conn:
            # Terminar conexiones activas
            conn.execute(text("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'smartplanner_db' AND pid <> pg_backend_pid()"))
            conn.commit()
            
            # Eliminar base de datos
            conn.execute(text("DROP DATABASE IF EXISTS smartplanner_db"))
            conn.commit()
            print("✅ Base de datos eliminada")
        
        # 2. Crear nueva base de datos
        print("\n🏗️  PASO 2: Creando nueva base de datos...")
        with engine.connect() as conn:
            conn.execute(text("CREATE DATABASE smartplanner_db"))
            conn.commit()
            print("✅ Nueva base de datos creada")
        
        # 3. Eliminar historial de migraciones de Alembic
        print("\n🧹 PASO 3: Limpiando historial de migraciones...")
        alembic_versions_dir = backend_dir / "alembic" / "versions"
        
        # Verificar que solo existe la migración consolidada
        migration_files = list(alembic_versions_dir.glob("*.py"))
        migration_files = [f for f in migration_files if f.name != "__pycache__"]
        
        print(f"📁 Archivos de migración encontrados: {len(migration_files)}")
        for file in migration_files:
            print(f"   • {file.name}")
        
        # Verificar que solo existe v1_0_0_initial_schema.py
        expected_migration = "v1_0_0_initial_schema.py"
        if len(migration_files) == 1 and migration_files[0].name == expected_migration:
            print(f"✅ Solo existe la migración consolidada: {expected_migration}")
        else:
            print(f"⚠️  Advertencia: Se esperaba solo {expected_migration}")
        
        # 4. Aplicar migración consolidada
        print("\n📋 PASO 4: Aplicando migración consolidada...")
        if not run_command("alembic upgrade head", "Aplicación de migración consolidada"):
            return False
        
        # 5. Verificar estructura de base de datos
        print("\n🔍 PASO 5: Verificando estructura de base de datos...")
        engine = create_engine(DATABASE_URL)
        with engine.connect() as conn:
            # Verificar tablas principales
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name
            """)
            tables = conn.execute(tables_query).fetchall()
            table_names = [row[0] for row in tables]
            
            expected_tables = [
                'countries', 'organizations', 'users', 'clients', 'projects', 
                'tickets', 'time_entries', 'epics', 'user_stories', 'invoices'
            ]
            
            print(f"📊 Tablas creadas: {len(table_names)}")
            for table in table_names:
                status = "✅" if table in expected_tables else "ℹ️"
                print(f"   {status} {table}")
            
            # Verificar campos específicos consolidados
            print("\n🔍 Verificando campos consolidados...")
            
            # Verificar campos de especialización en users
            users_columns = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'users' AND table_schema = 'public'
                ORDER BY column_name
            """)).fetchall()
            
            user_column_names = [row[0] for row in users_columns]
            specialization_fields = ['specialization', 'sub_specializations', 'hourly_rate', 'weekly_capacity', 'skills']
            
            print("👤 Campos de especialización en users:")
            for field in specialization_fields:
                status = "✅" if field in user_column_names else "❌"
                print(f"   {status} {field}")
            
            # Verificar campos en user_stories
            stories_columns = conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'user_stories' AND table_schema = 'public'
                ORDER BY column_name
            """)).fetchall()
            
            story_column_names = [row[0] for row in stories_columns]
            story_fields = ['estimated_hours', 'specialization', 'sub_specializations']
            
            print("📖 Campos consolidados en user_stories:")
            for field in story_fields:
                status = "✅" if field in story_column_names else "❌"
                print(f"   {status} {field}")
        
        # 6. Cargar datos de prueba inteligentes
        print("\n📊 PASO 6: Cargando datos de prueba inteligentes...")
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        try:
            init_data(db)
            print("✅ Datos de prueba cargados exitosamente")
        except Exception as e:
            print(f"❌ Error cargando datos de prueba: {str(e)}")
            db.rollback()
            return False
        finally:
            db.close()
        
        # 7. Resumen final
        print("\n" + "=" * 50)
        print("🎉 REINICIO COMPLETO EXITOSO")
        print("=" * 50)
        print("✅ Base de datos recreada con migración consolidada")
        print("✅ Estructura verificada y campos consolidados")
        print("✅ Datos de prueba inteligentes cargados")
        print("✅ Sistema listo para uso")
        print("\n🚀 Puedes reiniciar el servidor backend ahora")
        print("📝 Comando: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error durante el reinicio completo: {str(e)}")
        return False

if __name__ == "__main__":
    success = reset_database_complete()
    sys.exit(0 if success else 1) 