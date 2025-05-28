#!/usr/bin/env python3
"""
Script para actualizar las restricciones de estado de épicas en la base de datos
"""

import sqlite3
import os
from pathlib import Path

def update_epic_constraints():
    """Actualizar las restricciones de estado de épicas"""
    
    # Buscar la base de datos
    db_paths = [
        'smartplanner.db',
        'system_intelligence.db'
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print("❌ No se encontró la base de datos")
        return False
    
    print(f"📁 Usando base de datos: {db_path}")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si la tabla epics existe
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='epics'
        """)
        
        if not cursor.fetchone():
            print("❌ La tabla 'epics' no existe")
            return False
        
        # Verificar la estructura actual de la tabla
        cursor.execute("PRAGMA table_info(epics)")
        columns = cursor.fetchall()
        print("📋 Estructura actual de la tabla epics:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        
        # Verificar las restricciones actuales
        cursor.execute("""
            SELECT sql FROM sqlite_master 
            WHERE type='table' AND name='epics'
        """)
        table_sql = cursor.fetchone()[0]
        print(f"\n📝 SQL actual de la tabla:\n{table_sql}")
        
        # Verificar si ya existe la restricción correcta
        if "status IN ('backlog'" in table_sql:
            print("✅ La restricción ya incluye 'backlog'")
            return True
        
        # Crear una nueva tabla con las restricciones correctas
        print("\n🔄 Actualizando restricciones...")
        
        # Crear tabla temporal con las nuevas restricciones
        cursor.execute("""
            CREATE TABLE epics_new (
                epic_id INTEGER PRIMARY KEY,
                project_id INTEGER NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'backlog',
                priority VARCHAR(20) DEFAULT 'medium',
                start_date DATETIME,
                end_date DATETIME,
                estimated_hours DECIMAL(10,2),
                actual_hours DECIMAL(10,2) DEFAULT 0,
                progress_percentage DECIMAL(5,2) DEFAULT 0,
                color VARCHAR(7) DEFAULT '#3B82F6',
                tags JSON,
                acceptance_criteria TEXT,
                business_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (project_id),
                CHECK (status IN ('backlog', 'planning', 'in_progress', 'review', 'done', 'blocked')),
                CHECK (priority IN ('low', 'medium', 'high', 'critical'))
            )
        """)
        
        # Copiar datos de la tabla original
        cursor.execute("""
            INSERT INTO epics_new 
            SELECT * FROM epics
        """)
        
        # Eliminar tabla original
        cursor.execute("DROP TABLE epics")
        
        # Renombrar tabla nueva
        cursor.execute("ALTER TABLE epics_new RENAME TO epics")
        
        # Recrear índices si existen
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_epics_project_id ON epics (project_id)
        """)
        
        conn.commit()
        print("✅ Restricciones actualizadas exitosamente")
        
        # Verificar que los datos se mantuvieron
        cursor.execute("SELECT COUNT(*) FROM epics")
        count = cursor.fetchone()[0]
        print(f"📊 Épicas en la base de datos: {count}")
        
        # Verificar estados actuales
        cursor.execute("SELECT DISTINCT status FROM epics")
        statuses = [row[0] for row in cursor.fetchall()]
        print(f"📋 Estados encontrados: {statuses}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error al actualizar restricciones: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        return False
    
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    print("🔧 Actualizando restricciones de épicas...")
    success = update_epic_constraints()
    
    if success:
        print("\n✅ Actualización completada exitosamente")
        print("🚀 Ahora puedes reiniciar el sistema")
    else:
        print("\n❌ La actualización falló")
        print("🔍 Revisa los errores anteriores") 