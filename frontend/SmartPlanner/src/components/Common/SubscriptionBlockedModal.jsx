import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { FiAlertTriangle, FiLogOut, FiMessageCircle, FiShield, FiClock, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionBlockedModal({ 
  isOpen, 
  reason, 
  organizationName,
  subscriptionInfo 
}) {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const handleContactSupport = () => {
    // Abrir enlace de soporte en nueva pestaña
    window.open('mailto:soporte@smartplanner.com?subject=Solicitud de renovación de plan', '_blank');
  };

  const getReasonIcon = () => {
    if (reason?.includes('suspendida')) return <FiShield className="w-8 h-8 text-red-500" />;
    if (reason?.includes('prueba gratuita')) return <FiClock className="w-8 h-8 text-orange-500" />;
    if (reason?.includes('expirado')) return <FiAlertTriangle className="w-8 h-8 text-red-500" />;
    return <FiAlertTriangle className="w-8 h-8 text-red-500" />;
  };

  const getReasonColor = () => {
    if (reason?.includes('suspendida')) return 'text-red-600';
    if (reason?.includes('prueba gratuita')) return 'text-orange-600';
    if (reason?.includes('expirado')) return 'text-red-600';
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
      >
        {/* Header con gradiente de advertencia */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-4">
            {getReasonIcon()}
            <div>
              <h2 className="text-xl font-bold">Acceso Bloqueado</h2>
              <p className="text-red-100 text-sm mt-1">
                {organizationName || 'Tu organización'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Mensaje principal */}
          <div className="text-center mb-6">
            <div className={`text-lg font-semibold ${getReasonColor()} mb-3`}>
              {reason || 'La suscripción de tu organización ha expirado'}
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Para continuar utilizando SmartPlanner, necesitas renovar tu plan de suscripción o contactar a nuestro equipo de soporte.
            </p>
          </div>

          {/* Información de suscripción si está disponible */}
          {subscriptionInfo && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FiStar className="w-4 h-4 text-blue-500" />
                Información de Suscripción
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan actual:</span>
                  <span className="font-medium text-gray-800 capitalize">
                    {subscriptionInfo.subscription_plan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`font-medium capitalize ${
                    subscriptionInfo.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {subscriptionInfo.subscription_status}
                  </span>
                </div>
                {subscriptionInfo.days_until_trial_expiry !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Días restantes de prueba:</span>
                    <span className="font-medium text-orange-600">
                      {subscriptionInfo.days_until_trial_expiry} días
                    </span>
                  </div>
                )}
                {subscriptionInfo.days_until_subscription_expiry !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Días restantes de suscripción:</span>
                    <span className="font-medium text-orange-600">
                      {subscriptionInfo.days_until_subscription_expiry} días
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Opciones de acción */}
          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleContactSupport}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              <FiMessageCircle className="w-5 h-5" />
              Contactar a Soporte
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogout}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300"
            >
              <FiLogOut className="w-5 h-5" />
              Volver al Login
            </motion.button>
          </div>

          {/* Información adicional */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <FiMessageCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">¿Necesitas ayuda?</p>
                <p className="text-blue-700">
                  Nuestro equipo de soporte está disponible para ayudarte a renovar tu plan o resolver cualquier inconveniente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
} 