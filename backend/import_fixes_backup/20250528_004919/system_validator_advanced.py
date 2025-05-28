#!/usr/bin/env python3
"""
VERIFICADOR INTEGRAL DEL SISTEMA SMARTPLANNER
============================================

Este script realiza una validación exhaustiva y proactiva de toda la aplicación,
detectando errores, incongruencias, anormalidades y archivos obsoletos.

Funcionalidades:
- Validación de estructura de base de datos
- Verificación de alineación entre modelos, schemas, CRUD y routers
- Detección de archivos obsoletos y no utilizados
- Análisis de dependencias y referencias cruzadas
- Validación de configuraciones y constantes
- Detección de código muerto y funciones no utilizadas
- Verificación de integridad de datos
- Análisis de rendimiento y optimización
"""

import os
import sys
import ast
import re
import json
import sqlite3
import importlib.util
from pathlib import Path
from typing import Dict, List, Set, Tuple, Any, Optional
from collections import defaultdict, Counter
import subprocess
import time

# Colores para output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

class SystemValidator:
    def __init__(self):
        self.project_root = Path(__file__).parent
        self.backend_root = self.project_root
        self.frontend_root = self.project_root / "frontend" / "SmartPlanner"
        
        # Contadores de problemas
        self.errors = []
        self.warnings = []
        self.info = []
        self.obsolete_files = []
        
        # Mapas de referencias
        self.file_references = defaultdict(set)
        self.function_references = defaultdict(set)
        self.class_references = defaultdict(set)
        self.import_references = defaultdict(set)
        
        # Archivos analizados
        self.analyzed_files = set()
        self.python_files = set()
        self.js_files = set()
        
        print(f"{Colors.BOLD}{Colors.CYAN}🔍 VERIFICADOR INTEGRAL DEL SISTEMA SMARTPLANNER{Colors.END}")
        print(f"{Colors.CYAN}{'='*60}{Colors.END}\n")

    def log_error(self, message: str, file_path: str = None):
        """Registrar un error crítico"""
        self.errors.append({"message": message, "file": file_path})
        icon = "❌"
        print(f"{Colors.RED}{icon} ERROR: {message}{Colors.END}")
        if file_path:
            print(f"   📁 Archivo: {file_path}")

    def log_warning(self, message: str, file_path: str = None):
        """Registrar una advertencia"""
        self.warnings.append({"message": message, "file": file_path})
        icon = "⚠️"
        print(f"{Colors.YELLOW}{icon} ADVERTENCIA: {message}{Colors.END}")
        if file_path:
            print(f"   📁 Archivo: {file_path}")

    def log_info(self, message: str, file_path: str = None):
        """Registrar información"""
        self.info.append({"message": message, "file": file_path})
        icon = "ℹ️"
        print(f"{Colors.BLUE}{icon} INFO: {message}{Colors.END}")
        if file_path:
            print(f"   📁 Archivo: {file_path}")

    def log_obsolete(self, file_path: str, reason: str):
        """Registrar archivo obsoleto"""
        self.obsolete_files.append({"file": file_path, "reason": reason})
        icon = "🗑️"
        print(f"{Colors.MAGENTA}{icon} OBSOLETO: {file_path}{Colors.END}")
        print(f"   💭 Razón: {reason}")

    def scan_all_files(self):
        """Escanear todos los archivos del proyecto"""
        print(f"{Colors.BOLD}📂 Escaneando archivos del proyecto...{Colors.END}")
        
        # Escanear backend
        for file_path in self.backend_root.rglob("*.py"):
            if not any(skip in str(file_path) for skip in ["__pycache__", ".git", "venv", "env"]):
                self.python_files.add(file_path)
                self.analyzed_files.add(file_path)
        
        # Escanear frontend
        if self.frontend_root.exists():
            for file_path in self.frontend_root.rglob("*.js"):
                if not any(skip in str(file_path) for skip in ["node_modules", ".git", "dist", "build"]):
                    self.js_files.add(file_path)
                    self.analyzed_files.add(file_path)
            
            for file_path in self.frontend_root.rglob("*.jsx"):
                if not any(skip in str(file_path) for skip in ["node_modules", ".git", "dist", "build"]):
                    self.js_files.add(file_path)
                    self.analyzed_files.add(file_path)
        
        print(f"   ✅ Encontrados {len(self.python_files)} archivos Python")
        print(f"   ✅ Encontrados {len(self.js_files)} archivos JavaScript/JSX")

    def analyze_python_imports_and_references(self):
        """Analizar imports y referencias en archivos Python"""
        print(f"\n{Colors.BOLD}🔗 Analizando imports y referencias Python...{Colors.END}")
        
        for file_path in self.python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Parsear AST
                try:
                    tree = ast.parse(content)
                except SyntaxError as e:
                    self.log_error(f"Error de sintaxis en Python: {e}", str(file_path))
                    continue
                
                # Analizar imports
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            self.import_references[alias.name].add(str(file_path))
                    
                    elif isinstance(node, ast.ImportFrom):
                        if node.module:
                            self.import_references[node.module].add(str(file_path))
                            for alias in node.names:
                                self.import_references[f"{node.module}.{alias.name}"].add(str(file_path))
                    
                    elif isinstance(node, ast.FunctionDef):
                        self.function_references[node.name].add(str(file_path))
                    
                    elif isinstance(node, ast.ClassDef):
                        self.class_references[node.name].add(str(file_path))
                
                # Buscar referencias a archivos locales
                local_imports = re.findall(r'from\s+(?:app\.)?(\w+(?:\.\w+)*)\s+import', content)
                for imp in local_imports:
                    potential_file = self.backend_root / f"app/{imp.replace('.', '/')}.py"
                    if potential_file.exists():
                        self.file_references[str(potential_file)].add(str(file_path))
                
            except Exception as e:
                self.log_warning(f"Error analizando archivo Python: {e}", str(file_path))

    def analyze_js_imports_and_references(self):
        """Analizar imports y referencias en archivos JavaScript/JSX"""
        print(f"\n{Colors.BOLD}🔗 Analizando imports y referencias JavaScript/JSX...{Colors.END}")
        
        for file_path in self.js_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar imports ES6
                import_patterns = [
                    r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]',
                    r'import\s+[\'"]([^\'"]+)[\'"]',
                    r'require\([\'"]([^\'"]+)[\'"]\)'
                ]
                
                for pattern in import_patterns:
                    imports = re.findall(pattern, content)
                    for imp in imports:
                        # Resolver rutas relativas
                        if imp.startswith('./') or imp.startswith('../'):
                            try:
                                resolved_path = (file_path.parent / imp).resolve()
                                # Buscar con extensiones comunes
                                for ext in ['.js', '.jsx', '.ts', '.tsx']:
                                    if (resolved_path.parent / f"{resolved_path.name}{ext}").exists():
                                        target_file = resolved_path.parent / f"{resolved_path.name}{ext}"
                                        self.file_references[str(target_file)].add(str(file_path))
                                        break
                            except:
                                pass
                        
                        self.import_references[imp].add(str(file_path))
                
                # Buscar referencias a componentes
                component_refs = re.findall(r'<(\w+)', content)
                for comp in component_refs:
                    self.class_references[comp].add(str(file_path))
                
            except Exception as e:
                self.log_warning(f"Error analizando archivo JS/JSX: {e}", str(file_path))

    def verify_database_structure(self):
        """Verificar estructura de base de datos"""
        print(f"\n{Colors.BOLD}🗄️ Verificando estructura de base de datos...{Colors.END}")
        
        # Verificar archivo de migración principal
        migration_file = self.backend_root / "alembic" / "versions" / "v1_0_0_initial_schema.py"
        if not migration_file.exists():
            self.log_error("Archivo de migración principal no encontrado", str(migration_file))
            return
        
        try:
            with open(migration_file, 'r', encoding='utf-8') as f:
                migration_content = f.read()
            
            # Verificar tablas esperadas (corregir patrón de búsqueda)
            expected_tables = [
                'countries', 'organizations', 'users', 'clients', 'projects', 
                'epics', 'user_stories', 'time_entries', 'tickets'
            ]
            
            for table in expected_tables:
                # Buscar patrón correcto: op.create_table('tabla'
                if f"op.create_table(\n        '{table}'" in migration_content or f"'{table}'" in migration_content:
                    self.log_info(f"Tabla '{table}' encontrada en migración")
                else:
                    self.log_error(f"Tabla '{table}' no encontrada en migración", str(migration_file))
            
            # Verificar campos críticos
            critical_fields = {
                'users': ['specialization', 'sub_specializations'],
                'user_stories': ['estimated_hours', 'assigned_user_id'],
                'time_entries': ['entry_date', 'user_story_id'],
                'projects': ['estimated_hours']
            }
            
            for table, fields in critical_fields.items():
                for field in fields:
                    if field in migration_content:
                        self.log_info(f"Campo crítico '{field}' encontrado en tabla '{table}'")
                    else:
                        self.log_warning(f"Campo crítico '{field}' no encontrado en tabla '{table}'")
        
        except Exception as e:
            self.log_error(f"Error verificando migración: {e}", str(migration_file))

    def verify_model_schema_alignment(self):
        """Verificar alineación entre modelos y schemas"""
        print(f"\n{Colors.BOLD}🔄 Verificando alineación modelos-schemas...{Colors.END}")
        
        models_dir = self.backend_root / "app" / "models"
        schemas_dir = self.backend_root / "app" / "schemas"
        
        if not models_dir.exists() or not schemas_dir.exists():
            self.log_error("Directorios de modelos o schemas no encontrados")
            return
        
        # Mapear modelos y schemas
        model_files = {f.stem: f for f in models_dir.glob("*_models.py")}
        schema_files = {f.stem.replace("_schema", ""): f for f in schemas_dir.glob("*_schema.py")}
        
        # Verificar correspondencia
        for model_name in model_files:
            base_name = model_name.replace("_models", "")
            if base_name not in schema_files:
                self.log_warning(f"Modelo '{model_name}' no tiene schema correspondiente")
            else:
                self.log_info(f"Modelo-Schema alineados: {base_name}")
        
        for schema_name in schema_files:
            if f"{schema_name}_models" not in model_files:
                self.log_warning(f"Schema '{schema_name}' no tiene modelo correspondiente")

    def verify_crud_router_alignment(self):
        """Verificar alineación entre CRUD y routers"""
        print(f"\n{Colors.BOLD}🔄 Verificando alineación CRUD-Routers...{Colors.END}")
        
        crud_dir = self.backend_root / "app" / "crud"
        routers_dir = self.backend_root / "app" / "routers"
        
        if not crud_dir.exists() or not routers_dir.exists():
            self.log_error("Directorios de CRUD o routers no encontrados")
            return
        
        # Mapear CRUD y routers
        crud_files = {f.stem: f for f in crud_dir.glob("*_crud.py")}
        router_files = {f.stem.replace("_router", ""): f for f in routers_dir.glob("*_router.py")}
        
        # Verificar correspondencia
        for crud_name in crud_files:
            base_name = crud_name.replace("_crud", "")
            if base_name not in router_files:
                self.log_warning(f"CRUD '{crud_name}' no tiene router correspondiente")
            else:
                self.log_info(f"CRUD-Router alineados: {base_name}")

    def detect_unused_imports(self):
        """Detectar imports no utilizados"""
        print(f"\n{Colors.BOLD}🔍 Detectando imports no utilizados...{Colors.END}")
        
        for file_path in self.python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar imports
                import_lines = []
                for i, line in enumerate(content.split('\n')):
                    if line.strip().startswith(('import ', 'from ')):
                        import_lines.append((i + 1, line.strip()))
                
                # Verificar uso de cada import
                for line_num, import_line in import_lines:
                    # Extraer nombre del import
                    if import_line.startswith('from '):
                        match = re.search(r'import\s+(.+)', import_line)
                        if match:
                            imported_items = [item.strip() for item in match.group(1).split(',')]
                            for item in imported_items:
                                # Limpiar alias
                                clean_item = item.split(' as ')[0].strip()
                                if clean_item not in content.replace(import_line, ''):
                                    self.log_warning(f"Import no utilizado '{clean_item}' en línea {line_num}", str(file_path))
                    
                    elif import_line.startswith('import '):
                        match = re.search(r'import\s+(.+)', import_line)
                        if match:
                            module_name = match.group(1).split(' as ')[0].strip()
                            if module_name not in content.replace(import_line, ''):
                                self.log_warning(f"Import no utilizado '{module_name}' en línea {line_num}", str(file_path))
            
            except Exception as e:
                self.log_warning(f"Error detectando imports no utilizados: {e}", str(file_path))

    def detect_dead_code(self):
        """Detectar código muerto (funciones/clases no utilizadas)"""
        print(f"\n{Colors.BOLD}💀 Detectando código muerto...{Colors.END}")
        
        # Funciones definidas vs utilizadas
        defined_functions = defaultdict(list)
        used_functions = defaultdict(int)
        
        for file_path in self.python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar definiciones de funciones
                function_defs = re.findall(r'def\s+(\w+)\s*\(', content)
                for func in function_defs:
                    defined_functions[func].append(str(file_path))
                
                # Buscar usos de funciones
                for func_name in defined_functions.keys():
                    # Contar referencias (excluyendo la definición)
                    pattern = rf'\b{func_name}\s*\('
                    matches = re.findall(pattern, content)
                    # Restar 1 por la definición
                    used_functions[func_name] += max(0, len(matches) - 1)
            
            except Exception as e:
                self.log_warning(f"Error detectando código muerto: {e}", str(file_path))
        
        # Reportar funciones no utilizadas
        for func_name, files in defined_functions.items():
            if used_functions[func_name] == 0:
                # Excluir funciones especiales y endpoints
                if not func_name.startswith('_') and func_name not in ['main', 'upgrade', 'downgrade']:
                    self.log_warning(f"Función posiblemente no utilizada: '{func_name}'", files[0])

    def detect_obsolete_files(self):
        """Detectar archivos obsoletos"""
        print(f"\n{Colors.BOLD}🗑️ Detectando archivos obsoletos...{Colors.END}")
        
        # Archivos que no son referenciados por ningún otro
        unreferenced_files = set()
        
        for file_path in self.analyzed_files:
            if str(file_path) not in self.file_references:
                # Excluir archivos especiales
                if not any(special in str(file_path) for special in [
                    '__init__.py', 'main.py', 'App.jsx', 'index.js', 'manage.py',
                    'alembic.ini', 'requirements.txt', 'package.json'
                ]):
                    unreferenced_files.add(file_path)
        
        # Verificar si realmente están obsoletos
        for file_path in unreferenced_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Verificar si es un archivo de configuración o script independiente
                if any(indicator in content.lower() for indicator in [
                    'if __name__ == "__main__"',
                    'fastapi',
                    'router',
                    'export default',
                    'module.exports'
                ]):
                    continue  # Probablemente es un punto de entrada
                
                # Verificar tamaño del archivo
                if len(content.strip()) < 50:
                    self.log_obsolete(str(file_path), "Archivo muy pequeño y sin referencias")
                elif 'TODO' in content or 'FIXME' in content:
                    self.log_warning(f"Archivo con TODOs/FIXMEs sin referencias", str(file_path))
                else:
                    self.log_obsolete(str(file_path), "Sin referencias de otros archivos")
            
            except Exception as e:
                self.log_warning(f"Error verificando archivo obsoleto: {e}", str(file_path))

    def verify_configuration_consistency(self):
        """Verificar consistencia de configuraciones"""
        print(f"\n{Colors.BOLD}⚙️ Verificando consistencia de configuraciones...{Colors.END}")
        
        # Verificar configuraciones del backend
        config_files = [
            self.backend_root / "app" / "core" / "config.py",
            self.backend_root / "alembic.ini",
            self.backend_root / "requirements.txt"
        ]
        
        for config_file in config_files:
            if not config_file.exists():
                self.log_warning(f"Archivo de configuración faltante", str(config_file))
            else:
                self.log_info(f"Archivo de configuración encontrado", str(config_file))
        
        # Verificar configuraciones del frontend
        if self.frontend_root.exists():
            frontend_configs = [
                self.frontend_root / "package.json",
                self.frontend_root / "vite.config.js",
                self.frontend_root / "tailwind.config.js"
            ]
            
            for config_file in frontend_configs:
                if not config_file.exists():
                    self.log_warning(f"Archivo de configuración frontend faltante", str(config_file))
                else:
                    self.log_info(f"Archivo de configuración frontend encontrado", str(config_file))

    def verify_data_consistency(self):
        """Verificar consistencia de datos de inicialización"""
        print(f"\n{Colors.BOLD}📊 Verificando consistencia de datos...{Colors.END}")
        
        init_data_file = self.backend_root / "app" / "core" / "init_data.py"
        if not init_data_file.exists():
            self.log_error("Archivo de datos de inicialización no encontrado", str(init_data_file))
            return
        
        try:
            with open(init_data_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Verificar funciones de inicialización esperadas
            expected_init_functions = [
                'init_countries', 'init_organizations', 'init_users', 
                'init_clients', 'init_projects', 'init_epics_and_stories',
                'init_tickets', 'init_time_entries'
            ]
            
            for func in expected_init_functions:
                if f"def {func}" in content:
                    self.log_info(f"Función de inicialización encontrada: {func}")
                else:
                    self.log_warning(f"Función de inicialización faltante: {func}")
            
            # Verificar que se eviten duplicaciones
            if "existing_" in content and "filter" in content:
                self.log_info("Sistema de prevención de duplicaciones detectado")
            else:
                self.log_warning("Sistema de prevención de duplicaciones no detectado")
        
        except Exception as e:
            self.log_error(f"Error verificando datos de inicialización: {e}", str(init_data_file))

    def analyze_performance_issues(self):
        """Analizar posibles problemas de rendimiento"""
        print(f"\n{Colors.BOLD}⚡ Analizando problemas de rendimiento...{Colors.END}")
        
        performance_issues = []
        
        for file_path in self.python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Buscar consultas N+1
                if "for " in content and ".query(" in content:
                    if content.count(".query(") > 3:
                        self.log_warning(f"Posible problema N+1 detectado (múltiples queries)", str(file_path))
                
                # Buscar falta de paginación
                if ".all()" in content and "limit" not in content:
                    self.log_warning(f"Query sin paginación detectada", str(file_path))
                
                # Buscar imports pesados en bucles
                if "import " in content and "for " in content:
                    lines = content.split('\n')
                    in_loop = False
                    for line in lines:
                        if "for " in line or "while " in line:
                            in_loop = True
                        elif line.strip() == "":
                            in_loop = False
                        elif in_loop and "import " in line:
                            self.log_warning(f"Import dentro de bucle detectado", str(file_path))
            
            except Exception as e:
                self.log_warning(f"Error analizando rendimiento: {e}", str(file_path))

    def verify_security_issues(self):
        """Verificar posibles problemas de seguridad"""
        print(f"\n{Colors.BOLD}🔒 Verificando problemas de seguridad...{Colors.END}")
        
        security_patterns = {
            r'password\s*=\s*["\'][^"\']+["\']': "Contraseña hardcodeada",
            r'secret\s*=\s*["\'][^"\']+["\']': "Secret hardcodeado",
            r'api_key\s*=\s*["\'][^"\']+["\']': "API key hardcodeada",
            r'eval\s*\(': "Uso de eval() - riesgo de seguridad",
            r'exec\s*\(': "Uso de exec() - riesgo de seguridad",
            r'\.format\s*\([^)]*\{[^}]*\}': "Posible inyección en format()",
        }
        
        for file_path in self.python_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                for pattern, description in security_patterns.items():
                    if re.search(pattern, content, re.IGNORECASE):
                        self.log_warning(f"Problema de seguridad: {description}", str(file_path))
            
            except Exception as e:
                self.log_warning(f"Error verificando seguridad: {e}", str(file_path))

    def generate_comprehensive_report(self):
        """Generar reporte integral"""
        print(f"\n{Colors.BOLD}{Colors.CYAN}📋 REPORTE INTEGRAL DEL SISTEMA{Colors.END}")
        print(f"{Colors.CYAN}{'='*50}{Colors.END}")
        
        # Resumen ejecutivo
        total_issues = len(self.errors) + len(self.warnings)
        print(f"\n{Colors.BOLD}📊 RESUMEN EJECUTIVO:{Colors.END}")
        print(f"   🔴 Errores críticos: {Colors.RED}{len(self.errors)}{Colors.END}")
        print(f"   🟡 Advertencias: {Colors.YELLOW}{len(self.warnings)}{Colors.END}")
        print(f"   🔵 Información: {Colors.BLUE}{len(self.info)}{Colors.END}")
        print(f"   🗑️ Archivos obsoletos: {Colors.MAGENTA}{len(self.obsolete_files)}{Colors.END}")
        print(f"   📁 Archivos analizados: {len(self.analyzed_files)}")
        
        # Estado general del sistema
        if len(self.errors) == 0:
            if len(self.warnings) == 0:
                status = f"{Colors.GREEN}🟢 EXCELENTE{Colors.END}"
            elif len(self.warnings) < 5:
                status = f"{Colors.YELLOW}🟡 BUENO{Colors.END}"
            else:
                status = f"{Colors.YELLOW}🟠 REGULAR{Colors.END}"
        else:
            status = f"{Colors.RED}🔴 CRÍTICO{Colors.END}"
        
        print(f"\n{Colors.BOLD}🎯 ESTADO GENERAL: {status}{Colors.END}")
        
        # Detalles de errores críticos
        if self.errors:
            print(f"\n{Colors.BOLD}{Colors.RED}🚨 ERRORES CRÍTICOS QUE REQUIEREN ATENCIÓN INMEDIATA:{Colors.END}")
            for i, error in enumerate(self.errors, 1):
                print(f"   {i}. {error['message']}")
                if error['file']:
                    print(f"      📁 {error['file']}")
        
        # Top 10 advertencias más importantes
        if self.warnings:
            print(f"\n{Colors.BOLD}{Colors.YELLOW}⚠️ TOP 10 ADVERTENCIAS MÁS IMPORTANTES:{Colors.END}")
            for i, warning in enumerate(self.warnings[:10], 1):
                print(f"   {i}. {warning['message']}")
                if warning['file']:
                    print(f"      📁 {warning['file']}")
        
        # Archivos obsoletos
        if self.obsolete_files:
            print(f"\n{Colors.BOLD}{Colors.MAGENTA}🗑️ ARCHIVOS OBSOLETOS DETECTADOS:{Colors.END}")
            for i, obsolete in enumerate(self.obsolete_files, 1):
                print(f"   {i}. {obsolete['file']}")
                print(f"      💭 {obsolete['reason']}")
        
        # Recomendaciones
        print(f"\n{Colors.BOLD}{Colors.GREEN}💡 RECOMENDACIONES:{Colors.END}")
        
        if len(self.errors) > 0:
            print(f"   1. {Colors.RED}URGENTE:{Colors.END} Corregir errores críticos antes de continuar")
        
        if len(self.obsolete_files) > 5:
            print(f"   2. {Colors.MAGENTA}LIMPIEZA:{Colors.END} Eliminar archivos obsoletos para reducir complejidad")
        
        if len(self.warnings) > 10:
            print(f"   3. {Colors.YELLOW}REFACTORING:{Colors.END} Considerar refactorización para reducir advertencias")
        
        print(f"   4. {Colors.BLUE}MANTENIMIENTO:{Colors.END} Ejecutar este script regularmente")
        print(f"   5. {Colors.GREEN}DOCUMENTACIÓN:{Colors.END} Mantener documentación actualizada")
        
        # Guardar reporte detallado
        report_file = self.project_root / "system_validation_report.json"
        report_data = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "summary": {
                "errors": len(self.errors),
                "warnings": len(self.warnings),
                "info": len(self.info),
                "obsolete_files": len(self.obsolete_files),
                "analyzed_files": len(self.analyzed_files)
            },
            "errors": self.errors,
            "warnings": self.warnings,
            "info": self.info,
            "obsolete_files": self.obsolete_files
        }
        
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False)
            print(f"\n{Colors.GREEN}✅ Reporte detallado guardado en: {report_file}{Colors.END}")
        except Exception as e:
            print(f"\n{Colors.RED}❌ Error guardando reporte: {e}{Colors.END}")

    def run_full_validation(self):
        """Ejecutar validación completa"""
        start_time = time.time()
        
        print(f"{Colors.BOLD}🚀 Iniciando validación integral del sistema...{Colors.END}\n")
        
        # Fase 1: Escaneo de archivos
        self.scan_all_files()
        
        # Fase 2: Análisis de referencias
        self.analyze_python_imports_and_references()
        self.analyze_js_imports_and_references()
        
        # Fase 3: Validaciones estructurales
        self.verify_database_structure()
        self.verify_model_schema_alignment()
        self.verify_crud_router_alignment()
        
        # Fase 4: Detección de problemas
        self.detect_unused_imports()
        self.detect_dead_code()
        self.detect_obsolete_files()
        
        # Fase 5: Validaciones de calidad
        self.verify_configuration_consistency()
        self.verify_data_consistency()
        self.analyze_performance_issues()
        self.verify_security_issues()
        
        # Fase 6: Reporte final
        elapsed_time = time.time() - start_time
        print(f"\n{Colors.BOLD}⏱️ Validación completada en {elapsed_time:.2f} segundos{Colors.END}")
        
        self.generate_comprehensive_report()

def main():
    """Función principal"""
    try:
        validator = SystemValidator()
        validator.run_full_validation()
        
        # Código de salida basado en errores
        if validator.errors:
            sys.exit(1)  # Errores críticos encontrados
        elif len(validator.warnings) > 20:
            sys.exit(2)  # Demasiadas advertencias
        else:
            sys.exit(0)  # Todo bien
            
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}⚠️ Validación interrumpida por el usuario{Colors.END}")
        sys.exit(130)
    except Exception as e:
        print(f"\n{Colors.RED}❌ Error fatal durante la validación: {e}{Colors.END}")
        sys.exit(1)

if __name__ == "__main__":
    main() 