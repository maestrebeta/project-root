// Interceptor global para manejar errores de autenticación
import { handleAuthError } from './authUtils';

// Guardar la función fetch original
const originalFetch = window.fetch;

// Función para verificar si una URL es de nuestra API
const isApiRequest = (url) => {
  return url.includes('localhost:8001') || url.includes('/api/');
};

// Función para verificar si una respuesta es un error de autenticación
const isAuthError = (response) => {
  return response.status === 401;
};

// Interceptar todas las peticiones fetch
window.fetch = async function(...args) {
  const [url, options = {}] = args;
  
  // Solo interceptar peticiones a nuestra API
  if (!isApiRequest(url)) {
    return originalFetch.apply(this, args);
  }
  
  try {
    const response = await originalFetch.apply(this, args);
    
    // Si es un error de autenticación, manejar automáticamente
    if (isAuthError(response)) {
      console.log('🔄 Interceptor detectó error 401, cerrando sesión...');
      handleAuthError(new Error('Unauthorized'), response);
      return response; // Retornar la respuesta original para que el código pueda manejarla si es necesario
    }
    
    return response;
  } catch (error) {
    // Si es un error de red que podría ser de autenticación
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('🔄 Interceptor detectó error de autenticación en catch, cerrando sesión...');
      handleAuthError(error);
    }
    throw error;
  }
};

// Función para restaurar fetch original (útil para testing)
export const restoreOriginalFetch = () => {
  window.fetch = originalFetch;
};

// Función para verificar si el interceptor está activo
export const isInterceptorActive = () => {
  return window.fetch !== originalFetch;
};