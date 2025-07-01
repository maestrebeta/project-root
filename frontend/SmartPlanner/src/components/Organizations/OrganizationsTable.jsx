import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { FiPlus, FiSearch, FiFilter, FiRefreshCw, FiEye, FiEdit, FiTrash2, FiToggleLeft, FiToggleRight, FiUsers, FiGlobe, FiCalendar, FiStar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import OrganizationCard from './OrganizationCard';
import OrganizationModal from './OrganizationModal';

export default function OrganizationsTable({ onStatsUpdate }) {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showModal, setShowModal] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState(null);
  const [openPlanMenuId, setOpenPlanMenuId] = useState(null);

  // Obtener token de la sesión
  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    } catch {
      throw new Error('Error de autenticación');
    }
  };

  // Cargar organizaciones
  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      if (!isAuthenticated || user.role !== 'super_user') {
        throw new Error('No tienes permisos para ver organizaciones');
      }

      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/organizations/', {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar las organizaciones');
      }
      
      const data = await response.json();
      setOrganizations(data);
      setError('');
      
      // Actualizar estadísticas después de cargar organizaciones
      if (onStatsUpdate) {
        onStatsUpdate();
      }
    } catch (error) {
      console.error('Error al cargar las organizaciones:', error);
      setError(error.message || 'No se pudieron cargar las organizaciones');
    } finally {
      setLoading(false);
    }
  };

  // Cargar países
  const fetchCountries = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/countries/?active_only=true', {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar los países');
      }
      
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error al cargar los países:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user.role === 'super_user') {
      fetchOrganizations();
      fetchCountries();
    }
  }, [isAuthenticated, user]);

  // Filtrar y ordenar organizaciones
  const getFilteredOrganizations = () => {
    let filtered = organizations.filter(org => {
      const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           org.primary_contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && org.is_active) ||
                           (statusFilter === 'inactive' && !org.is_active);
      
      const matchesPlan = planFilter === 'all' || org.subscription_plan === planFilter;
      
      return matchesSearch && matchesStatus && matchesPlan;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'name') {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  // Manejar ordenamiento
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Obtener icono de ordenamiento
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Manejar cambio de estado de organización
  const handleToggleStatus = async (orgId, currentStatus) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/organizations/${orgId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ is_active: !currentStatus }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el estado');
      }

      await fetchOrganizations();
    } catch (error) {
      setError(error.message);
    }
  };

  // Manejar cambio de plan
  const handlePlanChange = async (orgId, newPlan) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/organizations/${orgId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ subscription_plan: newPlan }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cambiar el plan');
      }

      await fetchOrganizations();
    } catch (error) {
      setError(error.message);
    }
  };

  // Manejar eliminación
  const handleDelete = async (orgId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta organización? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/organizations/${orgId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la organización');
      }

      await fetchOrganizations();
    } catch (error) {
      setError(error.message);
    }
  };

  // Manejar edición
  const handleEdit = (org) => {
    setEditingOrganization(org);
    setShowModal(true);
  };

  // Manejar creación
  const handleCreate = () => {
    setEditingOrganization(null);
    setShowModal(true);
  };

  // Manejar guardado
  const handleSave = async () => {
    await fetchOrganizations();
    setShowModal(false);
    setEditingOrganization(null);
  };

  // Manejar apertura/cierre de menús de planes
  const handlePlanMenuToggle = (orgId) => {
    setOpenPlanMenuId(orgId);
  };

  // Crear objeto con el estado del menú abierto para pasar a los componentes hijos
  const planMenuState = {
    currentOpenMenuId: openPlanMenuId,
    toggle: handlePlanMenuToggle
  };

  // Si el usuario no es super_user, mostrar mensaje de acceso denegado
  if (user?.role !== 'super_user') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="mb-4">
            No tienes permisos para acceder a la gestión de organizaciones.
          </p>
          <p className="text-sm text-red-600">
            Esta funcionalidad está reservada exclusivamente para super usuarios.
          </p>
        </div>
      </div>
    );
  }

  const filteredOrganizations = getFilteredOrganizations();

  return (
    <div className={`space-y-6 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Controles de búsqueda y filtros */}
      <div
        className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20"
      >
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar organizaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>

            {/* Filtros */}
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>

              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              >
                <option value="all">Todos los planes</option>
                <option value="free">Prueba gratuita</option>
                <option value="premium">Premium</option>
                <option value="corporate">Corporate</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-2"
            >
              {viewMode === 'cards' ? <FiEye /> : <FiEye />}
              {viewMode === 'cards' ? 'Vista tabla' : 'Vista tarjetas'}
            </button>

            <button
              onClick={fetchOrganizations}
              disabled={loading}
              className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>

            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <FiPlus className="w-4 h-4" />
              Nueva Organización
            </button>
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div
          className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando organizaciones...</p>
          </div>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div
          className="text-center py-20"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiGlobe className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No se encontraron organizaciones</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== 'all' || planFilter !== 'all' 
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Comienza creando tu primera organización'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && planFilter === 'all' && (
            <button
              onClick={handleCreate}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <FiPlus className="w-4 h-4" />
              Crear Organización
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'cards' ? (
            <div
              key="cards"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredOrganizations.map((org, index) => (
                <OrganizationCard
                  key={org.organization_id}
                  organization={org}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                  onPlanChange={handlePlanChange}
                  onPlanMenuToggle={planMenuState}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div
              className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg border border-white/20"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50/50 backdrop-blur-sm">
                    <tr>
                      <th 
                        className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-2">
                          Nombre {getSortIcon('name')}
                        </div>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        País
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Usuarios
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
                    {filteredOrganizations.map((org) => (
                      <tr key={org.organization_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                            {org.description && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">{org.description}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {org.country_code || 'N/A'}
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={org.subscription_plan}
                            onChange={(e) => handlePlanChange(org.organization_id, e.target.value)}
                            className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="free">Prueba gratuita</option>
                            <option value="premium">Premium</option>
                            <option value="corporate">Corporate</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(org.organization_id, org.is_active)}
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              org.is_active 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {org.is_active ? <FiToggleRight /> : <FiToggleLeft />}
                            {org.is_active ? 'Activa' : 'Inactiva'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {org.max_users} máx.
                        </td>
                        <td className="px-6 py-4 text-sm font-medium space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1 transition-colors"
                            onClick={() => handleEdit(org)}
                          >
                            <FiEdit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 transition-colors"
                            onClick={() => handleDelete(org.organization_id)}
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Modal de organización */}
      <OrganizationModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingOrganization(null);
        }}
        organization={editingOrganization}
        countries={countries}
        onSave={handleSave}
      />
    </div>
  );
} 