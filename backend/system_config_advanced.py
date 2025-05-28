import os
import json
import psutil
import platform
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('advanced_config')

class SystemConfigAdvanced:
    """Sistema de configuración avanzada con auto-detección de hardware"""
    
    def __init__(self):
        self.config_dir = Path("config")
        self.config_file = self.config_dir / "intelligent_config.json"
        self.config_dir.mkdir(exist_ok=True)
        
        # Detectar hardware automáticamente
        self.hardware_info = self._detect_hardware()
        self.performance_tier = self._classify_performance_tier()
        
        # Cargar o crear configuración
        self.config = self._load_or_create_config()
        
        logger.info(f"Sistema detectado: {self.performance_tier}, {self.hardware_info['cpu_cores']} cores, {self.hardware_info['memory_gb']:.1f}GB RAM")
    
    def _detect_hardware(self) -> Dict[str, Any]:
        """Detecta automáticamente las características del hardware"""
        try:
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                'cpu_cores': psutil.cpu_count(logical=True),
                'cpu_physical_cores': psutil.cpu_count(logical=False),
                'memory_total': memory.total,
                'memory_gb': memory.total / (1024**3),
                'memory_available': memory.available,
                'disk_total': disk.total,
                'disk_free': disk.free,
                'disk_gb': disk.total / (1024**3),
                'platform': platform.system(),
                'platform_version': platform.version(),
                'python_version': platform.python_version(),
                'architecture': platform.architecture()[0]
            }
        except Exception as e:
            logger.error(f"Error detectando hardware: {e}")
            return {
                'cpu_cores': 4,
                'memory_gb': 8.0,
                'platform': 'Unknown'
            }
    
    def _classify_performance_tier(self) -> str:
        """Clasifica el sistema en tiers de rendimiento"""
        cores = self.hardware_info.get('cpu_cores', 4)
        memory_gb = self.hardware_info.get('memory_gb', 8.0)
        
        if cores >= 12 and memory_gb >= 16:
            return "high"
        elif cores >= 8 and memory_gb >= 12:
            return "medium"
        elif cores >= 4 and memory_gb >= 8:
            return "low"
        else:
            return "minimal"
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Configuración por defecto basada en el tier de rendimiento"""
        base_config = {
            'system_info': {
                'tier': self.performance_tier,
                'hardware': self.hardware_info,
                'detected_at': datetime.now().isoformat()
            },
            'ai_enabled': True,
            'monitoring': {
                'enabled': True,
                'interval_seconds': 300,  # 5 minutos
                'health_check_interval': 900,  # 15 minutos
                'metrics_retention_days': 30
            },
            'automation': {
                'enabled': True,
                'auto_cleanup': True,
                'auto_optimization': True,
                'auto_repair': True,
                'predictive_maintenance': True
            },
            'performance': {
                'max_workers': min(self.hardware_info.get('cpu_cores', 4), 8),
                'memory_limit_mb': int(self.hardware_info.get('memory_gb', 8) * 1024 * 0.7),
                'cache_size_mb': int(self.hardware_info.get('memory_gb', 8) * 100),
                'batch_size': 100
            },
            'database': {
                'pool_size': 5,
                'max_overflow': 10,
                'pool_timeout': 30,
                'pool_recycle': 3600
            },
            'logging': {
                'level': 'INFO',
                'max_file_size_mb': 50,
                'backup_count': 5,
                'rotation_enabled': True
            }
        }
        
        # Ajustes específicos por tier
        tier_adjustments = {
            'high': {
                'performance': {
                    'max_workers': min(self.hardware_info.get('cpu_cores', 4), 16),
                    'batch_size': 500,
                    'cache_size_mb': int(self.hardware_info.get('memory_gb', 8) * 200)
                },
                'database': {
                    'pool_size': 20,
                    'max_overflow': 30
                },
                'monitoring': {
                    'interval_seconds': 60,  # Monitoreo más frecuente
                    'health_check_interval': 300
                }
            },
            'medium': {
                'performance': {
                    'max_workers': min(self.hardware_info.get('cpu_cores', 4), 12),
                    'batch_size': 250
                },
                'database': {
                    'pool_size': 10,
                    'max_overflow': 20
                }
            },
            'low': {
                'performance': {
                    'max_workers': min(self.hardware_info.get('cpu_cores', 4), 6),
                    'batch_size': 100
                },
                'monitoring': {
                    'interval_seconds': 600  # Monitoreo menos frecuente
                }
            },
            'minimal': {
                'performance': {
                    'max_workers': 2,
                    'batch_size': 50,
                    'cache_size_mb': 50
                },
                'database': {
                    'pool_size': 3,
                    'max_overflow': 5
                },
                'monitoring': {
                    'interval_seconds': 900,
                    'health_check_interval': 1800
                },
                'ai_enabled': False  # Deshabilitar IA en sistemas mínimos
            }
        }
        
        # Aplicar ajustes del tier
        if self.performance_tier in tier_adjustments:
            self._deep_update(base_config, tier_adjustments[self.performance_tier])
        
        return base_config
    
    def _deep_update(self, base_dict: dict, update_dict: dict):
        """Actualiza recursivamente un diccionario"""
        for key, value in update_dict.items():
            if key in base_dict and isinstance(base_dict[key], dict) and isinstance(value, dict):
                self._deep_update(base_dict[key], value)
            else:
                base_dict[key] = value
    
    def _load_or_create_config(self) -> Dict[str, Any]:
        """Carga configuración existente o crea una nueva"""
        if self.config_file.exists():
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    
                # Actualizar información del sistema
                config['system_info'] = {
                    'tier': self.performance_tier,
                    'hardware': self.hardware_info,
                    'detected_at': datetime.now().isoformat(),
                    'last_updated': datetime.now().isoformat()
                }
                
                logger.info("Configuración inteligente cargada desde archivo")
                return config
            except Exception as e:
                logger.error(f"Error cargando configuración: {e}")
        
        # Crear nueva configuración
        config = self._get_default_config()
        self.save_config(config)
        logger.info("Nueva configuración inteligente creada")
        return config
    
    def save_config(self, config: Optional[Dict[str, Any]] = None):
        """Guarda la configuración actual"""
        if config is None:
            config = self.config
        
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            logger.info("Configuración guardada exitosamente")
        except Exception as e:
            logger.error(f"Error guardando configuración: {e}")
    
    def get_config(self, section: Optional[str] = None) -> Any:
        """Obtiene configuración completa o de una sección específica"""
        if section:
            return self.config.get(section, {})
        return self.config
    
    def update_config(self, section: str, updates: Dict[str, Any]):
        """Actualiza una sección de la configuración"""
        if section not in self.config:
            self.config[section] = {}
        
        self._deep_update(self.config[section], updates)
        self.save_config()
        logger.info(f"Configuración actualizada: {section}")
    
    def is_ai_enabled(self) -> bool:
        """Verifica si la IA está habilitada"""
        return self.config.get('ai_enabled', True)
    
    def get_performance_settings(self) -> Dict[str, Any]:
        """Obtiene configuraciones de rendimiento"""
        return self.config.get('performance', {})
    
    def get_monitoring_settings(self) -> Dict[str, Any]:
        """Obtiene configuraciones de monitoreo"""
        return self.config.get('monitoring', {})
    
    def get_automation_settings(self) -> Dict[str, Any]:
        """Obtiene configuraciones de automatización"""
        return self.config.get('automation', {})
    
    def validate_environment(self) -> Dict[str, Any]:
        """Valida el entorno del sistema"""
        validation_results = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'recommendations': []
        }
        
        # Validar memoria
        memory_gb = self.hardware_info.get('memory_gb', 0)
        if memory_gb < 4:
            validation_results['errors'].append("Memoria insuficiente (mínimo 4GB)")
            validation_results['valid'] = False
        elif memory_gb < 8:
            validation_results['warnings'].append("Memoria limitada, considere actualizar")
        
        # Validar CPU
        cpu_cores = self.hardware_info.get('cpu_cores', 0)
        if cpu_cores < 2:
            validation_results['errors'].append("CPU insuficiente (mínimo 2 cores)")
            validation_results['valid'] = False
        elif cpu_cores < 4:
            validation_results['warnings'].append("CPU limitada, rendimiento reducido")
        
        # Validar espacio en disco
        disk_free_gb = self.hardware_info.get('disk_free', 0) / (1024**3)
        if disk_free_gb < 1:
            validation_results['errors'].append("Espacio en disco insuficiente")
            validation_results['valid'] = False
        elif disk_free_gb < 5:
            validation_results['warnings'].append("Poco espacio en disco disponible")
        
        # Recomendaciones
        if self.performance_tier == 'minimal':
            validation_results['recommendations'].append("Considere actualizar hardware para mejor rendimiento")
        
        if not self.is_ai_enabled() and self.performance_tier in ['medium', 'high']:
            validation_results['recommendations'].append("Su sistema puede soportar IA, considere habilitarla")
        
        return validation_results

# Instancia global
config_manager = SystemConfigAdvanced()

def get_config_manager() -> SystemConfigAdvanced:
    """Obtiene el gestor de configuración global"""
    return config_manager

if __name__ == "__main__":
    # Prueba del sistema de configuración
    manager = SystemConfigAdvanced()
    
    print("🔧 Sistema de Configuración Avanzada")
    print("=" * 50)
    print(f"Tier de rendimiento: {manager.performance_tier}")
    print(f"CPU Cores: {manager.hardware_info['cpu_cores']}")
    print(f"Memoria: {manager.hardware_info['memory_gb']:.1f}GB")
    print(f"IA habilitada: {manager.is_ai_enabled()}")
    
    # Validar entorno
    validation = manager.validate_environment()
    print(f"\nValidación del entorno: {'✅ Válido' if validation['valid'] else '❌ Inválido'}")
    
    if validation['warnings']:
        print("⚠️ Advertencias:")
        for warning in validation['warnings']:
            print(f"  - {warning}")
    
    if validation['errors']:
        print("❌ Errores:")
        for error in validation['errors']:
            print(f"  - {error}")
    
    if validation['recommendations']:
        print("💡 Recomendaciones:")
        for rec in validation['recommendations']:
            print(f"  - {rec}") 