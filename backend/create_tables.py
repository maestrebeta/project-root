#!/usr/bin/env python3
"""
Script para crear todas las tablas de la base de datos
"""

import os
import sys

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import engine, Base
    from app.models import *
    
    print("🔧 Creando tablas en la base de datos...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    
    print("✅ Tablas creadas exitosamente")
    
    # Verificar las tablas creadas
    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table'"))
        tables = [row[0] for row in result]
        
    print(f"📊 Total de tablas creadas: {len(tables)}")
    print("📋 Lista de tablas:")
    for table in sorted(tables):
        print(f"   • {table}")
    
except Exception as e:
    print(f"❌ Error al crear las tablas: {str(e)}")
    sys.exit(1) 