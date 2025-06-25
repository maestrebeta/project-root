import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  FiEdit2, FiTrash2, FiEye, FiMessageSquare, FiUser, FiCalendar, 
  FiTag, FiAlertCircle, FiCheckCircle, FiClock, FiMapPin, FiMail,
  FiPhone, FiExternalLink, FiMoreVertical, FiArrowRight, FiX
} from 'react-icons/fi';

export default function TicketCard({ 
  ticket, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getUserName, 
  getClientName,
  getProjectName,
  ticketStatuses, 
  ticketPriorities 
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showActions, setShowActions] = useState(false);

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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(ticket.ticket_id, newStatus);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'nuevo': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'en_progreso': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cerrado': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'baja': return 'bg-green-100 text-green-700 border-green-200';
      case 'media': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'alta': return 'bg-red-100 text-red-700 border-red-200';
      case 'critica': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const isOverdue = () => {
    if (!ticket.due_date || ticket.status === 'cerrado') return false;
    const dueDate = new Date(ticket.due_date);
    const today = new Date();
    return dueDate < today;
  };

  const getDaysUntilDue = () => {
    if (!ticket.due_date) return null;
    const dueDate = new Date(ticket.due_date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header del ticket */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {ticket.ticket_number}
              </span>
              {isOverdue() && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Vencido
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
              {ticket.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {ticket.description}
            </p>
          </div>
          
          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>
            
            <AnimatePresence>
              {showActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setShowActions(false);
                        onEdit();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false);
                        setShowDetails(!showDetails);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <FiEye className="w-4 h-4" />
                      {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>
                    {canManage && (
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onDelete();
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Estados y prioridades */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(ticket.status)}`}>
            <span>{getStatusInfo(ticket.status).icon}</span>
            {getStatusInfo(ticket.status).label}
          </span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(ticket.priority)}`}>
            <span>{getPriorityInfo(ticket.priority).icon}</span>
            {getPriorityInfo(ticket.priority).label}
          </span>
          {ticket.category_rel && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
              <span>{ticket.category_rel.icon}</span>
              {ticket.category_rel.name}
            </span>
          )}
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FiUser className="w-4 h-4" />
            <span className="truncate">
              {ticket.assigned_to_user_id ? getUserName(ticket.assigned_to_user_id) : 'Sin asignar'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FiCalendar className="w-4 h-4" />
            <span>{formatDate(ticket.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Detalles expandibles */}
      <AnimatePresence>
        {showDetails && (
          <div className="border-t border-gray-100 p-6">
            <div className="space-y-4">
              {/* Cliente y Proyecto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Cliente</label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiUser className="w-4 h-4" />
                    <span>{getClientName(ticket.client_id)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Proyecto</label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiTag className="w-4 h-4" />
                    <span>{getProjectName(ticket.project_id)}</span>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Creado</label>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <FiCalendar className="w-4 h-4" />
                    <span>{formatDate(ticket.created_at)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vencimiento</label>
                  <div className="flex items-center gap-2 text-sm">
                    <FiClock className="w-4 h-4" />
                    {ticket.due_date ? (
                      <span className={isOverdue() ? 'text-red-600 font-medium' : 'text-gray-700'}>
                        {formatDate(ticket.due_date)}
                        {!isOverdue() && getDaysUntilDue() !== null && (
                          <span className="ml-1 text-xs text-gray-500">
                            ({getDaysUntilDue()} días)
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-gray-500">No definida</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reportado por */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Reportado por</label>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <FiUser className="w-4 h-4" />
                  <span>{getUserName(ticket.reported_by_user_id)}</span>
                </div>
              </div>

              {/* Descripción completa */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {ticket.description}
                </p>
              </div>

              {/* Botones de cambio de estado flexibles */}
              {canManage && (
                <div className="pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Cambiar Estado</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {ticket.status !== 'nuevo' && (
                      <button
                        onClick={() => handleStatusChange('nuevo')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-200 transition-all duration-200 font-medium"
                      >
                        <span>🔵</span>
                        Marcar como Nuevo
                      </button>
                    )}
                    
                    {ticket.status !== 'en_progreso' && (
                      <button
                        onClick={() => handleStatusChange('en_progreso')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 border border-orange-200 rounded-lg hover:bg-orange-200 transition-all duration-200 font-medium"
                      >
                        <span>🟠</span>
                        Marcar como En Progreso
                      </button>
                    )}
                    
                    {ticket.status !== 'cerrado' && (
                      <button
                        onClick={() => handleStatusChange('cerrado')}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition-all duration-200 font-medium"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        Marcar como Cerrado
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer con acciones rápidas */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FiEye className="w-4 h-4" />
              {showDetails ? 'Ocultar' : 'Detalles'}
            </button>
            {canManage && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
          
          {/* Botón de cerrar/reabrir grande y visible */}
          {canManage && (
            <button
              onClick={() => handleStatusChange(ticket.status === 'cerrado' ? 'en_progreso' : 'cerrado')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                ticket.status === 'cerrado'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
                  : 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200'
              }`}
              title={ticket.status === 'cerrado' ? 'Reabrir ticket' : 'Cerrar ticket'}
            >
              {ticket.status === 'cerrado' ? (
                <>
                  <FiArrowRight className="w-4 h-4" />
                  Reabrir
                </>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4" />
                  Cerrar
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 