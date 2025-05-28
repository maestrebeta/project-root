#!/usr/bin/env python3
"""
Script para crear las tablas faltantes
"""

import sys
from pathlib import Path

# Agregar el directorio app al path
sys.path.append(str(Path(__file__).parent / "app"))

def create_missing_tables():
    try:
        from app.core.database import engine
        from app.models.time_entry_models import TimeEntry
        from app.models.ticket_models import Ticket
        
        print("Creando tabla time_entries...")
        TimeEntry.__table__.create(engine, checkfirst=True)
        print("✅ Tabla time_entries creada")
        
        print("Creando tabla tickets...")
        Ticket.__table__.create(engine, checkfirst=True)
        print("✅ Tabla tickets creada")
        
        print("✅ Todas las tablas faltantes han sido creadas")
        return True
        
    except Exception as e:
        print(f"❌ Error creando tablas: {e}")
        return False

if __name__ == "__main__":
    success = create_missing_tables()
    sys.exit(0 if success else 1) 