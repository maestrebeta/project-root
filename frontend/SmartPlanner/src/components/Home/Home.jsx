import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiTrello, FiUsers, FiPieChart, FiActivity, FiStar, FiCalendar, FiCheckCircle, FiAlertCircle, FiArrowRight, FiPlus, FiEye, FiTrendingUp, FiTrendingDown, FiTarget, FiAlertTriangle, FiSearch } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Footer from "../Template/Footer.jsx";

// Estilos CSS para line-clamp
const lineClampStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Componente para las acciones rápidas con diseño premium
const QuickActionCard = ({ action, index, hoveredAction, setHoveredAction, onNavigate }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHoveredAction(index)}
      onHoverEnd={() => setHoveredAction(null)}
      className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden"
      onClick={() => onNavigate(action.to)}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Efecto de brillo en hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {/* Efecto de gradiente de fondo */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-15 transition-opacity duration-500
        ${action.color === 'blue' ? 'from-blue-400 via-blue-500 to-blue-600' : ''}
        ${action.color === 'purple' ? 'from-purple-400 via-purple-500 to-purple-600' : ''}
        ${action.color === 'green' ? 'from-green-400 via-green-500 to-green-600' : ''}
        ${action.color === 'indigo' ? 'from-indigo-400 via-indigo-500 to-indigo-600' : ''}
        ${action.color === 'orange' ? 'from-orange-400 via-orange-500 to-orange-600' : ''}
        ${action.color === 'red' ? 'from-red-400 via-red-500 to-red-600' : ''}
      `} />
      
      <div className="relative z-10">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`
            p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-lg
            ${action.color === 'blue' ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-700 shadow-blue-200/50' : ''}
            ${action.color === 'purple' ? 'bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 text-purple-700 shadow-purple-200/50' : ''}
            ${action.color === 'green' ? 'bg-gradient-to-br from-green-100 via-green-200 to-green-300 text-green-700 shadow-green-200/50' : ''}
            ${action.color === 'indigo' ? 'bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 text-indigo-700 shadow-indigo-200/50' : ''}
            ${action.color === 'orange' ? 'bg-gradient-to-br from-orange-100 via-orange-200 to-orange-300 text-orange-700 shadow-orange-200/50' : ''}
            ${action.color === 'red' ? 'bg-gradient-to-br from-red-100 via-red-200 to-red-300 text-red-700 shadow-red-200/50' : ''}
          `}>
            <action.icon className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="relative flex items-center justify-center">
              <h3 className="font-bold text-gray-800 text-lg group-hover:text-gray-900 transition-colors tracking-tight">
                {action.label}
              </h3>
              {hoveredAction === index && (
                <motion.span
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute -right-6"
                >
                  <FiArrowRight className="w-5 h-5 text-gray-400" />
                </motion.span>
              )}
            </div>
            <p className="text-xs text-gray-500 group-hover:text-gray-600 transition-colors leading-relaxed font-medium text-center">
              {action.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente para las estadísticas de proyectos con diseño premium
const ProjectStats = ({ stats, attentionProjects = [] }) => {
  const [selectedMetric, setSelectedMetric] = useState('overview');
  
  const projectMetrics = [
    { 
      id: 'overview',
      label: 'Vista General', 
      value: stats.total, 
      color: 'blue', 
      icon: FiTrello,
      trend: '+5%',
      trendDirection: 'up',
      description: 'Proyectos totales en el sistema'
    },
    { 
      id: 'active',
      label: 'En Progreso', 
      value: stats.active, 
      color: 'emerald', 
      icon: FiActivity,
      trend: '+12%',
      trendDirection: 'up',
      description: 'Proyectos activos actualmente'
    },
    { 
      id: 'delayed',
      label: 'Retrasados', 
      value: stats.delayed, 
      color: 'amber', 
      icon: FiAlertCircle,
      trend: '-3%',
      trendDirection: 'down',
      description: 'Proyectos con retrasos'
    },
    { 
      id: 'completed',
      label: 'Completados', 
      value: stats.completed, 
      color: 'purple', 
      icon: FiCheckCircle,
      trend: '+8%',
      trendDirection: 'up',
      description: 'Proyectos finalizados'
    }
  ];

  const selectedData = projectMetrics.find(metric => metric.id === selectedMetric);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Header con métricas principales */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">Resumen de Proyectos</h2>
          <p className="text-gray-600 text-lg font-medium">Métricas clave y estado actual</p>
        </div>
        
        {/* Métricas principales con tabs */}
        <div className="flex flex-wrap gap-3">
          {projectMetrics.map((metric) => (
            <button
              key={metric.id}
              onClick={() => setSelectedMetric(metric.id)}
              className={`px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 shadow-sm ${
                selectedMetric === metric.id
                  ? `bg-${metric.color}-100 text-${metric.color}-700 border-2 border-${metric.color}-200 shadow-md`
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-2 border-transparent hover:shadow-md'
              }`}
            >
              {metric.label}
            </button>
          ))}
        </div>
      </div>

      {/* Métrica seleccionada destacada */}
      <div className="mb-10">
        {selectedData && (
          <motion.div
            key={selectedData.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`p-5 rounded-3xl bg-${selectedData.color}-100 text-${selectedData.color}-600 shadow-lg`}>
                  <selectedData.icon className="w-10 h-10" />
                </div>
                <div>
                  <div className="text-5xl font-bold text-gray-800 mb-2 tracking-tight">{selectedData.value}</div>
                  <div className="text-xl font-semibold text-gray-600 mb-3">{selectedData.label}</div>
                  <p className="text-sm text-gray-500 font-medium">{selectedData.description}</p>
                </div>
              </div>
              <div className={`flex items-center gap-3 text-xl font-bold ${
                selectedData.trendDirection === 'up' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {selectedData.trendDirection === 'up' ? <FiTrendingUp className="w-7 h-7" /> : <FiTrendingDown className="w-7 h-7" />}
                {selectedData.trend}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Proyectos que requieren atención */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">Proyectos que Requieren Atención</h3>
        </div>
        
        {attentionProjects.length === 0 ? (
          /* Mensaje cuando no hay proyectos que requieren atención */
          <div className="text-center py-12">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">¡Excelente trabajo! 🎉</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Todos los proyectos están bajo control y no requieren atención inmediata. 
              El equipo está funcionando de manera eficiente.
            </p>
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium shadow-lg">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Estado óptimo
            </div>
          </div>
        ) : (
          /* Lista de proyectos que requieren atención */
          <div className="space-y-5">
            {attentionProjects.map((project, index) => {
              return (
                <motion.div
                  key={project.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  whileHover={{ x: 8, scale: 1.02 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100/50 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-300 cursor-pointer border border-gray-200/50 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 text-lg mb-2 tracking-tight">{project.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="text-gray-700 font-medium">{project.reason}</span>
                        <span className="flex items-center gap-1">
                          <FiCalendar className="w-3 h-3" />
                          Inicio: {project.start_date ? new Date(project.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No definida'}
                        </span>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-xs font-bold ${
                      project.criteria === 'Retrasado' ? 'bg-red-50 text-red-600' :
                      project.criteria === 'Ligeramente retrasado' ? 'bg-amber-50 text-amber-600' :
                      project.criteria === 'En riesgo' ? 'bg-orange-50 text-orange-600' :
                      project.criteria === 'Fecha límite' ? 'bg-red-50 text-red-600' :
                      project.criteria === 'Fecha próxima' ? 'bg-yellow-50 text-yellow-600' :
                      project.criteria === 'Progreso bajo' ? 'bg-blue-50 text-blue-600' :
                      project.criteria === 'Eficiencia baja' ? 'bg-purple-50 text-purple-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {project.criteria}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full transition-all duration-700 bg-blue-500"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-gray-500 font-medium">Progreso</span>
                    <span className="text-sm font-bold text-gray-700">{project.progress}%</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Componente para KPIs con diseño premium
const KPIDashboard = ({ kpiData, onViewAll, onNavigateToKPI }) => {
  const [selectedKPI, setSelectedKPI] = useState('overview');
  
  const kpiMetrics = [
    { 
      id: 'overview',
      label: 'Proyectos que necesitan atención', 
      value: kpiData.attentionProjects || 0, 
      color: 'blue', 
      icon: FiActivity,
      description: 'Proyectos retrasados o en riesgo',
      detail: 'Estos proyectos requieren revisión inmediata para evitar retrasos',
      route: '/admin/projects'
    },
    { 
      id: 'stories',
      label: 'HU vencidas', 
      value: kpiData.overdueStories || 0, 
      color: 'amber', 
      icon: FiClock,
      description: 'Historias de usuario fuera de plazo',
      detail: 'Tareas que han superado su fecha límite y necesitan priorización',
      route: '/manager/planning'
    },
    { 
      id: 'tickets',
      label: 'Tickets abiertos', 
      value: kpiData.openTickets || 0, 
      color: 'red', 
      icon: FiAlertCircle,
      description: 'Tickets pendientes de resolución',
      detail: 'Incidencias y solicitudes de ayuda que esperan respuesta',
      route: '/it/tickets'
    },
    { 
      id: 'quotations',
      label: 'Cotizaciones abiertas', 
      value: kpiData.pendingQuotations || 0, 
      color: 'orange', 
      icon: FiStar,
      description: 'Cotizaciones por aprobar',
      detail: 'Propuestas comerciales pendientes de aprobación del cliente',
      route: '/admin/projects'
    },
    { 
      id: 'tasks',
      label: 'Tareas bloqueadas y vencidas', 
      value: kpiData.blockedOrOverdueTasks || 0, 
      color: 'orange', 
      icon: FiAlertTriangle,
      description: 'Tareas que requieren atención inmediata',
      detail: 'Tareas bloqueadas por dependencias o que han superado su fecha límite',
      route: '/tasks'
    },
    { 
      id: 'rating',
      label: 'Satisfacción de clientes', 
      value: kpiData.organizationRating || 'N/A', 
      color: 'green', 
      icon: FiCheckCircle,
      description: 'Calificación promedio de clientes',
      detail: 'Nivel de satisfacción basado en feedback de nuestros clientes',
      route: '/admin/customers'
    }
  ];

  const selectedData = kpiMetrics.find(metric => metric.id === selectedKPI);

  // Función para manejar la navegación según el KPI seleccionado
  const handleViewDetails = () => {
    if (selectedData && onNavigateToKPI) {
      onNavigateToKPI(selectedData.route);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)`,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">Resumen del Sistema</h2>
          <p className="text-gray-600 text-lg font-medium">Métricas importantes de tu organización</p>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 text-center mb-4">
          
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {kpiMetrics.map((metric) => (
          <motion.button
            key={metric.id}
            onClick={() => setSelectedKPI(metric.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`py-8 px-4 rounded-2xl text-center transition-all duration-300 border-2 h-48 flex flex-col items-center justify-center ${
              selectedKPI === metric.id
                ? `bg-${metric.color}-50 border-${metric.color}-200 shadow-lg`
                : 'bg-gray-50 border-transparent hover:bg-gray-100 hover:shadow-md'
            }`}
          >
            <div className={`p-3 rounded-xl bg-${metric.color}-100 text-${metric.color}-600 shadow-sm mb-3 flex-shrink-0`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2 leading-tight">{metric.value}</div>
            <div className="text-sm font-semibold text-gray-700 leading-tight line-clamp-2 px-2">{metric.label}</div>
          </motion.button>
        ))}
      </div>

      {/* KPI Destacado */}
      {selectedData && (
          <motion.div
          key={selectedData.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="p-6 rounded-3xl bg-gradient-to-br from-gray-50 via-white to-gray-50 border border-gray-200 shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className={`p-5 rounded-3xl bg-${selectedData.color}-100 text-${selectedData.color}-600 shadow-lg`}>
                <selectedData.icon className="w-10 h-10" />
            </div>
              <div>
                <div className="text-4xl font-bold text-gray-800 mb-2 tracking-tight">{selectedData.value}</div>
                <div className="text-xl font-semibold text-gray-600 mb-2">{selectedData.label}</div>
                <p className="text-sm text-gray-500 font-medium mb-1">{selectedData.description}</p>
                <p className="text-xs text-gray-400 mb-4">{selectedData.detail}</p>
                <button
                  onClick={() => onNavigateToKPI && onNavigateToKPI(selectedData.route)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  <FiEye className="w-4 h-4" />
                  Ver detalles
                </button>
              </div>
            </div>
      </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Componente de búsqueda y filtros
const SearchAndFilters = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      {/* Eliminada la barra de búsqueda y el botón de nuevo proyecto */}
    </motion.div>
  );
};

export default function Home() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredAction, setHoveredAction] = useState(null);
  
  // Estados para datos reales
  const [projectStats, setProjectStats] = useState({
    total: 0,
    active: 0,
    delayed: 0,
    completed: 0,
    weeklyProgress: 0,
    monthlyTrend: '+0%'
  });
  const [timeAnalytics, setTimeAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [attentionProjects, setAttentionProjects] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingQuotations: 0,
    organizationRating: 'N/A',
    openTasks: 0,
    overdueStories: 0,
    attentionProjects: 0,
    blockedOrOverdueTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Actualizar la hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Cargar datos reales cuando el usuario esté autenticado
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchRealData();
    }
  }, [isAuthenticated, user]);

  // Efecto para recargar datos cuando se actualiza un proyecto
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'projectUpdated' && e.newValue === 'true') {
        // Recargar datos
        fetchRealData();
        // Limpiar la bandera
        localStorage.removeItem('projectUpdated');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // También verificar al cargar la página
    if (localStorage.getItem('projectUpdated') === 'true') {
      fetchRealData();
      localStorage.removeItem('projectUpdated');
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const fetchRealData = async () => {
    setLoading(true);
    setError(''); // Limpiar errores previos
    
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      // Cargar analytics de tiempo (endpoint principal)
      let analyticsData = null;
      try {
        const analyticsResponse = await fetch('http://localhost:8001/projects/time-analytics', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

        if (analyticsResponse.ok) {
          analyticsData = await analyticsResponse.json();
          setTimeAnalytics(analyticsData);
        } else {
          console.warn('No se pudo cargar analytics de tiempo');
          if (analyticsResponse.status === 401) {
            throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
          } else if (analyticsResponse.status >= 500) {
            throw new Error('Error del servidor. Por favor, intenta más tarde.');
          }
        }
      } catch (err) {
        console.warn('Error cargando analytics de tiempo:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          throw new Error('No se puede conectar con el servidor. Verifica tu conexión a internet.');
        }
        throw err;
      }

      // Cargar estadísticas de proyectos (opcional)
      try {
        const statsResponse = await fetch('http://localhost:8001/projects/stats', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          // Usar datos de stats si están disponibles
        }
      } catch (err) {
        console.warn('Error cargando estadísticas de proyectos:', err);
      }

      // Si tenemos datos de analytics, procesar estadísticas
      if (analyticsData) {
        const projects = analyticsData.projects || [];
        const total = projects.length;
        const active = projects.filter(p => ['in_progress', 'in_planning', 'at_risk'].includes(p.status)).length;
        const delayed = projects.filter(p => 
          p.efficiency === 'Retrasado' || 
          p.efficiency === 'Ligeramente retrasado' || 
          p.status === 'at_risk'
        ).length;
        const completed = projects.filter(p => p.status === 'completed').length;
        
        // Calcular progreso semanal (simulado basado en proyectos completados)
        const weeklyProgress = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Calcular tendencia mensual (simulado)
        const monthlyTrend = total > 0 ? `+${Math.round((active / total) * 100)}%` : '+0%';
        
        setProjectStats({
          total,
          active,
          delayed,
          completed,
          weeklyProgress,
          monthlyTrend
        });

        // Generar actividad reciente basada en datos reales
        generateRecentActivity(projects, analyticsData);

        // Generar proyectos que requieren atención con progreso real
        const attentionProjectsData = await generateAttentionProjectsWithRealProgress(projects);
        setAttentionProjects(attentionProjectsData);

        // Generar datos de KPIs con los proyectos ya cargados
        const kpiDataResult = await generateKPIData(projects);
        setKpiData(kpiDataResult);
      } else {
        // Si no hay datos de analytics, establecer valores por defecto
        setProjectStats({
          total: 0,
          active: 0,
          delayed: 0,
          completed: 0,
          weeklyProgress: 0,
          monthlyTrend: '+0%'
        });
        setRecentActivity([]);
        setAttentionProjects([]);
        
        // Generar datos de KPIs sin proyectos
        const kpiDataResult = await generateKPIData([]);
        setKpiData(kpiDataResult);
      }

    } catch (err) {
      console.error('Error fetching real data:', err);
      setError('Error al cargar los datos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (projects, analyticsData) => {
    // Generar actividad reciente basada en proyectos y analytics
    const activities = [];
    
    // Actividad de proyectos recientes
    projects.slice(0, 3).forEach((project, index) => {
      activities.push({
        id: `project-${project.project_id}`,
        title: `Proyecto ${project.name} actualizado`,
        description: `Estado: ${getProjectStatus(project)} - Progreso: ${project.progress_percentage || 0}%`,
        time: `${Math.floor(Math.random() * 24) + 1}h`,
        icon: FiTrello
      });
    });

    // Actividad de tiempo registrado
    if (analyticsData.total_hours > 0) {
      activities.push({
        id: 'time-entry',
        title: 'Horas registradas hoy',
        description: `${analyticsData.total_hours} horas registradas en el sistema`,
        time: '2h',
        icon: FiClock
      });
    }

    setRecentActivity(activities);
  };

  const generateAttentionProjectsWithRealProgress = async (projects) => {
    if (!projects || projects.length === 0) return [];

    // Obtener progreso real de todos los proyectos
    const projectIds = projects.map(p => p.project_id);
    const progressPromises = projectIds.map(async (projectId) => {
      try {
        const response = await fetch(`http://localhost:8001/projects/${projectId}/progress`, {
          headers: {
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('session')).token}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error(`Error obteniendo progreso del proyecto ${projectId}:`, error);
        return null;
      }
    });

    const progressResults = await Promise.all(progressPromises);
    const progressMap = {};
    progressResults.forEach((progress, index) => {
      if (progress) {
        progressMap[projectIds[index]] = progress;
      }
    });

    // Proyectos que requieren atención basados en criterios reales
    const attentionCandidates = projects
      .filter(project => {
        // Excluir proyectos completados
        if (project.status === 'completed') {
          return false;
        }
        
        // Proyectos retrasados
        if (project.efficiency === 'Retrasado') {
          return true;
        }
        
        // Proyectos ligeramente retrasados
        if (project.efficiency === 'Ligeramente retrasado') {
          return true;
        }
        
        // Proyectos en riesgo
        if (project.status === 'at_risk') {
          return true;
        }
        
        // Proyectos con progreso muy bajo (usando progreso real)
        const realProgress = progressMap[project.project_id];
        if (realProgress && realProgress.progress_percentage < 25) {
          return true;
        }
        
        // Proyectos con muchas horas trabajadas pero bajo progreso
        if (project.total_hours > 40 && realProgress && realProgress.progress_percentage < 60) {
          return true;
        }
        
        // Proyectos con fecha de fin próxima (menos de 7 días)
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
            return true;
          }
        }
        
        return false;
      })
      .sort((a, b) => {
        // Priorizar por severidad
        const aSeverity = getProjectSeverity(a, progressMap[a.project_id]);
        const bSeverity = getProjectSeverity(b, progressMap[b.project_id]);
        return bSeverity - aSeverity;
      })
      .slice(0, 4); // Máximo 4 proyectos

    return attentionCandidates.map(project => {
      const realProgress = progressMap[project.project_id];
      const reason = getProjectReason(project, realProgress);
      const status = getProjectStatus(project);
      const criteria = getProjectCriteria(project, realProgress);
      
      return {
        name: project.name,
        progress: realProgress ? realProgress.progress_percentage : 0,
        status: status,
        team: project.unique_users || 1,
        deadline: project.end_date || null,
        start_date: project.start_date || null,
        priority: getProjectPriority(project, realProgress),
        reason: reason,
        criteria: criteria,
        project_id: project.project_id
      };
    });
  };

  const getProjectSeverity = (project, realProgress) => {
    let severity = 0;
    
    if (project.efficiency === 'Retrasado') severity += 10;
    if (project.efficiency === 'Ligeramente retrasado') severity += 7;
    if (project.status === 'at_risk') severity += 8;
    
    // Usar el progreso real si está disponible
    const progressPercentage = realProgress ? realProgress.progress_percentage : (project.progress_percentage || 0);
    if (progressPercentage < 25) severity += 6;
    if (progressPercentage < 50) severity += 4;
    if (project.total_hours > 40 && progressPercentage < 60) severity += 3;
    
    // Agregar severidad por fecha de fin próxima
    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd <= 3 && daysUntilEnd >= 0) severity += 5;
      else if (daysUntilEnd <= 7 && daysUntilEnd >= 0) severity += 3;
    }
    
    return severity;
  };

  const getProjectReason = (project, realProgress) => {
    if (project.efficiency === 'Retrasado') {
      return 'Requiere atención inmediata';
    }
    if (project.efficiency === 'Ligeramente retrasado') {
      return 'Seguimiento recomendado';
    }
    if (project.status === 'at_risk') {
      return 'Seguimiento crítico necesario';
    }
    
    // Usar el progreso real si está disponible
    const progressPercentage = realProgress ? realProgress.progress_percentage : (project.progress_percentage || 0);
    if (progressPercentage < 25) {
      return 'Revisión de planificación';
    }
    if (project.total_hours > 40 && progressPercentage < 60) {
      return 'Eficiencia cuestionable';
    }
    
    // Verificar fecha de fin próxima
    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
        return 'Fecha límite muy próxima';
      }
      if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
        return 'Fecha límite próxima';
      }
    }
    
    // Si no tiene fecha límite, no debería estar en la lista de atención
    return 'Requiere seguimiento';
  };

  const getProjectStatus = (project) => {
    if (project.efficiency === 'Retrasado') return 'delayed';
    if (project.efficiency === 'Ligeramente retrasado') return 'delayed';
    if (project.status === 'at_risk') return 'delayed';
    return 'active';
  };

  const getProjectPriority = (project, realProgress) => {
    const severity = getProjectSeverity(project, realProgress);
    if (severity >= 15) return 'high';
    if (severity >= 10) return 'medium';
    return 'low';
  };

  const getProjectCriteria = (project, realProgress) => {
    if (project.efficiency === 'Retrasado') {
      return 'Retrasado';
    }
    if (project.efficiency === 'Ligeramente retrasado') {
      return 'Ligeramente retrasado';
    }
    if (project.status === 'at_risk') {
      return 'En riesgo';
    }
    
    // Usar el progreso real si está disponible
    const progressPercentage = realProgress ? realProgress.progress_percentage : (project.progress_percentage || 0);
    if (progressPercentage < 25) {
      return 'Progreso bajo';
    }
    if (project.total_hours > 40 && progressPercentage < 60) {
      return 'Eficiencia baja';
    }
    
    // Verificar fecha de fin próxima
    if (project.end_date) {
      const endDate = new Date(project.end_date);
      const today = new Date();
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd <= 3 && daysUntilEnd >= 0) {
        return 'Fecha límite';
      }
      if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
        return 'Fecha próxima';
      }
    }
    
    // Si no tiene fecha límite, no debería estar en la lista de atención
    return 'Requiere atención';
  };

  // Formatear el saludo según la hora del día
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  const quickActions = [
    { 
      icon: FiTrello,
      label: 'SmartPlanner',
      description: 'Gestiona tus proyectos y tareas',
      to: '/manager/planning',
      color: 'blue'
    },
    {
      icon: FiClock,
      label: 'Registro Horas',
      description: 'Controla tu tiempo y productividad',
      to: '/user/time-tracker',
      color: 'purple'
    },
    {
      icon: FiPieChart,
      label: 'Centro de Proyectos',
      description: 'Analiza el rendimiento del equipo',
      to: '/admin/projects',
      color: 'indigo'
    },
    {
      icon: FiUsers,
      label: 'Gestión Usuarios',
      description: 'Administra el equipo',
      to: '/admin/users',
      color: 'green'
    },
    {
      icon: FiStar,
      label: 'Gestión de Clientes',
      description: 'Administra tus clientes y relaciones',
      to: '/admin/customers',
      color: 'orange'
    },
    {
      icon: FiActivity,
      label: 'Tickets',
      description: 'Gestiona soporte y incidencias',
      to: '/it/tickets',
      color: 'red'
    }
  ];

  // Función para generar datos de KPIs
  const generateKPIData = async (projects) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) return {};

      const kpiData = {
        totalTickets: 0,
        openTickets: 0,
        pendingQuotations: 0,
        organizationRating: 'N/A',
        openTasks: 0,
        overdueStories: 0,
        attentionProjects: 0,
        blockedOrOverdueTasks: 0
      };

      // Obtener tickets
      try {
        const ticketsResponse = await fetch('http://localhost:8001/tickets/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (ticketsResponse.ok) {
          const tickets = await ticketsResponse.json();
          kpiData.totalTickets = tickets.length;
          kpiData.openTickets = tickets.filter(t => t.status === 'nuevo' || t.status === 'en_progreso').length;
        }
      } catch (err) {
        console.error('Error fetching tickets:', err);
      }

      // Obtener tareas bloqueadas y vencidas
      try {
        const tasksResponse = await fetch('http://localhost:8001/tasks/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tasksResponse.ok) {
          const tasks = await tasksResponse.json();
          const currentDate = new Date();
          
          // Filtrar tareas bloqueadas y vencidas
          const blockedOrOverdueTasks = tasks.filter(task => {
            // Tareas bloqueadas
            const isBlocked = task.status === 'blocked';
            
            // Tareas vencidas (tienen due_date y no están completadas)
            const isOverdue = task.due_date && 
                             task.status !== 'completed' && 
                             new Date(task.due_date) < currentDate;
            
            return isBlocked || isOverdue;
          });
          
          kpiData.blockedOrOverdueTasks = blockedOrOverdueTasks.length;
        }
      } catch (err) {
        console.error('Error fetching tasks:', err);
        // Fallback: usar 0 si falla la obtención
        kpiData.blockedOrOverdueTasks = 0;
      }

      // Obtener cotizaciones
      try {
        // Primero obtener el resumen para el total pendiente
        const quotationsSummaryResponse = await fetch('http://localhost:8001/projects/quotations/summary', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (quotationsSummaryResponse.ok) {
          const quotationsSummaryData = await quotationsSummaryResponse.json();
          
          // Si no hay monto pendiente, no hay cotizaciones abiertas
          if (quotationsSummaryData.total_pending <= 0) {
            kpiData.pendingQuotations = 0;
          } else {
            // Obtener todos los proyectos para luego obtener sus cotizaciones
            const projectsResponse = await fetch('http://localhost:8001/projects/', {
              headers: {
                'Authorization': `Bearer ${session.token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (projectsResponse.ok) {
              const allProjects = await projectsResponse.json();
              let openQuotationsCount = 0;
              
              // Obtener cotizaciones de cada proyecto
              for (const project of allProjects) {
                try {
                  const projectQuotationsResponse = await fetch(`http://localhost:8001/projects/${project.project_id}/quotations`, {
                    headers: {
                      'Authorization': `Bearer ${session.token}`,
                      'Content-Type': 'application/json'
                    }
                  });
                  
                  if (projectQuotationsResponse.ok) {
                    const projectQuotations = await projectQuotationsResponse.json();
                    // Contar cotizaciones que tienen cuotas pendientes
                    const openQuotations = projectQuotations.filter(quotation => 
                      quotation.total_pending > 0
                    );
                    openQuotationsCount += openQuotations.length;
                  }
                } catch (err) {
                  console.error(`Error fetching quotations for project ${project.project_id}:`, err);
                }
              }
              
              kpiData.pendingQuotations = openQuotationsCount;
            } else {
              // Fallback: si no podemos obtener los proyectos, usar aproximación
              kpiData.pendingQuotations = quotationsSummaryData.total_pending > 0 ? 1 : 0;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching quotations:', err);
      }

      // Obtener calificación de la organización (simulado por ahora)
      try {
        const clientsResponse = await fetch('http://localhost:8001/clients/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (clientsResponse.ok) {
          const clients = await clientsResponse.json();
          // Calcular calificación promedio basada en clientes con rating
          const clientsWithRating = clients.filter(c => c.rating_average !== undefined && c.rating_average !== null);
          if (clientsWithRating.length > 0) {
            const avgRating = clientsWithRating.reduce((sum, c) => sum + (c.rating_average || 0), 0) / clientsWithRating.length;
            kpiData.organizationRating = `${avgRating.toFixed(1)}/5.0`;
          }
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
      }

      // Calcular tareas abiertas y proyectos que necesitan atención basadas en proyectos pasados como parámetro
      if (projects && projects.length > 0) {
        const activeProjects = projects.filter(p => ['in_progress', 'in_planning', 'at_risk'].includes(p.status));
        kpiData.openTasks = activeProjects.reduce((sum, p) => sum + (p.total_stories || 0), 0);
        
        // Calcular proyectos retrasados/en riesgo
        const delayedProjects = projects.filter(p => 
          p.efficiency === 'Retrasado' || 
          p.efficiency === 'Ligeramente retrasado' || 
          p.status === 'at_risk'
        );
        kpiData.attentionProjects = delayedProjects.length; // Proyectos que necesitan atención
        
        // Obtener historias de usuario para calcular las vencidas
        try {
          const storiesResponse = await fetch('http://localhost:8001/epics/stories/', {
            headers: {
              'Authorization': `Bearer ${session.token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (storiesResponse.ok) {
            const stories = await storiesResponse.json();
            const today = new Date();
            
            // Calcular historias vencidas basándose en su fecha límite individual
            const overdueStories = stories.filter(story => {
              if (!story.end_date || story.status === 'done') return false;
              const endDate = new Date(story.end_date);
              return endDate < today;
            });
            
            kpiData.overdueStories = overdueStories.length;
          }
        } catch (err) {
          console.error('Error fetching user stories:', err);
          // Fallback al cálculo anterior si falla la obtención de historias
          const overdueProjects = projects.filter(p => p.efficiency === 'Retrasado');
          kpiData.overdueStories = overdueProjects.reduce((sum, p) => sum + (p.total_stories || 0), 0);
        }
      }

      return kpiData;
    } catch (err) {
      console.error('Error generating KPI data:', err);
      return {};
    }
  };

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS} relative overflow-hidden`}>
        <style>{lineClampStyles}</style>
        <main className="flex-1 px-8 py-10 relative z-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-spin mx-auto mb-4">
                <div className="w-12 h-12 bg-white rounded-full m-2"></div>
              </div>
              <p className="text-gray-600 font-medium">Cargando datos del sistema...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS} relative overflow-hidden`}>
        <style>{lineClampStyles}</style>
        <main className="flex-1 px-8 py-10 relative z-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">Error al cargar datos</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">{error}</p>
              <div className="space-y-3">
              <button 
                onClick={fetchRealData}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                Reintentar
                  </div>
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                >
                  Recargar página
              </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS} relative overflow-hidden`}>
      <style>{lineClampStyles}</style>
      <main className="flex-1 px-8 py-10 relative z-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex-1">
              <div className="flex items-center mb-6">
                <h1 className="text-6xl font-extrabold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent tracking-tight">
                  {getGreeting()}{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}! 
                </h1>
                <motion.span 
                  className="inline-block ml-2 text-6xl"
                  animate={{ 
                    rotate: [0, 20, -10, 20, 0],
                    scale: [1, 1.1, 1.05, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    display: 'inline-block',
                    transformOrigin: '70% 70%'
                  }}
                >
                  👋
                </motion.span>
              </div>
              <p className="text-2xl text-gray-600 font-medium tracking-tight">
                {currentTime.toLocaleDateString('es-ES', { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-sm shadow-xl border border-white/20">
                <div className="text-3xl font-bold text-gray-800 tracking-tight">
                  {currentTime.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <SearchAndFilters />

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-20"
        >
          {quickActions.map((action, idx) => (
            <QuickActionCard
              key={action.to}
              action={action}
              index={idx}
              hoveredAction={hoveredAction}
              setHoveredAction={setHoveredAction}
              onNavigate={navigate}
            />
          ))}
        </motion.div>

        {/* Stats and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
          <ProjectStats stats={projectStats} attentionProjects={attentionProjects} />
          <KPIDashboard kpiData={kpiData} onNavigateToKPI={navigate} />
        </div>
      </main>
      <Footer />

    </div>
  );
}