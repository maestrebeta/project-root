import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiX, FiAlertCircle, FiInfo } from 'react-icons/fi';

const iconMap = {
  success: FiCheck,
  error: FiX,
  warning: FiAlertCircle,
  info: FiInfo
};

const bgColorMap = {
  success: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800'
};

const NotificationPortal = ({ notification }) => {
  if (!notification) return null;

  const Icon = iconMap[notification.type] || FiInfo;
  const bgColor = bgColorMap[notification.type] || 'bg-blue-100 text-blue-800';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className={`fixed bottom-6 right-6 z-[9999] px-4 py-3 rounded-lg shadow-xl flex items-start space-x-3 ${bgColor}`}
        style={{
          maxWidth: 'calc(100vw - 3rem)',
          width: 'auto',
          minWidth: '250px'
        }}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex-shrink-0 pt-0.5">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPortal;