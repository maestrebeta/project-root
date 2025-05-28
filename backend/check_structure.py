#!/usr/bin/env python3
"""
Script para verificar la estructura de las tablas
"""

import os
import sys
from sqlalchemy import text

# Agregar el directorio actual al path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.core.database import engine
    
    print("🔍 Verificando estructura de tablas...")
    
    with engine.connect() as conn:
        # Verificar estructura de countries
        print("\n📋 Estructura de la tabla 'countries':")
        result = conn.execute(text("PRAGMA table_info(countries)"))
        for row in result:
            print(f"   {row}")
        
        # Verificar estructura de organizations
        print("\n📋 Estructura de la tabla 'organizations':")
        result = conn.execute(text("PRAGMA table_info(organizations)"))
        for row in result:
            print(f"   {row}")
        
        # Verificar estructura de users
        print("\n📋 Estructura de la tabla 'users':")
        result = conn.execute(text("PRAGMA table_info(users)"))
        for row in result:
            print(f"   {row}")
    
except Exception as e:
    print(f"❌ Error al verificar estructura: {str(e)}")
    import traceback
    traceback.print_exc()
    sys.exit(1) 