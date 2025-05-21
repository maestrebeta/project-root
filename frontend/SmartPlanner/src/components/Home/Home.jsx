import React from 'react';
import Footer from "../Template/Footer.jsx";

export default function Home() {
  const statsData = [
    { title: 'Total Proyectos', value: '24', change: '+3', icon: 'folder', color: 'blue' },
    { title: 'En progreso', value: '8', change: '+1', icon: 'trending_up', color: 'green' },
    { title: 'Atrasados', value: '3', change: '-2', icon: 'warning', color: 'red' },
    { title: 'Completados', value: '13', change: '+5', icon: 'check_circle', color: 'purple' }
  ];

  const quickLinks = [
    { icon: 'view_timeline', label: 'Proyectos', to: '/projects', color: 'blue' },
    { icon: 'group', label: 'Usuarios', to: '/users', color: 'green' },
    { icon: 'confirmation_number', label: 'Tickets', to: '/tickets', color: 'yellow' },
    { icon: 'security', label: 'Seguridad', to: '/security', color: 'red' }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f7fb]">
      <main className="flex-1 px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">Bienvenido a SmartPlanner</h1>
          <p className="text-lg text-gray-500">
            Tu panel centralizado para la gestión de proyectos, usuarios y tickets de IT.
          </p>
        </div>

        <div className="flex flex-wrap gap-6 my-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col justify-between bg-white rounded-2xl shadow-md border border-gray-100 px-8 py-6 min-w-[200px] max-w-[240px] flex-1 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                    flex items-center justify-center w-12 h-12 rounded-full
                    ${stat.color === 'blue' && 'bg-blue-100 text-blue-600'}
                    ${stat.color === 'green' && 'bg-green-100 text-green-600'}
                    ${stat.color === 'red' && 'bg-red-100 text-red-600'}
                    ${stat.color === 'purple' && 'bg-purple-100 text-purple-600'}
                  `}
                >
                  <span className="material-icons-outlined text-3xl">{stat.icon}</span>
                </div>
                <div>
                  <div className="text-sm text-gray-500 font-medium">{stat.title}</div>
                  <div className="text-3xl font-extrabold text-gray-800">{stat.value}</div>
                </div>
              </div>
              <div className={`mt-4 text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                {stat.change} este mes
              </div>
            </div>
          ))}
        </div>

        <div className="my-12">
          <h2 className="text-xl font-bold text-gray-700 mb-4">Accesos rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {quickLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.to}
                className={`
                  flex flex-col items-center justify-center bg-white rounded-xl shadow border border-gray-100 py-8 hover:bg-blue-50 transition group
                `}
              >
                <span
                  className={`
                    material-icons-outlined text-4xl mb-2
                    ${link.color === 'blue' && 'text-blue-500'}
                    ${link.color === 'green' && 'text-green-500'}
                    ${link.color === 'yellow' && 'text-yellow-500'}
                    ${link.color === 'red' && 'text-red-500'}
                  `}
                >
                  {link.icon}
                </span>
                <span className="text-lg font-semibold text-gray-700 group-hover:text-blue-700">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}