#!/usr/bin/env python3
"""
Script para iniciar todo el sistema SmartPlanner de manera coordinada
"""

import os
import sys
import time
import subprocess
import threading
import requests
import sqlite3
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Agregar el directorio app al path para importaciones
sys.path.append(str(Path(__file__).parent / "app"))

def print_status(message, status="INFO"):
    icons = {"INFO": "[INFO]", "SUCCESS": "[OK]", "ERROR": "[ERROR]", "WARNING": "[WARN]"}
    print(f"{icons.get(status, '[INFO]')} {message}")

def check_port(port, timeout=5):
    """Verificar si un puerto está disponible"""
    try:
        response = requests.get(f"http://localhost:{port}/", timeout=timeout)
        return True
    except:
        return False

def check_database_structure():
    """Verificar estructura de base de datos usando migraciones de Alembic"""
    print_status("Verificando estructura de base de datos...")
    
    try:
        # Usar la función actualizada
        return verify_and_fix_database()
        
    except Exception as e:
        print_status(f"Error verificando estructura: {str(e)}", "ERROR")
        return False

def initialize_data():
    """Inicializar datos de prueba"""
    print_status("Inicializando datos de prueba...")
    
    try:
        # Importar después de verificar la estructura
        from app.core.database import get_db
        from app.core.init_data import init_data
        
        # Obtener sesión de base de datos
        db_gen = get_db()
        db = next(db_gen)
        
        try:
            # Verificar si ya hay datos
            from app.models.organization_models import Organization
            org_count = db.query(Organization).count()
            
            if org_count == 0:
                print_status("No hay datos existentes, creando datos iniciales...", "INFO")
                init_data(db)
                print_status("Datos iniciales creados exitosamente", "SUCCESS")
            else:
                print_status(f"Base de datos ya contiene {org_count} organizaciones", "INFO")
                
                # Verificar datos específicos
                from app.models.project_models import Project
                from app.models.epic_models import Epic, UserStory
                from app.models.user_models import User
                
                project_count = db.query(Project).count()
                epic_count = db.query(Epic).count()
                story_count = db.query(UserStory).count()
                user_count = db.query(User).count()
                
                print_status(f"Datos existentes: {user_count} usuarios, {project_count} proyectos, {epic_count} épicas, {story_count} historias", "INFO")
                
                # Si hay pocos datos, agregar más
                if project_count < 5 or epic_count < 10 or story_count < 20:
                    print_status("Agregando más datos de prueba...", "INFO")
                    init_data(db)
                    print_status("Datos adicionales agregados", "SUCCESS")
                    
        finally:
            db.close()
            
        return True
        
    except Exception as e:
        print_status(f"Error inicializando datos: {str(e)}", "ERROR")
        return False

def verify_endpoints():
    """Verificar que los endpoints principales funcionen"""
    print_status("Verificando endpoints del API...")
    
    endpoints_to_check = [
        ("/", "Endpoint raíz"),
        ("/projects/", "Proyectos"),
        ("/epics/", "Épicas"),
        ("/users/", "Usuarios"),
        ("/organizations/", "Organizaciones"),
        ("/clients/", "Clientes")
    ]
    
    base_url = "http://localhost:8001"
    
    for endpoint, description in endpoints_to_check:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code in [200, 401]:  # 401 es esperado sin autenticación
                print_status(f"✓ {description}: OK", "SUCCESS")
            else:
                print_status(f"✗ {description}: HTTP {response.status_code}", "WARNING")
        except Exception as e:
            print_status(f"✗ {description}: Error - {str(e)}", "ERROR")

