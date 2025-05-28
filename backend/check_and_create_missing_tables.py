#!/usr/bin/env python3
"""
Script para verificar y crear las tablas faltantes en la base de datos SQLite
"""

import sqlite3
import sys
from datetime import datetime

def check_existing_tables():
    """Verifica qué tablas existen en la base de datos"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print("📋 Tablas existentes en la base de datos:")
        existing_tables = []
        for table in tables:
            table_name = table[0]
            existing_tables.append(table_name)
            print(f"  ✅ {table_name}")
        
        conn.close()
        return existing_tables
        
    except Exception as e:
        print(f"❌ Error al verificar tablas: {e}")
        return []

def create_epics_table():
    """Crea la tabla epics"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        create_epics_sql = """
        CREATE TABLE IF NOT EXISTS epics (
            epic_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            status VARCHAR(30) NOT NULL DEFAULT 'planning',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            start_date DATE,
            end_date DATE,
            estimated_hours INTEGER,
            actual_hours INTEGER DEFAULT 0,
            progress_percentage INTEGER DEFAULT 0,
            color VARCHAR(7) DEFAULT '#3B82F6',
            tags TEXT,
            acceptance_criteria TEXT,
            business_value INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE,
            CHECK (status IN ('planning', 'in_progress', 'testing', 'completed', 'cancelled')),
            CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
            CHECK (business_value >= 0 AND business_value <= 100)
        );
        """
        
        cursor.execute(create_epics_sql)
        
        # Crear índices para mejorar el rendimiento
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_epics_project_id ON epics(project_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_epics_status ON epics(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_epics_priority ON epics(priority);")
        
        conn.commit()
        conn.close()
        print("✅ Tabla 'epics' creada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al crear tabla epics: {e}")
        return False

def create_user_stories_table():
    """Crea la tabla user_stories"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        create_user_stories_sql = """
        CREATE TABLE IF NOT EXISTS user_stories (
            story_id INTEGER PRIMARY KEY AUTOINCREMENT,
            epic_id INTEGER,
            project_id INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT,
            acceptance_criteria TEXT,
            status VARCHAR(30) NOT NULL DEFAULT 'backlog',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            story_points INTEGER,
            estimated_hours DECIMAL(8,2),
            actual_hours DECIMAL(8,2) DEFAULT 0,
            assigned_to_user_id INTEGER,
            reporter_user_id INTEGER,
            sprint_id INTEGER,
            tags TEXT,
            due_date DATE,
            business_value INTEGER DEFAULT 0,
            technical_debt BOOLEAN DEFAULT FALSE,
            blocked BOOLEAN DEFAULT FALSE,
            blocked_reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (epic_id) REFERENCES epics (epic_id) ON DELETE SET NULL,
            FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
            FOREIGN KEY (reporter_user_id) REFERENCES users (user_id) ON DELETE SET NULL,
            CHECK (status IN ('backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done', 'cancelled')),
            CHECK (priority IN ('low', 'medium', 'high', 'critical')),
            CHECK (story_points >= 0),
            CHECK (business_value >= 0 AND business_value <= 100)
        );
        """
        
        cursor.execute(create_user_stories_sql)
        
        # Crear índices para mejorar el rendimiento
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_stories_epic_id ON user_stories(epic_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_stories_project_id ON user_stories(project_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_stories_status ON user_stories(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_stories_assigned_to ON user_stories(assigned_to_user_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_stories_sprint_id ON user_stories(sprint_id);")
        
        conn.commit()
        conn.close()
        print("✅ Tabla 'user_stories' creada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al crear tabla user_stories: {e}")
        return False

def create_sprints_table():
    """Crea la tabla sprints"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        create_sprints_sql = """
        CREATE TABLE IF NOT EXISTS sprints (
            sprint_id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'planning',
            goal TEXT,
            capacity_hours INTEGER,
            velocity INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects (project_id) ON DELETE CASCADE,
            CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
            CHECK (end_date > start_date)
        );
        """
        
        cursor.execute(create_sprints_sql)
        
        # Crear índices
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sprints_status ON sprints(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_sprints_dates ON sprints(start_date, end_date);")
        
        conn.commit()
        conn.close()
        print("✅ Tabla 'sprints' creada exitosamente")
        return True
        
    except Exception as e:
        print(f"❌ Error al crear tabla sprints: {e}")
        return False

def insert_sample_data():
    """Inserta datos de ejemplo para testing"""
    try:
        conn = sqlite3.connect('smartplanner.db')
        cursor = conn.cursor()
        
        # Verificar si ya existen datos
        cursor.execute("SELECT COUNT(*) FROM epics")
        epic_count = cursor.fetchone()[0]
        
        if epic_count == 0:
            # Insertar épica de ejemplo
            cursor.execute("""
                INSERT INTO epics (project_id, name, description, status, priority, estimated_hours, color, business_value)
                VALUES (1, 'Sistema de Autenticación', 'Implementar sistema completo de autenticación y autorización', 'in_progress', 'high', 40, '#10B981', 85)
            """)
            
            epic_id = cursor.lastrowid
            
            # Insertar user stories de ejemplo
            sample_stories = [
                (epic_id, 1, 'Login de Usuario', 'Como usuario quiero poder iniciar sesión en el sistema', 'backlog', 'high', 5, 8.0),
                (epic_id, 1, 'Registro de Usuario', 'Como usuario quiero poder registrarme en el sistema', 'todo', 'medium', 3, 6.0),
                (epic_id, 1, 'Recuperación de Contraseña', 'Como usuario quiero poder recuperar mi contraseña', 'in_progress', 'medium', 3, 4.0),
                (epic_id, 1, 'Perfil de Usuario', 'Como usuario quiero poder editar mi perfil', 'done', 'low', 2, 3.0)
            ]
            
            for story in sample_stories:
                cursor.execute("""
                    INSERT INTO user_stories (epic_id, project_id, title, description, status, priority, story_points, estimated_hours)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, story)
            
            # Insertar sprint de ejemplo
            cursor.execute("""
                INSERT INTO sprints (project_id, name, description, start_date, end_date, status, goal, capacity_hours)
                VALUES (1, 'Sprint 1 - Autenticación', 'Primer sprint enfocado en funcionalidades básicas de autenticación', 
                        date('now'), date('now', '+14 days'), 'active', 'Completar login y registro básico', 80)
            """)
            
            conn.commit()
            print("✅ Datos de ejemplo insertados exitosamente")
        else:
            print("ℹ️  Ya existen datos en las tablas, omitiendo inserción de ejemplos")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error al insertar datos de ejemplo: {e}")
        return False

