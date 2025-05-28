#!/usr/bin/env python3
"""
Script directo para recrear las tablas de SmartPlanner usando SQLAlchemy
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.database import SQLALCHEMY_DATABASE_URL, Base, SessionLocal
from app.core.init_data import init_data

# Importar todos los modelos para que SQLAlchemy los registre
from app.models.user_models import User
from app.models.project_models import Project, ProjectBudget
from app.models.organization_models import Organization
from app.models.client_models import Client
from app.models.time_entry_models import TimeEntry
from app.models.ticket_models import Ticket, TicketComment, TicketHistory
from app.models.country_models import Country
from app.models.payment_models import Payment, PaymentInstallment, Invoice
from app.models.epic_models import Epic, UserStory

def reset_tables_direct():
    """Eliminar y recrear todas las tablas usando SQLAlchemy directamente"""
    
    print("🗑️  Eliminando y recreando las tablas...")
    
    try:
        # Crear engine
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # Eliminar todas las tablas con CASCADE para manejar dependencias
        print("🔄 Eliminando tablas existentes...")
        with engine.connect() as conn:
            # Eliminar todas las tablas con CASCADE
            conn.execute(text("DROP SCHEMA public CASCADE"))
            conn.execute(text("CREATE SCHEMA public"))
            conn.execute(text("GRANT ALL ON SCHEMA public TO public"))
            conn.commit()
        print("✅ Tablas eliminadas")
        
        # Crear todas las tablas
        print("🔄 Creando tablas...")
        Base.metadata.create_all(bind=engine)
        print("✅ Tablas creadas")
        
    except Exception as e:
        print(f"❌ Error al manejar las tablas: {e}")
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
        return False
    
    print("\n🎉 Tablas recreadas exitosamente!")
    print("✅ Estructura de tablas creada")
    print("✅ Datos de ejemplo cargados")
    print("✅ SmartPlanner listo para usar")
    
    return True

if __name__ == "__main__":
    print("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos de las tablas")
    confirm = input("¿Estás seguro de que quieres continuar? (sí/no): ")
    
    if confirm.lower() in ['sí', 'si', 'yes', 'y', 's']:
        reset_tables_direct()
    else:
        print("❌ Operación cancelada") 