import React from 'react';
import ProyectosTable from './ProyectosTable';
import { useAppTheme } from '../../context/ThemeContext';

export default function ProyectosResume() {
  const theme = useAppTheme();

  const statsData = [
    { title: 'Total Proyectos', value: '24', change: '+3', icon: 'folder', color: theme.PRIMARY_COLOR },
    { title: 'En progreso', value: '8', change: '+1', icon: 'trending_up', color: 'green' },
    { title: 'Atrasados', value: '3', change: '-2', icon: 'warning', color: 'red' },
    { title: 'Completados', value: '13', change: '+5', icon: 'check_circle', color: 'purple' }
  ];

  return (
    <div className={`space-y-8 p-8 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className={`text-2xl font-bold mb-2 ${theme.PRIMARY_COLOR_CLASS}`}>Gestión de Proyectos</h1>
          <p className="text-gray-500">Administra y monitorea el progreso de todos los proyectos</p>
        </div>
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
        <ProyectosTable />
      </div>
    </div>
  );
}