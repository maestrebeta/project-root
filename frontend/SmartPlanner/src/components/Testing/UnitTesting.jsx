import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  FiCheckCircle, FiXCircle, FiAlertTriangle, FiPlus, FiEdit2, FiTrash2, 
  FiSearch, FiFilter, FiEye, FiEyeOff, FiClock, FiFlag, FiArrowUp, FiArrowDown,
  FiHome, FiUsers, FiLayers, FiDollarSign, FiCalendar, FiPieChart, FiClock as FiTimeTracker,
  FiServer, FiGrid, FiSettings, FiMessageCircle, FiZap, FiTrendingUp, FiLoader
} from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { sidebarItems } from '../Template/sidebarConfig';
import { useAuth } from '../../context/AuthContext';

// Función para extraer todas las vistas (items con propiedad 'to') del sidebar
function extractSidebarViews(items) {
  let views = [];
  for (const item of items) {
    if (item.to && item.text && item.icon) {
      views.push({
        id: item.to.replace(/\//g, '').replace(/-/g, ''),
        name: item.text,
        icon: item.icon,
        color: 'blue', // Puedes personalizar colores si lo deseas
        description: '',
        route: item.to
      });
    }
    if (item.children) {
      views = views.concat(extractSidebarViews(item.children));
    }
  }
  return views;
}

const AVAILABLE_VIEWS = extractSidebarViews(sidebarItems);

// Estados de los bugs
const BUG_STATUSES = {
  open: { label: 'Abierto', color: 'red', icon: FiAlertTriangle },
  in_progress: { label: 'En Progreso', color: 'yellow', icon: FiClock },
  resolved: { label: 'Resuelto', color: 'green', icon: FiCheckCircle },
  closed: { label: 'Cerrado', color: 'gray', icon: FiEyeOff }
};

// Prioridades de los bugs (íconos seguros)
const BUG_PRIORITIES = {
  low: { label: 'Baja', color: 'gray', icon: FiArrowDown, value: 1 },
  medium: { label: 'Media', color: 'yellow', icon: FiArrowUp, value: 2 },
  high: { label: 'Alta', color: 'orange', icon: FiAlertTriangle, value: 3 },
  critical: { label: 'Crítica', color: 'red', icon: FiFlag, value: 4 }
};

// Función para obtener headers de autenticación
const getAuthHeaders = () => {
  const session = localStorage.getItem('session');
  if (session) {
    const sessionData = JSON.parse(session);
    return {
      'Authorization': `Bearer ${sessionData.token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

export default function UnitTesting() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [bugs, setBugs] = useState([]);
  const [filteredBugs, setFilteredBugs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingBug, setEditingBug] = useState(null);
  const [selectedView, setSelectedView] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState('all');
  const [sortBy] = useState('priority');
  const [sortOrder] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función auxiliar para renderizar iconos de estado
  const renderStatusIcon = (status) => {
    const statusInfo = BUG_STATUSES[status];
    if (statusInfo) {
      const IconComponent = statusInfo.icon;
      return <IconComponent className="w-5 h-5" />;
    }
    return <FiAlertTriangle className="w-5 h-5" />;
  };

  // Función auxiliar para renderizar iconos de prioridad
  const renderPriorityIcon = (priority) => {
    const priorityInfo = BUG_PRIORITIES[priority];
    if (priorityInfo) {
      const IconComponent = priorityInfo.icon;
      return <IconComponent className="w-4 h-4" />;
    }
    return <FiArrowDown className="w-4 h-4" />;
  };

  // Cargar bugs desde el backend
  const fetchBugs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/bugs/', { 
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setBugs(data.bugs || []);
    } catch (error) {
      console.error('Error fetching bugs:', error);
      setError('Error al cargar los bugs');
      setBugs([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchBugs();
  }, []);

  // Filtrar y ordenar bugs
  useEffect(() => {
    let filtered = bugs.filter(bug => {
      const matchesSearch = bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bug.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || bug.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || bug.priority === priorityFilter;
      const matchesView = viewFilter === 'all' || bug.view_id === viewFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesView;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'priority':
          aValue = BUG_PRIORITIES[a.priority]?.value || 0;
          bValue = BUG_PRIORITIES[b.priority]?.value || 0;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'view_id':
          aValue = a.view_id;
          bValue = b.view_id;
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        default:
          aValue = BUG_PRIORITIES[a.priority]?.value || 0;
          bValue = BUG_PRIORITIES[b.priority]?.value || 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredBugs(filtered);
  }, [bugs, searchTerm, statusFilter, priorityFilter, viewFilter, sortBy, sortOrder]);

  // Funciones CRUD
  const addBug = async (bugData) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8001/bugs/', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          ...bugData,
          reporter: user?.username || 'current_user'
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const newBug = await response.json();
      setBugs(prev => [...prev, newBug]);
    setShowModal(false);
      setSelectedView(null);
    } catch (error) {
      console.error('Error creating bug:', error);
      alert('Error al crear el bug: ' + error.message);
    }
  };

  const updateBug = async (id, bugData) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/bugs/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(bugData)
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedBug = await response.json();
      setBugs(prev => prev.map(bug => 
        bug.id === id ? updatedBug : bug
    ));
    setShowModal(false);
      setEditingBug(null);
    } catch (error) {
      console.error('Error updating bug:', error);
      alert('Error al actualizar el bug: ' + error.message);
    }
  };

  const deleteBug = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este bug?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/bugs/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      setBugs(prev => prev.filter(bug => bug.id !== id));
    } catch (error) {
      console.error('Error deleting bug:', error);
      alert('Error al eliminar el bug: ' + error.message);
    }
  };

  const changeBugStatus = async (id, newStatus) => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8001/bugs/${id}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const updatedBug = await response.json();
      setBugs(prev => prev.map(bug => 
        bug.id === id ? updatedBug : bug
      ));
        } catch (error) {
      console.error('Error updating bug status:', error);
      alert('Error al actualizar el estado del bug: ' + error.message);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 ${theme.FONT_CLASS} relative overflow-hidden`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          </div>

      <div className="relative z-10 p-8">
        {/* Enhanced Filters */}
          <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
            className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 p-8 mb-8"
        >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="relative group">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                  placeholder="Buscar bugs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg font-medium"
            >
                <option value="all">📊 Todos los estados</option>
                {Object.entries(BUG_STATUSES).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            
            <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg font-medium"
            >
                <option value="all">🎯 Todas las prioridades</option>
                {Object.entries(BUG_PRIORITIES).map(([key, priority]) => (
                  <option key={key} value={key}>{priority.label}</option>
              ))}
            </select>
            
              <div className="flex gap-3">
            <select
                  value={viewFilter}
                  onChange={(e) => setViewFilter(e.target.value)}
                  className="flex-1 px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg font-medium"
                >
                  <option value="all">👁️ Todas las vistas</option>
                  {AVAILABLE_VIEWS.map(view => (
                    <option key={view.id} value={view.id}>{view.name}</option>
                  ))}
            </select>
                
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(true)}
                  className="px-4 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
                  title="Reportar Bug"
                >
                  <FiPlus className="w-6 h-6" />
                </motion.button>
              </div>
          </div>
        </motion.div>
        </AnimatePresence>

        {/* Loading State */}
        {loading && (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center py-20"
        >
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 text-lg">Cargando bugs...</p>
          </div>
        </motion.div>
        )}

        {/* Error State */}
        {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3">
              <FiAlertTriangle className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error al cargar datos</h3>
                <p className="text-red-600">{error}</p>
              </div>
              <button
                onClick={fetchBugs}
                className="ml-auto px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </motion.div>
        )}

        {/* Enhanced Bugs List */}
        {!loading && !error && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
              className="space-y-6"
            >
              {filteredBugs.map((bug, index) => {
                const view = AVAILABLE_VIEWS.find(v => v.id === bug.view_id);
                const statusInfo = BUG_STATUSES[bug.status];
                const priorityInfo = BUG_PRIORITIES[bug.priority];
                
                return (
                  <motion.div
                    key={bug.id}
                    initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -4,
                      transition: { duration: 0.2 }
                    }}
                    className="group relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Priority indicator line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                      priorityInfo.color === 'red' ? 'from-red-500 to-red-600' :
                      priorityInfo.color === 'orange' ? 'from-orange-500 to-orange-600' :
                      priorityInfo.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                      'from-gray-500 to-gray-600'
                    }`}></div>

                    <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                          <div className="flex items-start gap-6 mb-6">
                            {/* Enhanced Priority Badge */}
                            <div className={`p-4 rounded-2xl shadow-lg ${
                              priorityInfo.color === 'red' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' :
                              priorityInfo.color === 'orange' ? 'bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700' :
                              priorityInfo.color === 'yellow' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700' :
                              'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                    }`}>
                              <div className="flex items-center gap-2">
                                {renderPriorityIcon(bug.priority)}
                                <span className="font-bold text-sm">{priorityInfo.label}</span>
                              </div>
                    </div>
                    
                            {/* Enhanced Status Badge */}
                            <div className={`p-4 rounded-2xl shadow-lg ${
                              statusInfo.color === 'red' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-700' :
                              statusInfo.color === 'yellow' ? 'bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700' :
                              statusInfo.color === 'green' ? 'bg-gradient-to-br from-green-100 to-green-200 text-green-700' :
                              'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700'
                            }`}>
                              <div className="flex items-center gap-2">
                                {renderStatusIcon(bug.status)}
                                <span className="font-bold text-sm">{statusInfo.label}</span>
                    </div>
                  </div>
                  
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-3">
                                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                  {bug.title}
                                </h3>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold">
                                  #{bug.id}
                                </span>
                              </div>
                              
                              <p className="text-lg text-gray-600 mb-4 leading-relaxed">
                                {bug.description}
                              </p>
                              
                              <div className="flex items-center gap-8 text-sm text-gray-500 mb-6">
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                                  {view && <view.icon className="w-5 h-5 text-blue-500" />}
                                  <span className="font-semibold">{view?.name || 'Vista desconocida'}</span>
                    </span>
                    
                                <span className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl">
                                  <FiClock className="w-5 h-5 text-gray-400" />
                                  <span className="font-semibold">
                                    {new Date(bug.created_at).toLocaleDateString('es-ES', { 
                                      day: 'numeric', 
                                      month: 'short',
                                      year: 'numeric'
                                    })}
                                  </span>
                      </span>
                                
                                {bug.assigned_to && (
                                  <span className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl text-blue-600">
                                    <FiUsers className="w-5 h-5" />
                                    <span className="font-semibold">Asignado a: {bug.assigned_to}</span>
                      </span>
                    )}
                  </div>
                  
                              {/* Enhanced Quick Actions */}
                              <div className="flex items-center gap-4">
                                <select
                                  value={bug.status}
                                  onChange={(e) => changeBugStatus(bug.id, e.target.value)}
                                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 font-medium"
                                >
                                  {Object.entries(BUG_STATUSES).map(([key, status]) => (
                                    <option key={key} value={key}>{status.label}</option>
                                  ))}
                                </select>
                                
                                <select
                                  value={bug.priority}
                                  onChange={(e) => updateBug(bug.id, { priority: e.target.value })}
                                  className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 font-medium"
                                >
                                  {Object.entries(BUG_PRIORITIES).map(([key, priority]) => (
                                    <option key={key} value={key}>{priority.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                </div>
                
                        {/* Enhanced Action Buttons */}
                        <div className="flex items-center gap-3 ml-6">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                    onClick={() => {
                              setEditingBug(bug);
                      setShowModal(true);
                    }}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 group"
                            title="Editar bug"
                  >
                            <FiEdit2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </motion.button>
                  
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => deleteBug(bug.id)}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                            title="Eliminar bug"
                  >
                            <FiTrash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </motion.button>
                        </div>
                </div>
              </div>
            </motion.div>
                );
              })}
          
              {filteredBugs.length === 0 && !loading && (
            <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="text-center py-20"
            >
                  <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 shadow-xl border border-white/20">
                    <div className="text-gray-400 mb-6">
                      <FiTrendingUp className="w-24 h-24 mx-auto" />
                    </div>
                    <h3 className="text-3xl font-bold text-gray-700 mb-4">¡Excelente trabajo!</h3>
                    <p className="text-xl text-gray-500 mb-8">No hay bugs reportados con los filtros actuales</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <FiPlus className="w-6 h-6 inline mr-3" />
                      Reportar el primer bug
                    </motion.button>
              </div>
            </motion.div>
          )}
        </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Enhanced Modal */}
      <BugModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingBug(null);
          setSelectedView(null);
        }}
        onSave={editingBug ? (data) => updateBug(editingBug.id, data) : addBug}
        bug={editingBug}
        views={AVAILABLE_VIEWS}
        statuses={BUG_STATUSES}
        priorities={BUG_PRIORITIES}
        selectedView={selectedView}
      />
    </div>
  );
}

