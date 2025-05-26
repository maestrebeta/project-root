from typing import Dict, List, Optional

# Tipos de actividad predeterminados
DEFAULT_ACTIVITY_TYPES: List[str] = [
    'desarrollo',
    'reunion',
    'capacitacion',
    'soporte',
    'otro'
]

# Mapeo de tipos de actividad para conversión
ACTIVITY_TYPE_MAPPING: Dict[str, str] = {
    # Desarrollo
    'trabajo': 'desarrollo',
    'development': 'desarrollo',
    'coding': 'desarrollo',
    'programming': 'desarrollo',
    'design': 'desarrollo',
    
    # Reunión
    'meeting': 'reunion',
    'coordination': 'reunion',
    
    # Capacitación
    'training': 'capacitacion',
    'learning': 'capacitacion',
    'workshop': 'capacitacion',
    
    # Soporte
    'support': 'soporte',
    'helpdesk': 'soporte',
    'maintenance': 'soporte',
    
    # Otros
    'miscellaneous': 'otro',
    'general': 'otro'
}

def normalize_activity_type(activity_type: Optional[str]) -> str:
    """
    Convierte un tipo de actividad a uno de los tipos predeterminados
    
    :param activity_type: Tipo de actividad a convertir
    :return: Tipo de actividad convertido
    """
    if not activity_type:
        return 'desarrollo'
    
    lower_activity_type = activity_type.lower()
    return ACTIVITY_TYPE_MAPPING.get(lower_activity_type, 'otro')

def add_custom_activity_type(new_type: str, mapped_to: str = 'otro') -> None:
    """
    Permite agregar tipos de actividad personalizados
    
    :param new_type: Nuevo tipo de actividad
    :param mapped_to: Tipo al que se mapea (por defecto 'otro')
    """
    ACTIVITY_TYPE_MAPPING[new_type.lower()] = normalize_activity_type(mapped_to)

def get_valid_activity_types() -> List[str]:
    """
    Obtiene la lista de tipos de actividad válidos
    
    :return: Lista de tipos de actividad
    """
    return DEFAULT_ACTIVITY_TYPES 