import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiUsers, FiGlobe, FiCalendar, FiStar, FiMail, FiPhone, FiMapPin, FiEye, FiEyeOff, FiChevronDown, FiChevronUp, FiAward, FiTrendingUp, FiCheck } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onPlanChange, 
  index,
  onPlanMenuToggle // Nueva prop para manejar el cierre de otros menús
}) {
  const theme = useAppTheme();
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [superUsers, setSuperUsers] = useState([]);
  const [loadingSuperUsers, setLoadingSuperUsers] = useState(false);

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

  // Función para obtener super usuarios
  const fetchSuperUsers = async () => {
    if (!showDetails) return;
    
    setLoadingSuperUsers(true);
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/organizations/${organization.organization_id}/super-users`, {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuperUsers(data);
      } else {
        console.error('Error al cargar super usuarios:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar super usuarios:', error);
    } finally {
      setLoadingSuperUsers(false);
    }
  };

  // Cargar super usuarios cuando se muestran los detalles
  useEffect(() => {
    if (showDetails) {
      fetchSuperUsers();
    }
  }, [showDetails, organization.organization_id]);

  // Obtener información del plan
  const getPlanInfo = (plan) => {
    switch (plan) {
      case 'free':
        return {
          label: 'Prueba gratuita',
          color: 'gray',
          bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:from-gray-100 hover:to-gray-200',
          icon: '🆓',
          description: 'Acceso básico'
        };
      case 'premium':
        return {
          label: 'Premium',
          color: 'purple',
          bgColor: 'bg-gradient-to-br from-purple-50 to-purple-100',
          textColor: 'text-purple-700',
          borderColor: 'border-purple-200',
          hoverColor: 'hover:from-purple-100 hover:to-purple-200',
          icon: '⭐',
          description: 'Funcionalidades avanzadas'
        };
      case 'corporate':
        return {
          label: 'Corporate',
          color: 'indigo',
          bgColor: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
          textColor: 'text-indigo-700',
          borderColor: 'border-indigo-200',
          hoverColor: 'hover:from-indigo-100 hover:to-indigo-200',
          icon: '🏢',
          description: 'Solución empresarial'
        };
      default:
        return {
          label: plan,
          color: 'gray',
          bgColor: 'bg-gradient-to-br from-gray-50 to-gray-100',
          textColor: 'text-gray-700',
          borderColor: 'border-gray-200',
          hoverColor: 'hover:from-gray-100 hover:to-gray-200',
          icon: '❓',
          description: 'Plan personalizado'
        };
    }
  };

  const planInfo = getPlanInfo(organization.subscription_plan);

  // Manejar cambio de plan
  const handlePlanChange = async (newPlan) => {
    if (newPlan === organization.subscription_plan) {
      if (onPlanMenuToggle && onPlanMenuToggle.toggle) {
        onPlanMenuToggle.toggle(null); // Cerrar el menú
      }
      return;
    }
    
    setIsChangingPlan(true);
    try {
      await onPlanChange(organization.organization_id, newPlan);
      if (onPlanMenuToggle && onPlanMenuToggle.toggle) {
        onPlanMenuToggle.toggle(null); // Cerrar el menú después del cambio
      }
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Manejar apertura/cierre del menú de planes
  const handlePlanMenuToggle = () => {
    if (onPlanMenuToggle && onPlanMenuToggle.toggle) {
      onPlanMenuToggle.toggle(organization.organization_id);
    }
  };

  // Verificar si este menú está abierto
  const isPlanMenuOpen = onPlanMenuToggle && onPlanMenuToggle.currentOpenMenuId === organization.organization_id;

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Verificar si hay información de contacto
  const hasContactInfo = organization.primary_contact_name || organization.primary_contact_email || organization.primary_contact_phone;

  // Opciones de planes disponibles
  const planOptions = [
    { value: 'free', ...getPlanInfo('free') },
    { value: 'premium', ...getPlanInfo('premium') },
    { value: 'corporate', ...getPlanInfo('corporate') }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.05,
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -2, // Reducido de -4 a -2
        scale: 1.005, // Reducido de 1.01 a 1.005
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg border border-white/30 overflow-hidden hover:shadow-2xl transition-all duration-300 group"
    >
      {/* Header con gradiente sutil */}
      <div className="bg-gradient-to-br from-gray-50/50 via-white to-gray-50/30 p-6 border-b border-gray-100/50">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-1 group-hover:text-gray-800 transition-colors">
              {organization.name}
            </h3>
            {organization.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-4 leading-relaxed">
                {organization.description}
              </p>
            )}
            
            {/* Estado y país con mejor diseño */}
            <div className="flex items-center gap-3 flex-wrap">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggleStatus(organization.organization_id, organization.is_active)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 shadow-sm ${
                  organization.is_active 
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 hover:from-green-200 hover:to-emerald-200 border border-green-200' 
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 hover:from-red-200 hover:to-pink-200 border border-red-200'
                }`}
              >
                {organization.is_active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                {organization.is_active ? 'Activa' : 'Inactiva'}
              </motion.button>
              
              {organization.country_code && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full text-sm text-gray-600 border border-gray-200">
                  <FiMapPin className="w-3 h-3" />
                  <span className="font-medium">{organization.country_code}</span>
                </div>
              )}
            </div>
          </div>

          {/* Acciones con mejor diseño */}
          <div className="flex gap-2 ml-4">
            <motion.button
              whileHover={{ scale: 1.05, rotate: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEdit(organization)}
              className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="Editar organización"
            >
              <FiEdit className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, rotate: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDelete(organization.organization_id)}
              className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              title="Eliminar organización"
            >
              <FiTrash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Plan actual clickeable con menú desplegable */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handlePlanMenuToggle}
            disabled={isChangingPlan}
            className={`w-full flex items-center justify-between p-3 rounded-2xl ${planInfo.bgColor} border ${planInfo.borderColor} shadow-sm transition-all duration-200 ${planInfo.hoverColor} hover:shadow-md cursor-pointer ${
              isChangingPlan ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Cambiar plan de suscripción"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/50 rounded-xl">
                <span className="text-xl">{planInfo.icon}</span>
              </div>
              <div className="text-left">
                <span className={`text-sm font-semibold ${planInfo.textColor} block`}>
                  {planInfo.label}
                </span>
                <p className="text-xs text-gray-500 mt-1">{planInfo.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isChangingPlan && (
                <div className="p-1 bg-white/50 rounded-lg">
                  <div className="w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <motion.div
                animate={{ rotate: isPlanMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="p-1 bg-white/50 rounded-lg"
              >
                <FiChevronDown className="w-3 h-3 text-gray-600" />
              </motion.div>
            </div>
          </motion.button>

          {/* Menú desplegable de planes */}
          <AnimatePresence>
            {isPlanMenuOpen && !isChangingPlan && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-10"
              >
                <div className="p-2">
                  {planOptions.map((plan) => (
                    <motion.button
                      key={plan.value}
                      whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,0,0,0.02)' }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handlePlanChange(plan.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-150 ${
                        plan.value === organization.subscription_plan 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="p-2 bg-white/70 rounded-lg">
                        <span className="text-lg">{plan.icon}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${plan.textColor}`}>
                            {plan.label}
                          </span>
                          {plan.value === organization.subscription_plan && (
                            <FiCheck className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{plan.description}</p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Información básica con mejor diseño */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-6 mb-6">
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {organization.max_users}
            </div>
            <div className="text-sm text-gray-600 font-medium">Usuarios máx.</div>
          </motion.div>
          
          <motion.div 
            className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.15 }}
          >
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {organization.current_users_count || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">Usuarios actuales</div>
          </motion.div>
        </div>

        {/* Botón Ver detalles mejorado */}
        {(hasContactInfo || organization.timezone) && (
          <div className="mb-4">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-2xl transition-all duration-200 font-medium border border-gray-200 hover:border-gray-300 hover:shadow-md"
            >
              {showDetails ? (
                <>
                  <FiEyeOff className="w-4 h-4" />
                  Ocultar detalles
                  <FiChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <FiEye className="w-4 h-4" />
                  Ver detalles
                  <FiChevronDown className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        )}

        {/* Información de contacto con animación optimizada */}
        <AnimatePresence mode="wait">
          {showDetails && hasContactInfo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.2, 
                ease: "easeInOut"
              }}
              className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden"
            >
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiUsers className="w-4 h-4 text-blue-600" />
                Información de Contacto
              </h4>
              <div className="space-y-3">
                {organization.primary_contact_name && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FiUsers className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">{organization.primary_contact_name}</span>
                  </div>
                )}
                {organization.primary_contact_email && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FiMail className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="truncate">{organization.primary_contact_email}</span>
                  </div>
                )}
                {organization.primary_contact_phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FiPhone className="w-3 h-3 text-purple-600" />
                    </div>
                    <span>{organization.primary_contact_phone}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fechas y zona horaria con animación optimizada */}
        <AnimatePresence mode="wait">
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.2, 
                ease: "easeInOut"
              }}
              className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 overflow-hidden"
            >
              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-white/70 rounded-xl border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Creada</div>
                  <div className="text-sm font-semibold text-gray-800">{formatDate(organization.created_at)}</div>
                </div>
                <div className="text-center p-3 bg-white/70 rounded-xl border border-amber-100">
                  <div className="text-xs text-gray-500 mb-1 font-medium">Actualizada</div>
                  <div className="text-sm font-semibold text-gray-800">{formatDate(organization.updated_at)}</div>
                </div>
              </div>

              {/* Zona horaria */}
              {organization.timezone && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-white/70 rounded-xl p-3 border border-amber-100 mb-4">
                  <FiCalendar className="w-4 h-4 text-amber-600" />
                  <span className="font-medium">Zona horaria: {organization.timezone}</span>
                </div>
              )}

              {/* Información del plan de suscripción */}
              <div className="bg-white/70 rounded-xl p-3 border border-amber-100">
                <h5 className="text-xs text-gray-500 mb-2 font-medium">Plan de Suscripción</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className={`font-medium ${
                      organization.subscription_status === 'trial' ? 'text-orange-600' : 
                      organization.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {organization.subscription_status === 'trial' ? 'Prueba gratuita' :
                       organization.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {organization.subscription_start_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inicio:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(organization.subscription_start_date)}
                      </span>
                    </div>
                  )}
                  {organization.subscription_end_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(organization.subscription_end_date)}
                      </span>
                    </div>
                  )}
                  {organization.trial_end_date && organization.subscription_plan === 'free' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fin de prueba:</span>
                      <span className="font-medium text-gray-800">
                        {formatDate(organization.trial_end_date)}
                      </span>
                    </div>
                  )}
                  {organization.subscription_duration_months && organization.subscription_plan !== 'free' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duración:</span>
                      <span className="font-medium text-gray-800">
                        {organization.subscription_duration_months === 1 ? '1 mes' :
                         organization.subscription_duration_months === 3 ? '3 meses' :
                         organization.subscription_duration_months === 6 ? '6 meses' :
                         organization.subscription_duration_months === 12 ? '1 año' :
                         `${organization.subscription_duration_months} meses`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Super Usuarios */}
              <div className="bg-white/70 rounded-xl p-3 border border-amber-100">
                <h5 className="text-xs text-gray-500 mb-2 font-medium">Super Usuarios</h5>
                {loadingSuperUsers ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-gray-600 ml-2">Cargando...</span>
                  </div>
                ) : superUsers.length > 0 ? (
                  <div className="space-y-2">
                    {superUsers.length > 1 && (
                      <div className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2 mb-2">
                        ⚠️ Hay {superUsers.length} super usuarios en esta organización
                      </div>
                    )}
                    {superUsers.map((user, index) => (
                      <div key={user.user_id} className="text-sm border border-gray-200 rounded-lg p-2">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-gray-800">{user.full_name || user.username}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {user.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          {user.role === 'super_user' ? (
                            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 mt-2">
                              <span>Usuario: <span className="font-mono font-semibold text-blue-800">{user.username}</span></span>
                              <span className="mx-2">|</span>
                              <span>Contraseña: <span className="font-mono font-semibold text-blue-800">8164</span></span>
                              <button
                                className="ml-2 px-2 py-1 text-xs bg-blue-200 rounded hover:bg-blue-300 font-semibold"
                                onClick={() => navigator.clipboard.writeText('8164')}
                              >
                                Copiar
                              </button>
                            </div>
                          ) : (
                            <div>Usuario: <span className="font-mono">{user.username}</span></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 text-center py-2">
                    No se encontraron super usuarios
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
} 