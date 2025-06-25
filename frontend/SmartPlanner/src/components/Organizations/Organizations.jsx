import React, { useState, useEffect } from 'react';
import { FiGlobe, FiCheckCircle, FiXCircle, FiStar, FiAward, FiTrendingUp } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AccessDenied from '../Common/AccessDenied';
import OrganizationsTable from './OrganizationsTable';

export default function Organizations() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    premium: 0,
    corporate: 0
  });
  const [loading, setLoading] = useState(true);

  // Verificar si el usuario es super_user
  const isSuperUser = user?.role === 'super_user';

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

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/organizations/stats', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar las estadísticas');
      }
      
      const data = await response.json();
      setStats({
        total: parseInt(data.total_organizations.value),
        active: parseInt(data.active_organizations.value),
        inactive: parseInt(data.inactive_organizations.value),
        premium: parseInt(data.premium_organizations.value),
        corporate: parseInt(data.corporate_organizations.value)
      });
    } catch (error) {
      console.error('Error al cargar las estadísticas:', error);
      // Mantener valores por defecto en caso de error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperUser) {
      fetchStats();
    }
  }, [isSuperUser]);

  // Si no es super usuario, mostrar componente de acceso denegado
  if (!isSuperUser) {
    return (
      <AccessDenied 
        title="Acceso Restringido" 
        message="No tienes permisos para acceder a la gestión de organizaciones" 
        details="Esta funcionalidad está reservada exclusivamente para super usuarios"
        icon="admin_panel_settings"
      />
    );
  }

  return (
    <div className={`space-y-8 p-8 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>

      {/* Stats Grid - Una sola fila como en Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Organizaciones</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
              <p className="text-xs text-gray-500 mt-1">En el sistema</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <FiGlobe className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Activas</p>
              <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.active}</p>
              <p className="text-xs text-gray-500 mt-1">Funcionando</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <FiCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Inactivas</p>
              <p className="text-3xl font-bold text-red-600">{loading ? '...' : stats.inactive}</p>
              <p className="text-xs text-gray-500 mt-1">Suspendidas</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
              <FiXCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Premium</p>
              <p className="text-3xl font-bold text-purple-600">{loading ? '...' : stats.premium}</p>
              <p className="text-xs text-gray-500 mt-1">Plan avanzado</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <FiStar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Corporate</p>
              <p className="text-3xl font-bold text-indigo-600">{loading ? '...' : stats.corporate}</p>
              <p className="text-xs text-gray-500 mt-1">Plan empresarial</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <FiAward className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Organizations Table Component */}
      <OrganizationsTable onStatsUpdate={fetchStats} />
    </div>
  );
} 