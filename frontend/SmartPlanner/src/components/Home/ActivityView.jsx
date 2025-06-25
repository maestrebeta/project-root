import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFilter, FiSearch, FiClock, FiTrello, FiUsers, FiPieChart, FiActivity, FiCalendar, FiCheckCircle, FiAlertCircle, FiStar, FiEye, FiDownload } from 'react-icons/fi';

const ActivityView = ({ isOpen, onClose }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo para actividades
  const activities = [
    { 
      id: 1, 
      type: 'project', 
      title: 'Nuevo proyecto creado', 
      description: 'Sistema de Gestión v2.0', 
      time: '2h', 
      icon: FiTrello,
      user: 'María González',
      priority: 'high',
      status: 'completed'
    },
    { 
      id: 2, 
      type: 'user', 
      title: 'Usuario actualizado', 
      description: 'Permisos modificados para Juan Pérez', 
      time: '4h', 
      icon: FiUsers,
      user: 'Admin',
      priority: 'medium',
      status: 'completed'
    },
    { 
      id: 3, 
      type: 'report', 
      title: 'Reporte generado', 
      description: 'Informe mensual de productividad', 
      time: '6h', 
      icon: FiPieChart,
      user: 'Sistema',
      priority: 'low',
      status: 'completed'
    },
    { 
      id: 4, 
      type: 'time', 
      title: 'Tiempo registrado', 
      description: '8h en Desarrollo Frontend', 
      time: '8h', 
      icon: FiClock,
      user: 'Carlos Rodríguez',
      priority: 'medium',
      status: 'completed'
    },
    { 
      id: 5, 
      type: 'project', 
      title: 'Tarea completada', 
      description: 'Implementación de autenticación', 
      time: '1d', 
      icon: FiCheckCircle,
      user: 'Ana Martínez',
      priority: 'high',
      status: 'completed'
    },
    { 
      id: 6, 
      type: 'alert', 
      title: 'Proyecto retrasado', 
      description: 'API de Integración - Fecha límite próxima', 
      time: '1d', 
      icon: FiAlertCircle,
      user: 'Sistema',
      priority: 'high',
      status: 'pending'
    },
    { 
      id: 7, 
      type: 'meeting', 
      title: 'Reunión programada', 
      description: 'Revisión semanal del equipo', 
      time: '2d', 
      icon: FiCalendar,
      user: 'Laura Fernández',
      priority: 'medium',
      status: 'scheduled'
    },
    { 
      id: 8, 
      type: 'activity', 
      title: 'Actividad iniciada', 
      description: 'Desarrollo de nuevas funcionalidades', 
      time: '3d', 
      icon: FiActivity,
      user: 'Diego López',
      priority: 'low',
      status: 'in-progress'
    }
  ];

  const filters = [
    { id: 'all', label: 'Todas', icon: FiEye },
    { id: 'project', label: 'Proyectos', icon: FiTrello },
    { id: 'user', label: 'Usuarios', icon: FiUsers },
    { id: 'time', label: 'Tiempo', icon: FiClock },
    { id: 'report', label: 'Reportes', icon: FiPieChart }
  ];

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-green-100 text-green-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-600';
      case 'pending': return 'bg-amber-100 text-amber-600';
      case 'scheduled': return 'bg-blue-100 text-blue-600';
      case 'in-progress': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-600';
      case 'user': return 'bg-green-100 text-green-600';
      case 'time': return 'bg-purple-100 text-purple-600';
      case 'report': return 'bg-orange-100 text-orange-600';
      case 'alert': return 'bg-red-100 text-red-600';
      case 'meeting': return 'bg-indigo-100 text-indigo-600';
      case 'activity': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.user.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Renderizar el modal usando Portal
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FiActivity className="w-7 h-7" />
                Actividad del Sistema
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-purple-100">
                Historial completo de actividades y eventos del sistema
              </p>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6">
            {/* Filtros y búsqueda */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                      selectedFilter === filter.id
                        ? 'bg-purple-100 text-purple-700 border-2 border-purple-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <filter.icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de actividades */}
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-300 border border-gray-200/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-4 rounded-2xl ${getTypeColor(activity.type)} shadow-sm`}>
                        <activity.icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-bold text-gray-800 truncate">
                            {activity.title}
                          </h3>
                          <div className="flex items-center gap-2 ml-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(activity.priority)}`}>
                              {activity.priority === 'high' ? 'Alta' :
                               activity.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(activity.status)}`}>
                              {activity.status === 'completed' ? 'Completado' :
                               activity.status === 'pending' ? 'Pendiente' :
                               activity.status === 'scheduled' ? 'Programado' : 'En Progreso'}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3 leading-relaxed">
                          {activity.description}
                        </p>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <span className="flex items-center gap-2">
                            <FiUsers className="w-4 h-4" />
                            {activity.user}
                          </span>
                          <span className="flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            Hace {activity.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <FiActivity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No se encontraron actividades
                  </h3>
                  <p className="text-gray-500">
                    Intenta ajustar los filtros o términos de búsqueda
                  </p>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ActivityView; 