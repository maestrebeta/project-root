import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiCheck, FiTrash2, FiEye, FiEyeOff, FiClock, FiAlertCircle, FiCheckCircle, FiUser, FiTag, FiCalendar, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import { handleAuthError } from '../../utils/authUtils';

export default function NotificationsPanel({ onClose }) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error,
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications 
  } = useNotifications();
  
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    read: 0,
    deleted: 0
  });

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

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/notifications/stats', {
        headers,
        credentials: 'include'
      });
      
      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}`);
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      handleAuthError(error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []); // Solo ejecutar una vez al montar el componente

  // Obtener icono según el tipo de notificación
  const getIcon = (type) => {
    switch (type) {
      case 'ticket_assigned':
        return <FiTag className="w-5 h-5 text-blue-600" />;
      case 'task_assigned':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
      case 'user_story_assigned':
        return <FiBookOpen className="w-5 h-5 text-purple-600" />;
      case 'ticket_status_changed':
        return <FiAlertCircle className="w-5 h-5 text-orange-600" />;
      case 'system_alert':
        return <FiBell className="w-5 h-5 text-red-600" />;
      case 'mention':
        return <FiUser className="w-5 h-5 text-purple-600" />;
      case 'deadline_reminder':
        return <FiClock className="w-5 h-5 text-yellow-600" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Formatear tiempo
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays}d`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Obtener color de prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col notifications-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FiBell className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
            <p className="text-sm text-gray-600">
              {unreadCount} sin leer de {notifications.length}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Acciones */}
        {unreadCount > 0 && (
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <button
              onClick={markAllAsRead}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <FiCheck className="w-4 h-4" />
              Marcar todas como leídas
            </button>
          </div>
        )}

        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-500 mb-2">
                <FiAlertCircle className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-gray-600">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-2">
                <FiBell className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600">No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.notification_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      notification.status === 'unread' ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icono */}
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Badge de prioridad */}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            
                            {/* Indicador de no leída */}
                            {notification.status === 'unread' && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {formatTime(notification.created_at)}
                            </span>
                            {notification.sender_name && (
                              <span className="flex items-center gap-1">
                                <FiUser className="w-3 h-3" />
                                {notification.sender_name}
                              </span>
                            )}
                          </div>
                          
                          {/* Acciones */}
                          <div className="flex items-center gap-1">
                            {notification.status === 'unread' && (
                              <button
                                onClick={() => markAsRead(notification.notification_id)}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Marcar como leída"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.notification_id)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 