// Configuración de tipos de actividad

// Tipos de actividad predeterminados
export const DEFAULT_ACTIVITY_TYPES = [
    'trabajo',
    'reunion',
    'capacitacion', 
    'soporte', 
    'otro'
];

// Mapeo de tipos de actividad para conversión
export const ACTIVITY_TYPE_MAPPING = {
    // Trabajo
    'development': 'trabajo',
    'coding': 'trabajo',
    'programming': 'trabajo',
    'design': 'trabajo',
    
    // Reunión
    'meeting': 'reunion',
    'coordination': 'reunion',
    
    // Capacitación
    'training': 'capacitacion',
    'learning': 'capacitacion',
    'workshop': 'capacitacion',
    
    // Soporte
    'support': 'soporte',
    'helpdesk': 'soporte',
    'maintenance': 'soporte',
    
    // Otros
    'miscellaneous': 'otro',
    'general': 'otro'
};

/**
 * Convierte un tipo de actividad a uno de los tipos predeterminados
 * @param {string} activityType - Tipo de actividad a convertir
 * @returns {string} Tipo de actividad convertido
 */
export function normalizeActivityType(activityType) {
    const lowerActivityType = activityType.toLowerCase();
    return ACTIVITY_TYPE_MAPPING[lowerActivityType] || 'otro';
}

/**
 * Permite agregar tipos de actividad personalizados
 * @param {string} newType - Nuevo tipo de actividad
 * @param {string} [mappedTo='otro'] - Tipo al que se mapea
 */
export function addCustomActivityType(newType, mappedTo = 'otro') {
    const lowerNewType = newType.toLowerCase();
    ACTIVITY_TYPE_MAPPING[lowerNewType] = normalizeActivityType(mappedTo);
}

// Exportar tipos de actividad para uso en componentes
export default {
    DEFAULT_ACTIVITY_TYPES,
    ACTIVITY_TYPE_MAPPING,
    normalizeActivityType,
    addCustomActivityType
}; 