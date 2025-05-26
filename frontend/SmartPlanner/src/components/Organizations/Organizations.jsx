import React from 'react';
import OrganizationsTable from './OrganizationsTable';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AccessDenied from '../Common/AccessDenied';

export default function Organizations() {
  const theme = useAppTheme();
  const { user } = useAuth();

  // Verificar si el usuario es super_user
  const isSuperUser = user?.role === 'super_user';

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

  const statsData = [
    { 
      title: 'Total Organizaciones', 
      value: '12', 
      change: '+2', 
      icon: 'business', 
      color: theme.PRIMARY_COLOR 
    },
    { 
      title: 'Activas', 
      value: '10', 
      change: '+1', 
      icon: 'check_circle', 
      color: 'green' 
    },
    { 
      title: 'Inactivas', 
      value: '2', 
      change: '+1', 
      icon: 'block', 
      color: 'red' 
    },
    { 
      title: 'Nuevas este mes', 
      value: '3', 
      change: '+3', 
      icon: 'add_business', 
      color: 'purple' 
    }
  ];

  return (
    <div className={`space-y-8 p-8 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Header Section */}
      <div>
        <h1 className={`text-2xl font-bold mb-2 ${theme.PRIMARY_COLOR_CLASS}`}>
          Gestión de Organizaciones
        </h1>
        <p className="text-gray-500">
          Administra y monitorea todas las organizaciones del sistema
        </p>
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
                <p className={`text-sm mt-1 font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} este mes
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="mt-8">
        <OrganizationsTable />
      </div>
    </div>
  );
} 