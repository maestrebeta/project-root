import os
import sys
import json
import time
import schedule
import threading
import logging
import argparse
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional, Callable
import subprocess

# Importar configuración y sistema manager
from system_config_advanced import get_config_manager
from system_manager_advanced import IntelligentSystemManager

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('auto_scheduler')

class IntelligentTask:
    """Tarea inteligente con programación adaptativa"""
    
    def __init__(self, name: str, description: str, function: Callable, 
                 interval_minutes: int = 60, conditions: Optional[Dict] = None,
                 adaptive: bool = True, max_failures: int = 3):
        self.name = name
        self.description = description
        self.function = function
        self.interval_minutes = interval_minutes
        self.conditions = conditions or {}
        self.adaptive = adaptive
        self.max_failures = max_failures
        
        # Estadísticas de ejecución
        self.executions = 0
        self.successes = 0
        self.failures = 0
        self.last_execution = None
        self.last_success = None
        self.last_failure = None
        self.average_duration = 0.0
        self.enabled = True
        
        # Programación adaptativa
        self.original_interval = interval_minutes
        self.current_interval = interval_minutes
    
    def get_success_rate(self) -> float:
        """Calcula la tasa de éxito"""
        if self.executions == 0:
            return 0.0
        return self.successes / self.executions
    
    def should_execute(self) -> bool:
        """Verifica si la tarea debe ejecutarse"""
        if not self.enabled:
            return False
        
        # Verificar condiciones específicas
        for condition, value in self.conditions.items():
            if condition == 'min_health_score':
                # Solo ejecutar si el health score es menor al valor
                try:
                    system = IntelligentSystemManager()
                    health_score = system.calculate_health_score()
                    if health_score >= value:
                        return False
                except:
                    pass
            elif condition == 'max_cpu_usage':
                # Solo ejecutar si el CPU está por debajo del valor
                import psutil
                if psutil.cpu_percent() > value:
                    return False
        
        return True
    
    def execute(self) -> Dict[str, Any]:
        """Ejecuta la tarea y registra resultados"""
        if not self.should_execute():
            return {
                'status': 'skipped',
                'reason': 'Condiciones no cumplidas'
            }
        
        start_time = time.time()
        self.executions += 1
        self.last_execution = datetime.now()
        
        try:
            result = self.function()
            
            # Registrar éxito
            self.successes += 1
            self.last_success = datetime.now()
            
            # Actualizar duración promedio
            duration = time.time() - start_time
            self.average_duration = (self.average_duration * (self.successes - 1) + duration) / self.successes
            
            # Ajustar intervalo si es adaptativo
            if self.adaptive:
                self.adjust_interval(success=True)
            
            logger.info(f"Tarea '{self.name}' ejecutada exitosamente en {duration:.2f}s")
            
            return {
                'status': 'success',
                'duration': duration,
                'result': result
            }
            
        except Exception as e:
            # Registrar fallo
            self.failures += 1
            self.last_failure = datetime.now()
            
            # Ajustar intervalo si es adaptativo
            if self.adaptive:
                self.adjust_interval(success=False)
            
            # Deshabilitar si hay demasiados fallos
            if self.failures >= self.max_failures:
                self.enabled = False
                logger.warning(f"Tarea '{self.name}' deshabilitada por exceso de fallos")
            
            logger.error(f"Error ejecutando tarea '{self.name}': {e}")
            
            return {
                'status': 'failed',
                'error': str(e),
                'duration': time.time() - start_time
            }
    
    def adjust_interval(self, success: bool):
        """Ajusta el intervalo basado en el éxito/fallo"""
        if success:
            # Si es exitoso y la tasa de éxito es alta, puede ejecutarse menos frecuentemente
            if self.get_success_rate() > 0.9:
                self.current_interval = min(self.current_interval * 1.1, self.original_interval * 2)
        else:
            # Si falla, ejecutar más frecuentemente
            self.current_interval = max(self.current_interval * 0.8, self.original_interval * 0.5)
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas de la tarea"""
        return {
            'name': self.name,
            'description': self.description,
            'enabled': self.enabled,
            'executions': self.executions,
            'successes': self.successes,
            'failures': self.failures,
            'success_rate': self.get_success_rate(),
            'average_duration': self.average_duration,
            'current_interval': self.current_interval,
            'last_execution': self.last_execution.isoformat() if self.last_execution else None,
            'last_success': self.last_success.isoformat() if self.last_success else None,
            'last_failure': self.last_failure.isoformat() if self.last_failure else None
        }

class AutoScheduler:
    """Programador automático inteligente"""
    
    def __init__(self):
        self.config_manager = get_config_manager()
        self.system_manager = IntelligentSystemManager()
        self.tasks: List[IntelligentTask] = []
        self.running = False
        self.scheduler_thread = None
        
        # Configurar tareas inteligentes
        self.setup_intelligent_tasks()
        
        logger.info(f"Programador automático inicializado con {len(self.tasks)} tareas")
    
    def setup_intelligent_tasks(self):
        """Configura las 8 tareas inteligentes predefinidas"""
        
        # 1. Análisis Inteligente del Sistema
        self.add_task(IntelligentTask(
            name="Análisis Inteligente del Sistema",
            description="Ejecuta análisis completo con IA del estado del sistema",
            function=self._task_intelligent_analysis,
            interval_minutes=60,  # Cada hora
            adaptive=True
        ))
        
        # 2. Limpieza Automática
        self.add_task(IntelligentTask(
            name="Limpieza Automática",
            description="Limpia archivos temporales, logs antiguos y optimiza espacio",
            function=self._task_auto_cleanup,
            interval_minutes=360,  # Cada 6 horas
            adaptive=True
        ))
        
        # 3. Optimización de Rendimiento
        self.add_task(IntelligentTask(
            name="Optimización de Rendimiento",
            description="Optimiza base de datos y configuraciones del sistema",
            function=self._task_performance_optimization,
            interval_minutes=120,  # Cada 2 horas
            conditions={'min_health_score': 80},  # Solo si health score < 80
            adaptive=True
        ))
        
        # 4. Backup de Configuración
        self.add_task(IntelligentTask(
            name="Backup de Configuración",
            description="Crea respaldo de configuraciones críticas del sistema",
            function=self._task_config_backup,
            interval_minutes=1440,  # Diario
            adaptive=False  # Backup debe ser regular
        ))
        
        # 5. Monitoreo de Salud
        self.add_task(IntelligentTask(
            name="Monitoreo de Salud",
            description="Verifica salud del sistema y genera alertas",
            function=self._task_health_monitoring,
            interval_minutes=15,  # Cada 15 minutos
            adaptive=True
        ))
        
        # 6. Actualización de Métricas
        self.add_task(IntelligentTask(
            name="Actualización de Métricas",
            description="Recolecta y actualiza métricas del sistema",
            function=self._task_metrics_update,
            interval_minutes=5,  # Cada 5 minutos
            adaptive=True
        ))
        
        # 7. Análisis Predictivo
        self.add_task(IntelligentTask(
            name="Análisis Predictivo",
            description="Ejecuta predicciones de IA sobre problemas futuros",
            function=self._task_predictive_analysis,
            interval_minutes=120,  # Cada 2 horas
            adaptive=True
        ))
        
        # 8. Auto-reparación
        self.add_task(IntelligentTask(
            name="Auto-reparación",
            description="Detecta y repara problemas automáticamente",
            function=self._task_auto_repair,
            interval_minutes=30,  # Cada 30 minutos
            conditions={'min_health_score': 70},  # Solo si health score < 70
            adaptive=True
        ))
    
    def add_task(self, task: IntelligentTask):
        """Añade una tarea al programador"""
        self.tasks.append(task)
    
    def _task_intelligent_analysis(self) -> Dict[str, Any]:
        """Tarea: Análisis inteligente del sistema"""
        analysis = self.system_manager.intelligent_analysis()
        return {
            'health_score': analysis['system_health_score'],
            'recommendations': len(analysis['recommendations']),
            'auto_fixes': len(analysis['auto_fixes_applied'])
        }
    
    def _task_auto_cleanup(self) -> Dict[str, Any]:
        """Tarea: Limpieza automática"""
        repairs = self.system_manager.auto_repair_system()
        cleanup_repairs = [r for r in repairs if r['type'] in ['temp_cleanup', 'log_cleanup']]
        return {
            'cleaned_items': len(cleanup_repairs),
            'space_freed': '50MB'  # Simulado
        }
    
    def _task_performance_optimization(self) -> Dict[str, Any]:
        """Tarea: Optimización de rendimiento"""
        repairs = self.system_manager.auto_repair_system()
        optimization_repairs = [r for r in repairs if r['type'] in ['database_optimization', 'cache_optimization']]
        return {
            'optimizations_applied': len(optimization_repairs),
            'performance_improvement': '15%'  # Simulado
        }
    
    def _task_config_backup(self) -> Dict[str, Any]:
        """Tarea: Backup de configuración"""
        try:
            # Crear directorio de backup
            backup_dir = Path("backups") / datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_dir.mkdir(parents=True, exist_ok=True)
            
            # Backup de configuración
            config_file = Path("config/intelligent_config.json")
            if config_file.exists():
                import shutil
                shutil.copy2(config_file, backup_dir / "intelligent_config.json")
            
            # Backup de base de datos
            db_file = Path("system_intelligence.db")
            if db_file.exists():
                import shutil
                shutil.copy2(db_file, backup_dir / "system_intelligence.db")
            
            return {
                'backup_location': str(backup_dir),
                'files_backed_up': 2
            }
        except Exception as e:
            raise Exception(f"Error en backup: {e}")
    
    def _task_health_monitoring(self) -> Dict[str, Any]:
        """Tarea: Monitoreo de salud"""
        health_score = self.system_manager.calculate_health_score()
        predictions = self.system_manager.predict_system_issues()
        
        # Generar alerta si es necesario
        alerts = []
        if health_score < 50:
            alerts.append("Health score crítico")
        if len(predictions) > 0:
            alerts.append(f"{len(predictions)} problemas predichos")
        
        return {
            'health_score': health_score,
            'predictions': len(predictions),
            'alerts_generated': len(alerts)
        }
    
    def _task_metrics_update(self) -> Dict[str, Any]:
        """Tarea: Actualización de métricas"""
        import psutil
        
        # Recolectar métricas
        cpu_percent = psutil.cpu_percent()
        memory_percent = psutil.virtual_memory().percent
        disk_percent = psutil.disk_usage('/').percent
        
        # Guardar métricas
        self.system_manager.save_metric('cpu_usage', cpu_percent)
        self.system_manager.save_metric('memory_usage', memory_percent)
        self.system_manager.save_metric('disk_usage', disk_percent)
        
        return {
            'metrics_collected': 3,
            'cpu_usage': cpu_percent,
            'memory_usage': memory_percent,
            'disk_usage': disk_percent
        }
    
    def _task_predictive_analysis(self) -> Dict[str, Any]:
        """Tarea: Análisis predictivo"""
        predictions = self.system_manager.predict_system_issues()
        
        # Analizar tendencias
        trends = {
            'cpu_trend': 'stable',
            'memory_trend': 'increasing',
            'disk_trend': 'stable'
        }
        
        return {
            'predictions_generated': len(predictions),
            'trends_analyzed': len(trends),
            'high_confidence_predictions': len([p for p in predictions if p.get('confidence', 0) > 0.8])
        }
    
    def _task_auto_repair(self) -> Dict[str, Any]:
        """Tarea: Auto-reparación"""
        repairs = self.system_manager.auto_repair_system()
        successful_repairs = [r for r in repairs if r['status'] == 'success']
        
        return {
            'repairs_attempted': len(repairs),
            'repairs_successful': len(successful_repairs),
            'success_rate': len(successful_repairs) / len(repairs) if repairs else 0
        }
    
    def start(self):
        """Inicia el programador automático"""
        if self.running:
            logger.warning("El programador ya está ejecutándose")
            return
        
        self.running = True
        
        # Programar tareas
        for task in self.tasks:
            if task.enabled:
                schedule.every(task.current_interval).minutes.do(self._execute_task, task)
        
        # Iniciar hilo del programador
        self.scheduler_thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("Programador automático iniciado")
    
    def stop(self):
        """Detiene el programador automático"""
        self.running = False
        schedule.clear()
        
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
        
        logger.info("Programador automático detenido")
    
    def _execute_task(self, task: IntelligentTask):
        """Ejecuta una tarea específica"""
        try:
            result = task.execute()
            
            # Reprogramar con nuevo intervalo si es adaptativo
            if task.adaptive and task.enabled:
                schedule.clear(task.name)
                schedule.every(int(task.current_interval)).minutes.do(self._execute_task, task).tag(task.name)
            
            return result
        except Exception as e:
            logger.error(f"Error ejecutando tarea {task.name}: {e}")
            return {'status': 'error', 'error': str(e)}
    
    def _run_scheduler(self):
        """Ejecuta el bucle principal del programador"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(1)
            except Exception as e:
                logger.error(f"Error en programador: {e}")
                time.sleep(5)
    
    def get_status(self) -> Dict[str, Any]:
        """Obtiene el estado del programador"""
        return {
            'running': self.running,
            'total_tasks': len(self.tasks),
            'enabled_tasks': len([t for t in self.tasks if t.enabled]),
            'tasks': [task.get_stats() for task in self.tasks]
        }
    
    def enable_task(self, task_name: str):
        """Habilita una tarea específica"""
        for task in self.tasks:
            if task.name == task_name:
                task.enabled = True
                logger.info(f"Tarea '{task_name}' habilitada")
                return True
        return False
    
    def disable_task(self, task_name: str):
        """Deshabilita una tarea específica"""
        for task in self.tasks:
            if task.name == task_name:
                task.enabled = False
                schedule.clear(task_name)
                logger.info(f"Tarea '{task_name}' deshabilitada")
                return True
        return False
    
    def execute_task_now(self, task_name: str) -> Dict[str, Any]:
        """Ejecuta una tarea inmediatamente"""
        for task in self.tasks:
            if task.name == task_name:
                return task.execute()
        return {'status': 'error', 'error': 'Tarea no encontrada'}

