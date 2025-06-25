import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FiPlus, FiFilter, FiSearch, FiEye, FiEyeOff, FiCheckCircle, 
  FiClock, FiAlertCircle, FiUser, FiCalendar, FiTag, FiMessageSquare,
  FiEdit2, FiTrash2, FiMoreVertical, FiArrowRight, FiUsers, FiTarget,
  FiTrendingUp, FiTrendingDown, FiActivity, FiStar, FiZap, FiRefreshCw, FiGrid, FiList, FiX, FiAlertTriangle, FiFolder
} from 'react-icons/fi';
import TicketModal from './TicketModal';
import TicketCard from './TicketCard';
import TicketTable from './TicketTable';

export default function Tickets() {
  const { user, isAuthenticated } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para el modal
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [showClosed, setShowClosed] = useState(false);
  
  // Estados para ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  // Estados de tickets disponibles
  const [ticketStatuses, setTicketStatuses] = useState([]);
  const [ticketPriorities, setTicketPriorities] = useState([]);
  
  // Determinar si el usuario puede gestionar tickets
  const canManageTickets = user?.role === 'super_user' || user?.role === 'admin';
  
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

      // Cargar clientes
      const clientsResponse = await fetch('http://localhost:8001/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        setClients(clientsData);
      }

      // Cargar proyectos
      const projectsResponse = await fetch('http://localhost:8001/projects/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);
      }

      // Cargar tickets
      await fetchTickets();

      // Estados y prioridades por defecto para tickets
      setTicketStatuses([
        { id: 'nuevo', label: 'Nuevo', color: 'blue', icon: '🔵' },
        { id: 'en_progreso', label: 'En Progreso', color: 'orange', icon: '🟠' },
        { id: 'cerrado', label: 'Cerrado', color: 'green', icon: '🟢' }
      ]);

      setTicketPriorities([
        { id: 'baja', label: 'Baja', color: 'green', icon: '🟢' },
        { id: 'media', label: 'Media', color: 'yellow', icon: '🟡' },
        { id: 'alta', label: 'Alta', color: 'red', icon: '🔴' },
        { id: 'critica', label: 'Crítica', color: 'red', icon: '🚨' }
      ]);

    } catch (err) {
      console.error('Error fetching initial data:', err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      console.log('🔍 Fetching tickets...');
      console.log('Session:', session);
      console.log('User:', user);
      console.log('Can manage tickets:', canManageTickets);
      
      const response = await fetch('http://localhost:8001/tickets/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const ticketsData = await response.json();
        console.log('📋 Tickets recibidos:', ticketsData);
        console.log('📊 Cantidad de tickets:', ticketsData.length);
        
        // TEMPORAL: Comentar filtrado por usuario para debugging
        /*
        if (!canManageTickets) {
          // Usuarios no administradores solo ven sus tickets asignados
          filteredTickets = ticketsData.filter(ticket => ticket.assigned_to_user_id === user.user_id);
          console.log('🔒 Usuario no admin, tickets filtrados:', filteredTickets.length);
          console.log('🔒 User ID:', user.user_id);
          console.log('🔒 Tickets con assigned_to_user_id:', ticketsData.map(t => ({ id: t.ticket_id, assigned: t.assigned_to_user_id })));
        }
        */
        
        console.log('✅ Tickets finales a mostrar:', ticketsData);
        setTickets(ticketsData);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error al cargar los tickets: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error fetching tickets:', err);
      setLoading(false);
    }
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  // Filtrar tickets según los filtros aplicados
  const getFilteredTickets = () => {
    let filtered = tickets;
    
    // TEMPORAL: Comentar filtrado por usuario para debugging
    /*
    // Filtrar por usuario asignado
    if (!canManageTickets) {
      // Usuarios normales solo ven sus tickets asignados
      filtered = filtered.filter(ticket => ticket.assigned_to_user_id === user?.user_id);
    }
    */
    
    // Filtrar por búsqueda
    if (searchFilter) {
      filtered = filtered.filter(ticket => 
        ticket.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ticket.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ticket.ticket_number.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    // Filtrar por prioridad
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }
    
    // Filtrar por usuario asignado (solo para administradores)
    if (canManageTickets && assignedToFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.assigned_to_user_id === parseInt(assignedToFilter));
    }

    // Filtrar por cliente
    if (clientFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.client_id === parseInt(clientFilter));
    }
    
    // Filtrar tickets cerrados según el toggle
    if (!showClosed) {
      filtered = filtered.filter(ticket => ticket.status !== 'cerrado');
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
    const filteredTickets = getFilteredTickets();
    const total = filteredTickets.length;
    const nuevo = filteredTickets.filter(t => t.status === 'nuevo').length;
    const enProgreso = filteredTickets.filter(t => t.status === 'en_progreso').length;
    const cerrado = filteredTickets.filter(t => t.status === 'cerrado').length;
    
    // Calcular tickets abiertos (nuevos + en progreso)
    const abiertos = nuevo + enProgreso;
    
    // Calcular tickets vencidos
    const today = new Date();
    const overdue = filteredTickets.filter(t => {
      if (!t.due_date || t.status === 'cerrado') return false;
      const dueDate = new Date(t.due_date);
      return dueDate < today;
    }).length;
    
    // Calcular tendencias
    const criticalTickets = filteredTickets.filter(t => t.priority === 'critica').length;
    const highPriorityTickets = filteredTickets.filter(t => t.priority === 'alta').length;
    
    return { 
      total, 
      nuevo, 
      enProgreso, 
      cerrado, 
      abiertos,
      overdue, 
      criticalTickets, 
      highPriorityTickets 
    };
  };

  // Manejar creación/edición de tickets
  const handleSaveTicket = async (ticketData) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const url = selectedTicket 
        ? `http://localhost:8001/tickets/${selectedTicket.ticket_id}`
        : 'http://localhost:8001/tickets/';
      
      const method = selectedTicket ? 'PUT' : 'POST';
      
      // Preparar datos del ticket
      let finalTicketData = { ...ticketData };
      
      if (!selectedTicket) {
        // Es un ticket nuevo, agregar campos requeridos
        finalTicketData = {
          ...ticketData,
          organization_id: user.organization_id,
          ticket_number: `TICK-${Date.now()}`, // Generar número único
          reported_by_user_id: user.user_id
        };
      }
      
      console.log('📤 Enviando datos del ticket:', finalTicketData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalTicketData)
      });

      console.log('📥 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const savedTicket = await response.json();
        console.log('✅ Ticket guardado exitosamente:', savedTicket);
        setShowTicketModal(false);
        setSelectedTicket(null);
        await fetchTickets();
      } else {
        const errorData = await response.text();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(`Error al guardar el ticket: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error saving ticket:', err);
    }
  };

  // Manejar eliminación de tickets
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este ticket?')) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        await fetchTickets();
      } else {
        throw new Error('Error al eliminar el ticket');
      }
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  // Manejar cambio de estado de ticket
  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      console.log(`🔧 Intentando cambiar estado de ticket ${ticketId} a ${newStatus}`);
      console.log(`🔧 Tipo de ticketId: ${typeof ticketId}`);
      console.log(`🔧 Tipo de newStatus: ${typeof newStatus}`);
      
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      console.log(`🔧 Token de sesión: ${session.token.substring(0, 20)}...`);
      
      // Usar el endpoint específico para cambios de estado
      const requestBody = { 
        status: newStatus,
        resolved_at: newStatus === 'cerrado' ? new Date().toISOString() : null,
        closed_at: newStatus === 'cerrado' ? new Date().toISOString() : null
      };
      console.log(`🔧 Cuerpo de la petición:`, requestBody);
      
      const response = await fetch(`http://localhost:8001/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`🔧 Respuesta del servidor: ${response.status} ${response.statusText}`);
      console.log(`🔧 Headers de respuesta:`, Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const updatedTicket = await response.json();
        console.log('✅ Ticket actualizado exitosamente:', updatedTicket);
        await fetchTickets();
      } else {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        console.error('❌ Status:', response.status);
        console.error('❌ StatusText:', response.statusText);
        throw new Error(`Error al actualizar el estado: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (err) {
      console.error('❌ Error updating ticket status:', err);
      alert(`Error al cambiar el estado: ${err.message}`);
    }
  };

  // Obtener nombre del usuario
  const getUserName = (userId) => {
    const user = users.find(u => u.user_id === userId);
    return user ? user.full_name : 'Usuario desconocido';
  };

  // Obtener nombre del cliente
  const getClientName = (clientId) => {
    const client = clients.find(c => c.client_id === clientId);
    return client ? client.name : 'Cliente desconocido';
  };

  // Obtener nombre del proyecto
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.project_id === projectId);
    return project ? project.name : 'Proyecto desconocido';
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setAssignedToFilter('all');
    setClientFilter('all');
    setShowClosed(false);
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
  const filteredTickets = getFilteredTickets();
  const hasActiveFilters = searchFilter || statusFilter !== 'all' || priorityFilter !== 'all' || assignedToFilter !== 'all' || clientFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiMessageSquare className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando tickets</h3>
          <p className="text-gray-600">Preparando tu sistema de soporte...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">En el sistema</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FiMessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Abiertos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.abiertos}</p>
                  <p className="text-xs text-gray-500 mt-1">Nuevos + En Progreso</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <FiFolder className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Vencidos</p>
                  <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
                  <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
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
                  placeholder="Buscar tickets por número, título o descripción..."
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

              {/* Toggle para mostrar tickets cerrados - Mejorado */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showClosed}
                    onChange={(e) => setShowClosed(e.target.checked)}
                    className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mostrar cerrados</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiCheckCircle className={`w-4 h-4 ${showClosed ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-xs text-gray-500">({filteredTickets.filter(t => t.status === 'cerrado').length} cerrados)</span>
                </div>
              </div>

              {/* Botón de nuevo ticket mejorado */}
              {canManageTickets && (
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setShowTicketModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-5 h-5" />
                  Nuevo Ticket
                </button>
              )}
            </div>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los estados</option>
                      {ticketStatuses.map(status => (
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
                      {ticketPriorities.map(priority => (
                        <option key={priority.id} value={priority.id}>{priority.label}</option>
                      ))}
                    </select>
                  </div>

                  {canManageTickets && (
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los clientes</option>
                      {clients.map(client => (
                        <option key={client.client_id} value={client.client_id}>{client.name}</option>
                      ))}
                    </select>
                  </div>

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
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiMessageSquare className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No se encontraron tickets</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar más tickets'
                  : canManageTickets 
                    ? 'Crea el primer ticket para comenzar a gestionar el soporte'
                    : 'No tienes tickets asignados actualmente. Contacta a tu administrador.'
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
                  {filteredTickets.map((ticket) => (
                    <div
                      key={ticket.ticket_id}
                      className="mt-4"
                    >
                      <TicketCard
                        ticket={ticket}
                        users={users}
                        canManage={canManageTickets}
                        onEdit={() => {
                          setSelectedTicket(ticket);
                          setShowTicketModal(true);
                        }}
                        onDelete={() => handleDeleteTicket(ticket.ticket_id)}
                        onStatusChange={handleStatusChange}
                        getUserName={getUserName}
                        getClientName={getClientName}
                        getProjectName={getProjectName}
                        ticketStatuses={ticketStatuses}
                        ticketPriorities={ticketPriorities}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <TicketTable
                  tickets={filteredTickets}
                  users={users}
                  clients={clients}
                  projects={projects}
                  canManage={canManageTickets}
                  onEdit={(ticket) => {
                    setSelectedTicket(ticket);
                    setShowTicketModal(true);
                  }}
                  onDelete={handleDeleteTicket}
                  onStatusChange={handleStatusChange}
                  getUserName={getUserName}
                  getClientName={getClientName}
                  getProjectName={getProjectName}
                  ticketStatuses={ticketStatuses}
                  ticketPriorities={ticketPriorities}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de ticket */}
      <TicketModal
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setSelectedTicket(null);
        }}
        ticket={selectedTicket}
        users={users}
        clients={clients}
        projects={projects}
        onSave={handleSaveTicket}
        ticketStatuses={ticketStatuses}
        ticketPriorities={ticketPriorities}
      />
    </div>
  );
} 