import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiTag, FiCheckCircle, FiAlertCircle, FiBell, FiUser, FiClock } from 'react-icons/fi';

export default function NotificationToast({ notification, onClose, onMarkAsRead }) {
  
  // Auto-cerrar después de 5 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);

  // Obtener icono según el tipo de notificación
  const getIcon = (type) => {
    switch (type) {
      case 'ticket_assigned':
        return <FiTag className="w-5 h-5 text-blue-600" />;
      case 'task_assigned':
        return <FiCheckCircle className="w-5 h-5 text-green-600" />;
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

  // Obtener color de fondo según la prioridad
  const getBackgroundColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-50 border-red-200';
      case 'high':
        return 'bg-orange-50 border-orange-200';
      case 'medium':
        return 'bg-blue-50 border-blue-200';
      case 'low':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Obtener color de texto según la prioridad
  const getTextColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-800';
      case 'high':
        return 'text-orange-800';
      case 'medium':
        return 'text-blue-800';
      case 'low':
        return 'text-gray-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300, scale: 0.8 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 300, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed top-4 right-4 w-80 max-w-sm bg-white rounded-lg shadow-lg border ${getBackgroundColor(notification.priority)} z-[9999] overflow-hidden`}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4">
          <div className="flex items-start gap-3 flex-1">
            {/* Icono */}
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(notification.type)}
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className={`text-sm font-semibold ${getTextColor(notification.priority)} line-clamp-1`}>
                  {notification.title}
                </h3>
                <button
                  onClick={onClose}
                  className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <FiX className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {notification.message}
              </p>
              
              {/* Información adicional */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {notification.sender_name && (
                  <span className="flex items-center gap-1">
                    <FiUser className="w-3 h-3" />
                    {notification.sender_name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  Ahora mismo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-1 bg-gray-200">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
            className="h-full bg-blue-500"
          />
        </div>

        {/* Acciones */}
        {notification.status === 'unread' && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <button
              onClick={() => {
                onMarkAsRead(notification.notification_id);
                onClose();
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              Marcar como leída
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
} 