// Componente Modal para agregar/editar bugs
function BugModal({ isOpen, onClose, onSave, bug, views, statuses, priorities, selectedView }) {
  const [formData, setFormData] = useState({
    view_id: '',
    title: '',
    description: '',
    status: 'open',
    priority: 'medium'
  });

  useEffect(() => {
    if (bug) {
      setFormData({
        view_id: bug.view_id,
        title: bug.title,
        description: bug.description,
        status: bug.status,
        priority: bug.priority
      });
    } else {
      setFormData({
        view_id: selectedView || '',
        title: '',
        description: '',
        status: 'open',
        priority: 'medium'
      });
    }
  }, [bug, selectedView]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.view_id && formData.title.trim() && formData.description.trim()) {
      onSave(formData);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      style={{ isolation: 'isolate' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        style={{ isolation: 'isolate' }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl rounded-t-3xl p-8 border-b border-gray-200 z-20 flex-shrink-0" style={{ isolation: 'isolate' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <FiZap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-blue-800 bg-clip-text text-transparent">
                  {bug ? 'Editar Bug' : 'Reportar Nuevo Bug'}
        </h2>
                <p className="text-gray-600 mt-1">
                  {bug ? 'Modifica los detalles del bug' : 'Describe el problema encontrado'}
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-2xl transition-all duration-300"
            >
              <FiXCircle className="w-6 h-6" />
            </motion.button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1 relative z-10">
          {/* Selección de vista mejorada */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-4">
              🎯 Vista afectada *
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {views.map(view => (
                <motion.button
                  key={view.id}
                  type="button"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setFormData(prev => ({ ...prev, view_id: view.id }))}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 text-left group relative z-0 ${
                    formData.view_id === view.id
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      formData.view_id === view.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
                    } transition-all duration-300`}>
                      <view.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-lg">{view.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{view.description}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Título */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              📝 Título del bug *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg"
              placeholder="Ej: Botón no responde al hacer clic"
              required
            />
          </div>
          
          {/* Prioridad y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                🎯 Prioridad
            </label>
            <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg font-medium"
                style={{ zIndex: 1 }}
            >
                {Object.entries(priorities).map(([key, priority]) => (
                  <option key={key} value={key}>{priority.label}</option>
              ))}
            </select>
          </div>
          
          <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                📊 Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg font-medium"
                style={{ zIndex: 1 }}
            >
              {Object.entries(statuses).map(([key, status]) => (
                <option key={key} value={key}>{status.label}</option>
              ))}
            </select>
            </div>
          </div>
          
          {/* Descripción */}
          <div>
            <label className="block text-lg font-semibold text-gray-800 mb-3">
              📋 Descripción *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all duration-300 text-lg resize-none"
              rows="6"
              placeholder="Describe el problema de manera clara y concisa. Incluye pasos para reproducir, comportamiento esperado vs actual, y cualquier información adicional relevante..."
              required
            />
          </div>
          
          {/* Botones de acción */}
          <div className="flex justify-end gap-4 pt-8 border-t border-gray-200">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-8 py-4 text-gray-600 hover:text-gray-800 font-semibold text-lg transition-colors"
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {bug ? 'Actualizar Bug' : 'Reportar Bug'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );

  return createPortal(modalContent, document.body);
} 