import React, { useEffect, useState } from 'react';
import ClientsTable from './ClientsTable';

export default function ClientsResume() {
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    nuevosMes: 0
  });

  useEffect(() => {
    // Suponiendo que tu API devuelve todos los clientes con campos: is_active y created_at
    fetch('http://localhost:8000/clients/')
      .then(res => res.json())
      .then(data => {
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
      });
  }, []);

  const statsData = [
    { title: 'Total Clientes', value: stats.total, icon: 'groups', color: 'blue' },
    { title: 'Activos', value: stats.activos, icon: 'check_circle', color: 'green' },
    { title: 'Inactivos', value: stats.inactivos, icon: 'block', color: 'red' },
    { title: 'Nuevos este mes', value: stats.nuevosMes, icon: 'person_add', color: 'purple' }
  ];

  return (
    <main className="main-content">
      <div className="content-header">
        <div>
          <h1 className="text-2xl font-bold">Listado de Clientes</h1>
          <p className="text-sm text-gray-500">Gestión y seguimiento de todos los clientes registrados</p>
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
          </div>
        ))}
      </div>

      <div className="table-container">
        <ClientsTable />
      </div>
    </main>
  );
}