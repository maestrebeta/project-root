import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from './ThemeContext';
import { isAuthenticated, getCurrentUser, makeAuthenticatedRequest, handleAuthError } from '../utils/authUtils';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState(null);
  const navigate = useNavigate();
  const theme = useAppTheme();

  // Función para actualizar la imagen de perfil (solo en memoria)
  const updateProfileImage = (imageData) => {
    setProfileImage(imageData);
  };

  // Función para obtener los datos completos del usuario
  const fetchUserDetails = async (username, token) => {
    try {
      const response = await fetch(`http://localhost:8000/users?username=${username}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Error al obtener datos del usuario');
      }

      const users = await response.json();
      const userDetails = users.find(u => u.username === username);
      
      if (!userDetails) {
        throw new Error('Usuario no encontrado');
      }

      return userDetails;
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          
          if (currentUser) {
            // Restaurar imagen de perfil desde la sesión
            if (currentUser.profile_image) {
              updateProfileImage(currentUser.profile_image);
            }
            
            // Aplicar preferencias de tema desde el backend
            if (currentUser.theme_preferences) {
              theme.setPrimaryColor(currentUser.theme_preferences.primary_color);
              theme.setFont(currentUser.theme_preferences.font_class);
              theme.setFontSize(currentUser.theme_preferences.font_size_class);
              theme.setAnimations(currentUser.theme_preferences.animations_enabled);
            }
            
            setUser(currentUser);
            
            // Disparar evento de inicio de sesión para sincronizar tema
            window.dispatchEvent(new CustomEvent('userLoggedIn'));
          }
        }
      } catch (error) {
        console.error('Error al inicializar autenticación:', error);
        // Las utilidades de auth ya limpiarán la sesión si es necesario
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('grant_type', 'password');

      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
        credentials: 'include'
      });

      // Manejar errores de red y CORS
      if (!response.ok) {
        let errorDetail = 'Credenciales incorrectas';
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorDetail;
        } catch {
          // Si no se puede parsear como JSON, usar el texto de la respuesta
          errorDetail = await response.text() || errorDetail;
        }

        // Log detallado de errores
        console.error('Error de inicio de sesión:', {
          status: response.status,
          statusText: response.statusText,
          errorDetail: errorDetail
        });

        throw new Error(errorDetail);
      }

      const data = await response.json();
      
      if (!data.access_token) {
        throw new Error('Token no recibido del servidor');
      }

      // Actualizar imagen de perfil desde el backend
      if (data.user.profile_image) {
        updateProfileImage(data.user.profile_image);
      }
      
      // Aplicar preferencias de tema desde el backend
      if (data.user.theme_preferences) {
        theme.setPrimaryColor(data.user.theme_preferences.primary_color);
        theme.setFont(data.user.theme_preferences.font_class);
        theme.setFontSize(data.user.theme_preferences.font_size_class);
        theme.setAnimations(data.user.theme_preferences.animations_enabled);
      }

      const session = {
        user: {
          ...data.user,
          organization_id: 
            data.user.organization_id || 
            data.user.organization?.organization_id || 
            data.organization?.organization_id || 
            null
        },
        token: data.access_token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas
      };

      // Logging detallado para depuración
      console.group('Datos de Sesión al Iniciar Sesión');
      console.log('Datos completos del usuario:', data.user);
      console.log('Datos de sesión:', session);
      console.log('ID de organización:', session.user.organization_id);
      console.log('Estructura de organización:', {
        organization_id: data.user.organization_id,
        organization: data.user.organization,
        data_organization: data.organization
      });
      console.groupEnd();

      localStorage.setItem('session', JSON.stringify(session));
      setUser(session.user);
      
      // Disparar evento de inicio de sesión para sincronizar tema
      window.dispatchEvent(new CustomEvent('userLoggedIn'));
      
      navigate('/home');
      return true;
    } catch (error) {
      console.error('Error completo de inicio de sesión:', error);
      
      // Manejar diferentes tipos de errores
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Error de conexión. Por favor, verifica tu conexión de red o el servidor.');
      } else if (error.message.includes('CORS')) {
        throw new Error('Error de configuración de servidor. Por favor, contacta al administrador.');
      } else {
        throw error; // Mantener el mensaje de error original
      }
    }
  };

  const updateUserProfile = async (userData) => {
    try {
      if (!isAuthenticated()) {
        throw new Error('Sesión inválida');
      }

      const currentUser = getCurrentUser();
      if (!currentUser?.user_id) {
        throw new Error('Usuario no encontrado');
      }

      // Preparar datos según el schema UserUpdate
      const currentTheme = theme || {};
      const updateData = {
        full_name: userData.full_name,
        email: userData.email,
        role: currentUser.role,
        is_active: true,
        profile_image: profileImage,
        theme_preferences: {
          primary_color: currentTheme.PRIMARY_COLOR || 'blue',
          font_class: currentTheme.FONT_CLASS || 'font-sans',
          font_size_class: currentTheme.FONT_SIZE_CLASS || 'text-base',
          animations_enabled: currentTheme.ANIMATION_ENABLED || true
        }
      };

      const response = await makeAuthenticatedRequest(
        `http://localhost:8000/users/${currentUser.user_id}`,
        {
          method: 'PUT',
          body: JSON.stringify(updateData)
        }
      );

      if (!response) {
        throw new Error('Error al actualizar el perfil');
      }

      // Obtener datos actualizados del usuario
      const updatedUser = await fetchUserDetails(currentUser.username, getCurrentUser().token);
      
      // Actualizar sesión con los datos completos
      const savedSession = localStorage.getItem('session');
      if (savedSession) {
        const session = JSON.parse(savedSession);
        const updatedSession = {
          ...session,
          user: updatedUser
        };
        
        localStorage.setItem('session', JSON.stringify(updatedSession));
        setUser(updatedUser);

        // Actualizar imagen de perfil desde el backend
        if (updatedUser.profile_image) {
          setProfileImage(updatedUser.profile_image);
        }
        
        // Aplicar preferencias de tema desde el backend
        if (updatedUser.theme_preferences) {
          theme.setPrimaryColor(updatedUser.theme_preferences.primary_color);
          theme.setFont(updatedUser.theme_preferences.font_class);
          theme.setFontSize(updatedUser.theme_preferences.font_size_class);
          theme.setAnimations(updatedUser.theme_preferences.animations_enabled);
        }
      }

      return updatedUser;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('session');
    setUser(null);
    setProfileImage(null);
    
    // Disparar evento de cierre de sesión para resetear el tema
    console.log('Disparando evento userLoggedOut');
    window.dispatchEvent(new CustomEvent('userLoggedOut'));
    
    navigate('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    updateUserProfile,
    profileImage,
    updateProfileImage
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 