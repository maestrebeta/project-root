#!/usr/bin/env python3
"""
Script para recrear las tablas de épicas y user stories con la estructura correcta
"""

import sqlite3
import sys
from datetime import datetime

def recreate_epic_tables():
    """Elimina y recrea las tablas de épicas y user stories"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        print("🗑️ Eliminando tablas existentes...")
        
        # Eliminar tablas en orden correcto (por dependencias)
        cursor.execute("DROP TABLE IF EXISTS user_stories;")
        cursor.execute("DROP TABLE IF EXISTS epics;")
        
        print("✅ Tablas eliminadas")
        
        print("🔨 Creando tabla epics...")
        cursor.execute("""
            CREATE TABLE epics (
                epic_id INTEGER PRIMARY KEY,
                project_id INTEGER NOT NULL,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'planning',
                priority VARCHAR(20) DEFAULT 'medium',
                start_date DATETIME,
                end_date DATETIME,
                estimated_hours DECIMAL(10, 2),
                actual_hours DECIMAL(10, 2) DEFAULT 0,
                progress_percentage DECIMAL(5, 2) DEFAULT 0,
                color VARCHAR(7) DEFAULT '#3B82F6',
                tags JSON,
                acceptance_criteria TEXT,
                business_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects (project_id)
            );
        """)
        
        print("🔨 Creando tabla user_stories...")
        cursor.execute("""
            CREATE TABLE user_stories (
                story_id INTEGER PRIMARY KEY,
                epic_id INTEGER,
                project_id INTEGER NOT NULL,
                title VARCHAR(300) NOT NULL,
                description TEXT,
                acceptance_criteria TEXT,
                status VARCHAR(30) NOT NULL DEFAULT 'backlog',
                priority VARCHAR(20) DEFAULT 'medium',
                specialization VARCHAR(50) DEFAULT 'development',
                sub_specializations JSON,
                estimated_hours DECIMAL(8, 2) DEFAULT 8,
                ui_hours DECIMAL(8, 2) DEFAULT 0,
                development_hours DECIMAL(8, 2) DEFAULT 0,
                testing_hours DECIMAL(8, 2) DEFAULT 0,
                documentation_hours DECIMAL(8, 2) DEFAULT 0,
                actual_hours DECIMAL(8, 2) DEFAULT 0,
                assigned_user_id INTEGER,
                sprint_id INTEGER,
                start_date DATETIME,
                end_date DATETIME,
                completed_date DATETIME,
                tags JSON,
                checklist JSON,
                comments JSON,
                attachments JSON,
                color VARCHAR(7) DEFAULT '#10B981',
                is_blocked BOOLEAN DEFAULT 0,
                blocked_reason TEXT,
                business_value TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (epic_id) REFERENCES epics (epic_id),
                FOREIGN KEY (project_id) REFERENCES projects (project_id),
                FOREIGN KEY (assigned_user_id) REFERENCES users (user_id),
                CHECK (specialization IN ('development', 'ui_ux', 'testing', 'documentation', 'management', 'data_analysis'))
            );
        """)
        
        # Crear índices para mejorar el rendimiento
        print("📊 Creando índices...")
        cursor.execute("CREATE INDEX idx_epics_project_id ON epics(project_id);")
        cursor.execute("CREATE INDEX idx_epics_status ON epics(status);")
        cursor.execute("CREATE INDEX idx_user_stories_epic_id ON user_stories(epic_id);")
        cursor.execute("CREATE INDEX idx_user_stories_project_id ON user_stories(project_id);")
        cursor.execute("CREATE INDEX idx_user_stories_status ON user_stories(status);")
        cursor.execute("CREATE INDEX idx_user_stories_assigned_user_id ON user_stories(assigned_user_id);")
        
        conn.commit()
        
        print("✅ Tablas recreadas exitosamente")
        
        # Verificar estructura
        print("\n📋 Verificando estructura de tablas:")
        
        cursor.execute("PRAGMA table_info(epics);")
        epics_columns = cursor.fetchall()
        print(f"  📊 Tabla 'epics' - {len(epics_columns)} columnas:")
        for col in epics_columns:
            print(f"    - {col[1]} ({col[2]})")
        
        cursor.execute("PRAGMA table_info(user_stories);")
        stories_columns = cursor.fetchall()
        print(f"  📊 Tabla 'user_stories' - {len(stories_columns)} columnas:")
        for col in stories_columns:
            print(f"    - {col[1]} ({col[2]})")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error al recrear tablas: {e}")
        return False

def add_sample_data():
    """Agrega datos de ejemplo para testing"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        print("\n🌱 Agregando datos de ejemplo...")
        
        # Verificar que existe un proyecto
        cursor.execute("SELECT project_id FROM projects LIMIT 1;")
        project = cursor.fetchone()
        
        if not project:
            print("⚠️ No se encontraron proyectos. Creando proyecto de ejemplo...")
            cursor.execute("""
                INSERT INTO projects (name, description, organization_id, status)
                VALUES ('Proyecto Demo', 'Proyecto de demostración', 1, 'active');
            """)
            project_id = cursor.lastrowid
        else:
            project_id = project[0]
        
        # Crear épica de ejemplo
        cursor.execute("""
            INSERT INTO epics (project_id, name, description, status, priority, color)
            VALUES (?, 'Épica de Ejemplo', 'Esta es una épica de demostración para testing', 'planning', 'high', '#3B82F6');
        """, (project_id,))
        epic_id = cursor.lastrowid
        
        # Crear user stories de ejemplo
        user_stories = [
            ('Como usuario quiero poder iniciar sesión', 'Implementar sistema de autenticación', 'backlog', 'high', 'development', 16),
            ('Como usuario quiero ver mi dashboard', 'Crear dashboard principal con métricas', 'backlog', 'medium', 'ui_ux', 12),
            ('Como admin quiero gestionar usuarios', 'Panel de administración de usuarios', 'backlog', 'medium', 'development', 20),
        ]
        
        for title, description, status, priority, specialization, hours in user_stories:
            cursor.execute("""
                INSERT INTO user_stories (epic_id, project_id, title, description, status, priority, specialization, estimated_hours)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
            """, (epic_id, project_id, title, description, status, priority, specialization, hours))
        
        conn.commit()
        
        print(f"✅ Datos de ejemplo agregados:")
        print(f"  - 1 épica creada (ID: {epic_id})")
        print(f"  - {len(user_stories)} user stories creadas")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error al agregar datos de ejemplo: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Iniciando recreación de tablas de épicas y user stories...")
    
    if recreate_epic_tables():
        if add_sample_data():
            print("\n🎉 ¡Proceso completado exitosamente!")
            print("Las tablas de épicas y user stories están listas para usar.")
        else:
            print("\n⚠️ Tablas creadas pero falló la inserción de datos de ejemplo.")
    else:
        print("\n❌ Falló la recreación de tablas.")
        sys.exit(1) 