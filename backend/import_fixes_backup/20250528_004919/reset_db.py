#!/usr/bin/env python3
"""
Script para limpiar y recrear la base de datos completamente
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine
from app.core.database import SQLALCHEMY_DATABASE_URL, Base, SessionLocal
from app.core.init_data import init_data
import alembic.config
import alembic.command

def reset_database():
    """Eliminar y recrear la base de datos completamente"""
    
    # Configuración de la base de datos (basada en database.py)
    DB_NAME = "smartplanner"
    DB_USER = "admin"
    DB_PASSWORD = "816465"
    DB_HOST = "localhost"
    DB_PORT = "5432"
    
    print("🗑️  Eliminando y recreando la base de datos...")
    
    try:
        # Conectar a PostgreSQL como superusuario para eliminar/crear la DB
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user="admin",  # Usuario administrador de PostgreSQL
            password="816465"  # Contraseña del administrador
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Terminar todas las conexiones activas a la base de datos
        cursor.execute(f"""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = '{DB_NAME}' AND pid <> pg_backend_pid()
        """)
        
        # Eliminar la base de datos si existe
        cursor.execute(f"DROP DATABASE IF EXISTS {DB_NAME}")
        print(f"✅ Base de datos '{DB_NAME}' eliminada")
        
        # Crear la base de datos nuevamente
        cursor.execute(f"CREATE DATABASE {DB_NAME} OWNER {DB_USER}")
        print(f"✅ Base de datos '{DB_NAME}' creada")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Error al manejar la base de datos: {e}")
        print("💡 Asegúrate de que PostgreSQL esté ejecutándose y que tengas permisos de administrador")
        return False
    
    print("🔄 Ejecutando migraciones...")
    
    try:
        # Ejecutar migraciones de Alembic
        alembic_cfg = alembic.config.Config("alembic.ini")
        alembic_cfg.set_main_option("script_location", "alembic")
        alembic.command.upgrade(alembic_cfg, "head")
        print("✅ Migraciones ejecutadas exitosamente")
        
    except Exception as e:
        print(f"❌ Error al ejecutar migraciones: {e}")
        return False
    
    print("📊 Inicializando datos de ejemplo...")
    
    try:
        # Inicializar datos de ejemplo
        db = SessionLocal()
        init_data(db)
        db.close()
        print("✅ Datos de ejemplo inicializados")
        
    except Exception as e:
        print(f"❌ Error al inicializar datos: {e}")
        return False
    
    print("\n🎉 Base de datos recreada exitosamente!")
    print("✅ Estructura de tablas creada")
    print("✅ Datos de ejemplo cargados")
    print("✅ SmartPlanner listo para usar")
    
    return True

if __name__ == "__main__":
    print("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de la base de datos")
    confirm = input("¿Estás seguro de que quieres continuar? (sí/no): ")
    
    if confirm.lower() in ['sí', 'si', 'yes', 'y', 's']:
        reset_database()
    else:
        print("❌ Operación cancelada") 