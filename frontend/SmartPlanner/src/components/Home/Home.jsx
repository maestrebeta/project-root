import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiTrello, FiUsers, FiPieChart, FiActivity, FiStar, FiCalendar, FiCheckCircle, FiAlertCircle, FiArrowRight, FiPlus, FiEye, FiTrendingUp, FiTrendingDown, FiTarget, FiSearch } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import Footer from "../Template/Footer.jsx";
import CalendarView from './CalendarView.jsx';
import ActivityView from './ActivityView.jsx';

// Componente para las acciones rápidas con diseño premium
const QuickActionCard = ({ action, index, hoveredAction, setHoveredAction, onNavigate }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -6 }}
      whileTap={{ scale: 0.97 }}
      onHoverStart={() => setHoveredAction(index)}
      onHoverEnd={() => setHoveredAction(null)}
      className="group relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8 cursor-pointer hover:shadow-2xl transition-all duration-500 overflow-hidden"
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
      `} />
      
      <div className="relative z-10">
        <div className="flex flex-col items-center text-center gap-6">
          <div className={`
            p-6 rounded-3xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 shadow-lg
            ${action.color === 'blue' ? 'bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-700 shadow-blue-200/50' : ''}
            ${action.color === 'purple' ? 'bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 text-purple-700 shadow-purple-200/50' : ''}
            ${action.color === 'green' ? 'bg-gradient-to-br from-green-100 via-green-200 to-green-300 text-green-700 shadow-green-200/50' : ''}
            ${action.color === 'indigo' ? 'bg-gradient-to-br from-indigo-100 via-indigo-200 to-indigo-300 text-indigo-700 shadow-indigo-200/50' : ''}
          `}>
            <action.icon className="w-10 h-10" />
          </div>
          <div className="space-y-3">
            <div className="relative flex items-center justify-center">
              <h3 className="font-bold text-gray-800 text-xl group-hover:text-gray-900 transition-colors tracking-tight">
                {action.label}
              </h3>
              {hoveredAction === index && (
                <motion.span
                  initial={{ opacity: 0, x: -10, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute -right-8"
                >
                  <FiArrowRight className="w-6 h-6 text-gray-400" />
                </motion.span>
              )}
            </div>
            <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors leading-relaxed font-medium text-center">
              {action.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Componente para las estadísticas de proyectos con diseño premium
const ProjectStats = ({ stats, onViewCalendar, onNewProject, attentionProjects = [] }) => {
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

  const quickActions = [
    { label: 'Crear Proyecto', icon: FiPlus, color: 'blue', action: onNewProject },
    { label: 'Ver Calendario', icon: FiCalendar, color: 'green', action: onViewCalendar }
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
        <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 text-sm font-bold border border-emerald-100 shadow-lg">
          <div className="flex items-center gap-2">
            <FiTarget className="w-5 h-5" />
            {stats.weeklyProgress}% completado esta semana
          </div>
        </div>
      </div>

      {/* Métricas principales con tabs */}
      <div className="mb-10">
        <div className="flex flex-wrap gap-3 mb-8">
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

        {/* Métrica seleccionada destacada */}
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

      {/* Acciones rápidas */}
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className={`p-6 rounded-2xl bg-gradient-to-br from-${action.color}-50 to-${action.color}-100 text-${action.color}-700 hover:from-${action.color}-100 hover:to-${action.color}-200 transition-all duration-300 shadow-lg hover:shadow-xl border border-${action.color}-200/50`}
            >
              <div className="flex flex-col items-center gap-3">
                <action.icon className="w-7 h-7" />
                <span className="text-sm font-semibold text-center tracking-tight">{action.label}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Proyectos que requieren atención */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">Proyectos que Requieren Atención</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors tracking-tight">
            Ver todos →
          </button>
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
                          <FiUsers className="w-3 h-3" />
                          {project.team} miembros
                        </span>
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

// Componente para la actividad reciente con diseño premium
const RecentActivity = ({ activities, onViewAll }) => {
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
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 mb-3 tracking-tight">Actividad Reciente</h2>
          <p className="text-gray-600 text-lg font-medium">Últimas acciones en el sistema</p>
        </div>
        <button 
          onClick={onViewAll}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 hover:from-gray-100 hover:to-gray-200 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl"
        >
          <FiEye className="w-5 h-5" />
          Ver todo
        </button>
      </div>
      <div className="space-y-5">
        {activities.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.5 }}
            whileHover={{ x: 12, scale: 1.02 }}
            className="flex items-start gap-5 p-5 rounded-2xl hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 transition-all duration-300 cursor-pointer group border border-transparent hover:border-gray-200 shadow-sm hover:shadow-md"
          >
            <div className={`p-4 rounded-2xl bg-gradient-to-br from-blue-100 via-blue-200 to-blue-300 text-blue-700 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
              <activity.icon className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors tracking-tight">
                {activity.title}
              </h3>
              <p className="text-sm text-gray-500 truncate group-hover:text-gray-600 transition-colors mt-2 leading-relaxed font-medium">
                {activity.description}
              </p>
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap bg-gray-100 px-3 py-2 rounded-xl font-semibold">
              Hace {activity.time}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

