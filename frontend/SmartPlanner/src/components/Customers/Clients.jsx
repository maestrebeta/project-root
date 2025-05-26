import React, { useEffect, useState } from 'react';
import ClientsTable from './ClientsTable';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ClientsResume() {
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    nuevosMes: 0
  });
  const [error, setError] = useState('');

  const theme = useAppTheme();
  const { isAuthenticated } = useAuth();

  const fetchClientStats = async () => {
    try {
      // Obtener token de la sesión
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:8000/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar los clientes');
      }

      const data = await response.json();
        const total = data.length;
        const activos = data.filter(c => c.is_active).length;
        const inactivos = data.filter(c => !c.is_active).length;
      
        // Nuevos este mes (requiere campo created_at tipo fecha)
        const now = new Date();
        const nuevosMes = data.filter(c => {
          if (!c.created_at) return false;
          const created = new Date(c.created_at);
          return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length;

        setStats({ total, activos, inactivos, nuevosMes });
      setError('');
    } catch (error) {
      console.error('Error al cargar estadísticas de clientes:', error);
      
      // Manejar específicamente errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('token')) {
        setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Error de conexión. Por favor, verifica tu conexión de red o el servidor.');
      } else {
        setError(error.message || 'Error al cargar las estadísticas de clientes');
      }

      // Restablecer estadísticas
      setStats({ total: 0, activos: 0, inactivos: 0, nuevosMes: 0 });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClientStats();
    }
  }, [isAuthenticated]);

  const statsData = [
    { title: 'Total Clientes', value: stats.total, icon: 'groups', color: theme.PRIMARY_COLOR },
    { title: 'Activos', value: stats.activos, icon: 'check_circle', color: 'green' },
    { title: 'Inactivos', value: stats.inactivos, icon: 'block', color: 'red' },
    { title: 'Nuevos este mes', value: stats.nuevosMes, icon: 'person_add', color: 'purple' }
  ];

  return (
    <div className={`space-y-8 p-8 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${theme.PRIMARY_COLOR_CLASS}`}>Gestión de Clientes</h1>
          <p className="text-gray-500">Administra y monitorea la cartera de clientes</p>
        </div>
      </div>

      {/* Error Handling */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          <div className="flex items-center gap-2">
            <span className="material-icons-outlined text-xl">error_outline</span>
            {error}
          </div>
        </div>
      )}

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
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="mt-8">
        <ClientsTable />
      </div>
    </div>
  );
}