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

  // Componente de tarjeta de usuario simplificado
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

      {/* Métricas principales simplificadas */}
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
    <div className="space-y-8">
      {/* Header Ejecutivo Mejorado */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-3">Centro de Análisis de Capacidad</h1>
              <p className="text-indigo-100 text-xl mb-6">Optimización inteligente del rendimiento del equipo</p>
              
              {/* Métricas principales integradas en el header */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1">{data.summary?.total_users || 0}</div>
                  <div className="text-indigo-200 text-sm">Total de Usuarios</div>
                  <div className="text-2xl mt-2">👥</div>
                </div>
                
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1">{data.summary?.overloaded_users || 0}</div>
                  <div className="text-indigo-200 text-sm">Sobrecargados</div>
                  <div className="text-2xl mt-2">⚡</div>
                </div>
                
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1">{Math.round(data.summary?.avg_capacity || 0)}%</div>
                  <div className="text-indigo-200 text-sm">Capacidad Promedio</div>
                  <div className="text-2xl mt-2">📊</div>
                </div>
                
                <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold mb-1">{Math.round(data.summary?.avg_efficiency || 0)}%</div>
                  <div className="text-indigo-200 text-sm">Eficiencia Global</div>
                  <div className="text-2xl mt-2">🚀</div>
                </div>
              </div>
            </div>
            
            <div className="text-right ml-8">
              <div className="text-6xl font-bold mb-3">{Math.round(data.summary?.avg_efficiency || 0)}%</div>
              <div className="text-indigo-200 font-medium text-lg">Eficiencia Global</div>
              <div className="text-sm text-indigo-300 mt-2">
                {data.summary?.avg_efficiency > 85 ? '🚀 Rendimiento Excepcional' : 
                 data.summary?.avg_efficiency > 70 ? '📈 Buen Rendimiento' : '⚠️ Necesita Atención'}
              </div>
              <div className="mt-4 text-xs text-indigo-300">
                Última actualización: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controles Mejorados */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-900">Análisis Detallado del Equipo</h2>
            <p className="text-gray-600">Explora y optimiza el rendimiento de cada miembro</p>
        </div>
        
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtros Mejorados */}
            <div className="relative">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">👥 Todos los usuarios</option>
                <option value="overloaded">⚡ Sobrecargados</option>
                <option value="underutilized">📉 Subutilizados</option>
                <option value="development">💻 Desarrollo</option>
                <option value="ui_ux">🎨 UI/UX</option>
                <option value="testing">🧪 Testing</option>
                <option value="management">👔 Gestión</option>
          </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="material-icons-outlined text-gray-400 text-sm">expand_more</span>
              </div>
            </div>

            {/* Ordenamiento Mejorado */}
            <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="efficiency">📈 Por Eficiencia</option>
                <option value="capacity">⚡ Por Capacidad</option>
                <option value="tickets">🎯 Por Tickets</option>
                <option value="name">👤 Por Nombre</option>
          </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="material-icons-outlined text-gray-400 text-sm">expand_more</span>
              </div>
            </div>

            {/* Modo de vista Mejorado */}
            <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('cards')}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'cards' 
                    ? 'bg-white shadow-lg text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de tarjetas"
              >
                <FiUsers className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
                className={`p-3 rounded-lg transition-all duration-300 ${
                  viewMode === 'table' 
                    ? 'bg-white shadow-lg text-blue-600' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Vista de tabla"
              >
                <FiBarChart className="w-5 h-5" />
            </button>
          </div>

            {/* Botón de actualizar Mejorado */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
              title="Actualizar datos"
          >
              <FiRefreshCw className="w-5 h-5" />
          </motion.button>
          </div>
        </div>
      </div>

      {/* Lista de usuarios Mejorada */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
            Equipo ({filteredUsers.length} usuarios)
          </h3>
            <p className="text-gray-600 mt-1">
              {filteredUsers.length === 0 
                ? 'No hay usuarios que coincidan con los filtros'
                : `Mostrando ${filteredUsers.length} de ${data.users?.length || 0} usuarios`
              }
            </p>
          </div>
          {filteredUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="material-icons-outlined text-base">info</span>
              Haz clic en una tarjeta para ver más detalles
            </div>
          )}
        </div>

        {filteredUsers.length > 0 ? (
          viewMode === 'cards' ? (
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialización
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eficiencia
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacidad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Asignadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horas Trabajadas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3">
                            {(user.full_name || user.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.full_name || user.username}
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSpecializationColor(user.specialization)}`}>
                            {getSpecializationLabel(user.specialization)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round(user.efficiency_score || 0)}%
                        </div>
                        <div className={`text-xs ${
                          (user.efficiency_score || 0) >= 90 ? 'text-green-600' :
                          (user.efficiency_score || 0) >= 75 ? 'text-blue-600' :
                          (user.efficiency_score || 0) >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {(user.efficiency_score || 0) >= 90 ? 'Excelente' :
                           (user.efficiency_score || 0) >= 75 ? 'Bueno' :
                           (user.efficiency_score || 0) >= 60 ? 'Regular' : 'Necesita mejora'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${
                                (user.capacity_percentage || 0) > 90 ? 'bg-red-500' :
                                (user.capacity_percentage || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(user.capacity_percentage || 0, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {Math.round(user.capacity_percentage || 0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.assigned_hours || 0}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.worked_hours || 0}h
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_overloaded 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.is_overloaded ? '⚠️ Sobrecargado' : '✅ Equilibrado'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-8xl mb-6"
            >
              {data.users?.length === 0 ? '👥' : '🔍'}
            </motion.div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              {data.users?.length === 0 
                ? 'No hay usuarios en el equipo'
                : 'No se encontraron resultados'
              }
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {data.users?.length === 0 
                ? 'Comienza agregando el primer miembro del equipo para ver análisis de capacidad'
                : 'Intenta ajustar los filtros o criterios de búsqueda'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {data.users?.length === 0 ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-icons-outlined">person_add</span>
                    Agregar Primer Usuario
                  </span>
                </motion.button>
              ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedFilter('all');
                    setSortBy('efficiency');
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-semibold"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-icons-outlined">refresh</span>
                    Limpiar Filtros
                  </span>
            </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 