// Componente de búsqueda y filtros
const SearchAndFilters = ({ onNewProject }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-10"
    >
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
          <input
            type="text"
            placeholder="Buscar proyectos, usuarios, tareas..."
            className="w-full pl-14 pr-6 py-5 rounded-3xl border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/20 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg text-lg"
          />
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onNewProject}
            className="flex items-center gap-3 px-8 py-5 rounded-3xl bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
          >
            <FiPlus className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">Nuevo Proyecto</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default function Home() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredAction, setHoveredAction] = useState(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  
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

  const fetchRealData = async () => {
    setLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      // Cargar estadísticas de proyectos
      const statsResponse = await fetch('http://localhost:8001/projects/stats', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      // Cargar analytics de tiempo
      const analyticsResponse = await fetch('http://localhost:8001/projects/time-analytics', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok && analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        
        setTimeAnalytics(analyticsData);
        
        // Calcular estadísticas reales
        const projects = analyticsData.projects || [];
        const total = projects.length;
        const active = projects.filter(p => ['in_progress', 'in_planning', 'at_risk'].includes(p.status)).length;
        const delayed = projects.filter(p => p.efficiency === 'Retrasado').length;
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

        // Generar proyectos que requieren atención
        const attentionProjectsData = generateAttentionProjects(projects);
        setAttentionProjects(attentionProjectsData);
      }
    } catch (err) {
      console.error('Error fetching real data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (projects, analyticsData) => {
    const activities = [];
    
    // Actividad basada en proyectos recientes
    const recentProjects = projects
      .sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      .slice(0, 3);
    
    recentProjects.forEach((project, index) => {
      activities.push({
        id: index + 1,
        type: 'project',
        title: 'Proyecto actualizado',
        description: project.name,
        time: '2h',
        icon: FiTrello
      });
    });

    // Actividad basada en horas registradas
    if (analyticsData.summary?.total_hours_worked > 0) {
      activities.push({
        id: activities.length + 1,
        type: 'time',
        title: 'Tiempo registrado',
        description: `${analyticsData.summary.total_hours_worked}h en total`,
        time: '4h',
        icon: FiClock
      });
    }

    // Actividad basada en eficiencia
    const efficientProjects = projects.filter(p => p.efficiency === 'En tiempo').length;
    if (efficientProjects > 0) {
      activities.push({
        id: activities.length + 1,
        type: 'report',
        title: 'Eficiencia del equipo',
        description: `${efficientProjects} proyectos en tiempo`,
        time: '6h',
        icon: FiPieChart
      });
    }

    // Si no hay suficientes actividades, agregar algunas por defecto
    while (activities.length < 4) {
      activities.push({
        id: activities.length + 1,
        type: 'system',
        title: 'Sistema activo',
        description: 'SmartPlanner funcionando correctamente',
        time: '8h',
        icon: FiActivity
      });
    }

    setRecentActivity(activities.slice(0, 4));
  };

  const generateAttentionProjects = (projects) => {
    if (!projects || projects.length === 0) return [];

    console.log('Proyectos disponibles para análisis:', projects.map(p => ({
      name: p.name,
      efficiency: p.efficiency,
      status: p.status,
      progress: p.progress_percentage
    })));

    // Proyectos que requieren atención basados en criterios reales
    const attentionCandidates = projects
      .filter(project => {
        // Proyectos retrasados
        if (project.efficiency === 'Retrasado') {
          console.log(`Proyecto ${project.name} incluido: Retrasado`);
          return true;
        }
        
        // Proyectos ligeramente retrasados
        if (project.efficiency === 'Ligeramente retrasado') {
          console.log(`Proyecto ${project.name} incluido: Ligeramente retrasado`);
          return true;
        }
        
        // Proyectos en riesgo
        if (project.status === 'at_risk') {
          console.log(`Proyecto ${project.name} incluido: En riesgo`);
          return true;
        }
        
        // Proyectos con progreso muy bajo
        if ((project.progress_percentage || 0) < 25) {
          console.log(`Proyecto ${project.name} incluido: Progreso bajo (${project.progress_percentage}%)`);
          return true;
        }
        
        // Proyectos con muchas horas trabajadas pero bajo progreso
        if (project.total_hours > 40 && (project.progress_percentage || 0) < 60) {
          console.log(`Proyecto ${project.name} incluido: Muchas horas, bajo progreso`);
          return true;
        }
        
        // Proyectos con fecha de fin próxima (menos de 7 días)
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const today = new Date();
          const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          if (daysUntilEnd <= 7 && daysUntilEnd >= 0 && project.status !== 'completed') {
            console.log(`Proyecto ${project.name} incluido: Fecha límite próxima (${daysUntilEnd} días)`);
            return true;
          }
        }
        
        return false;
      })
      .sort((a, b) => {
        // Priorizar por severidad
        const aSeverity = getProjectSeverity(a);
        const bSeverity = getProjectSeverity(b);
        return bSeverity - aSeverity;
      })
      .slice(0, 4); // Máximo 4 proyectos

    console.log('Proyectos que requieren atención:', attentionCandidates.map(p => p.name));

    return attentionCandidates.map(project => {
      const reason = getProjectReason(project);
      const status = getProjectStatus(project);
      const criteria = getProjectCriteria(project);
      
      return {
        name: project.name,
        progress: project.progress_percentage || 0,
        status: status,
        team: project.unique_users || 1,
        deadline: project.end_date || null,
        start_date: project.start_date || null,
        priority: getProjectPriority(project),
        reason: reason,
        criteria: criteria,
        project_id: project.project_id
      };
    });
  };

  const getProjectSeverity = (project) => {
    let severity = 0;
    
    if (project.efficiency === 'Retrasado') severity += 10;
    if (project.efficiency === 'Ligeramente retrasado') severity += 7;
    if (project.status === 'at_risk') severity += 8;
    if ((project.progress_percentage || 0) < 25) severity += 6;
    if ((project.progress_percentage || 0) < 50) severity += 4;
    if (project.total_hours > 40 && (project.progress_percentage || 0) < 60) severity += 3;
    
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

  const getProjectReason = (project) => {
    if (project.efficiency === 'Retrasado') {
      return 'Requiere atención inmediata';
    }
    if (project.efficiency === 'Ligeramente retrasado') {
      return 'Seguimiento recomendado';
    }
    if (project.status === 'at_risk') {
      return 'Seguimiento crítico necesario';
    }
    if ((project.progress_percentage || 0) < 25) {
      return 'Revisión de planificación';
    }
    if (project.total_hours > 40 && (project.progress_percentage || 0) < 60) {
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
    
    return 'Requiere seguimiento';
  };

  const getProjectStatus = (project) => {
    if (project.efficiency === 'Retrasado') return 'delayed';
    if (project.efficiency === 'Ligeramente retrasado') return 'delayed';
    if (project.status === 'at_risk') return 'delayed';
    return 'active';
  };

  const getProjectPriority = (project) => {
    const severity = getProjectSeverity(project);
    if (severity >= 15) return 'high';
    if (severity >= 10) return 'medium';
    return 'low';
  };

  const getProjectCriteria = (project) => {
    if (project.efficiency === 'Retrasado') {
      return 'Retrasado';
    }
    if (project.efficiency === 'Ligeramente retrasado') {
      return 'Ligeramente retrasado';
    }
    if (project.status === 'at_risk') {
      return 'En riesgo';
    }
    if ((project.progress_percentage || 0) < 25) {
      return 'Progreso bajo';
    }
    if (project.total_hours > 40 && (project.progress_percentage || 0) < 60) {
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
    
    return 'Requiere atención';
  };

  // Formatear el saludo según la hora del día
  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  // Función para manejar la creación de nuevo proyecto
  const handleNewProject = () => {
    // Navegar a la página de proyectos con parámetro para abrir modal
    navigate('/admin/projects?openModal=true');
  };

  const handleViewAll = () => {
    setIsActivityOpen(true);
  };

  const handleViewCalendar = () => {
    setIsCalendarOpen(true);
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
    }
  ];

  // Mostrar estado de carga
  if (loading) {
    return (
      <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS} relative overflow-hidden`}>
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
        <main className="flex-1 px-8 py-10 relative z-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">Error al cargar datos</p>
              <p className="text-gray-600 text-sm">{error}</p>
              <button 
                onClick={fetchRealData}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Reintentar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS} relative overflow-hidden`}>
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
        <SearchAndFilters onNewProject={handleNewProject} />

        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20"
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
          <ProjectStats stats={projectStats} onViewCalendar={handleViewCalendar} onNewProject={handleNewProject} attentionProjects={attentionProjects} />
          <RecentActivity activities={recentActivity} onViewAll={handleViewAll} />
        </div>
      </main>
      <Footer />

      {/* Modales */}
      <CalendarView isOpen={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
      <ActivityView isOpen={isActivityOpen} onClose={() => setIsActivityOpen(false)} />
    </div>
  );
}