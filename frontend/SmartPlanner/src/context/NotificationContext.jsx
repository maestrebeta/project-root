import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import NotificationToast from '../components/Notifications/NotificationToast';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotifications, setToastNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener token de la sesión
  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    } catch {
      throw new Error('Error de autenticación');
    }
  };

  // Cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/', {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Cargar contador de no leídas
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/unread-count', {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unread_count);
      }
    } catch (error) {
      console.error('Error al cargar contador de no leídas:', error);
    }
  }, [isAuthenticated, user]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        // Actualizar notificaciones localmente
        setNotifications(prev => prev.map(notif => 
          notif.notification_id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        ));
        
        // Actualizar contador
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error al marcar como leída:', error);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/mark-all-read', {
        method: 'PATCH',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({
          ...notif,
          status: 'read',
          read_at: notif.read_at || new Date().toISOString()
        })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/notifications/${notificationId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.filter(notif => notif.notification_id !== notificationId));
        // Actualizar contador si era no leída
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.notification_id === notificationId);
          return notification?.status === 'unread' ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
    }
  }, [notifications]);

  // Agregar notificación toast
  const addToastNotification = useCallback((notification) => {
    const toastId = Date.now();
    setToastNotifications(prev => [...prev, { ...notification, toastId }]);
    
    // Auto-eliminar después de 5 segundos
    setTimeout(() => {
      removeToastNotification(toastId);
    }, 5000);
  }, []);

  // Remover notificación toast
  const removeToastNotification = useCallback((toastId) => {
    setToastNotifications(prev => prev.filter(toast => toast.toastId !== toastId));
  }, []);

  // Simular nueva notificación (para testing)
  const simulateNewNotification = useCallback(() => {
    const mockNotification = {
      notification_id: Date.now(),
      type: 'ticket_assigned',
      title: 'Ticket asignado: TICK-001',
      message: 'Te han asignado el ticket "Problema con el login" (TICK-001)',
      priority: 'medium',
      status: 'unread',
      sender_name: 'Juan Pérez',
      created_at: new Date().toISOString()
    };
    
    addToastNotification(mockNotification);
    setNotifications(prev => [mockNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  }, [addToastNotification]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isAuthenticated, user, fetchNotifications, fetchUnreadCount]);

  // Polling para nuevas notificaciones (cada 30 segundos)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addToastNotification,
    simulateNewNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        {toastNotifications.map((toast) => (
          <NotificationToast
            key={toast.toastId}
            notification={toast}
            onClose={() => removeToastNotification(toast.toastId)}
            onMarkAsRead={markAsRead}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
}; 