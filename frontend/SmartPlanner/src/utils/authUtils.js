// Utilidades para manejo de autenticación

export const getAuthHeaders = () => {
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      throw new Error('No hay sesión activa');
    }
    
    // Verificar si el token ha expirado
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem('session');
      throw new Error('Sesión expirada');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    };
  } catch (error) {
    // Limpiar sesión inválida
    localStorage.removeItem('session');
    throw new Error('Error de autenticación: ' + error.message);
  }
};

export const isAuthenticated = () => {
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token || !session?.user) {
      return false;
    }
    
    // Verificar si el token ha expirado
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem('session');
      return false;
    }
    
    return true;
  } catch (error) {
    localStorage.removeItem('session');
    return false;
  }
};

export const getCurrentUser = () => {
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.user) {
      return null;
    }
    
    // Verificar si el token ha expirado
    if (session.expiresAt && new Date(session.expiresAt) <= new Date()) {
      localStorage.removeItem('session');
      return null;
    }
    
    return session.user;
  } catch (error) {
    localStorage.removeItem('session');
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem('session');
  window.dispatchEvent(new CustomEvent('userLoggedOut'));
  window.location.href = '/login';
};

export const handleAuthError = (error, response = null) => {
  console.error('Error de autenticación:', error);
  
  // Si es error 401, limpiar sesión y redirigir
  if (response?.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized')) {
    console.log('Token inválido o expirado, limpiando sesión...');
    logout();
    return;
  }
  
  // Si es error de red, mostrar mensaje apropiado
  if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
    throw new Error('Error de conexión. Verifica tu conexión de red.');
  }
  
  // Re-lanzar el error original
  throw error;
};

export const makeAuthenticatedRequest = async (url, options = {}) => {
  try {
    const headers = getAuthHeaders();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      },
      credentials: 'include'
    });
    
    // Manejar errores de autenticación
    if (response.status === 401) {
      handleAuthError(new Error('Unauthorized'), response);
      return;
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    handleAuthError(error);
  }
};

// Hook personalizado para requests autenticados
export const useAuthenticatedRequest = () => {
  const makeRequest = async (url, options = {}) => {
    try {
      const headers = getAuthHeaders();
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        },
        credentials: 'include'
      });
      
      // Manejar errores de autenticación
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return null;
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      handleAuthError(error);
      return null;
    }
  };

  return { makeRequest };
}; 