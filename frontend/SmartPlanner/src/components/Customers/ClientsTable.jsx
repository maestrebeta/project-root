import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMoreVertical, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, 
  FiGlobe, FiUser, FiActivity, FiClock, FiCheckCircle, FiAlertCircle,
  FiEye, FiEyeOff, FiTarget, FiTrendingUp, FiHash, FiChevronDown, 
  FiChevronUp, FiAlertTriangle, FiDollarSign, FiMessageSquare, FiStar, FiLoader
} from 'react-icons/fi';

export default function ClientsTable({ 
  clients, 
  countries, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getCountryName,
  sortConfig,
  onSort,
  getSortIcon,
  updatingStatus = new Set()
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showMenuFor, setShowMenuFor] = useState(null);

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

  const handleQuickStatusChange = (clientId, currentStatus) => {
    onStatusChange(clientId, !currentStatus);
  };

  const getProjectsProgress = (client) => {
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

  const toggleRowExpansion = (clientId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedRows(newExpanded);
  };

  const handleSort = (key) => {
    onSort(key);
  };

  const getSortedClients = () => {
    return [...clients].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      // Manejar ordenamiento especial por severidad
      if (sortConfig.key === 'severity') {
        aValue = (a.open_tickets_count || 0) * 2 + 
                ((a.delayed_projects_count || 0) + (a.risk_projects_count || 0)) * 1.5;
        bValue = (b.open_tickets_count || 0) * 2 + 
                ((b.delayed_projects_count || 0) + (b.risk_projects_count || 0)) * 1.5;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });
  };

  const sortedClients = getSortedClients();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Cliente
                  <span className="text-gray-400">{getSortIcon('name')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('country_code')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  País
                  <span className="text-gray-400">{getSortIcon('country_code')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('severity')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Prioridad
                  <span className="text-gray-400">{getSortIcon('severity')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('projects_count')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Proyectos
                  <span className="text-gray-400">{getSortIcon('projects_count')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('open_tickets_count')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Tickets
                  <span className="text-gray-400">{getSortIcon('open_tickets_count')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('pending_quotes_amount')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Pendiente $
                  <span className="text-gray-400">{getSortIcon('pending_quotes_amount')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('risk_projects_count')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  En Riesgo
                  <span className="text-gray-400">{getSortIcon('risk_projects_count')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('is_active')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Estado
                  <span className="text-gray-400">{getSortIcon('is_active')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <span className="sr-only">Expandir</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedClients.map((client) => {
              const statusInfo = getStatusInfo(client.is_active);
              const StatusIcon = statusInfo.icon;
              const progress = getProjectsProgress(client);
              const isExpanded = expandedRows.has(client.client_id);
              const isHighActivity = (client.projects_count || 0) > 3 || (client.total_hours_registered || 0) > 100;

              return (
                <React.Fragment key={client.client_id}>
                  <motion.tr 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`hover:bg-gray-50 transition-all duration-200 ${
                      isHighActivity ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Cliente */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold ${
                          client.is_active 
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                            : 'bg-gray-400'
                        }`}>
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-gray-900">
                              {client.name}
                            </div>
                            {isHighActivity && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                <FiTrendingUp className="w-3 h-3" />
                                Alta actividad
                              </div>
                            )}
                          </div>
                          {client.code && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <FiHash className="w-3 h-3" />
                              {client.code}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contacto */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {client.contact_email ? (
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <FiMail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[150px]">{client.contact_email}</span>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Sin email</div>
                        )}
                      </div>
                    </td>

                    {/* País */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {client.country_code ? (
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <span className={`fi fi-${client.country_code.toLowerCase()}`}></span>
                          <span className="truncate max-w-[100px]">{getCountryName(client.country_code)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">N/A</span>
                      )}
                    </td>

                    {/* Severidad/Prioridad */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const severityScore = (client.open_tickets_count || 0) * 2 + 
                                            ((client.delayed_projects_count || 0) + (client.risk_projects_count || 0)) * 1.5;
                        if (severityScore >= 10) {
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <FiAlertTriangle className="w-3 h-3" />
                              Alta
                            </div>
                          );
                        } else if (severityScore >= 5) {
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              <FiAlertCircle className="w-3 h-3" />
                              Media
                            </div>
                          );
                        } else if (severityScore > 0) {
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              <FiClock className="w-3 h-3" />
                              Baja
                            </div>
                          );
                        } else {
                          return (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <FiCheckCircle className="w-3 h-3" />
                              Normal
                            </div>
                          );
                        }
                      })()}
                    </td>

                    {/* Proyectos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiTarget className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {client.projects_count || 0}
                        </span>
                      </div>
                    </td>

                    {/* Tickets Abiertos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiMessageSquare className={`w-4 h-4 ${
                          (client.open_tickets_count || 0) > 5 ? 'text-red-500' :
                          (client.open_tickets_count || 0) > 2 ? 'text-amber-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          (client.open_tickets_count || 0) > 5 ? 'text-red-600' :
                          (client.open_tickets_count || 0) > 2 ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {client.open_tickets_count || 0}
                        </span>
                      </div>
                    </td>

                    {/* Cotizaciones Pendientes */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiDollarSign className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-600">
                          ${(client.pending_quotes_amount || 0).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Proyectos en Riesgo */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiAlertTriangle className={`w-4 h-4 ${
                          ((client.delayed_projects_count || 0) + (client.risk_projects_count || 0)) > 2 ? 'text-red-500' :
                          ((client.delayed_projects_count || 0) + (client.risk_projects_count || 0)) > 0 ? 'text-amber-500' : 'text-gray-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          ((client.delayed_projects_count || 0) + (client.risk_projects_count || 0)) > 2 ? 'text-red-600' :
                          ((client.delayed_projects_count || 0) + (client.risk_projects_count || 0)) > 0 ? 'text-amber-600' : 'text-gray-900'
                        }`}>
                          {(client.delayed_projects_count || 0) + (client.risk_projects_count || 0)}
                        </span>
                      </div>
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManage ? (
                        <button
                          onClick={() => !updatingStatus.has(client.client_id) && handleQuickStatusChange(client.client_id, client.is_active)}
                          disabled={updatingStatus.has(client.client_id)}
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                            updatingStatus.has(client.client_id)
                              ? 'opacity-70 cursor-not-allowed'
                              : 'hover:scale-105 hover:shadow-md hover:brightness-95 cursor-pointer'
                          } ${statusInfo.bgColor} ${statusInfo.textColor} ${statusInfo.borderColor} border`}
                          title={updatingStatus.has(client.client_id) ? 'Actualizando...' : `Clic para ${client.is_active ? 'desactivar' : 'activar'} el cliente`}
                        >
                          {updatingStatus.has(client.client_id) ? (
                            <FiLoader className="w-3 h-3 animate-spin" />
                          ) : (
                            <StatusIcon className="w-3 h-3" />
                          )}
                          {updatingStatus.has(client.client_id) ? 'Actualizando...' : statusInfo.label}
                        </button>
                      ) : (
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          statusInfo.bgColor
                        } ${statusInfo.textColor} ${statusInfo.borderColor} border`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {canManage && (
                        <div className="relative">
                          <button
                            onClick={() => setShowMenuFor(showMenuFor === client.client_id ? null : client.client_id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          >
                            <FiMoreVertical className="w-4 h-4 text-gray-600" />
                          </button>
                          
                          <AnimatePresence>
                            {showMenuFor === client.client_id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-10"
                              >
                                <button
                                  onClick={() => {
                                    onEdit(client);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                                >
                                  <FiEdit2 className="w-4 h-4" />
                                  Editar cliente
                                </button>
                                
                                <button
                                  onClick={() => {
                                    handleQuickStatusChange(client.client_id, client.is_active);
                                    setShowMenuFor(null);
                                  }}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                                >
                                  {client.is_active ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                                  {client.is_active ? 'Desactivar' : 'Activar'}
                                </button>
                                
                                <hr className="my-2 border-gray-100" />
                                
                                <button
                                  onClick={() => {
                                    onDelete(client.client_id);
                                    setShowMenuFor(null);
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
                      )}
                    </td>

                    {/* Expandir */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRowExpansion(client.client_id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {isExpanded ? (
                          <FiChevronUp className="w-4 h-4 text-gray-600" />
                        ) : (
                          <FiChevronDown className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    </td>
                  </motion.tr>

                  {/* Fila expandida con detalles */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <td colSpan="11" className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Información de contacto detallada */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FiUser className="w-4 h-4" />
                                Información de Contacto
                              </h4>
                              <div className="space-y-2 text-sm">
                                {client.contact_email && (
                                  <div className="flex items-center gap-2">
                                    <FiMail className="w-3 h-3 text-gray-400" />
                                    <span>{client.contact_email}</span>
                                  </div>
                                )}
                                {client.contact_phone && (
                                  <div className="flex items-center gap-2">
                                    <FiPhone className="w-3 h-3 text-gray-400" />
                                    <span>{client.contact_phone}</span>
                                  </div>
                                )}
                                {client.address && (
                                  <div className="flex items-start gap-2">
                                    <FiMapPin className="w-3 h-3 text-gray-400 mt-0.5" />
                                    <span>{client.address}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Información fiscal y país */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FiGlobe className="w-4 h-4" />
                                Información Legal
                              </h4>
                              <div className="space-y-2 text-sm">
                                {client.tax_id && (
                                  <div className="flex items-center gap-2">
                                    <FiHash className="w-3 h-3 text-gray-400" />
                                    <span>ID Fiscal: {client.tax_id}</span>
                                  </div>
                                )}
                                {client.country_code && (
                                  <div className="flex items-center gap-2">
                                    <span className={`fi fi-${client.country_code.toLowerCase()}`}></span>
                                    <span>{getCountryName(client.country_code)}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <FiUser className="w-3 h-3 text-gray-400" />
                                  <span>Creado: {formatDate(client.created_at)}</span>
                                </div>
                              </div>
                            </div>

                            {/* Métricas de actividad */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FiActivity className="w-4 h-4" />
                                Métricas de Actividad
                              </h4>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="text-lg font-bold text-orange-600">${(client.pending_quotes_amount || 0).toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">Pendiente</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <div className="text-lg font-bold text-yellow-600">
                                    {client.rating_average ? client.rating_average.toFixed(1) : 'N/A'}
                                  </div>
                                  <div className="text-xs text-gray-500">Calificación</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                  <div className="text-lg font-bold text-red-600">{client.open_tickets_count || 0}</div>
                                  <div className="text-xs text-gray-500">Tickets</div>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="text-lg font-bold text-amber-600">{(client.delayed_projects_count || 0) + (client.risk_projects_count || 0)}</div>
                                  <div className="text-xs text-gray-500">En riesgo</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}