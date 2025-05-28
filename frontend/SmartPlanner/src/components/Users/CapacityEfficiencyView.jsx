import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUsers, FiTrendingUp, FiClock, FiTarget, FiActivity, 
  FiBarChart2, FiBarChart, FiRefreshCw, FiAlertTriangle,
  FiCheckCircle, FiXCircle, FiInfo, FiZap, FiAward,
  FiFilter, FiDownload, FiSettings
} from 'react-icons/fi';

export default function CapacityEfficiencyView({ 
  capacityData, 
  loading, 
  onRefresh,
  getCapacityColor,
  getEfficiencyColor,
  getSpecializationColor,
  getSpecializationLabel 
}) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('efficiency');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Datos por defecto si no hay capacityData
  const defaultData = {
    users: [],
    workload_summary: [],
    summary: {
      total_users: 0,
      avg_capacity: 0,
      avg_efficiency: 0,
      overloaded_users: 0,
      total_worked_hours: 0,
      total_assigned_hours: 0,
      global_ticket_resolution: 0,
      total_resolved_tickets: 0,
      total_tickets_assigned: 0
    }
  };

  const data = capacityData || defaultData;

  // Filtrar y ordenar usuarios
  const getFilteredAndSortedUsers = () => {
    let filtered = data.users || [];

    // Aplicar filtros
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'overloaded') {
        filtered = filtered.filter(user => user.is_overloaded);
      } else if (selectedFilter === 'underutilized') {
        filtered = filtered.filter(user => user.capacity_percentage < 50);
      } else {
        filtered = filtered.filter(user => user.specialization === selectedFilter);
      }
    }

    // Aplicar ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'efficiency':
          return (b.efficiency_score || 0) - (a.efficiency_score || 0);
        case 'capacity':
          return (b.capacity_percentage || 0) - (a.capacity_percentage || 0);
        case 'tickets':
          return (b.resolved_tickets || 0) - (a.resolved_tickets || 0);
        case 'name':
          return (a.full_name || a.username || '').localeCompare(b.full_name || b.username || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredUsers = getFilteredAndSortedUsers();

  // Métricas destacadas
  const keyMetrics = [
    {
      title: 'Eficiencia Promedio',
      value: `${Math.round(data.summary?.avg_efficiency || 0)}%`,
      change: data.summary?.avg_efficiency > 75 ? '+5.2%' : '-2.1%',
      trend: data.summary?.avg_efficiency > 75 ? 'up' : 'down',
      icon: FiTrendingUp,
      color: data.summary?.avg_efficiency > 75 ? 'green' : 'red',
      description: 'Rendimiento general del equipo'
    },
    {
      title: 'Capacidad Utilizada',
      value: `${Math.round(data.summary?.avg_capacity || 0)}%`,
      change: '+3.8%',
      trend: 'up',
      icon: FiBarChart2,
      color: 'blue',
      description: 'Porcentaje de capacidad en uso'
    },
    {
      title: 'Tickets Resueltos',
      value: data.summary?.total_resolved_tickets || 0,
      change: `${Math.round(data.summary?.global_ticket_resolution || 0)}%`,
      trend: 'up',
      icon: FiCheckCircle,
      color: 'emerald',
      description: 'Tasa de resolución global'
    },
    {
      title: 'Usuarios Sobrecargados',
      value: data.summary?.overloaded_users || 0,
      change: data.summary?.overloaded_users === 0 ? '0%' : '+12%',
      trend: data.summary?.overloaded_users === 0 ? 'neutral' : 'down',
      icon: FiAlertTriangle,
      color: data.summary?.overloaded_users === 0 ? 'green' : 'red',
      description: 'Usuarios con >90% capacidad'
    }
  ];

  // Componente de tarjeta de usuario mejorada
  const UserCard = ({ user }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ y: -4, shadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
      className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:border-blue-200 transition-all duration-300"
    >
      {/* Header del usuario */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.full_name || user.username}</h3>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(user.specialization)}`}>
                {getSpecializationLabel(user.specialization)}
              </span>
              {user.is_overloaded && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  ⚠️ Sobrecargado
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getEfficiencyColor(user.efficiency_score)}`}>
            {Math.round(user.efficiency_score || 0)}%
          </div>
          <div className="text-xs text-gray-500">Eficiencia</div>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{user.assigned_hours || 0}h</div>
          <div className="text-xs text-gray-600">Asignadas</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-bold text-gray-900">{user.worked_hours || 0}h</div>
          <div className="text-xs text-gray-600">Trabajadas</div>
        </div>
      </div>

      {/* Barra de capacidad */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Capacidad</span>
          <span className={`text-sm font-bold ${getCapacityColor(user.capacity_percentage)}`}>
            {Math.round(user.capacity_percentage || 0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(user.capacity_percentage || 0, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-2 rounded-full ${
              (user.capacity_percentage || 0) > 90 ? 'bg-red-500' :
              (user.capacity_percentage || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
          />
        </div>
      </div>

      {/* Estadísticas adicionales */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-sm font-bold text-gray-900">{user.completed_tasks || 0}</div>
          <div className="text-xs text-gray-600">Tareas</div>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">{user.resolved_tickets || 0}</div>
          <div className="text-xs text-gray-600">Tickets</div>
        </div>
        <div>
          <div className="text-sm font-bold text-gray-900">{user.avg_completion_time || 'N/A'}</div>
          <div className="text-xs text-gray-600">Tiempo Prom.</div>
        </div>
      </div>

      {/* Tareas preferidas */}
      {user.preferred_tasks && user.preferred_tasks.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-600 mb-2">Especialidades:</div>
          <div className="flex flex-wrap gap-1">
            {user.preferred_tasks.slice(0, 3).map((task, index) => (
              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {task}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Capacidad y Eficiencia del Equipo</h2>
          <p className="text-gray-600">Análisis detallado del rendimiento y carga de trabajo</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtros */}
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos los usuarios</option>
            <option value="overloaded">Sobrecargados</option>
            <option value="underutilized">Subutilizados</option>
            <option value="development">Desarrollo</option>
            <option value="ui_ux">UI/UX</option>
            <option value="testing">Testing</option>
            <option value="management">Gestión</option>
          </select>

          {/* Ordenamiento */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="efficiency">Por Eficiencia</option>
            <option value="capacity">Por Capacidad</option>
            <option value="tickets">Por Tickets</option>
            <option value="name">Por Nombre</option>
          </select>

          {/* Modo de vista */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded-md ${viewMode === 'cards' ? 'bg-white shadow-sm' : ''}`}
            >
              <FiUsers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
            >
              <FiBarChart className="w-4 h-4" />
            </button>
          </div>

          {/* Botón de actualizar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <FiRefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {keyMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${metric.color}-100`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600`} />
              </div>
              <div className={`text-sm font-medium ${
                metric.trend === 'up' ? 'text-green-600' : 
                metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.change}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
              <div className="text-sm font-medium text-gray-900 mb-1">{metric.title}</div>
              <div className="text-xs text-gray-600">{metric.description}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Resumen por especialización */}
      {data.workload_summary && data.workload_summary.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Especialización</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.workload_summary.map((spec, index) => (
              <motion.div
                key={spec.specialization}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpecializationColor(spec.specialization)}`}>
                    {getSpecializationLabel(spec.specialization)}
                  </span>
                  <span className="text-sm font-bold text-gray-900">{spec.user_count} usuarios</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-600">Horas totales</div>
                    <div className="font-semibold">{spec.total_hours}h</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Eficiencia prom.</div>
                    <div className="font-semibold">{spec.avg_efficiency}%</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Equipo ({filteredUsers.length} usuarios)
          </h3>
          {filteredUsers.length === 0 && (
            <span className="text-sm text-gray-500">No hay datos disponibles</span>
          )}
        </div>

        {filteredUsers.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredUsers.map((user) => (
                <UserCard key={user.user_id} user={user} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-12">
            <FiUsers className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de capacidad</h3>
            <p className="text-gray-500 mb-4">
              {data.users?.length === 0 
                ? 'No se encontraron usuarios en la organización'
                : 'No hay usuarios que coincidan con los filtros seleccionados'
              }
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Actualizar datos
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
} 