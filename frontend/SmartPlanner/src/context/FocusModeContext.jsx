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
    console.log('FocusMode: Activando modo enfoque...');
    
    // Verificar que el usuario esté autenticado antes de activar
    const session = localStorage.getItem('session');
    if (!session) {
      console.log('FocusMode: Usuario no autenticado, no activando modo enfoque');
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
    console.log('FocusMode: Desactivando modo enfoque...');
    setIsFocusMode(false);
  };

  // Efecto para manejar cambios en el modo enfoque
  useEffect(() => {
    console.log('FocusMode: Estado cambiado a:', isFocusMode);
    
    if (isFocusMode) {
      // Activar pantalla completa si no está activa
      if (!document.fullscreenElement) {
        console.log('FocusMode: Activando pantalla completa...');
        document.documentElement.requestFullscreen().catch(err => {
          console.log('Error al activar pantalla completa:', err);
        });
      }
      // Agregar clases CSS para modo enfoque
      console.log('FocusMode: Agregando clases CSS...');
      document.body.classList.add('focus-mode-active');
    } else {
      // Siempre intentar salir de pantalla completa si está activa
      if (document.fullscreenElement) {
        console.log('FocusMode: Saliendo de pantalla completa...');
        document.exitFullscreen().catch(err => {
          console.log('Error al salir de pantalla completa:', err);
        });
      }
      // Remover clases CSS
      console.log('FocusMode: Removiendo clases CSS...');
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
          console.log('FocusMode: Usuario no autenticado, no activando modo enfoque con teclas');
          return;
        }
        
        console.log('FocusMode: Teclas Shift + E detectadas, alternando modo enfoque...');
        toggleFocusMode();
      }
      
      // También permitir salir con Escape
      if (event.key === 'Escape' && isFocusMode) {
        event.preventDefault();
        console.log('FocusMode: Tecla Escape detectada, desactivando modo enfoque...');
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
      console.log('FocusMode: Detectado logout, desactivando modo enfoque...');
      setIsFocusMode(false);
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