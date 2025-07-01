import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiEdit2, FiTrash2, FiMoreVertical, FiUser, FiCalendar, 
  FiClock, FiTag, FiMessageSquare, FiCheckCircle, FiAlertCircle,
  FiTarget, FiStar, FiEye, FiEyeOff, FiArrowUp, FiArrowDown, FiChevronDown, FiChevronRight, FiX
} from 'react-icons/fi';

export default function TaskTable({ 
  tasks, 
  canManage, 
  onEdit, 
  onDelete, 
  onStatusChange, 
  getUserName, 
  taskStatuses, 
  taskPriorities,
  sortConfig,
  onSort,
  getSortIcon
}) {
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showMenuFor, setShowMenuFor] = useState(null);

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

  const handleQuickComplete = (taskId) => {
    const task = tasks.find(t => t.task_id === taskId);
    if (task) {
      if (task.status === 'completed') {
        onStatusChange(taskId, 'pending');
      } else {
        onStatusChange(taskId, 'completed');
      }
    }
  };

  const getProgress = (task) => {
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

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const toggleRowExpansion = (taskId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSort = (key) => {
    onSort(key);
  };

  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'created_at' || sortConfig.key === 'due_date') {
        return sortConfig.direction === 'asc' 
          ? new Date(aValue || 0) - new Date(bValue || 0)
          : new Date(bValue || 0) - new Date(aValue || 0);
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

  const sortedTasks = getSortedTasks();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarea
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Estado</span>
                  {getSortIcon('status') && <span className="text-gray-400">{getSortIcon('status')}</span>}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center space-x-1">
                  <span>Prioridad</span>
                  {getSortIcon('priority') && <span className="text-gray-400">{getSortIcon('priority')}</span>}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('assigned_to')}
              >
                <div className="flex items-center space-x-1">
                  <span>Asignado</span>
                  {getSortIcon('assigned_to') && <span className="text-gray-400">{getSortIcon('assigned_to')}</span>}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('due_date')}
              >
                <div className="flex items-center space-x-1">
                  <span>Vence</span>
                  {getSortIcon('due_date') && <span className="text-gray-400">{getSortIcon('due_date')}</span>}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progreso
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedTasks.map(task => {
              const statusInfo = getStatusInfo(task.status);
              const priorityInfo = getPriorityInfo(task.priority);
              const progress = getProgress(task);
              const isExpanded = expandedRows.has(task.task_id);

              return (
                <React.Fragment key={task.task_id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleRowExpansion(task.task_id)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {task.title}
                            </h3>
                            {task.tags && task.tags.length > 0 && (
                              <div className="flex space-x-1">
                                {task.tags.slice(0, 2).map((tag, index) => (
                                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    {tag}
                                  </span>
                                ))}
                                {task.tags.length > 2 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                    +{task.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate mt-1">
                            {task.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        statusInfo.color === 'red' ? 'bg-red-100 text-red-800' :
                        statusInfo.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        statusInfo.color === 'green' ? 'bg-green-100 text-green-800' :
                        statusInfo.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {statusInfo.icon} {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        priorityInfo.color === 'red' ? 'bg-red-50 text-red-700 border border-red-200' :
                        priorityInfo.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        priorityInfo.color === 'green' ? 'bg-green-50 text-green-700 border border-green-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        {priorityInfo.icon} {priorityInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <FiUser className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-900">{getUserName(task.assigned_to)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <FiCalendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{formatDate(task.due_date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-xs text-gray-600 mb-1">
                            <span>{progress}%</span>
                            <span>{task.actual_hours || 0}h / {task.estimated_hours || 0}h</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {/* Botón de completar rápida */}
                        <button
                          onClick={() => handleQuickComplete(task.task_id)}
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            task.status === 'completed'
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-600'
                          }`}
                          title={task.status === 'completed' ? 'Marcar pendiente' : 'Marcar como completada'}
                        >
                          <FiCheckCircle className="w-4 h-4" />
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
                          className={`p-2 rounded-lg transition-all duration-200 ${
                            task.status === 'blocked'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                          }`}
                          title={task.status === 'blocked' ? 'Desbloquear tarea' : 'Bloquear tarea'}
                        >
                          <FiX className="w-4 h-4" />
                        </button>

                        {/* Botón de ver detalles */}
                        <button
                          onClick={() => toggleRowExpansion(task.task_id)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title={isExpanded ? "Ocultar detalles" : "Ver detalles"}
                        >
                          <FiEye className="w-4 h-4" />
                        </button>

                        {/* Menú de acciones */}
                        <div className="relative">
                          <button
                            onClick={() => setShowMenuFor(showMenuFor === task.task_id ? null : task.task_id)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
                          >
                            <FiMoreVertical className="w-4 h-4" />
                          </button>
                          
                          {showMenuFor === task.task_id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <div className="py-1">
                                {canManage && (
                                  <>
                                    <button
                                      onClick={() => {
                                        onEdit(task);
                                        setShowMenuFor(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                                    >
                                      <FiEdit2 className="w-4 h-4" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        onDelete(task.task_id);
                                        setShowMenuFor(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                                    >
                                      <FiTrash2 className="w-4 h-4" />
                                      <span>Eliminar</span>
                                    </button>
                                    <div className="border-t border-gray-200 my-1"></div>
                                  </>
                                )}
                                
                                {/* Opciones de cambio de estado */}
                                {taskStatuses.map(status => (
                                  <button
                                    key={status.id}
                                    onClick={() => {
                                      onStatusChange(task.task_id, status.id);
                                      setShowMenuFor(null);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center space-x-2 ${
                                      task.status === status.id 
                                        ? 'bg-blue-50 text-blue-700' 
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                  >
                                    <span>{status.icon}</span>
                                    <span>Marcar como {status.label}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Fila expandida con detalles */}
                  {isExpanded && (
                    <tr className="bg-gray-50">
                      <td colSpan="7" className="px-6 py-4">
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Detalles de la tarea</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Descripción:</label>
                                  <p className="text-sm text-gray-600 mt-1">{task.description || 'Sin descripción'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Notas:</label>
                                  <p className="text-sm text-gray-600 mt-1">{task.notes || 'Sin notas'}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Fecha de creación:</label>
                                  <p className="text-sm text-gray-600 mt-1">{formatDate(task.created_at)}</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Información adicional</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Horas estimadas:</label>
                                  <p className="text-sm text-gray-600 mt-1">{task.estimated_hours || 0} horas</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium text-gray-700">Horas reales:</label>
                                  <p className="text-sm text-gray-600 mt-1">{task.actual_hours || 0} horas</p>
                                </div>
                                {task.tags && task.tags.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium text-gray-700">Etiquetas:</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {task.tags.map((tag, index) => (
                                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overlay para cerrar menú cuando se hace clic fuera */}
      {showMenuFor && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowMenuFor(null)}
        />
      )}
    </div>
  );
} 