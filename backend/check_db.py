#!/usr/bin/env python3
"""
Script para verificar el estado de la base de datos
"""

import os
import sys
from sqlalchemy import text, inspect

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import engine, get_db, SQLALCHEMY_DATABASE_URL
    from app.models import *
    
    print("🔍 Verificando base de datos...")
    print(f"📍 URL de base de datos: {SQLALCHEMY_DATABASE_URL}")
    
    # Verificar conexión
    with engine.connect() as conn:
        # Para SQLite
        if "sqlite" in SQLALCHEMY_DATABASE_URL:
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        else:
            # Para PostgreSQL
            result = conn.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public'"))
        
        tables = [row[0] for row in result]
        
    print(f"✅ Conexión exitosa")
    print(f"📊 Tablas encontradas: {len(tables)}")
    
    if tables:
        print("📋 Lista de tablas:")
        for table in sorted(tables):
            print(f"   • {table}")
    else:
        print("⚠️  No se encontraron tablas. Es necesario ejecutar migraciones.")
        
    # Verificar si existe la tabla de usuarios
    if 'users' in tables:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"👥 Usuarios en la base de datos: {user_count}")
    
    print("✅ Base de datos verificada correctamente")
    
except Exception as e:
    print(f"❌ Error al verificar la base de datos: {str(e)}")
    print("💡 Puede que necesites ejecutar las migraciones primero")
    sys.exit(1) 