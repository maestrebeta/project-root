import React, { useEffect, useState } from 'react';
import UsersTable from './UsersTable';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Users() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    total_users: { value: '0', change: '0' },
    active_users: { value: '0', change: '0' },
    suspended_users: { value: '0', change: '0' },
    new_this_month: { value: '0', change: '0' }
  });
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      throw new Error('Error de autenticación');
    }
  };

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/users/stats', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar las estadísticas');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error al cargar las estadísticas:', error);
      // Mantener valores por defecto en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  const statsData = [
    { 
      title: 'Total Usuarios', 
      value: stats.total_users.value, 
      change: stats.total_users.change, 
      icon: 'group', 
      color: theme.PRIMARY_COLOR 
    },
    { 
      title: 'Activos', 
      value: stats.active_users.value, 
      change: stats.active_users.change, 
      icon: 'check_circle', 
      color: 'green' 
    },
    { 
      title: 'Suspendidos', 
      value: stats.suspended_users.value, 
      change: stats.suspended_users.change, 
      icon: 'block', 
      color: 'red' 
    },
    { 
      title: 'Nuevos este mes', 
      value: stats.new_this_month.value, 
      change: stats.new_this_month.change, 
      icon: 'person_add', 
      color: 'purple' 
    }
  ];

  return (
    <div className={`space-y-8 p-8 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Header Section */}
      <div>
        <h1 className={`text-2xl font-bold mb-2 ${theme.PRIMARY_COLOR_CLASS}`}>Gestión de Usuarios</h1>
        <p className="text-gray-500">Administra y monitorea todos los usuarios del sistema</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={`
              relative overflow-hidden rounded-xl p-6
              bg-opacity-10 backdrop-blur-sm
              border border-gray-100
              ${stat.color === theme.PRIMARY_COLOR ? `bg-${theme.PRIMARY_COLOR}-50` : `bg-${stat.color}-50`}
              transition-all duration-300 hover:shadow-lg hover:scale-[1.02]
              ${loading ? 'animate-pulse' : ''}
            `}
          >
            <div className="flex items-center gap-4">
              <div
                className={`
                  flex items-center justify-center w-12 h-12 rounded-lg
                  ${stat.color === theme.PRIMARY_COLOR ? `bg-${theme.PRIMARY_COLOR}-100 text-${theme.PRIMARY_COLOR}-600` : 
                    `bg-${stat.color}-100 text-${stat.color}-600`}
                `}
              >
                <span className="material-icons-outlined text-2xl">{stat.icon}</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : stat.value}
                </h3>
                <p className={`text-sm mt-1 font-medium ${
                  stat.change.startsWith('+') ? 'text-green-600' : 
                  stat.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {loading ? '...' : `${stat.change} este mes`}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="mt-8">
        <UsersTable />
      </div>
    </div>
  );
}