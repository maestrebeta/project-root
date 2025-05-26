import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiTrello, FiUsers, FiPieChart, FiActivity, FiStar, FiCalendar, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Footer from "../Template/Footer.jsx";

export default function Home() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredAction, setHoveredAction] = useState(null);

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Formatear el saludo según la hora del día
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Datos de ejemplo (en producción vendrían de una API)
  const projectStats = {
    total: 24,
    active: 8,
    delayed: 3,
    completed: 13,
    weeklyProgress: 68,
    monthlyTrend: '+12%'
  };

  const recentActivity = [
    { id: 1, type: 'project', title: 'Nuevo proyecto creado', description: 'Sistema de Gestión v2.0', time: '2h', icon: FiTrello },
    { id: 2, type: 'user', title: 'Usuario actualizado', description: 'Permisos modificados para Juan Pérez', time: '4h', icon: FiUsers },
    { id: 3, type: 'report', title: 'Reporte generado', description: 'Informe mensual de productividad', time: '6h', icon: FiPieChart },
    { id: 4, type: 'time', title: 'Tiempo registrado', description: '8h en Desarrollo Frontend', time: '8h', icon: FiClock }
  ];

  const quickActions = [
    { 
      icon: FiTrello,
      label: 'SmartPlanner',
      description: 'Gestiona tus proyectos y tareas',
      to: '/manager/planning',
      color: 'blue'
    },
    {
      icon: FiPieChart,
      label: 'Auditar Jira',
      description: 'Analiza el rendimiento del equipo',
      to: '/manager/jira-summary',
      color: 'indigo'
    },
    {
      icon: FiClock,
      label: 'Registro Horas',
      description: 'Controla tu tiempo y productividad',
      to: '/user/time-tracker',
      color: 'purple'
    },
    {
      icon: FiUsers,
      label: 'Gestión Usuarios',
      description: 'Administra el equipo',
      to: '/admin/users',
      color: 'green'
    }
  ];

  const upcomingDeadlines = [
    { project: 'Sistema de Gestión v2.0', deadline: '2024-03-20', status: 'on-track' },
    { project: 'App Móvil Cliente', deadline: '2024-03-25', status: 'at-risk' },
    { project: 'Portal Empleados', deadline: '2024-04-01', status: 'delayed' }
  ];

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3] ${theme.FONT_CLASS}`}>
      <main className="flex-1 px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
            {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 👋
          </h1>
          <p className="text-lg text-gray-600">
            {currentTime.toLocaleDateString('es-ES', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </motion.div>

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {quickActions.map((action, idx) => (
            <motion.div
              key={action.to}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredAction(idx)}
              onHoverEnd={() => setHoveredAction(null)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:shadow-lg transition-all duration-200"
              onClick={() => navigate(action.to)}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  p-3 rounded-lg transition-colors duration-200
                  ${action.color === 'blue' ? 'bg-blue-100 text-blue-600' : ''}
                  ${action.color === 'indigo' ? 'bg-indigo-100 text-indigo-600' : ''}
                  ${action.color === 'purple' ? 'bg-purple-100 text-purple-600' : ''}
                  ${action.color === 'green' ? 'bg-green-100 text-green-600' : ''}
                `}>
                  <action.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    {action.label}
                    <AnimatePresence>
                      {hoveredAction === idx && (
                        <motion.span
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FiArrowRight className="w-4 h-4 text-gray-400" />
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Project Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Resumen de Proyectos</h2>
              <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium">
                {projectStats.weeklyProgress}% completado esta semana
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100/50">
                <div className="text-3xl font-bold text-blue-600">{projectStats.total}</div>
                <div className="text-sm text-blue-600/80 mt-1">Total Proyectos</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100/50">
                <div className="text-3xl font-bold text-emerald-600">{projectStats.active}</div>
                <div className="text-sm text-emerald-600/80 mt-1">Activos</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100/50">
                <div className="text-3xl font-bold text-amber-600">{projectStats.delayed}</div>
                <div className="text-sm text-amber-600/80 mt-1">Retrasados</div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100/50">
                <div className="text-3xl font-bold text-purple-600">{projectStats.completed}</div>
                <div className="text-sm text-purple-600/80 mt-1">Completados</div>
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Actividad Reciente</h2>
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Ver todo
              </button>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <motion.div
                  key={activity.id}
                  whileHover={{ x: 4 }}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50/80 transition-all duration-200 cursor-pointer group"
                >
                  <div className={`p-2 rounded-lg ${theme.PRIMARY_BG_SOFT} transition-colors duration-200`}>
                    <activity.icon className={`w-5 h-5 ${theme.PRIMARY_COLOR_CLASS}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900">{activity.title}</h3>
                    <p className="text-xs text-gray-500 truncate group-hover:text-gray-600">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">Hace {activity.time}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Upcoming Deadlines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">Próximos Vencimientos</h2>
            <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              Ver calendario
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-4 font-medium">Proyecto</th>
                  <th className="pb-4 font-medium">Fecha Límite</th>
                  <th className="pb-4 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {upcomingDeadlines.map((deadline) => (
                  <tr
                    key={deadline.project}
                    className="group cursor-pointer hover:bg-gray-50/80 transition-colors duration-200"
                  >
                    <td className="py-3">
                      <div className="font-medium text-gray-800 group-hover:text-gray-900 transition-colors">
                        {deadline.project}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                        {new Date(deadline.deadline).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`
                        px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all
                        ${deadline.status === 'on-track' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : ''}
                        ${deadline.status === 'at-risk' ? 'bg-amber-50 text-amber-600 group-hover:bg-amber-100' : ''}
                        ${deadline.status === 'delayed' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : ''}
                      `}>
                        {deadline.status === 'on-track' && <FiCheckCircle className="w-3 h-3" />}
                        {deadline.status === 'at-risk' && <FiAlertCircle className="w-3 h-3" />}
                        {deadline.status === 'delayed' && <FiAlertCircle className="w-3 h-3" />}
                        {deadline.status === 'on-track' ? 'En tiempo' : 
                         deadline.status === 'at-risk' ? 'En riesgo' : 'Retrasado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}