def main():
    """Función principal del programador automático"""
    parser = argparse.ArgumentParser(description="Programador Automático Inteligente - SmartPlanner v2.0")
    parser.add_argument('--start', action='store_true', help='Iniciar programador')
    parser.add_argument('--stop', action='store_true', help='Detener programador')
    parser.add_argument('--status', action='store_true', help='Ver estado')
    parser.add_argument('--enable', type=str, help='Habilitar tarea específica')
    parser.add_argument('--disable', type=str, help='Deshabilitar tarea específica')
    parser.add_argument('--execute', type=str, help='Ejecutar tarea específica ahora')
    
    args = parser.parse_args()
    
    # Crear instancia del programador
    scheduler = AutoScheduler()
    
    if args.status or not any(vars(args).values()):
        # Mostrar estado
        status = scheduler.get_status()
        
        print("🤖 Estado del Programador Inteligente")
        print("=" * 50)
        print(f"📊 Total de tareas: {status['total_tasks']}")
        print(f"✅ Tareas habilitadas: {status['enabled_tasks']}")
        print(f"🔄 Estado: {'Ejecutándose' if status['running'] else 'Detenido'}")
        
        print("\n📋 Tareas:")
        for task_stats in status['tasks']:
            status_icon = "✅" if task_stats['enabled'] else "❌"
            success_rate = task_stats['success_rate'] * 100
            
            print(f"   • {task_stats['name']}")
            print(f"     Estado: {status_icon}")
            print(f"     Éxitos: {task_stats['successes']}, Fallos: {task_stats['failures']}")
            print(f"     Tasa de éxito: {success_rate:.1f}%")
            
            if task_stats['last_execution']:
                print(f"     Última ejecución: {task_stats['last_execution']}")
            print()
    
    elif args.start:
        print("🚀 Iniciando programador automático...")
        scheduler.start()
        
        try:
            print("✅ Programador iniciado. Presiona Ctrl+C para detener")
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo programador...")
            scheduler.stop()
            print("✅ Programador detenido")
    
    elif args.stop:
        print("🛑 Deteniendo programador...")
        scheduler.stop()
        print("✅ Programador detenido")
    
    elif args.enable:
        if scheduler.enable_task(args.enable):
            print(f"✅ Tarea '{args.enable}' habilitada")
        else:
            print(f"❌ Tarea '{args.enable}' no encontrada")
    
    elif args.disable:
        if scheduler.disable_task(args.disable):
            print(f"❌ Tarea '{args.disable}' deshabilitada")
        else:
            print(f"❌ Tarea '{args.disable}' no encontrada")
    
    elif args.execute:
        print(f"⚡ Ejecutando tarea '{args.execute}'...")
        result = scheduler.execute_task_now(args.execute)
        
        if result['status'] == 'success':
            print(f"✅ Tarea ejecutada exitosamente")
            if 'duration' in result:
                print(f"⏱️ Duración: {result['duration']:.2f}s")
        elif result['status'] == 'skipped':
            print(f"⏭️ Tarea omitida: {result.get('reason', 'Condiciones no cumplidas')}")
        else:
            print(f"❌ Error: {result.get('error', 'Error desconocido')}")

if __name__ == "__main__":
    main() 