def main():
    print("🔧 Verificando y creando tablas faltantes para el módulo de planificación...")
    print("=" * 70)
    
    # Verificar tablas existentes
    existing_tables = check_existing_tables()
    
    print("\n🔨 Creando tablas faltantes...")
    
    # Crear tablas faltantes
    tables_to_create = [
        ('epics', create_epics_table),
        ('user_stories', create_user_stories_table),
        ('sprints', create_sprints_table)
    ]
    
    created_count = 0
    for table_name, create_func in tables_to_create:
        if table_name not in existing_tables:
            print(f"\n📝 Creando tabla '{table_name}'...")
            if create_func():
                created_count += 1
        else:
            print(f"ℹ️  Tabla '{table_name}' ya existe, omitiendo...")
    
    if created_count > 0:
        print(f"\n🎯 Insertando datos de ejemplo...")
        insert_sample_data()
    
    print("\n" + "=" * 70)
    print(f"✅ Proceso completado. {created_count} tablas creadas.")
    
    # Verificar tablas finales
    print("\n📋 Verificación final de tablas:")
    final_tables = check_existing_tables()
    
    required_tables = ['epics', 'user_stories', 'sprints']
    missing_tables = [table for table in required_tables if table not in final_tables]
    
    if not missing_tables:
        print("\n🎉 ¡Todas las tablas requeridas están disponibles!")
        print("   El módulo de planificación debería funcionar correctamente ahora.")
    else:
        print(f"\n⚠️  Aún faltan las siguientes tablas: {missing_tables}")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 