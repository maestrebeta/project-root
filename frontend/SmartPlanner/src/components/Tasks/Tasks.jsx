import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FiPlus, FiFilter, FiSearch, FiEye, FiEyeOff, FiCheckCircle, 
  FiClock, FiAlertCircle, FiUser, FiCalendar, FiTag, FiMessageSquare,
  FiEdit2, FiTrash2, FiMoreVertical, FiArrowRight, FiUsers, FiTarget,
  FiTrendingUp, FiTrendingDown, FiActivity, FiStar, FiZap, FiRefreshCw, FiGrid, FiList, FiX, FiAlertTriangle
} from 'react-icons/fi';
import TaskModal from './TaskModal';
import TaskCard from './TaskCard';
import TaskTable from './TaskTable';

export default function Tasks() {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para el modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  
  // Estados para ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  // Estados de tareas disponibles
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [taskPriorities, setTaskPriorities] = useState([]);
  
  // Determinar si el usuario puede gestionar tareas
  const canManageTasks = user?.role === 'super_user' || user?.role === 'admin';
  
  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchInitialData();
    }
  }, [isAuthenticated, user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      // Cargar usuarios
      const usersResponse = await fetch('http://localhost:8001/users/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }

      // Cargar tareas
      await fetchTasks();

      // Cargar estados de tareas desde el endpoint específico
      const taskStatesResponse = await fetch('http://localhost:8001/tasks/task-states/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (taskStatesResponse.ok) {
        const taskStatesData = await taskStatesResponse.json();
        setTaskStatuses(taskStatesData.states || []);
      } else {
        // Estados por defecto si no están configurados
        setTaskStatuses([
          { id: 'pending', label: 'Pendiente', color: 'red', icon: '🔴' },
          { id: 'in_progress', label: 'En Progreso', color: 'blue', icon: '🔵' },
          { id: 'completed', label: 'Completada', color: 'green', icon: '🟢' },
          { id: 'blocked', label: 'Bloqueada', color: 'orange', icon: '🟠' }
        ]);
      }

      // Cargar prioridades de tareas desde el endpoint específico
      const taskPrioritiesResponse = await fetch('http://localhost:8001/tasks/task-priorities/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (taskPrioritiesResponse.ok) {
        const taskPrioritiesData = await taskPrioritiesResponse.json();
        setTaskPriorities(taskPrioritiesData);
      } else {
        // Prioridades por defecto si no están configuradas
        setTaskPriorities([
          { id: 'low', label: 'Baja', color: 'green', icon: '🟢' },
          { id: 'medium', label: 'Media', color: 'yellow', icon: '🟡' },
          { id: 'high', label: 'Alta', color: 'red', icon: '🔴' },
          { id: 'urgent', label: 'Urgente', color: 'red', icon: '🚨' }
        ]);
      }

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/tasks/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const tasksData = await response.json();
        
        // Filtrar tareas según el rol del usuario
        let filteredTasks = tasksData;
        if (!canManageTasks) {
          // Usuarios no administradores solo ven sus tareas asignadas
          filteredTasks = tasksData.filter(task => task.assigned_to === user.user_id);
        }
        
        setTasks(filteredTasks);
      } else {
        throw new Error('Error al cargar las tareas');
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setLoading(false);
    }
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  // Filtrar tareas según los filtros aplicados
  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Filtrar por usuario asignado
    if (!canManageTasks) {
      // Usuarios normales solo ven sus tareas asignadas
      filtered = filtered.filter(task => task.assigned_to === user?.user_id);
    }
    
    // Filtrar por búsqueda
    if (searchFilter) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        task.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchFilter.toLowerCase()))
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Filtrar por prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }
    
    // Filtrar por usuario asignado (solo para administradores)
    if (canManageTasks && assignedToFilter !== 'all') {
      filtered = filtered.filter(task => task.assigned_to === parseInt(assignedToFilter));
    }
    
    // Filtrar tareas completadas según el toggle
    if (!showCompleted) {
      filtered = filtered.filter(task => task.status !== 'completed');
    }
    
    // Ordenar
    filtered.sort((a, b) => {
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
    
    return filtered;
  };

  // Obtener estadísticas
  const getStats = () => {
    const filteredTasks = getFilteredTasks();
    const total = filteredTasks.length;
    const pending = filteredTasks.filter(t => t.status === 'pending').length;
    const blocked = filteredTasks.filter(t => t.status === 'blocked').length;
    
    // Calcular tareas vencidas
    const today = new Date();
    const overdue = filteredTasks.filter(t => {
      if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today;
    }).length;
    
    // Calcular tendencias
    const totalHours = filteredTasks.reduce((sum, t) => sum + (t.actual_hours || 0), 0);
    const estimatedHours = filteredTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    const efficiency = estimatedHours > 0 ? Math.round((totalHours / estimatedHours) * 100) : 0;
    
    return { total, pending, blocked, overdue, totalHours, estimatedHours, efficiency };
  };

  // Manejar creación/edición de tareas
  const handleSaveTask = async (taskData) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const url = selectedTask 
        ? `http://localhost:8001/tasks/${selectedTask.task_id}`
        : 'http://localhost:8001/tasks/';
      
      const method = selectedTask ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (response.ok) {
        setShowTaskModal(false);
        setSelectedTask(null);
        await fetchTasks();
      } else {
        throw new Error('Error al guardar la tarea');
      }
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Manejar eliminación de tareas
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        await fetchTasks();
      } else {
        throw new Error('Error al eliminar la tarea');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Manejar cambio de estado de tarea
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      console.log(`Intentando cambiar estado de tarea ${taskId} a ${newStatus}`);
      
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`http://localhost:8001/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log(`Respuesta del servidor: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const updatedTask = await response.json();
        console.log('Tarea actualizada exitosamente:', updatedTask);
        await fetchTasks();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error del servidor:', errorData);
        throw new Error(`Error al actualizar el estado: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
      // Aquí podrías mostrar una notificación de error al usuario
    }
  };

  // Obtener nombre del usuario
  const getUserName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.full_name : 'Usuario desconocido';
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
    setShowCompleted(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const stats = getStats();
  const filteredTasks = getFilteredTasks();
  const hasActiveFilters = searchFilter || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiTarget className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando tareas</h3>
          <p className="text-gray-600">Preparando tu espacio de trabajo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="w-full p-6">
        {/* Header mejorado */}
        <div className="mb-8">
          {/* Estadísticas con diseño mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Tareas</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">En el sistema</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FiTarget className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                  <p className="text-3xl font-bold text-red-600">{stats.pending}</p>
                  <p className="text-xs text-gray-500 mt-1">Por iniciar</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiClock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Bloqueadas</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.blocked}</p>
                  <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Vencidas</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-gray-500 mt-1">Fuera de plazo</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiAlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Eficiencia</p>
                  <p className="text-3xl font-bold text-green-600">{stats.efficiency}%</p>
                  <p className="text-xs text-gray-500 mt-1">Horas vs Estimado</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <FiTrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles y filtros mejorados */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Búsqueda mejorada */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar tareas por título, descripción o tags..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  hasActiveFilters 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                )}
              </button>

              {/* Botón de refrescar */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300 disabled:opacity-50"
              >
                <FiRefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </button>

              {/* Toggle de vista mejorado */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                  Tabla
                </button>
              </div>

              {/* Toggle para mostrar tareas completadas - Mejorado */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showCompleted}
                    onChange={(e) => setShowCompleted(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mostrar completadas</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiCheckCircle className={`w-4 h-4 ${showCompleted ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs text-gray-500">({filteredTasks.filter(t => t.status === 'completed').length} completadas)</span>
                </div>
              </div>

              {/* Botón de nueva tarea mejorado */}
              {canManageTasks && (
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    setShowTaskModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-5 h-5" />
                  Nueva Tarea
                </button>
              )}
            </div>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los estados</option>
                      {taskStatuses.map(status => (
                        <option key={status.id} value={status.id}>{status.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prioridad</label>
                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todas las prioridades</option>
                      {taskPriorities.map(priority => (
                        <option key={priority.id} value={priority.id}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  {canManageTasks && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Asignado a</label>
                      <select
                        value={assignedToFilter}
                        onChange={(e) => setAssignedToFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="all">Todos los usuarios</option>
                        {users.map(user => (
                          <option key={user.user_id} value={user.user_id}>{user.full_name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Contenido principal */}
        <div>
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiTarget className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No se encontraron tareas</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar más tareas'
                  : canManageTasks 
                    ? 'Crea la primera tarea para comenzar a organizar el trabajo del equipo'
                    : 'No tienes tareas asignadas actualmente. Contacta a tu administrador.'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium shadow-lg"
                >
                  <FiZap className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.task_id}
                      className="mt-4"
                    >
                      <TaskCard
                        task={task}
                        users={users}
                        canManage={canManageTasks}
                        onEdit={() => {
                          setSelectedTask(task);
                          setShowTaskModal(true);
                        }}
                        onDelete={() => handleDeleteTask(task.task_id)}
                        onStatusChange={handleStatusChange}
                        getUserName={getUserName}
                        taskStatuses={taskStatuses}
                        taskPriorities={taskPriorities}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <TaskTable
                  tasks={filteredTasks}
                  users={users}
                  canManage={canManageTasks}
                  onEdit={(task) => {
                    setSelectedTask(task);
                    setShowTaskModal(true);
                  }}
                  onDelete={handleDeleteTask}
                  onStatusChange={handleStatusChange}
                  getUserName={getUserName}
                  taskStatuses={taskStatuses}
                  taskPriorities={taskPriorities}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de tarea */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setSelectedTask(null);
        }}
        task={selectedTask}
        users={users}
        onSave={handleSaveTask}
        taskStatuses={taskStatuses}
        taskPriorities={taskPriorities}
      />
    </div>
  );
} 