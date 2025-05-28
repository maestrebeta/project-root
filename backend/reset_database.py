#!/usr/bin/env python3
"""
Script para resetear completamente la base de datos
Borra la base de datos existente y la recrea usando migraciones de Alembic
"""

import os
import sys
import subprocess
from pathlib import Path

def print_status(message, status="INFO"):
    colors = {"INFO": "\033[94m", "SUCCESS": "\033[92m", "ERROR": "\033[91m", "WARNING": "\033[93m"}
    print(f"{colors.get(status, '')}{status}: {message}\033[0m")

def main():
    print_status("🗑️ Reseteando base de datos SmartPlanner", "INFO")
    print("=" * 60)
    
    # Cambiar al directorio del script
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    # Rutas de las bases de datos
    db_files = [
        "smartplanner.db",
        "system_intelligence.db"
    ]
    
    # 1. Borrar bases de datos existentes
    print_status("Eliminando bases de datos existentes...", "INFO")
    for db_file in db_files:
        db_path = script_dir / db_file
        if db_path.exists():
            try:
                db_path.unlink()
                print_status(f"✓ Eliminado: {db_file}", "SUCCESS")
            except Exception as e:
                print_status(f"Error eliminando {db_file}: {e}", "ERROR")
                return False
        else:
            print_status(f"No existe: {db_file}", "INFO")
    
    # 2. Borrar directorio de versiones de Alembic (para empezar limpio)
    alembic_versions_dir = script_dir / "alembic" / "versions"
    if alembic_versions_dir.exists():
        # Solo eliminar archivos .pyc, mantener las migraciones
        for pyc_file in alembic_versions_dir.glob("*.pyc"):
            pyc_file.unlink()
        for pycache_dir in alembic_versions_dir.glob("__pycache__"):
            import shutil
            shutil.rmtree(pycache_dir)
    
    # 3. Aplicar migraciones de Alembic
    print_status("Aplicando migraciones de Alembic...", "INFO")
    try:
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], capture_output=True, text=True, cwd=script_dir)
        
        if result.returncode != 0:
            print_status(f"Error en migraciones: {result.stderr}", "ERROR")
            return False
        
        print_status("✓ Migraciones aplicadas correctamente", "SUCCESS")
        
    except Exception as e:
        print_status(f"Error ejecutando migraciones: {e}", "ERROR")
        return False
    
    # 4. Verificar que las tablas se crearon
    print_status("Verificando estructura de base de datos...", "INFO")
    try:
        # Importar después de que la base de datos esté lista
        sys.path.append(str(script_dir))
        from app.core.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        required_tables = [
            'countries', 'organizations', 'users', 'clients', 'projects',
            'epics', 'user_stories', 'time_entries', 'tickets'
        ]
        
        missing_tables = [table for table in required_tables if table not in tables]
        
        if missing_tables:
            print_status(f"❌ Tablas faltantes: {missing_tables}", "ERROR")
            return False
        
        print_status(f"✓ Base de datos verificada: {len(tables)} tablas creadas", "SUCCESS")
        
        # Mostrar tablas creadas
        print("\nTablas creadas:")
        for table in sorted(tables):
            print(f"  - {table}")
        
    except Exception as e:
        print_status(f"Error verificando base de datos: {e}", "ERROR")
        return False
    
    print("\n" + "=" * 60)
    print_status("🎉 Base de datos reseteada exitosamente", "SUCCESS")
    print_status("Ahora puedes ejecutar 'python start_system.py' para inicializar datos", "INFO")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 