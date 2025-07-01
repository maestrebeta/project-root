import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { 
  FiPlus, FiFilter, FiSearch, FiEye, FiEyeOff, FiCheckCircle, 
  FiClock, FiAlertCircle, FiUser, FiCalendar, FiTag, FiUserPlus,
  FiEdit2, FiTrash2, FiMoreVertical, FiArrowRight, FiUsers, FiTarget,
  FiTrendingUp, FiTrendingDown, FiActivity, FiStar, FiZap, FiRefreshCw, FiGrid, FiList, FiX, FiAlertTriangle,
  FiMail, FiShield, FiToggleLeft, FiToggleRight, FiSave
} from 'react-icons/fi';

export default function ExternalUsers() {
  const { user, isAuthenticated } = useAuth();
  const [externalUsers, setExternalUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Estados para filtros y búsqueda
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  // Estados para el modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    phone: '',
    password: '',
    client_id: ''
  });
  const [editErrors, setEditErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determinar si el usuario puede gestionar usuarios externos
  const canManageExternalUsers = user?.role === 'super_user' || user?.role === 'admin';
  
  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchExternalUsers();
      fetchClients();
    }
  }, [isAuthenticated, user]);

  const fetchExternalUsers = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      
      const response = await fetch('http://localhost:8001/external-users/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const usersData = await response.json();
        setExternalUsers(usersData);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`Error al cargar los usuarios externos: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error fetching external users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Función para refrescar datos
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchExternalUsers();
    setRefreshing(false);
  };

  // Filtrar usuarios según los filtros aplicados
  const getFilteredUsers = () => {
    let filtered = externalUsers;
    
    // Filtrar por búsqueda
    if (searchFilter) {
      filtered = filtered.filter(user => 
        user.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        user.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
        user.username.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.is_active === (statusFilter === 'active'));
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'created_at' || sortConfig.key === 'last_login') {
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
    const filteredUsers = getFilteredUsers();
    const total = filteredUsers.length;
    const active = filteredUsers.filter(u => u.is_active).length;
    const inactive = filteredUsers.filter(u => !u.is_active).length;
    
    // Calcular usuarios con login reciente (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogin = filteredUsers.filter(u => {
      if (!u.last_login) return false;
      return new Date(u.last_login) > thirtyDaysAgo;
    }).length;
    
    return { 
      total, 
      active, 
      inactive, 
      recentLogin
    };
  };

  // Manejar cambio de estado de usuario
  const handleStatusChange = async (userId, newStatus) => {
    try {
      
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`http://localhost:8001/external-users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (response.ok) {
        const updatedUser = await response.json();
        await fetchExternalUsers();
      } else {
        const errorText = await response.text();
        console.error('❌ Error del servidor:', errorText);
        throw new Error(`Error al actualizar el estado: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('❌ Error updating user status:', err);
      alert(`Error al cambiar el estado: ${err.message}`);
    }
  };

  // Manejar edición de usuario
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      username: user.username || '',
      phone: user.phone || '',
      password: '',
      client_id: user.client_id || ''
    });
    setEditErrors({});
    setShowEditModal(true);
  };

  // Manejar guardado de edición
  const handleSaveEdit = async () => {
    if (!validateEditForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const updateData = { 
        ...editFormData,
        client_id: parseInt(editFormData.client_id)
      };
      // Solo incluir password si se proporcionó uno nuevo
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await fetch(`http://localhost:8001/external-users/${selectedUser.external_user_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setShowEditModal(false);
        setSelectedUser(null);
        await fetchExternalUsers();
      } else {
        const errorData = await response.json();
        setEditErrors({ submit: errorData.detail || 'Error al actualizar el usuario' });
      }
    } catch (err) {
      console.error('❌ Error editing user:', err);
      setEditErrors({ submit: `Error al editar el usuario: ${err.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validar formulario de edición
  const validateEditForm = () => {
    const newErrors = {};

    if (!editFormData.full_name.trim()) {
      newErrors.full_name = 'El nombre completo es requerido';
    }

    if (!editFormData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(editFormData.email)) {
      newErrors.email = 'El email no es válido';
    }

    if (!editFormData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    }

    if (!editFormData.client_id) {
      newErrors.client_id = 'Debe seleccionar un cliente';
    }

    if (editFormData.password && editFormData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar eliminación de usuario
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario externo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`http://localhost:8001/external-users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchExternalUsers();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el usuario');
      }
    } catch (err) {
      console.error('❌ Error deleting user:', err);
      alert(`Error al eliminar el usuario: ${err.message}`);
    }
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para obtener el nombre del cliente
  const getClientName = (clientId) => {
    const client = clients.find(c => c.client_id === clientId);
    return client ? client.name : 'Cliente no asignado';
  };

  const stats = getStats();
  const filteredUsers = getFilteredUsers();
  const hasActiveFilters = searchFilter || statusFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiUserPlus className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando usuarios externos</h3>
          <p className="text-gray-600">Preparando tu sistema de gestión...</p>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Usuarios</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">Registrados</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Activos</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                  <p className="text-xs text-gray-500 mt-1">Usuarios activos</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                  <FiCheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Inactivos</p>
                  <p className="text-3xl font-bold text-red-600">{stats.inactive}</p>
                  <p className="text-xs text-gray-500 mt-1">Usuarios inactivos</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Login Reciente</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.recentLogin}</p>
                  <p className="text-xs text-gray-500 mt-1">Últimos 30 días</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                  <FiClock className="w-6 h-6 text-white" />
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
                  placeholder="Buscar usuarios por nombre, email o usuario..."
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
            </div>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
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
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUserPlus className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No se encontraron usuarios externos</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar más usuarios'
                  : 'Los usuarios externos se registran desde el portal de soporte'
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
                  {filteredUsers.map((externalUser) => (
                    <div
                      key={externalUser.external_user_id}
                      className="mt-4"
                    >
                      <ExternalUserCard
                        user={externalUser}
                        canManage={canManageExternalUsers}
                        onStatusChange={handleStatusChange}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        formatDate={formatDate}
                        getClientName={getClientName}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ExternalUserTable
                  users={filteredUsers}
                  canManage={canManageExternalUsers}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditUser}
                  onDelete={handleDeleteUser}
                  formatDate={formatDate}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  getClientName={getClientName}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de edición */}
      <AnimatePresence>
        {showEditModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <FiEdit2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Editar Usuario Externo</h2>
                      <p className="text-sm text-blue-100">
                        Modificar información del usuario
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                {editErrors.submit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{editErrors.submit}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={editFormData.full_name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        editErrors.full_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nombre completo"
                    />
                    {editErrors.full_name && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.full_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        editErrors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="usuario@email.com"
                    />
                    {editErrors.email && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de usuario *
                    </label>
                    <input
                      type="text"
                      value={editFormData.username}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, username: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        editErrors.username ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="usuario123"
                    />
                    {editErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="+34 600 000 000"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva contraseña (opcional)
                    </label>
                    <input
                      type="password"
                      value={editFormData.password}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, password: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        editErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Dejar vacío para mantener la actual"
                    />
                    {editErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cliente *
                    </label>
                    <select
                      value={editFormData.client_id}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, client_id: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="">Selecciona un cliente</option>
                      {clients.map((client) => (
                        <option key={client.client_id} value={client.client_id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                    {editErrors.client_id && (
                      <p className="mt-1 text-sm text-red-600">{editErrors.client_id}</p>
                    )}
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4 mr-2" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente de tarjeta para usuario externo
function ExternalUserCard({ user, canManage, onStatusChange, onEdit, onDelete, formatDate, getClientName }) {
  const [showActions, setShowActions] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Header del usuario */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {user.username}
              </span>
              {!user.is_active && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                  Inactivo
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">
              {user.full_name}
            </h3>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <FiMail className="w-4 h-4" />
              {user.email}
            </p>
          </div>
          
          {/* Menú de acciones */}
          {canManage && (
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
                          onEdit(user);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onStatusChange(user.external_user_id, !user.is_active);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        {user.is_active ? (
                          <>
                            <FiToggleLeft className="w-4 h-4" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <FiToggleRight className="w-4 h-4" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowActions(false);
                          onDelete(user.external_user_id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <FiCalendar className="w-4 h-4" />
            <span>Creado: {formatDate(user.created_at)}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <FiClock className="w-4 h-4" />
            <span>Último login: {formatDate(user.last_login)}</span>
          </div>
        </div>

        {/* Cliente asociado */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
          <FiUser className="w-4 h-4" />
          <span>Cliente: {getClientName(user.client_id)}</span>
        </div>

        {/* Teléfono SIEMPRE visible para altura uniforme */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 min-h-[1.5rem]">
          <FiMail className="w-4 h-4" />
          <span>{user.phone ? user.phone : 'Sin teléfono'}</span>
        </div>
      </div>

      {/* Footer con acciones rápidas */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              ID: {user.external_user_id}
            </span>
          </div>
          
          {/* Botones de acción */}
          {canManage && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit(user)}
                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
                title="Editar usuario"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => onStatusChange(user.external_user_id, !user.is_active)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  user.is_active
                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
              >
                {user.is_active ? (
                  <FiToggleLeft className="w-4 h-4" />
                ) : (
                  <FiToggleRight className="w-4 h-4" />
                )}
              </button>
              
              <button
                onClick={() => onDelete(user.external_user_id)}
                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200"
                title="Eliminar usuario"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de tabla para usuarios externos
function ExternalUserTable({ users, canManage, onStatusChange, onEdit, onDelete, formatDate, onSort, getSortIcon, getClientName }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('full_name')}
              >
                <div className="flex items-center gap-2">
                  Nombre
                  {getSortIcon('full_name')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('email')}
              >
                <div className="flex items-center gap-2">
                  Email
                  {getSortIcon('email')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('is_active')}
              >
                <div className="flex items-center gap-2">
                  Estado
                  {getSortIcon('is_active')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('created_at')}
              >
                <div className="flex items-center gap-2">
                  Creado
                  {getSortIcon('created_at')}
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort('last_login')}
              >
                <div className="flex items-center gap-2">
                  Último Login
                  {getSortIcon('last_login')}
                </div>
              </th>
              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.external_user_id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-mono text-gray-900">
                      {user.username}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {user.external_user_id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FiMail className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{getClientName(user.client_id)}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                    user.is_active 
                      ? 'bg-green-100 text-green-700 border-green-200' 
                      : 'bg-red-100 text-red-700 border-red-200'
                  }`}>
                    <span>{user.is_active ? '🟢' : '🔴'}</span>
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.last_login)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {/* Botón de editar */}
                    {canManage && (
                      <button
                        onClick={() => onEdit(user)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all duration-200"
                        title="Editar usuario"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Botón de activar/desactivar */}
                    {canManage && (
                      <button
                        onClick={() => onStatusChange(user.external_user_id, !user.is_active)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          user.is_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.is_active ? (
                          <FiToggleLeft className="w-4 h-4" />
                        ) : (
                          <FiToggleRight className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Botón de eliminar */}
                    {canManage && (
                      <button
                        onClick={() => onDelete(user.external_user_id)}
                        className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all duration-200"
                        title="Eliminar usuario"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}