import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import UsersTable from './UsersTable';
import UserModal from './UserModal';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import CapacityEfficiencyView from './CapacityEfficiencyView';

export default function Users() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [activeView, setActiveView] = useState('usuarios');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statsData, setStatsData] = useState([]);
  const [capacityData, setCapacityData] = useState(null);
  const [teamInsights, setTeamInsights] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

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

  const fetchStats = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/users/stats', { 
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      const formattedStats = [
        {
          title: 'Total de Usuarios',
          value: data.total_users?.value || '0',
          change: data.total_users?.change || '0%',
          icon: 'people',
          color: 'blue',
          description: 'Usuarios activos en la organización'
        },
        {
          title: 'Capacidad Promedio',
          value: data.avg_capacity?.value || '0%',
          change: data.avg_capacity?.change || '0%',
          icon: 'trending_up',
          color: 'purple',
          description: 'Utilización promedio de capacidad'
        },
        {
          title: 'Eficiencia Promedio',
          value: data.avg_efficiency?.value || '0%',
          change: data.avg_efficiency?.change || '0%',
          icon: 'speed',
          color: 'orange',
          description: 'Rendimiento general del equipo'
        }
      ];
      
      setStatsData(formattedStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(`Error al cargar estadísticas: ${error.message}`);
    }
  };

  const fetchCapacityData = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/users/capacity-analytics', { 
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Si es error 422, mostrar mensaje más específico
        if (response.status === 422) {
          console.warn('Endpoint capacity-analytics no disponible o datos insuficientes');
          setCapacityData({
            users: [],
            workload_summary: [],
            summary: {
              total_users: 0,
              avg_capacity: 0,
              avg_efficiency: 0,
              overloaded_users: 0,
              total_worked_hours: 0,
              total_assigned_hours: 0,
              global_ticket_resolution: 0,
              total_resolved_tickets: 0,
              total_tickets_assigned: 0
            }
          });
          return;
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCapacityData(data);
      
    } catch (error) {
      console.error('Error fetching capacity data:', error);
      // En lugar de mostrar error, usar datos por defecto
      setCapacityData({
        users: [],
        workload_summary: [],
        summary: {
          total_users: 0,
          avg_capacity: 0,
          avg_efficiency: 0,
          overloaded_users: 0,
          total_worked_hours: 0,
          total_assigned_hours: 0,
          global_ticket_resolution: 0,
          total_resolved_tickets: 0,
          total_tickets_assigned: 0
        }
      });
    }
  };

  const fetchTeamInsights = async () => {
    // Generar insights avanzados basados en los datos de capacidad
    if (capacityData) {
      const insights = {
        teamVelocity: {
          current: Math.round(capacityData.summary?.avg_efficiency || 0),
          trend: capacityData.summary?.avg_efficiency > 75 ? '+12%' : '-5%',
          benchmark: 78,
          status: capacityData.summary?.avg_efficiency > 85 ? 'excellent' : 
                  capacityData.summary?.avg_efficiency > 70 ? 'good' : 'needs_improvement'
        },
        skillDistribution: Object.entries(capacityData.workload_by_specialization || {}).map(([spec, data]) => {
          const demand = data.total_users > 2 ? 80 : 65; // Demanda simulada basada en cobertura
          const coverage = Math.min(data.total_users * 25, 100); // Cobertura basada en número de usuarios
          return {
            skill: getSpecializationLabel(spec),
            coverage: coverage,
            demand: demand,
            gap: coverage - demand,
            efficiency: data.avg_capacity || 0
          };
        }) || [],
        collaborationScore: Math.min(85 + Object.keys(capacityData.workload_by_specialization || {}).length * 2, 100),
        knowledgeSharing: Math.round(capacityData.summary?.avg_efficiency * 0.9 || 0),
        burnoutRisk: capacityData.users?.filter(user => user.is_overloaded).map(user => ({
          userId: user.user_id,
          name: user.full_name || user.username,
          risk: user.capacity_percentage > 95 ? 'high' : 'medium',
          workload: user.capacity_percentage,
          efficiency: user.efficiency_score
        })) || [],
        productivityTrends: {
          weeklyGrowth: '+8.5%',
          monthlyGrowth: '+23%',
          qualityScore: Math.round((capacityData.summary?.avg_efficiency || 0) * 1.2),
          deliveryPredictability: Math.round((capacityData.summary?.avg_efficiency || 0) * 0.95)
        }
      };
      setTeamInsights(insights);
    }
  };

  const fetchUsers = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/users', { headers });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Filtrar usuarios según el rol del usuario actual
      let filteredUsers = data;
      if (user?.role !== 'super_user') {
        // Si no es super_user, ocultar otros super_users
        filteredUsers = data.filter(userData => userData.role !== 'super_user');
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = async (user) => {
    try {
      // Obtener datos actualizados del backend
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/users/${user.user_id}`, {
        headers
      });
      
      if (!response.ok) {
        throw new Error('Error al obtener datos del usuario');
      }
      
      const updatedUser = await response.json();
      
      setSelectedUser(updatedUser);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error al obtener datos del usuario:', error);
      // Fallback: usar los datos del estado local
    setSelectedUser(user);
    setShowUserModal(true);
    }
  };

  const handleSaveUser = async (userData) => {
      const headers = getAuthHeaders();
      const url = selectedUser 
        ? `http://localhost:8001/users/${selectedUser.user_id}`
        : 'http://localhost:8001/users';
      const method = selectedUser ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar el usuario');
      }

    const savedUser = await response.json();

      setShowUserModal(false);
      setSelectedUser(null);
    
    // Recargar la lista de usuarios para aplicar el filtrado correcto
      await fetchUsers();
      await fetchAllData(); // Refrescar datos de capacidad
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/users/${userId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el usuario');
      }

      await fetchUsers();
      await fetchAllData(); // Refrescar datos de capacidad
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar el usuario: ' + error.message);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      if (activeView === 'capacidad') {
      await fetchStats();
      await fetchCapacityData();
      } else if (activeView === 'usuarios') {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchAllData();
  }, [activeView]);

  useEffect(() => {
    if (capacityData) {
      fetchTeamInsights();
    }
  }, [capacityData]);

  const getSpecializationColor = (specialization) => {
    const colors = {
      'development': 'blue',
      'ui_ux': 'purple',
      'testing': 'green',
      'documentation': 'yellow',
      'management': 'red',
      'data_analysis': 'indigo'
    };
    return colors[specialization] || 'gray';
  };

  const getSpecializationLabel = (specialization) => {
    const labels = {
      'development': 'Desarrollo',
      'ui_ux': 'UI/UX',
      'testing': 'Testing',
      'documentation': 'Documentación',
      'management': 'Gestión',
      'data_analysis': 'Análisis de Datos'
    };
    return labels[specialization] || specialization;
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 75) return 'yellow';
    if (percentage >= 50) return 'blue';
    return 'green';
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 90) return 'green';
    if (efficiency >= 75) return 'blue';
    if (efficiency >= 60) return 'yellow';
    return 'red';
  };

  // Consolidar las vistas de capacidad y eficiencia en una sola
  const renderCapacityAndEfficiencyView = () => (
    <CapacityEfficiencyView
      capacityData={capacityData}
      loading={loading}
      onRefresh={fetchCapacityData}
      getCapacityColor={getCapacityColor}
      getEfficiencyColor={getEfficiencyColor}
      getSpecializationColor={getSpecializationColor}
      getSpecializationLabel={getSpecializationLabel}
    />
  );

  const renderUsersTable = () => (
    <div className="space-y-6">
      {/* Header con botón de crear usuario */}
      <div className="flex justify-between items-center">
        <div></div>
        <button
          onClick={handleCreateUser}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg"
        >
          <span className="material-icons-outlined">person_add</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Tabla de usuarios mejorada */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Usuario</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Especialización</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Capacidad</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                        {(user.full_name || user.username).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.full_name || user.username}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">
                        {user.specialization === 'development' ? '💻' :
                         user.specialization === 'ui_ux' ? '🎨' :
                         user.specialization === 'testing' ? '🧪' :
                         user.specialization === 'documentation' ? '📚' :
                         user.specialization === 'management' ? '👔' :
                         user.specialization === 'data_analysis' ? '📊' : '💼'}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getSpecializationLabel(user.specialization)}
                        </div>
                        {user.sub_specializations && user.sub_specializations.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {user.sub_specializations.slice(0, 2).join(', ')}
                            {user.sub_specializations.length > 2 && ` +${user.sub_specializations.length - 2}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'super_user' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'dev' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'super_user' ? '👑 Super Usuario' :
                       user.role === 'admin' ? '👨‍💼 Admin' :
                       user.role === 'dev' ? '👨‍💻 Dev' :
                       user.role === 'infra' ? '🔧 Infra' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (user.weekly_capacity || 40) > 45 ? 'bg-red-500' :
                            (user.weekly_capacity || 40) > 40 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min((user.weekly_capacity || 40) / 50 * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{user.weekly_capacity || 40}h/sem</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar usuario"
                      >
                        <span className="material-icons-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.user_id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Eliminar usuario"
                      >
                        <span className="material-icons-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {users.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay usuarios</h3>
            <p className="text-gray-600 mb-4">Comienza agregando el primer miembro del equipo</p>
            <button
              onClick={handleCreateUser}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Crear Primer Usuario
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const tabs = [
    { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'group' },
    { id: 'capacidad', label: 'Capacidad y Eficiencia', icon: 'speed' }
  ];

  return (
    <div className="p-6 w-full">
      {/* Navegación por pestañas */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeView === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="material-icons-outlined text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Contenido de las pestañas */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">
                {activeView === 'usuarios' ? 'Cargando usuarios...' : 'Cargando análisis inteligente...'}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeView === 'capacidad' && renderCapacityAndEfficiencyView()}
            {activeView === 'usuarios' && renderUsersTable()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Usuario */}
      <UserModal
        user={selectedUser}
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}