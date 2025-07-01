import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import NotificationToast from '../components/Notifications/NotificationToast';
import { useAuth } from './AuthContext';
import { handleAuthError } from '../utils/authUtils';

const NotificationsContext = createContext();

// Notificaciones de ejemplo
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: 'alert',
    title: 'Límite de presupuesto alcanzado',
    message: 'El proyecto "App Móvil" ha alcanzado el 90% del presupuesto asignado',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutos atrás
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'info',
    title: 'Nueva tarea asignada',
    message: 'Te han asignado la tarea "Implementar autenticación"',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutos atrás
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'success',
    title: 'Sprint completado',
    message: 'El sprint "Marzo S2" ha sido completado exitosamente',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 horas atrás
    read: true,
    priority: 'low'
  }
];

export function NotificationsProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState([]);
  
  // Cargar notificaciones ya mostradas desde localStorage para persistir entre refrescos
  const [shownToastIds, setShownToastIds] = useState(() => {
    try {
      const saved = localStorage.getItem('shownToastIds');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Verificar si estamos en la página de login
  const isLoginPage = location.pathname === '/login';
  
  // Verificar si estamos en rutas donde no deberían aparecer notificaciones
  const isExternalPortal = location.pathname === '/external/ticket-form' || location.pathname.startsWith('/external/form/');
  const isRootPage = location.pathname === '/';
  
  // Verificar si debemos mostrar notificaciones toast
  const shouldShowToasts = !isLoginPage && !isExternalPortal && !isRootPage && isAuthenticated;

  // Guardar notificaciones mostradas en localStorage
  const saveShownToastIds = useCallback((newSet) => {
    try {
      localStorage.setItem('shownToastIds', JSON.stringify([...newSet]));
    } catch (error) {
      console.error('Error guardando shownToastIds:', error);
    }
  }, []);

  // Obtener token de la sesión usando el contexto de autenticación
  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
      
      return headers;
    } catch (error) {
      console.error('❌ Error en getAuthHeaders:', error);
      throw new Error('Error de autenticación');
    }
  };

  // Cargar notificaciones del backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      
      const response = await fetch('http://localhost:8001/notifications/', {
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al cargar notificaciones: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error('❌ Error al cargar notificaciones:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Obtener contador de notificaciones no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/unread-count', {
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      } else {
        console.error('❌ Error en fetchUnreadCount:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error al obtener contador de notificaciones:', error);
      handleAuthError(error);
    }
  }, [isAuthenticated, user]);

  // Agregar notificación toast
  const addToastNotification = useCallback((notification) => {
    const toastId = Date.now();
    
    setToastNotifications(prev => {
      const newToasts = [...prev, { ...notification, toastId }];
      return newToasts;
    });
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      removeToastNotification(toastId);
    }, 5000);
  }, []);

  // Remover notificación toast
  const removeToastNotification = useCallback((toastId) => {
    setToastNotifications(prev => prev.filter(toast => toast.toastId !== toastId));
  }, []);

  // Verificar nuevas notificaciones
  const checkNewNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/check-new', {
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.has_new || data.new_count > 0) {
          const latestResponse = await fetch('http://localhost:8001/notifications/latest', {
            headers,
            credentials: 'include'
          });
          
          if (latestResponse.status === 401) {
            handleAuthError(new Error('Unauthorized'), latestResponse);
            return;
          }
          
          if (latestResponse.ok) {
            const latestNotification = await latestResponse.json();
            
            // Verificar si esta notificación ya se mostró como toast
            const notificationId = latestNotification.notification_id;
            if (!shownToastIds.has(notificationId)) {
              addToastNotification(latestNotification);
              
              // Registrar que esta notificación ya se mostró como toast y guardar en localStorage
              const newShownToastIds = new Set([...shownToastIds, notificationId]);
              setShownToastIds(newShownToastIds);
              saveShownToastIds(newShownToastIds);
            } else {
            }
            
            // Agregar la nueva notificación a la lista local sin refrescar todo
            setNotifications(prev => {
              // Verificar si la notificación ya existe en la lista
              const exists = prev.some(n => n.notification_id === notificationId);
              if (!exists) {
                const newNotifications = [latestNotification, ...prev];
                
                // Calcular el contador de no leídas basado en las notificaciones reales
                const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
                setUnreadCount(unreadCount);
                
                return newNotifications;
              }
              return prev;
            });
          } else {
            console.error('❌ Error obteniendo notificación más reciente:', latestResponse.status);
          }
        } else {
          return
        }
      } else {
        console.error('❌ Error en check-new:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Error details:', errorText);
      }
    } catch (error) {
      console.error('❌ Error al verificar nuevas notificaciones:', error);
      handleAuthError(error);
    }
  }, [addToastNotification, shownToastIds, saveShownToastIds, isAuthenticated, user]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      notification_id: Date.now(),
      created_at: new Date().toISOString(),
      status: 'unread',
      ...notification
    };
    setNotifications(prev => {
      const newNotifications = [newNotification, ...prev];
      // Calcular el contador de no leídas basado en las notificaciones reales
      const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
      setUnreadCount(unreadCount);
      return newNotifications;
    });
    
    // Mostrar toast notification
    addToastNotification(newNotification);
  }, [addToastNotification]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        setNotifications(prev => {
          const newNotifications = prev.map(n => 
            n.notification_id === notificationId ? { ...n, status: 'read' } : n
          );
          // Calcular el contador de no leídas basado en las notificaciones reales
          const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
          setUnreadCount(unreadCount);
          return newNotifications;
        });
      }
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      handleAuthError(error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/mark-all-read', {
        method: 'PATCH',
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        setNotifications(prev => {
          const newNotifications = prev.map(n => ({ ...n, status: 'read' }));
          setUnreadCount(0);
          return newNotifications;
        });
      }
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      handleAuthError(error);
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/notifications/${notificationId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        setNotifications(prev => {
          const newNotifications = prev.filter(n => n.notification_id !== notificationId);
          // Calcular el contador de no leídas basado en las notificaciones reales
          const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
          setUnreadCount(unreadCount);
          return newNotifications;
        });
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      handleAuthError(error);
    }
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  // Función para mostrar notificaciones toast simples
  const showNotification = useCallback((message, type = 'success') => {
    const notification = {
      type: type === 'success' ? 'task_assigned' : type === 'error' ? 'system_alert' : 'info',
      title: type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información',
      message: message,
      priority: type === 'error' ? 'high' : 'medium'
    };
    
    addToastNotification(notification);
  }, [addToastNotification]);

  // Cargar notificaciones al montar el componente o cuando cambie la autenticación
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setError(null);
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  // Polling para actualizar notificaciones cada 1.2 segundos (muy frecuente para respuesta inmediata)
  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    const interval = setInterval(() => {
      checkNewNotifications();
    }, 1200); // 1.2 segundos para respuesta muy rápida

    return () => {
      clearInterval(interval);
    };
  }, [checkNewNotifications, isAuthenticated, user]);

  // Limpiar notificaciones toast cuando navegue a páginas donde no deberían aparecer
  useEffect(() => {
    if (!shouldShowToasts) {
      setToastNotifications([]);
    }
    
  }, [shouldShowToasts, location.pathname, isLoginPage, isExternalPortal, isRootPage, isAuthenticated, toastNotifications.length]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        loading,
        error,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
        refreshNotifications,
        addToastNotification,
        showNotification
      }}
    >
      {children}
      
      {/* Toast notifications */}
      {shouldShowToasts && (
        <div className="fixed top-4 right-4 z-[9999] space-y-2">
          {toastNotifications.map((toast) => {
            return (
              <NotificationToast
                key={toast.toastId}
                notification={toast}
                onClose={() => removeToastNotification(toast.toastId)}
                onMarkAsRead={markAsRead}
              />
            );
          })}
        </div>
      )}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

// Función de ayuda para crear notificaciones
export function createNotification(type, title, message) {
  return {
    type,
    title,
    message,
    priority: type === 'alert' ? 'high' : type === 'warning' ? 'medium' : 'low'
  };
} 