def verify_and_fix_database():
    """
    Verificar y corregir la estructura de la base de datos usando migraciones de Alembic
    """
    print_status("Verificando estructura de base de datos con Alembic...", "INFO")
    
    try:
        # Verificar si existe alembic.ini
        alembic_ini = Path(__file__).parent / "alembic.ini"
        if not alembic_ini.exists():
            print_status("Archivo alembic.ini no encontrado", "ERROR")
            return False
        
        # Ejecutar migraciones de Alembic
        print_status("Aplicando migraciones de Alembic...", "INFO")
        result = subprocess.run([
            sys.executable, "-m", "alembic", "upgrade", "head"
        ], cwd=Path(__file__).parent, capture_output=True, text=True)
        
        if result.returncode != 0:
            print_status(f"Error en migraciones de Alembic: {result.stderr}", "ERROR")
            return False
        
        print_status("Migraciones aplicadas correctamente", "SUCCESS")
        
        # Verificar estructura de base de datos
        from app.core.database import engine
        from sqlalchemy import inspect
        
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        # Tablas requeridas
        required_tables = [
            'countries', 'organizations', 'users', 'clients', 'projects',
            'epics', 'user_stories', 'time_entries', 'tickets'
        ]
        
        missing_tables = [table for table in required_tables if table not in tables]
        
        if missing_tables:
            print_status(f"Tablas faltantes: {missing_tables}", "ERROR")
            return False
        
        print_status(f"Base de datos verificada: {len(tables)} tablas encontradas", "SUCCESS")
        return True
        
    except Exception as e:
        print_status(f"Error verificando base de datos: {str(e)}", "ERROR")
        return False

def start_backend():
    """Iniciar el servidor backend FastAPI"""
    print_status("Iniciando servidor backend...")
    
    # Verificar y corregir base de datos primero
    if not verify_and_fix_database():
        print_status("No se puede iniciar el backend sin una base de datos válida", "ERROR")
        return None
    
    backend_dir = Path(__file__).parent
    
    try:
        # Cambiar al directorio backend
        os.chdir(backend_dir)
        
        # Comando para iniciar uvicorn
        cmd = [
            sys.executable, "-m", "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8001",
            "--reload"
        ]
        
        print_status(f"Ejecutando: {' '.join(cmd)}")
        
        # Iniciar el proceso
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Esperar a que el servidor esté listo
        print_status("Esperando que el servidor esté listo...")
        
        for i in range(30):  # Esperar hasta 30 segundos
            if process.poll() is not None:
                # El proceso terminó
                output = process.stdout.read()
                print_status(f"El servidor terminó inesperadamente: {output}", "ERROR")
                return None
            
            if check_port(8001):
                print_status("Servidor backend iniciado correctamente", "SUCCESS")
                return process
            
            time.sleep(1)
        
        print_status("Timeout esperando que el servidor esté listo", "ERROR")
        process.terminate()
        return None
        
    except Exception as e:
        print_status(f"Error iniciando backend: {e}", "ERROR")
        return None

def start_automation():
    """Iniciar el sistema de automatización"""
    print_status("Iniciando sistema de automatización...")
    try:
        backend_dir = Path(__file__).parent
        os.chdir(backend_dir)
        
        # Verificar si los archivos de automatización existen
        automation_files = ["system_manager_advanced.py", "auto_scheduler.py"]
        for file in automation_files:
            if not Path(file).exists():
                print_status(f"Archivo de automatización {file} no encontrado", "WARNING")
                return None
        
        # Ejecutar análisis inteligente
        try:
            subprocess.run([sys.executable, "system_manager_advanced.py", "intelligent"], 
                         check=True, timeout=30)
        except subprocess.TimeoutExpired:
            print_status("Análisis inteligente tomó demasiado tiempo, continuando...", "WARNING")
        except Exception as e:
            print_status(f"Error en análisis inteligente: {str(e)}", "WARNING")
        
        # Iniciar programador automático en background
        cmd = [sys.executable, "auto_scheduler.py", "--start"]
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        print_status("Sistema de automatización iniciado", "SUCCESS")
        return process
        
    except Exception as e:
        print_status(f"Error al iniciar automatización: {str(e)}", "ERROR")
        return None

