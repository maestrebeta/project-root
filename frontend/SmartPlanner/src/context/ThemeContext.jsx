import React, { createContext, useContext, useState, useEffect } from "react";
import { isAuthenticated, getCurrentUser, makeAuthenticatedRequest } from "../utils/authUtils";

const ThemeContext = createContext();

const DEFAULT_THEME = {
  primaryColor: "blue",
  font: "font-sans",
  fontSize: "text-base",
  animations: true
};

export function ThemeProvider({ children }) {
  // Inicializar con el tema por defecto
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // Generar clases y variables del tema
  const themeClasses = React.useMemo(() => ({
    ...theme,
    PRIMARY_COLOR: theme.primaryColor,
    PRIMARY_COLOR_CLASS: `text-${theme.primaryColor}-500`,
    PRIMARY_FONT_CLASS: `text-${theme.primaryColor}-600`,
    PRIMARY_BG_CLASS: `bg-${theme.primaryColor}-100`,
    PRIMARY_BG_SOFT: `bg-${theme.primaryColor}-50`,
    PRIMARY_BG_MEDIUM: `bg-${theme.primaryColor}-500`,
    PRIMARY_BG_STRONG: `bg-${theme.primaryColor}-600`,
    PRIMARY_BORDER_CLASS: `border-${theme.primaryColor}-500`,
    PRIMARY_HOVER_BG: `hover:bg-${theme.primaryColor}-600`,
    PRIMARY_HOVER_TEXT: `hover:text-${theme.primaryColor}-500`,
    PRIMARY_RING_CLASS: `focus:ring-${theme.primaryColor}-500`,
    PRIMARY_BUTTON_CLASS: `bg-${theme.primaryColor}-600 hover:bg-${theme.primaryColor}-700 focus:ring-${theme.primaryColor}-500 text-white`,
    SECONDARY_BUTTON_CLASS: `bg-${theme.primaryColor}-100 text-${theme.primaryColor}-700 hover:bg-${theme.primaryColor}-200`,
    PRIMARY_GRADIENT_CLASS: `bg-gradient-to-r from-${theme.primaryColor}-600 to-${theme.primaryColor}-500`,
    PRIMARY_GRADIENT_HOVER_CLASS: `hover:from-${theme.primaryColor}-700 hover:to-${theme.primaryColor}-600`,
    PRIMARY_ACTIVE_CLASS: `active:bg-${theme.primaryColor}-700`,
    PRIMARY_DISABLED_CLASS: `disabled:bg-${theme.primaryColor}-300`,
    FONT_CLASS: theme.font,
    FONT_SIZE_CLASS: theme.fontSize,
    ANIMATION_ENABLED: theme.animations
  }), [theme]);

  // Actualizar el tema y sincronizarlo con el backend
  const updateTheme = (updates) => {
    const newTheme = { ...theme, ...updates };
    setTheme(newTheme);
    
    // Disparar evento de cambio de tema
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: newTheme
    }));
    
    // Sincronizar con el backend si hay una sesión activa
    syncThemeWithBackend(newTheme);
  };
  
  // Función para sincronizar el tema con el backend si hay sesión activa
  const syncThemeWithBackend = async (themeData) => {
    try {
      // Verificar si hay sesión activa
      if (!isAuthenticated()) {
        return;
      }
      
      const currentUser = getCurrentUser();
      if (!currentUser?.user_id) {
        return;
      }
      
      // Solo actualizar las preferencias de tema en el backend
      const updateData = {
        theme_preferences: {
          primary_color: themeData.primaryColor,
          font_class: themeData.font,
          font_size_class: themeData.fontSize,
          animations_enabled: themeData.animations
        }
      };
      
      // Enviar actualización al backend usando la utilidad de autenticación
      const response = await makeAuthenticatedRequest(
        `http://localhost:8001/users/${currentUser.user_id}/theme`,
        {
          method: 'PATCH',
          body: JSON.stringify(updateData)
        }
      );
      
      if (response) {
        // Actualizar la sesión local con el nuevo tema
        const savedSession = localStorage.getItem('session');
        if (savedSession) {
          const session = JSON.parse(savedSession);
          const updatedSession = {
            ...session,
            user: {
              ...session.user,
              theme_preferences: updateData.theme_preferences
            }
          };
          localStorage.setItem('session', JSON.stringify(updatedSession));
        }
      }
      
    } catch (error) {
      // No interrumpir la experiencia del usuario si falla la sincronización
      // Si es error 401, las utilidades de auth ya manejarán el logout
    }
  };

  // Aplicar clases al documento
  useEffect(() => {
    document.documentElement.setAttribute('data-theme-color', theme.primaryColor);
    document.documentElement.setAttribute('data-theme-font', theme.font);
    document.documentElement.setAttribute('data-theme-size', theme.fontSize);
    
    const root = document.documentElement;
    root.style.setProperty('--primary-color', theme.primaryColor);
    root.style.setProperty('--primary-light', `var(--${theme.primaryColor}-100)`);
    root.style.setProperty('--primary-medium', `var(--${theme.primaryColor}-500)`);
    root.style.setProperty('--primary-dark', `var(--${theme.primaryColor}-700)`);
  }, [theme]);

  // Cargar tema desde la sesión al iniciar
  useEffect(() => {
    const loadThemeFromSession = () => {
      if (isAuthenticated()) {
        try {
          const currentUser = getCurrentUser();
          if (currentUser?.theme_preferences) {
            // Aplicar tema del usuario desde el backend
            setTheme({
              primaryColor: currentUser.theme_preferences.primary_color || DEFAULT_THEME.primaryColor,
              font: currentUser.theme_preferences.font_class || DEFAULT_THEME.font,
              fontSize: currentUser.theme_preferences.font_size_class || DEFAULT_THEME.fontSize,
              animations: currentUser.theme_preferences.animations_enabled ?? DEFAULT_THEME.animations
            });
          } else {
            // Si el usuario no tiene preferencias, usar tema por defecto
            setTheme(DEFAULT_THEME);
          }
        } catch (error) {
          setTheme(DEFAULT_THEME);
        }
      } else {
        // Si no hay sesión, usar tema por defecto
        setTheme(DEFAULT_THEME);
      }
    };
    
    // Cargar tema al iniciar
    loadThemeFromSession();
    
    // Escuchar eventos de inicio de sesión
    window.addEventListener('userLoggedIn', loadThemeFromSession);
    
    // Escuchar eventos de cierre de sesión
    const handleLogout = () => {
      setTheme(DEFAULT_THEME);
    };
    
    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('userLoggedIn', loadThemeFromSession);
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  const contextValue = {
    ...themeClasses,
    setPrimaryColor: (color) => updateTheme({ primaryColor: color }),
    setFont: (font) => updateTheme({ font }),
    setFontSize: (size) => updateTheme({ fontSize: size }),
    setAnimations: (enabled) => updateTheme({ animations: enabled })
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}