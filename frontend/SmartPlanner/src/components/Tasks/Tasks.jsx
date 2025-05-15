import React, { useEffect, useState } from 'react';
import TasksTable from './TasksTable';

export default function TasksResume() {
  const [stats, setStats] = useState({
    total: 0,
    usuarios: 0,
    proyectos: 0,
    horas: 0,
    hoy: 0
  });

  useEffect(() => {
    fetch('http://localhost:8000/time-entries/')
      .then(res => res.json())
      .then(data => {
        const total = data.length;
        const usuarios = new Set(data.map(t => t.user_id)).size;
        const proyectos = new Set(data.map(t => t.project_id)).size;
        const horas = data.reduce((sum, t) => sum + (parseFloat(t.hours) || 0), 0);
        const hoy = data.filter(t => {
          if (!t.start_time) return false;
          const start = new Date(t.start_time);
          const now = new Date();
          return start.getDate() === now.getDate() &&
                 start.getMonth() === now.getMonth() &&
                 start.getFullYear() === now.getFullYear();
        }).length;
        setStats({ total, usuarios, proyectos, horas, hoy });
      });
  }, []);

  const statsData = [
    { title: 'Tareas registradas', value: stats.total, icon: 'assignment', color: 'blue' },
    { title: 'Usuarios con tareas', value: stats.usuarios, icon: 'person', color: 'green' },
    { title: 'Proyectos involucrados', value: stats.proyectos, icon: 'folder', color: 'purple' },
    { title: 'Horas totales', value: stats.horas.toFixed(2), icon: 'schedule', color: 'orange' },
    { title: 'Tareas hoy', value: stats.hoy, icon: 'today', color: 'teal' }
  ];

  return (
    <main className="main-content">
      <div className="content-header">
        <div>
          <h1 className="text-2xl font-bold">Registro de Tareas</h1>
          <p className="text-sm text-gray-500">Visualiza y gestiona todas las tareas y registros de tiempo</p>
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
                  ${stat.color === 'purple' && 'bg-purple-100 text-purple-600'}
                  ${stat.color === 'orange' && 'bg-orange-100 text-orange-600'}
                  ${stat.color === 'teal' && 'bg-teal-100 text-teal-600'}
                `}
              >
                <span className="material-icons-outlined text-2xl">{stat.icon}</span>
              </div>
              <div>
                <div className="text-xs text-gray-500 font-medium">{stat.title}</div>
                <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="table-container">
        <TasksTable />
      </div>
    </main>
  );
}