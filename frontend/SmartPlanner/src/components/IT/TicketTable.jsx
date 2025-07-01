import React, { useState } from 'react';
import { 
  FiEdit2, FiTrash2, FiEye, FiMessageSquare, FiUser, FiCalendar, 
  FiTag, FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiMail,
  FiPhone, FiExternalLink, FiMoreVertical, FiArrowRight, FiX, FiChevronDown, FiChevronUp
} from 'react-icons/fi';

export default function TicketTable({ 
  tickets, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getUserName, 
  getClientName,
  getProjectName,
  getDaysOpen,
  ticketStatuses, 
  ticketPriorities,
  onSort,
  getSortIcon
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const getStatusInfo = (status) => {
    const statusInfo = ticketStatuses.find(s => s.id === status);
    return statusInfo || { label: status, color: 'gray', icon: '❓' };
  };

  const getPriorityInfo = (priority) => {
    const priorityInfo = ticketPriorities.find(p => p.id === priority);
    return priorityInfo || { label: priority, color: 'gray', icon: '❓' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No definida';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleQuickClose = (ticketId) => {
    const ticket = tickets.find(t => t.ticket_id === ticketId);
    if (ticket) {
      if (ticket.status === 'cerrado') {
        onStatusChange(ticketId, 'en_progreso');
      } else {
        onStatusChange(ticketId, 'cerrado');
      }
    }
  };

  const toggleRowExpansion = (ticketId) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nuevo': return 'bg-blue-100 text-blue-800';
      case 'en_progreso': return 'bg-yellow-100 text-yellow-800';
      case 'cerrado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'baja': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-red-100 text-red-800';
      case 'critica': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto descriptivo para los días
  const getDaysText = (days) => {
    if (days === 0) return 'Hoy';
    if (days === 1) return '1 día';
    if (days < 7) return `${days} días`;
    if (days < 30) return `${Math.floor(days / 7)} semana${Math.floor(days / 7) > 1 ? 's' : ''}`;
    if (days < 365) return `${Math.floor(days / 30)} mes${Math.floor(days / 30) > 1 ? 'es' : ''}`;
    return `${Math.floor(days / 365)} año${Math.floor(days / 365) > 1 ? 's' : ''}`;
  };

  // Obtener color para los días según el tiempo
  const getDaysColor = (days, status) => {
    if (status === 'cerrado') return 'text-green-600 bg-green-50';
    if (days <= 1) return 'text-green-600 bg-green-50';
    if (days <= 3) return 'text-blue-600 bg-blue-50';
    if (days <= 7) return 'text-yellow-600 bg-yellow-50';
    if (days <= 30) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ticket
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('title')}
              >
                <div className="flex items-center gap-2">
                  Título
                  {getSortIcon('title')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('status')}
              >
                <div className="flex items-center gap-2">
                  Estado
                  {getSortIcon('status')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('priority')}
              >
                <div className="flex items-center gap-2">
                  Prioridad
                  {getSortIcon('priority')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asignado a
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proyecto
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center gap-1">
                  Creado {getSortIcon('created_at')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tiempo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <React.Fragment key={ticket.ticket_id}>
                <tr className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleRowExpansion(ticket.ticket_id)}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                      >
                        {expandedRows.has(ticket.ticket_id) ? (
                          <FiChevronUp className="w-4 h-4" />
                        ) : (
                          <FiChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="text-sm font-mono text-gray-900">
                          {ticket.ticket_number}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                      {ticket.title}
                    </div>
                    <div className="text-sm text-gray-500 max-w-xs truncate">
                      {ticket.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
                      <span>{getStatusInfo(ticket.status).icon}</span>
                      {getStatusInfo(ticket.status).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
                      <span>{getPriorityInfo(ticket.priority).icon}</span>
                      {getPriorityInfo(ticket.priority).label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.category_rel && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                        <span>{ticket.category_rel.icon}</span>
                        {ticket.category_rel.name}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {ticket.assigned_to_user_id ? getUserName(ticket.assigned_to_user_id) : 'Sin asignar'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FiTag className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {getProjectName(ticket.project_id)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(ticket.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getDaysColor(getDaysOpen(ticket), ticket.status)}`}>
                      <FiClock className="w-3 h-3" />
                      {ticket.status === 'cerrado' ? 'Resuelto en' : 'Abierto'} {getDaysText(getDaysOpen(ticket))}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* Botón de cerrar/reabrir rápido - Solo ícono */}
                      <button
                        onClick={() => handleQuickClose(ticket.ticket_id)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          ticket.status === 'cerrado'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={ticket.status === 'cerrado' ? 'Reabrir ticket' : 'Cerrar ticket'}
                      >
                        {ticket.status === 'cerrado' ? (
                          <FiArrowRight className="w-4 h-4" />
                        ) : (
                          <FiCheckCircle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Botón de editar - Solo ícono */}
                      {canManage && (
                        <button
                          onClick={() => onEdit(ticket)}
                          className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
                          title="Editar ticket"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Botón de eliminar - Solo ícono */}
                      {canManage && (
                        <button
                          onClick={() => onDelete(ticket.ticket_id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200"
                          title="Eliminar ticket"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                
                {/* Fila expandida con detalles */}
                {expandedRows.has(ticket.ticket_id) && (
                  <tr>
                    <td colSpan="10" className="px-6 py-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Información del ticket */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Información del Ticket</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Número:</span>
                              <span className="ml-2 font-mono text-gray-900">{ticket.ticket_number}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Título:</span>
                              <span className="ml-2 text-gray-900">{ticket.title}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Descripción:</span>
                              <p className="mt-1 text-gray-900 leading-relaxed">{ticket.description}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Reportado por:</span>
                              <span className="ml-2 text-gray-900">{getUserName(ticket.reported_by_user_id)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Fechas y estado */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Fechas y Estado</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Creado:</span>
                              <span className="ml-2 text-gray-900">{formatDate(ticket.created_at)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Actualizado:</span>
                              <span className="ml-2 text-gray-900">{formatDate(ticket.updated_at)}</span>
                            </div>
                            {ticket.resolved_at && (
                              <div>
                                <span className="text-gray-500">Resuelto:</span>
                                <span className="ml-2 text-gray-900">{formatDate(ticket.resolved_at)}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Asignaciones */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Asignaciones</h4>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="text-gray-500">Asignado a:</span>
                              <span className="ml-2 text-gray-900">
                                {ticket.assigned_to_user_id ? getUserName(ticket.assigned_to_user_id) : 'Sin asignar'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Cliente:</span>
                              <span className="ml-2 text-gray-900">{getClientName(ticket.client_id)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Proyecto:</span>
                              <span className="ml-2 text-gray-900">{getProjectName(ticket.project_id)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 