def show_system_info():
    """Mostrar información del sistema"""
    print("\n" + "=" * 60)
    print_status("🎉 Sistema SmartPlanner iniciado exitosamente!", "SUCCESS")
    print("\n📋 Servicios activos:")
    
    if check_port(8001):
        print("   🔗 Backend API: http://localhost:8001")
        print("   📚 Documentación: http://localhost:8001/docs")
        print("   🔍 Redoc: http://localhost:8001/redoc")
    
    # Verificar si el frontend está ejecutándose manualmente
    if check_port(3000):
        print("   🌐 Frontend: http://localhost:3000 (ejecutándose manualmente)")
    else:
        print("   🌐 Frontend: Ejecutar manualmente con 'npm run dev' en /frontend/SmartPlanner")
    
    print("\n🔑 Credenciales de acceso:")
    print("   👤 Usuario: admin")
    print("   🔒 Contraseña: admin123")
    print("   📧 Email: admin@smartplanner.com")
    
    print("\n⚡ Sistema inteligente:")
    print("   🤖 IA activada con análisis predictivo")
    print("   🔄 Tareas automatizadas ejecutándose")
    print("   📊 Monitoreo continuo del sistema")
    print("   🗄️ Base de datos SQLite inicializada")
    
    print("\n💡 Para iniciar el frontend:")
    print("   1. Abrir nueva terminal")
    print("   2. cd frontend/SmartPlanner")
    print("   3. npm install (si es la primera vez)")
    print("   4. npm run dev")
    
    print("\n🔧 Comandos útiles:")
    print("   📊 Ver logs: tail -f logs/*.log")
    print("   🗄️ Verificar DB: sqlite3 smartplanner.db '.tables'")
    print("   🔄 Reiniciar: Ctrl+C y ejecutar de nuevo")

def main():
    print_status("🚀 Preparando SmartPlanner v2.0 con Sistema Inteligente")
    print("=" * 60)
    
    try:
        # 1. Verificar y preparar base de datos
        print_status("Verificando estructura de base de datos...", "INFO")
        if not verify_and_fix_database():
            print_status("Error preparando base de datos, abortando...", "ERROR")
            return
        
        # 2. Inicializar datos
        print_status("Inicializando datos del sistema...", "INFO")
        if not initialize_data():
            print_status("Error inicializando datos, abortando...", "ERROR")
            return
        
        # 3. Mostrar información del sistema
        print("\n" + "=" * 60)
        print_status("🎉 Sistema SmartPlanner preparado exitosamente!", "SUCCESS")
        print("\n📋 Sistema listo para usar:")
        
        print("\n🗄️ Base de datos:")
        print("   ✅ Estructura verificada y corregida")
        print("   ✅ Datos iniciales cargados")
        print("   📍 Ubicación: smartplanner.db")
        
        print("\n🔑 Credenciales de acceso:")
        print("   👤 Usuario: admin")
        print("   🔒 Contraseña: admin123")
        print("   📧 Email: admin@smartplanner.com")
        
        print("\n🚀 Para iniciar el sistema:")
        print("   1. Backend: uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload")
        print("   2. Frontend: cd frontend/SmartPlanner && npm run dev")
        
        print("\n🔗 URLs del sistema:")
        print("   🌐 Frontend: http://localhost:3000")
        print("   🔗 Backend API: http://localhost:8001")
        print("   📚 Documentación: http://localhost:8001/docs")
        print("   🔍 Redoc: http://localhost:8001/redoc")
        
        print("\n⚡ Características del sistema:")
        print("   🤖 IA activada con análisis predictivo")
        print("   📊 Estados de épicas corregidos (backlog incluido)")
        print("   🔄 Datos de prueba completos")
        print("   🗄️ Base de datos SQLite optimizada")
        
        print("\n🔧 Comandos útiles:")
        print("   📊 Verificar DB: sqlite3 smartplanner.db '.tables'")
        print("   🔍 Ver datos: sqlite3 smartplanner.db 'SELECT * FROM epics LIMIT 5;'")
        print("   🔄 Recrear datos: python app/core/init_data.py")
        
        print("\n" + "=" * 60)
        print_status("Sistema preparado. Inicia el backend manualmente cuando estés listo.", "SUCCESS")
        
    except Exception as e:
        print_status(f"Error crítico: {str(e)}", "ERROR")
        sys.exit(1)

if __name__ == "__main__":
    main() 