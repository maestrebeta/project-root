import React from 'react';
import UsersTable from './UsersTable';
import { useAppTheme } from '../../context/ThemeContext';

export default function Users() {
  const theme = useAppTheme();

  const statsData = [
    { title: 'Total Usuarios', value: '120', change: '+8', icon: 'group', color: theme.PRIMARY_COLOR },
    { title: 'Activos', value: '110', change: '+5', icon: 'check_circle', color: 'green' },
    { title: 'Suspendidos', value: '5', change: '+1', icon: 'block', color: 'red' },
    { title: 'Nuevos este mes', value: '8', change: '+8', icon: 'person_add', color: 'purple' }
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
        <UsersTable />
      </div>
    </div>
  );
}