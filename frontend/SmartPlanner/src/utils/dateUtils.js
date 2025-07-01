/**
 * Utilidades para manejo de fechas en la aplicación
 */

/**
 * Convierte una fecha del backend (sin zona horaria) a la zona horaria local del usuario
 * @param {string} dateString - Fecha del backend (ej: "2025-06-27T02:17:26.822000")
 * @returns {Date} - Objeto Date en zona horaria local
 */
export const parseBackendDate = (dateString) => {
  if (!dateString) return null;
  
  // Si la fecha ya tiene zona horaria, usar el método normal
  if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-')) {
    return new Date(dateString);
  }
  
  // Para fechas del backend sin zona horaria, asumir que están en hora local
  // y crear la fecha directamente
  const [datePart, timePart] = dateString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  
  // Crear fecha en zona horaria local
  const dateObj = new Date(year, month - 1, day, hour, minute, second);
  
  return dateObj;
};

/**
 * Convierte una fecha (string o Date) a la zona horaria local del usuario
 * @param {string|Date} date - Fecha a convertir
 * @returns {Date} - Objeto Date en zona horaria local
 */
export const parseToLocalDate = (date) => {
  if (!date) return null;
  
  // Si ya es un objeto Date, devolverlo
  if (date instanceof Date) return date;
  
  // Si es un string, usar la función específica para fechas del backend
  if (typeof date === 'string') {
    return parseBackendDate(date);
  }
  
  return new Date(date);
};

/**
 * Formatea una fecha para mostrar en la interfaz de usuario
 * @param {string|Date} date - Fecha a formatear
 * @param {Object} options - Opciones de formato
 * @returns {string} - Fecha formateada
 */
export const formatDateForDisplay = (date, options = {}) => {
  const dateObj = parseBackendDate(date);
  if (!dateObj) return '';
  
  const defaultOptions = {
    day: 'numeric',
    month: 'short'
  };
  
  const formatOptions = { ...defaultOptions, ...options };
  
  return dateObj.toLocaleDateString('es-ES', formatOptions);
};

/**
 * Formatea una fecha para mostrar como tooltip completo
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada completa
 */
export const formatDateForTooltip = (date) => {
  const dateObj = parseBackendDate(date);
  if (!dateObj) return '';
  
  return dateObj.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Crea una fecha de completado en la zona horaria local del servidor
 * @returns {string} - Fecha en formato ISO string sin zona horaria (para que el backend la interprete como local)
 */
export const createCompletedDate = () => {
  const now = new Date();
  
  // Crear la fecha en formato ISO pero sin la 'Z' de UTC
  // Esto hace que el backend la interprete como fecha local
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  // Formato: "2025-06-27T14:30:45.123" (sin zona horaria)
  const localDateString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
  
  return localDateString;
};

/**
 * Debug: Muestra información detallada de una fecha
 * @param {string|Date} date - Fecha a debuggear
 * @param {string} label - Etiqueta para el log
 */
export const debugDate = (date, label = 'Fecha') => {
  const dateObj = parseBackendDate(date);
  if (!dateObj) {
    console.log(`🔍 ${label}: Fecha inválida o nula`);
    return;
  }
}; 