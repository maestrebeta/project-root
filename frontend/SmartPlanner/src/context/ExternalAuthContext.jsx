import React, { createContext, useContext, useState, useEffect } from 'react';

const ExternalAuthContext = createContext();

export const useExternalAuth = () => {
  const context = useContext(ExternalAuthContext);
  if (!context) {
    throw new Error('useExternalAuth debe ser usado dentro de un ExternalAuthProvider');
  }
  return context;
};

export const ExternalAuthProvider = ({ children }) => {
  const [externalUser, setExternalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // Función para validar la sesión con el servidor
  const validateSession = async () => {
    if (!token || !externalUser) {
      return false;
    }

    try {
      const response = await fetch(`http://localhost:8001/external-users/${externalUser.external_user_id}/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const { valid, user } = await response.json();
        if (valid && user) {
          // Actualizar datos del usuario si han cambiado
          setExternalUser(user);
          return true;
        } else {
          // Usuario no válido, cerrar sesión
          logout();
          return false;
        }
      } else if (response.status === 401 || response.status === 404) {
        // Usuario no autorizado o no encontrado, cerrar sesión
        logout();
        return false;
      } else {
        // Otro error, mantener sesión por ahora
        return true;
      }
    } catch (error) {
      // En caso de error de conexión, mantener la sesión
      return true;
    }
  };

  // Cargar sesión al inicializar
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = localStorage.getItem('externalSession');
        if (session) {
          const { user, token, expiresAt } = JSON.parse(session);
          
          // Verificar si la sesión no ha expirado
          if (expiresAt && new Date(expiresAt) > new Date()) {
            setExternalUser(user);
            setToken(token);
            
            // Validar la sesión con el servidor
            const isValid = await validateSession();
            if (!isValid) {
              console.log('🔄 Sesión inválida, cerrando automáticamente');
            }
          } else {
            // Sesión expirada, limpiar
            console.log('🔄 Sesión expirada, limpiando');
            localStorage.removeItem('externalSession');
          }
        }
      } catch (error) {
        console.error('Error loading external session:', error);
        localStorage.removeItem('externalSession');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  // Validar sesión periódicamente (cada 5 minutos)
  useEffect(() => {
    if (externalUser && token) {
      const interval = setInterval(async () => {
        const isValid = await validateSession();
        if (!isValid) {
          console.log('🔄 Validación periódica: sesión inválida');
        }
      }, 5 * 60 * 1000); // 5 minutos

      return () => clearInterval(interval);
    }
  }, [externalUser, token]);

  // Guardar sesión en localStorage
  const saveSession = (user, token, expiresInHours = 24) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);
    
    const session = {
      user,
      token,
      expiresAt: expiresAt.toISOString()
    };
    
    localStorage.setItem('externalSession', JSON.stringify(session));
    setExternalUser(user);
    setToken(token);
  };

  // Registrar usuario externo
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:8001/external-users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const { user, token } = await response.json();
        saveSession(user, token);
        return { success: true, user };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Error al registrar' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8001/external-users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const { user, token } = await response.json();
        saveSession(user, token);
        return { success: true, user };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Credenciales inválidas' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Cerrar sesión
  const logout = () => {
    console.log('🚪 Cerrando sesión externa');
    localStorage.removeItem('externalSession');
    setExternalUser(null);
    setToken(null);
  };

  // Actualizar datos del usuario
  const updateUser = async (userData) => {
    if (!token) return { success: false, error: 'No hay sesión activa' };

    try {
      const response = await fetch(`http://localhost:8001/external-users/${externalUser.external_user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        saveSession(updatedUser, token);
        return { success: true, user: updatedUser };
      } else if (response.status === 401 || response.status === 404) {
        // Usuario no autorizado o no encontrado, cerrar sesión
        logout();
        return { success: false, error: 'Sesión expirada o usuario no encontrado' };
      } else {
        const error = await response.json();
        return { success: false, error: error.detail || 'Error al actualizar' };
      }
    } catch (error) {
      return { success: false, error: 'Error de conexión' };
    }
  };

  // Verificar si el usuario está autenticado
  const isAuthenticated = () => {
    return externalUser !== null && token !== null;
  };

  // Obtener token para requests autenticados
  const getAuthHeaders = () => {
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const value = {
    externalUser,
    token,
    loading,
    register,
    login,
    logout,
    updateUser,
    isAuthenticated,
    getAuthHeaders,
    validateSession
  };

  return (
    <ExternalAuthContext.Provider value={value}>
      {children}
    </ExternalAuthContext.Provider>
  );
}; 