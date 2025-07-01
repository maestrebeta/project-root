import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useSubscriptionValidation = () => {
  const { user, isAuthenticated } = useAuth();
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Validar suscripción
  const validateSubscription = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    // Eliminar la excepción para super usuarios - todos deben validar su organización
    try {
      setLoading(true);
      setError(null);

      const headers = getAuthHeaders();
      
      // Obtener información de suscripción
      const subscriptionResponse = await fetch('http://localhost:8001/auth/subscription-info', {
        headers,
        credentials: 'include'
      });

      if (subscriptionResponse.ok) {
        const subscriptionData = await subscriptionResponse.json();
        setSubscriptionInfo(subscriptionData);
        
        // Verificar si la organización está inactiva
        if (subscriptionData.organization_status === 'inactive' || !subscriptionData.organization_active) {
          setIsBlocked(true);
          setBlockReason('La organización está inactiva. Contacta a soporte para más información.');
          return;
        }
        
        // Verificar si la suscripción está activa
        if (!subscriptionData.is_subscription_active) {
          setIsBlocked(true);
          setBlockReason(subscriptionData.reason || 'La suscripción ha expirado');
        } else {
          setIsBlocked(false);
          setBlockReason('');
        }
      } else {
        // Si no se puede obtener información de suscripción, intentar validar directamente
        const validateResponse = await fetch('http://localhost:8001/auth/validate-subscription', {
          headers,
          credentials: 'include'
        });

        if (!validateResponse.ok) {
          const errorData = await validateResponse.json();
          setIsBlocked(true);
          setBlockReason(errorData.detail || 'Error de validación de suscripción');
        } else {
          setIsBlocked(false);
          setBlockReason('');
        }
      }
    } catch (error) {
      console.error('Error al validar suscripción:', error);
      setError(error.message);
      // En caso de error de conexión, no bloquear el acceso
      setIsBlocked(false);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Validar suscripción en cada cambio de usuario o autenticación
  useEffect(() => {
    validateSubscription();
  }, [validateSubscription]);

  // Función para revalidar manualmente
  const revalidate = useCallback(() => {
    validateSubscription();
  }, [validateSubscription]);

  // Función para verificar si debe mostrar advertencia
  const shouldShowWarning = useCallback(() => {
    if (!subscriptionInfo) return false;
    
    return (
      subscriptionInfo.should_show_trial_warning ||
      subscriptionInfo.should_show_subscription_warning
    );
  }, [subscriptionInfo]);

  // Función para obtener el mensaje de advertencia
  const getWarningMessage = useCallback(() => {
    if (!subscriptionInfo) return null;

    if (subscriptionInfo.should_show_trial_warning && subscriptionInfo.days_until_trial_expiry !== null) {
      return {
        type: 'trial',
        message: `Tu período de prueba gratuita expira en ${subscriptionInfo.days_until_trial_expiry} días`,
        daysLeft: subscriptionInfo.days_until_trial_expiry
      };
    }

    if (subscriptionInfo.should_show_subscription_warning && subscriptionInfo.days_until_subscription_expiry !== null) {
      return {
        type: 'subscription',
        message: `Tu suscripción expira en ${subscriptionInfo.days_until_subscription_expiry} días`,
        daysLeft: subscriptionInfo.days_until_subscription_expiry
      };
    }

    return null;
  }, [subscriptionInfo]);

  return {
    subscriptionInfo,
    isBlocked,
    blockReason,
    loading,
    error,
    revalidate,
    shouldShowWarning: shouldShowWarning(),
    warningMessage: getWarningMessage(),
    organizationName: subscriptionInfo?.organization_name || user?.organization_name
  };
}; 