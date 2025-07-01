import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMoreVertical, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, 
  FiGlobe, FiUser, FiActivity, FiClock, FiCheckCircle, FiAlertCircle,
  FiEye, FiEyeOff, FiTarget, FiTrendingUp, FiHash, FiDollarSign, 
  FiStar, FiMessageSquare, FiAlertTriangle, FiLoader
} from 'react-icons/fi';

export default function ClientCard({ 
  client, 
  countries, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getCountryName,
  isUpdatingStatus = false
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusInfo = (isActive) => {
    if (isActive) {
      return {
        color: 'green',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: FiCheckCircle,
        label: 'Activo'
      };
    } else {
      return {
        color: 'red',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: FiAlertCircle,
        label: 'Inactivo'
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const handleStatusChange = (newStatus) => {
    onStatusChange(client.client_id, newStatus);
    setShowMenu(false);
  };

  const getProjectsProgress = () => {
    // Usar el progreso promedio calculado automáticamente si está disponible
    if (client.projects_progress_average !== undefined && client.projects_progress_average !== null) {
      return client.projects_progress_average;
    }
    
    // Fallback: calcular basado en proyectos y horas (método anterior)
    const projectsCount = client.projects_count || 0;
    const totalHours = client.total_hours_registered || 0;
    
    if (projectsCount === 0) return 0;
    
    // Calcular progreso basado en proyectos activos (asumiendo que cada proyecto debería tener al menos 40 horas promedio)
    const expectedHours = projectsCount * 40;
    return Math.min((totalHours / expectedHours) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  const progress = getProjectsProgress();
  const statusInfo = getStatusInfo(client.is_active);
  const StatusIcon = statusInfo.icon;
  const isHighActivity = (client.projects_count || 0) > 3 || (client.total_hours_registered || 0) > 100;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-white rounded-2xl shadow-lg border h-[420px] flex flex-col hover:shadow-xl transition-all duration-300 ${
        isHighActivity ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-100'
      }`}    >      {/* Header de la tarjeta */}
      <div className="p-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            {/* Avatar */}
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${
              client.is_active ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gray-400'
            }`}>
              {client.name.charAt(0).toUpperCase()}
            </div>
              {/* Información del cliente y toggle switch */}
            <div className="flex-1 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg leading-tight">
                    {client.name}
                  </h3>
                  {client.code && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <FiHash className="w-3 h-3" />
                      {client.code}
                    </div>
                  )}
                </div>
                
                {/* Toggle switch más cerca del nombre */}
                {canManage && (
                  <div className="flex items-center">
                    <button
                      onClick={() => !isUpdatingStatus && handleStatusChange(!client.is_active)}
                      disabled={isUpdatingStatus}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        isUpdatingStatus 
                          ? 'opacity-70 cursor-not-allowed' 
                          : 'cursor-pointer'
                      } ${
                        client.is_active ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={isUpdatingStatus ? 'Actualizando...' : `Cambiar a ${client.is_active ? 'inactivo' : 'activo'}`}
                    >
                      {isUpdatingStatus ? (
                        <div className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-3.5">
                          <FiLoader className="w-3 h-3 animate-spin text-gray-400 ml-0.5 mt-0.5" />
                        </div>
                      ) : (
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            client.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      )}
                    </button>
                    <span className={`ml-2 text-xs font-medium ${
                      client.is_active ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Menú de acciones */}
          {canManage && (
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FiMoreVertical className="w-5 h-5 text-gray-600" />
              </button>
              
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                  >
                    <button
                      onClick={() => {
                        onEdit(client);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Editar cliente
                    </button>
                    
                    <hr className="my-2 border-gray-100" />
                    
                    <button
                      onClick={() => {
                        onDelete(client.client_id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center gap-3 text-red-600"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Eliminar cliente
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}        </div>
      </div>

      {/* Contenido principal - scrollable */}
      <div className="px-6 flex-1 overflow-y-auto">
        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          {(client.contact_email || client.contact_phone) && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <FiMail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="truncate">
                {client.contact_email && client.contact_phone 
                  ? `${client.contact_email} | ${client.contact_phone}`
                  : client.contact_email || client.contact_phone
                }
              </span>
            </div>
          )}
        </div>

        {/* Métricas críticas - siempre visibles */}
        <div className="space-y-2 mb-4">
          {/* Línea 1: Métricas críticas (requieren acción inmediata) */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100 flex-1">
              <FiMessageSquare className="w-4 h-4 text-red-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold text-red-600">{client.open_tickets_count || 0}</div>
                <div className="text-xs text-gray-500 truncate">Tickets abiertos</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100 flex-1">
              <FiAlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-lg font-bold text-amber-600">{(client.delayed_projects_count || 0) + (client.risk_projects_count || 0)}</div>
                <div className="text-xs text-gray-500 truncate">Proyectos en riesgo</div>
              </div>
            </div>
          </div>
          
          {/* Línea 2: Métricas de oportunidad */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-lg border border-orange-100 flex-1">
              <FiDollarSign className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-orange-600">${(client.pending_quotes_amount || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-500 truncate">Cotizaciones pendientes</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-100 flex-1">
              <FiStar className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-yellow-600">
                  {client.rating_average ? client.rating_average.toFixed(1) : 'N/A'}
                </div>
                <div className="text-xs text-gray-500 truncate">Calificación</div>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progreso de avance en proyectos */}
        {(client.projects_count || 0) > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Avance en proyectos</span>
              <span className="font-medium text-gray-900">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-2 rounded-full ${getProgressColor(progress)}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer - siempre en la parte inferior */}
      <div className="p-6 pt-4 flex-shrink-0 border-t border-gray-100">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          {showDetails ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
          {showDetails ? 'Ocultar' : 'Ver'} detalles
        </button>

        {/* Detalles expandibles */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100 space-y-3"
            >
              {client.address && (
                <div className="flex items-start gap-3 text-sm">
                  <FiMapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">Dirección</div>
                    <div className="text-gray-600">{client.address}</div>
                  </div>
                </div>
              )}
              
              {client.tax_id && (
                <div className="flex items-start gap-3 text-sm">
                  <FiHash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">ID Fiscal</div>
                    <div className="text-gray-600">{client.tax_id}</div>
                  </div>
                </div>
              )}
              
              {client.country_code && (
                <div className="flex items-start gap-3 text-sm">
                  <FiGlobe className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-700">País</div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className={`fi fi-${client.country_code.toLowerCase()}`}></span>
                      <span>{getCountryName(client.country_code)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 text-sm">
                <FiUser className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-700">Creado</div>
                  <div className="text-gray-600">{formatDate(client.created_at)}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
