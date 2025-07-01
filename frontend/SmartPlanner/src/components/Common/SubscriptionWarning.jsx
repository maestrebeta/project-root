import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiX, FiClock, FiStar, FiAward, FiCheckCircle, FiArrowRight, FiCalendar, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionWarning() {
  const { user } = useAuth();
  const [warning, setWarning] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkSubscriptionWarning = async () => {
      if (!user?.organization_id) return;

      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.token) return;

        const response = await fetch('http://localhost:8001/auth/subscription-info', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const subscriptionInfo = await response.json();
          
          // Verificar si hay advertencias que mostrar
          if (subscriptionInfo.should_show_trial_warning) {
            setWarning({
              type: 'trial',
              title: 'Prueba gratuita próxima a expirar',
              message: `Tu prueba gratuita expira en ${subscriptionInfo.days_until_trial_expiry} días.`,
              daysLeft: subscriptionInfo.days_until_trial_expiry,
              action: 'upgrade',
              color: 'amber',
              icon: FiClock
            });
            setIsVisible(true);
          } else if (subscriptionInfo.should_show_subscription_warning) {
            setWarning({
              type: 'subscription',
              title: 'Suscripción próxima a expirar',
              message: `Tu suscripción expira en ${subscriptionInfo.days_until_subscription_expiry} días.`,
              daysLeft: subscriptionInfo.days_until_subscription_expiry,
              action: 'renew',
              color: 'red',
              icon: FiAlertTriangle
            });
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error('Error al verificar advertencias de suscripción:', error);
      }
    };

    checkSubscriptionWarning();
  }, [user?.organization_id]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    // Guardar en localStorage para no mostrar de nuevo en esta sesión
    localStorage.setItem('subscriptionWarningDismissed', Date.now().toString());
  };

  const handleAction = () => {
    // Aquí se puede implementar la lógica para redirigir a la página de suscripción
    // Por ahora, solo cerramos la advertencia
    handleDismiss();
  };

  const getPlanInfo = (plan) => {
    switch (plan) {
      case 'premium':
        return {
          name: 'Premium',
          description: 'Funcionalidades avanzadas',
          icon: FiStar,
          color: 'purple',
          price: '$29/mes'
        };
      case 'corporate':
        return {
          name: 'Corporate',
          description: 'Solución empresarial completa',
          icon: FiAward,
          color: 'indigo',
          price: '$99/mes'
        };
      default:
        return {
          name: 'Premium',
          description: 'Funcionalidades avanzadas',
          icon: FiStar,
          color: 'purple',
          price: '$29/mes'
        };
    }
  };

  const planInfo = getPlanInfo('premium');

  if (!isVisible || isDismissed || !warning) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`fixed top-4 right-4 z-50 max-w-md w-full`}
      >
        <div className={`bg-gradient-to-r from-${warning.color}-50 to-${warning.color}-100 border border-${warning.color}-200 rounded-2xl shadow-2xl backdrop-blur-sm`}>
          {/* Header */}
          <div className={`bg-gradient-to-r from-${warning.color}-500 to-${warning.color}-600 px-6 py-4 rounded-t-2xl text-white`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <warning.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{warning.title}</h3>
                  <p className="text-sm opacity-90">
                    {warning.daysLeft === 1 ? 'Expira mañana' : `Expira en ${warning.daysLeft} días`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <p className="text-gray-700 mb-4">{warning.message}</p>
              
              {/* Contador de días */}
              <div className={`bg-${warning.color}-100 border border-${warning.color}-200 rounded-xl p-4 mb-4`}>
                <div className="flex items-center justify-center gap-3">
                  <FiCalendar className={`w-5 h-5 text-${warning.color}-600`} />
                  <div className="text-center">
                    <div className={`text-2xl font-bold text-${warning.color}-700`}>
                      {warning.daysLeft}
                    </div>
                    <div className="text-sm text-gray-600">
                      {warning.daysLeft === 1 ? 'día restante' : 'días restantes'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Información del plan recomendado */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 bg-${planInfo.color}-100 rounded-lg`}>
                    <planInfo.icon className={`w-5 h-5 text-${planInfo.color}-600`} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{planInfo.name}</h4>
                    <p className="text-sm text-gray-600">{planInfo.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{planInfo.price}</span>
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Recomendado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Más tarde
              </button>
              <button
                onClick={handleAction}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-${warning.color}-600 to-${warning.color}-700 text-white rounded-xl hover:from-${warning.color}-700 hover:to-${warning.color}-800 transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
              >
                {warning.action === 'upgrade' ? 'Actualizar Plan' : 'Renovar Suscripción'}
                <FiArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Footer info */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FiShield className="w-3 h-3" />
                <span>Tu cuenta se suspenderá automáticamente al expirar</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
} 