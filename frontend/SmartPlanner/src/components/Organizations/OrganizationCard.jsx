import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiUsers, FiGlobe, FiCalendar, FiStar, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';

export default function OrganizationCard({ 
  organization, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onPlanChange, 
  index 
}) {
  const theme = useAppTheme();
  const [isChangingPlan, setIsChangingPlan] = useState(false);

  // Obtener información del plan
  const getPlanInfo = (plan) => {
    switch (plan) {
      case 'free':
        return {
          label: 'Prueba gratuita',
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '🆓'
        };
      case 'premium':
        return {
          label: 'Premium',
          color: 'purple',
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          icon: '⭐'
        };
      case 'corporate':
        return {
          label: 'Corporate',
          color: 'indigo',
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-800',
          icon: '🏢'
        };
      default:
        return {
          label: plan,
          color: 'gray',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '❓'
        };
    }
  };

  const planInfo = getPlanInfo(organization.subscription_plan);

  // Manejar cambio de plan
  const handlePlanChange = async (newPlan) => {
    setIsChangingPlan(true);
    try {
      await onPlanChange(organization.organization_id, newPlan);
    } finally {
      setIsChangingPlan(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Header con estado y acciones */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
              {organization.name}
            </h3>
            {organization.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {organization.description}
              </p>
            )}
            
            {/* Estado de la organización */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onToggleStatus(organization.organization_id, organization.is_active)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  organization.is_active 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {organization.is_active ? <FiToggleRight /> : <FiToggleLeft />}
                {organization.is_active ? 'Activa' : 'Inactiva'}
              </button>
              
              {organization.country_code && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <FiMapPin className="w-3 h-3" />
                  {organization.country_code}
                </div>
              )}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(organization)}
              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar organización"
            >
              <FiEdit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(organization.organization_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar organización"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Plan actual */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{planInfo.icon}</span>
            <span className={`text-sm font-medium ${planInfo.textColor}`}>
              {planInfo.label}
            </span>
          </div>
          
          {/* Selector de plan */}
          <select
            value={organization.subscription_plan}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={isChangingPlan}
            className={`text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
              isChangingPlan ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'
            }`}
          >
            <option value="free">Prueba gratuita</option>
            <option value="premium">Premium</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>
      </div>

      {/* Información de contacto */}
      {(organization.primary_contact_name || organization.primary_contact_email || organization.primary_contact_phone) && (
        <div className="p-6 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Información de Contacto
          </h4>
          <div className="space-y-2">
            {organization.primary_contact_name && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiUsers className="w-3 h-3 text-gray-400" />
                <span>{organization.primary_contact_name}</span>
              </div>
            )}
            {organization.primary_contact_email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiMail className="w-3 h-3 text-gray-400" />
                <span className="truncate">{organization.primary_contact_email}</span>
              </div>
            )}
            {organization.primary_contact_phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiPhone className="w-3 h-3 text-gray-400" />
                <span>{organization.primary_contact_phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {organization.max_users}
            </div>
            <div className="text-xs text-gray-500">Usuarios máx.</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {organization.current_users_count || 0}
            </div>
            <div className="text-xs text-gray-500">Usuarios actuales</div>
          </div>
        </div>

        {/* Fechas */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-500 mb-1">Creada</div>
              <div className="font-medium">{formatDate(organization.created_at)}</div>
            </div>
            <div>
              <div className="text-gray-500 mb-1">Actualizada</div>
              <div className="font-medium">{formatDate(organization.updated_at)}</div>
            </div>
          </div>
        </div>

        {/* Zona horaria */}
        {organization.timezone && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FiCalendar className="w-3 h-3" />
              <span>Zona horaria: {organization.timezone}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
} 