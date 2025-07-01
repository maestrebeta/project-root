import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { 
  FiEdit2, FiTrash2, FiMoreVertical, FiUser, FiCalendar, 
  FiClock, FiTag, FiMessageSquare, FiCheckCircle, FiAlertCircle,
  FiArrowRight, FiX
} from 'react-icons/fi';

export default function TaskCard({ 
  task, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getUserName, 
  taskStatuses, 
  taskPriorities 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const getStatusInfo = (status) => {
    // Primero buscar en la configuración de la organización
    const configStatus = taskStatuses.find(s => s.id === status);
    if (configStatus) {
      return configStatus;
    }
    
    // Si no está en la configuración, usar traducciones por defecto
    const statusMap = {
      'pending': { label: 'Pendiente', color: 'red', icon: '🔴' },
      'in_progress': { label: 'En Progreso', color: 'blue', icon: '🔵' },
      'completed': { label: 'Completada', color: 'green', icon: '🟢' },
      'blocked': { label: 'Bloqueada', color: 'orange', icon: '🟠' },
      'cancelled': { label: 'Cancelada', color: 'gray', icon: '⚫' }
    };
    
    return statusMap[status] || { label: status, color: 'gray', icon: '🔘' };
  };

  const getPriorityInfo = (priority) => {
    // Primero buscar en la configuración de la organización
    const configPriority = taskPriorities.find(p => p.id === priority);
    if (configPriority) {
      return configPriority;
    }
    
    // Si no está en la configuración, usar traducciones por defecto
    const priorityMap = {
      'low': { label: 'Baja', color: 'green', icon: '🟢' },
      'medium': { label: 'Media', color: 'yellow', icon: '🟡' },
      'high': { label: 'Alta', color: 'red', icon: '🔴' },
      'urgent': { label: 'Urgente', color: 'red', icon: '🚨' }
    };
    
    return priorityMap[priority] || { label: priority, color: 'gray', icon: '🔘' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.task_id, newStatus);
    setShowMenu(false);
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgress = () => {
    // Si la tarea está completada, mostrar 100%
    if (task.status === 'completed') {
      return 100;
    }
    
    // Si no está completada, calcular basado en horas estimadas vs reales
    if (task.estimated_hours && task.actual_hours) {
      return Math.min(100, Math.round((task.actual_hours / task.estimated_hours) * 100));
    }
    
    return 0;
  };

  const progress = getProgress();
  const statusInfo = getStatusInfo(task.status);
  const priorityInfo = getPriorityInfo(task.priority);
  const isUrgent = task.priority === 'urgent' || (task.due_date && new Date(task.due_date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000));

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 overflow-hidden group ${
        isUrgent ? 'border-red-200 hover:border-red-300' : 'border-gray-100 hover:border-gray-200'
      } h-full flex flex-col`}
    >
      {/* Indicador de urgencia */}
      {isUrgent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
      )}

      {/* Header de la tarjeta */}
      <div className="p-6 pb-4">
        {/* Título y menú */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
              statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
              statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
              statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {statusInfo.icon} {statusInfo.label}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              priorityInfo.color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
              priorityInfo.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              priorityInfo.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-gray-50 text-gray-700 border border-gray-200'
            }`}>
              {priorityInfo.icon} {priorityInfo.label}
            </span>
          </div>
          
          {/* Menú de acciones */}
          {canManage && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onEdit(task);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(task.task_id);
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Eliminar</span>
                    </button>
                    <div className="border-t border-gray-200 my-1"></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Título y descripción con altura fija */}
        <div className="mb-4 flex-1">
          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2 leading-tight">
            {task.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
            {task.description || 'Sin descripción'}
          </p>
        </div>
      </div>

      {/* Información de progreso y horas */}
      <div className="px-6 pb-4">
        {task.estimated_hours && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Progreso</span>
              <span className="text-gray-800 font-medium">
                {task.actual_hours || 0}h / {task.estimated_hours}h
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Información de asignación y fechas */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-2 text-gray-600">
            <FiUser className="w-4 h-4" />
            <span>{getUserName(task.assigned_to)}</span>
          </div>
          
          {task.due_date && (
            <div className="flex items-center space-x-2 text-gray-600">
              <FiCalendar className="w-4 h-4" />
              <span>Vence: {formatDate(task.due_date)}</span>
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center space-x-2">
              <FiTag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {tag}
                  </span>
                ))}
                {task.tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    +{task.tags.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer con botones de acción */}
      <div className="px-6 pb-6 mt-auto">
        <div className="flex items-center justify-between">
          {/* Botones de acción principales */}
          <div className="flex items-center space-x-2">
            {/* Botón de completar rápida */}
            <button
              onClick={() => {
                if (task.status === 'completed') {
                  onStatusChange(task.task_id, 'pending');
                } else {
                  onStatusChange(task.task_id, 'completed');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700 hover:border-green-200 border border-gray-200'
              }`}
            >
              <FiCheckCircle className={`w-4 h-4 ${task.status === 'completed' ? 'text-green-600' : 'text-gray-500'}`} />
              <span className="text-sm font-medium">
                {task.status === 'completed' ? 'Marcar pendiente' : 'Completar'}
              </span>
            </button>

            {/* Botón de toggle blocked */}
            <button
              onClick={() => {
                if (task.status === 'blocked') {
                  onStatusChange(task.task_id, 'pending');
                } else {
                  onStatusChange(task.task_id, 'blocked');
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                task.status === 'blocked'
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 hover:border-red-200 border border-gray-200'
              }`}
              title={task.status === 'blocked' ? 'Desbloquear tarea' : 'Bloquear tarea'}
            >
              <FiX className={`w-4 h-4 ${task.status === 'blocked' ? 'text-red-600' : 'text-gray-500'}`} />
              <span className="text-sm font-medium">
                {task.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
              </span>
            </button>
          </div>

          {/* Botón de ver detalles */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 border border-blue-200"
          >
            <span className="text-sm font-medium">Ver detalles</span>
            <FiArrowRight className={`w-4 h-4 transition-transform duration-200 ${showDetails ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Detalles expandibles */}
      <AnimatePresence>
        {showDetails && (
          <div
            className="border-t border-gray-100 bg-gray-50"
          >
            <div className="p-6 space-y-4">
              {/* Notas */}
              {task.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiMessageSquare className="w-4 h-4" />
                    Notas
                  </h4>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                    {task.notes}
                  </p>
                </div>
              )}

              {/* Información adicional */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Creada:</span>
                  <p className="font-medium text-gray-700">
                    {new Date(task.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Actualizada:</span>
                  <p className="font-medium text-gray-700">
                    {new Date(task.updated_at || task.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>

              {/* Cambio de estado (solo para usuarios que pueden gestionar) */}
              {canManage && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Cambiar estado</h4>
                  <div className="flex flex-wrap gap-2">
                    {taskStatuses.map((status) => (
                      <button
                        key={status.id}
                        onClick={() => handleStatusChange(status.id)}
                        disabled={task.status === status.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                          task.status === status.id
                            ? `${status.color === 'red' ? 'bg-red-100 text-red-700' : status.color === 'blue' ? 'bg-blue-100 text-blue-700' : status.color === 'green' ? 'bg-green-100 text-green-700' : status.color === 'orange' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'} border border-gray-200 cursor-not-allowed`
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
                        }`}
                      >
                        <span>{status.icon}</span>
                        <span>{status.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Overlay para cerrar menú al hacer clic fuera */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
} 