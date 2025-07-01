import React, { createContext, useContext, useState, useEffect } from 'react';

const FocusModeContext = createContext();

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (!context) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

export const FocusModeProvider = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Función para activar/desactivar modo enfoque
  const toggleFocusMode = () => {
    setIsFocusMode(prev => !prev);
  };

  // Función para activar modo enfoque
  const activateFocusMode = () => {
    // Verificar que el usuario esté autenticado antes de activar
    const session = localStorage.getItem('session');
    if (!session) {
      return false;
    }
    
    // Pequeño delay para asegurar que la sesión esté completamente guardada
    setTimeout(() => {
      setIsFocusMode(true);
    }, 100);
    
    return true;
  };

  // Función para desactivar modo enfoque
  const deactivateFocusMode = () => {
    setIsFocusMode(false);
  };

  // Efecto para manejar cambios en el modo enfoque
  useEffect(() => {
    if (isFocusMode) {
      // Activar pantalla completa si no está activa
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
        });
      }
      // Agregar clases CSS para modo enfoque
      document.body.classList.add('focus-mode-active');
    } else {
      // Siempre intentar salir de pantalla completa si está activa
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
        });
      }
      // Remover clases CSS
      document.body.classList.remove('focus-mode-active');
    }
  }, [isFocusMode]);

  // Efecto para manejar eventos de teclado (Shift + E)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Verificar si se presiona Shift + E
      if (event.shiftKey && event.key.toLowerCase() === 'e') {
        event.preventDefault(); // Prevenir comportamiento por defecto
        
        // Verificar que el usuario esté autenticado
        const session = localStorage.getItem('session');
        if (!session) {
          return;
        }
        toggleFocusMode();
      }
      
      // También permitir salir con Escape
      if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        deactivateFocusMode();
      }
    };

    // Agregar event listener
    document.addEventListener('keydown', handleKeyDown);
    
    // Limpiar event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFocusMode]); // Dependencia para acceder al estado actual

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      document.body.classList.remove('focus-mode-active');
    };
  }, []);

  // Escuchar eventos de logout para desactivar modo enfoque
  useEffect(() => {
    const handleLogout = () => {
      setIsFocusMode(false);
      
      // Limpiar flags de sessionStorage relacionados con el sidebar
      sessionStorage.removeItem('focusModeSidebarContracted');
      
      // Limpiar clases CSS del modo enfoque
      document.body.classList.remove('focus-mode-active');
      
      // Salir de pantalla completa si está activa
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => {
          console.log('Error al salir de pantalla completa durante logout:', err);
        });
      }
    };

    window.addEventListener('userLoggedOut', handleLogout);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
    };
  }, []);

  const value = {
    isFocusMode,
    toggleFocusMode,
    activateFocusMode,
    deactivateFocusMode
  };

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
}; 