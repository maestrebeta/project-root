import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMoreVertical, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, 
  FiGlobe, FiUser, FiActivity, FiClock, FiCheckCircle, FiAlertCircle,
  FiEye, FiEyeOff, FiTarget, FiTrendingUp, FiHash, FiChevronDown, FiChevronUp, FiLoader
} from 'react-icons/fi';

export default function ClientTable({ 
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
  updatingStatus
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
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
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
                  onClick={() => handleSort('projects_count')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Proyectos
                  <span className="text-gray-400">{getSortIcon('projects_count')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button 
                  onClick={() => handleSort('total_hours_registered')}
                  className="flex items-center gap-2 hover:text-gray-700 transition-colors"
                >
                  Horas
                  <span className="text-gray-400">{getSortIcon('total_hours_registered')}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avance
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <span className="sr-only">Expandir</span>              </th>
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
                  >                    {/* Cliente */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-between">
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
                                  Alto avance
                                </div>
                              )}
                            </div>
                            {client.code && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <FiHash className="w-3 h-3" />
                                {client.code}
                              </div>
                            )}                          </div>
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
                        {client.contact_phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <FiPhone className="w-3 h-3" />
                            {client.contact_phone}
                          </div>
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

                    {/* Proyectos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiTarget className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {client.projects_count || 0}
                        </span>
                      </div>
                    </td>

                    {/* Horas Registradas */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {client.total_hours_registered || 0}h
                        </span>
                      </div>
                    </td>

                    {/* Avance en proyectos */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(client.projects_count || 0) > 0 ? (
                        <div className="w-full">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">Progreso</span>
                            <span className="font-medium">{Math.round(progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Sin progreso</span>
                      )}                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {canManage ? (
                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={client.is_active}
                              onChange={(e) => handleQuickStatusChange(client.client_id, client.is_active)}
                              disabled={updatingStatus.has(client.client_id)}
                              className="sr-only"
                            />
                            <div className={`relative w-11 h-6 rounded-full peer transition-colors duration-200 ease-in-out ${
                              updatingStatus.has(client.client_id)
                                ? 'bg-gray-300 cursor-not-allowed'
                                : client.is_active 
                                  ? 'bg-green-500 hover:bg-green-600' 
                                  : 'bg-gray-300 hover:bg-gray-400'
                            }`}>
                              <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-300 rounded-full h-5 w-5 transition-transform duration-200 ease-in-out flex items-center justify-center ${
                                client.is_active ? 'translate-x-5' : 'translate-x-0'
                              }`}>
                                {updatingStatus.has(client.client_id) ? (
                                  <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                ) : client.is_active ? (
                                  <FiCheckCircle className="w-3 h-3 text-green-500" />
                                ) : (
                                  <FiAlertCircle className="w-3 h-3 text-gray-400" />
                                )}
                              </div>
                            </div>
                            <span className={`ml-2 text-xs font-medium ${
                              updatingStatus.has(client.client_id) 
                                ? 'text-gray-400'
                                : 'text-gray-700'
                            }`}>
                              {updatingStatus.has(client.client_id) 
                                ? 'Actualizando...' 
                                : client.is_active ? 'Activo' : 'Inactivo'
                              }
                            </span>
                          </label>
                        </div>
                      ) : (
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          client.is_active 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {client.is_active ? 'Activo' : 'Inactivo'}
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
                              >                                <button
                                  onClick={() => {
                                    onEdit(client);
                                    setShowMenuFor(null);
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
                        <td colSpan="10" className="px-6 py-4 bg-gray-50 border-b border-gray-200">
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
                            </div>                            {/* Métricas de avance */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <FiActivity className="w-4 h-4" />
                                Métricas de Avance en Proyectos
                              </h4>
                              <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                  <div className="text-lg font-bold text-orange-600">${(client.pending_quotes_amount || 0).toLocaleString()}</div>
                                  <div className="text-xs text-gray-500">Pendiente</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <div className="text-lg font-bold text-yellow-600">{(client.client_rating || 0).toFixed(1)}</div>
                                  <div className="text-xs text-gray-500">Calificación</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                                  <div className="text-lg font-bold text-red-600">{client.open_tickets_count || 0}</div>
                                  <div className="text-xs text-gray-500">Tickets Abiertos</div>
                                </div>
                                <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
                                  <div className="text-lg font-bold text-amber-600">{client.delayed_projects_count || 0}</div>
                                  <div className="text-xs text-gray-500">Retrasados</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                                  <div className="text-lg font-bold text-red-600">{client.risk_projects_count || 0}</div>
                                  <div className="text-xs text-gray-500">En Riesgo</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                                  <div className="text-lg font-bold text-blue-600">{Math.round(progress)}%</div>
                                  <div className="text-xs text-gray-500">Progreso</div>
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
