import React, { useEffect, useState } from 'react';
import ProyectosTable from './ProyectosTable';

export default function ProyectosResume() {

  const statsData = [
    { title: 'Total Proyectos', value: '24', change: '+3', icon: 'folder', color: 'blue' },
    { title: 'En progreso', value: '8', change: '+1', icon: 'trending_up', color: 'green' },
    { title: 'Atrasados', value: '3', change: '-2', icon: 'warning', color: 'red' },
    { title: 'Completados', value: '13', change: '+5', icon: 'check_circle', color: 'purple' }
  ];

  return (

        <main className="main-content">
          <div className="content-header">
            <div>
              <h1 className="text-2xl font-bold">Listado de Proyectos</h1>
              <p className="text-sm text-gray-500">Gestión y seguimiento de todos los proyectos activos</p>
            </div>
            
            <div className="controls">
              {/* Controles aquí... */}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6 my-8">
            {statsData.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col justify-between bg-white rounded-xl shadow border border-gray-100 px-6 py-4 min-w-[200px] max-w-[220px] flex-1"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full
                      ${stat.color === 'blue' && 'bg-blue-100 text-blue-600'}
                      ${stat.color === 'green' && 'bg-green-100 text-green-600'}
                      ${stat.color === 'red' && 'bg-red-100 text-red-600'}
                      ${stat.color === 'purple' && 'bg-purple-100 text-purple-600'}
                    `}
                  >
                    <span className="material-icons-outlined text-2xl">{stat.icon}</span>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">{stat.title}</div>
                    <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                  </div>
                </div>
                <div className={`mt-3 text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} este mes
                </div>
              </div>
            ))}
          </div>

          <div className="table-container">
            <ProyectosTable />
          </div>
        </main>
  );
}