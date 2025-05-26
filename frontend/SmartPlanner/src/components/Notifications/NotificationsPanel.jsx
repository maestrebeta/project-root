import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell, FiClock, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';

const FILTERS = ['Todas', 'No leídas', 'Alertas', 'Info'];

export default function NotificationsPanel({ onClose }) {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState('Todas');
  const { 
    notifications, 
    markAsRead, 
    markAllAsRead,
    unreadCount 
  } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'alert':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <FiInfo className="w-5 h-5 text-blue-500" />;
      default:
        return <FiBell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5;

    if (diffInHours < 24) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  const filteredNotifications = notifications.filter(n => {
    switch (activeFilter) {
      case 'No leídas':
        return !n.read;
      case 'Alertas':
        return n.type === 'alert';
      case 'Info':
        return n.type === 'info';
      default:
        return true;
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`fixed right-4 top-20 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden ${theme.FONT_CLASS} z-[100]`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FiBell className={`w-6 h-6 ${theme.PRIMARY_COLOR_CLASS}`} />
          <div>
            <h2 className="text-lg font-bold text-gray-800">Notificaciones</h2>
            <p className="text-sm text-gray-500">
              {unreadCount} sin leer
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiX className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Filters */}
      <div className="px-2 py-2 border-b border-gray-200 bg-gray-50 flex gap-2 overflow-x-auto">
        {FILTERS.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all
              ${activeFilter === filter 
                ? `${theme.PRIMARY_BG_MEDIUM} text-white` 
                : 'bg-white text-gray-600 hover:bg-gray-100'}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="overflow-y-auto max-h-[60vh]">
        <AnimatePresence>
          {filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer
                    ${!notification.read ? 'bg-blue-50/50' : ''}`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex gap-4">
                    <div className="mt-1">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded text-xs font-medium ${theme.PRIMARY_BG_SOFT} ${theme.PRIMARY_FONT_CLASS}`}>
                          Nueva
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <FiBell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-center">
                No hay notificaciones {activeFilter !== 'Todas' ? 'con este filtro' : ''}
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <button 
          className={`text-sm font-medium ${theme.PRIMARY_COLOR_CLASS} hover:underline`}
          onClick={markAllAsRead}
        >
          Marcar todas como leídas
        </button>
      </div>
    </motion.div>
  );
} 