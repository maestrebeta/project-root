import React, { createContext, useContext, useState, useCallback } from 'react';

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
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications,
        unreadCount: notifications.filter(n => !n.read).length
      }}
    >
      {children}
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