import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiClock, FiCalendar, FiPlus, FiChevronRight, FiX, FiCheck, FiSettings, FiPlay, FiPause, FiSquare, FiEdit2, FiTrash2, FiUser, FiTag, FiChevronDown, FiChevronUp, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { es } from 'date-fns/locale';
import TimerPanel from './TimerPanel';
import EstadisticasPanel from './EstadisticasPanel';
import EntradasTiempo from './EntradasTiempo';
import FormularioEntrada from './FormularioEntrada';
import CalendarioSemana from './CalendarioSemana';
import NotificationPortal from './NotificationPortal';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import Footer from "../Template/Footer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProjectsAndTags } from './useProjectsAndTags';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import TaskStatesManager from './TaskStatesManager';
import ActivityCategoriesManager from './ActivityCategoriesManager';
import TasksTable from './TasksTable';
import { useNotifications } from '../../context/NotificationsContext';

const calculateStats = (entries, projects, currentFilter = 'today') => {
  const totalHours = entries.reduce((sum, entry) => {
    // Calcular duración en horas
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const duration = (end - start) / (1000 * 60 * 60);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);

  // Filtrar entradas según el filtro actual
  const now = new Date();
  let filteredEntries = entries;
  
  switch (currentFilter) {
    case 'today': {
      filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate.toDateString() === now.toDateString();
      });
      break;
    }
    case 'this_week': {
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= startOfWeek;
      });
      break;
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredEntries = entries.filter(entry => {
        const entryDate = new Date(entry.start_time);
        return entryDate >= startOfMonth;
      });
      break;
    }
    case 'all':
    default:
      // No filtrar, usar todas las entradas
      filteredEntries = entries;
      break;
  }

  // Calcular horas totales del período filtrado
  const filteredHours = filteredEntries.reduce((sum, entry) => {
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const duration = (end - start) / (1000 * 60 * 60);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);

  // Filtrar entradas de hoy y esta semana para estadísticas específicas
  const todayEntries = entries.filter(entry => {
    const entryDate = new Date(entry.start_time);
    return entryDate.toDateString() === now.toDateString();
  });

  const weekEntries = entries.filter(entry => {
    const entryDate = new Date(entry.start_time);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    return entryDate >= startOfWeek;
  });

  const todayHours = todayEntries.reduce((sum, entry) => {
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const duration = (end - start) / (1000 * 60 * 60);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);

  const weekHours = weekEntries.reduce((sum, entry) => {
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const duration = (end - start) / (1000 * 60 * 60);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);

  // Agrupar por proyecto usando las entradas filtradas
  const projectStats = filteredEntries.reduce((stats, entry) => {
    const project = projects.find(p => p.project_id === entry.project_id);
    if (project) {
      const projectName = project.name;
      const duration = ((new Date(entry.end_time || new Date()) - new Date(entry.start_time)) / (1000 * 60 * 60));
      stats[projectName] = (stats[projectName] || 0) + (isNaN(duration) ? 0 : duration);
    }
    return stats;
  }, {});

  return {
    totalHours: Number(filteredHours.toFixed(2)) || 0,
    projectStats,
    todayHours: Number(todayHours.toFixed(2)) || 0,
    todayEntries: todayEntries.length,
    weekHours: Number(weekHours.toFixed(2)) || 0,
    weekEntries: weekEntries.length,
    productivityPoints: Math.round(filteredHours * 10),
    filteredEntriesCount: filteredEntries.length
  };
};

const TimeTracker = () => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showNotification: showNotificationFromHook } = useNotifications();
  const { projects, clients, loading: projectsLoading, error: projectsError, refresh: refreshProjects } = useProjectsAndTags();
  const { taskStates, updateTaskStates, loading: statesLoading, error: statesError } = useOrganizationStates();

  const [showCalendar, setShowCalendar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [billable, setBillable] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [stats, setStats] = useState({ 
    totalHours: 0, 
    projectStats: {},
    todayHours: 0,
    todayEntries: 0,
    weekHours: 0,
    weekEntries: 0,
    productivityPoints: 0
  });
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today');
  const [showTaskStates, setShowTaskStates] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showActivityCategories, setShowActivityCategories] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Variables de estado del timer
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerDescription, setTimerDescription] = useState('');
  const [timerBillable, setTimerBillable] = useState(true);
  const [loadingTimer, setLoadingTimer] = useState(false);

  // Referencias y estado del scroll
  const mainRef = useRef(null);
  const [lastScrollTop, setLastScrollTop] = useState(0);

  // Función de manejo de scroll
  const handleScroll = () => {
    if (mainRef.current) {
      const scrollTop = mainRef.current.scrollTop;
      setLastScrollTop(scrollTop);
    }
  };

  // Función de manejo de teclas
  const handleKeyDown = (e) => {
    // Implementar navegación por teclado si es necesario
  };

  // Efecto para manejar el scroll
  useEffect(() => {
    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll);
      return () => mainElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Normalizar estado
  const normalizeStatus = (status) => {
    if (!status) return 1; // ID del estado por defecto (Pendiente)
    
    // Si ya es un número, devolverlo directamente
    if (typeof status === 'number') {
      return status;
    }
    
    // Si es string, intentar convertirlo a número
    if (typeof status === 'string') {
      const numStatus = parseInt(status);
      if (!isNaN(numStatus)) {
        return numStatus;
      }
      
      // Si no se puede convertir, mapear a IDs
      const normalized = status.toLowerCase().trim();
      switch (normalized) {
        case 'pending':
        case 'pendiente':
        case 'nueva':
          return 1; // Pendiente
        case 'in_progress':
        case 'in progress':
        case 'en_progreso':
        case 'en progreso':
          return 2; // En Progreso
        case 'completed':
        case 'completado':
        case 'completada':
        case 'done':
          return 3; // Completada
        default:
          return 1; // Pendiente por defecto
      }
    }
    
    return 1; // Estado por defecto
  };

  const handleFilterChange = (newFilter) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilter }));
  };

  // Refs
  const notificationTimeoutRef = useRef(null);

  // Fetch de entradas de tiempo
  const fetchTimeEntries = async (filter = 'today') => {
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { token, user } = JSON.parse(session);
      
      if (!token || !user) {
        throw new Error('Información de sesión incompleta');
      }

      const response = await fetch(`http://localhost:8001/time-entries/?skip=0&limit=100&filter=${filter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        throw new Error('Sesión expirada');
      }

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || 'Error al cargar las entradas de tiempo');
      }

      const data = await response.json();
      setTimeEntries(data);
      
      // Calcular estadísticas con el filtro actual
      const calculatedStats = calculateStats(data, projects, filter);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error al cargar entradas de tiempo:', error);
      
      if (error.message.includes('Sesión expirada') || error.message.includes('No hay sesión activa')) {
        showNotificationFromHook('error', 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        // Aquí podrías redirigir al login si tienes un sistema de navegación
        // navigate('/login');
        return;
      }
      
      showNotificationFromHook('error', error.message || 'Error al cargar las entradas de tiempo');
    }
  };

  // Efectos
  useEffect(() => {
    if (user?.user_id && projects.length > 0) {
      fetchTimeEntries(filter);
    }
  }, [user?.user_id, filter, projects]);

  // Manejo de notificaciones
  const showNotification = useCallback((type, message) => {
    // Limpiar notificación previa si existe
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ type, message });

    // Configurar timeout para ocultar la notificación
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
    }, 5000);
  }, []);

  // Handlers
  const handleEditar = useCallback((entry) => {
    setEditingEntry(entry);
  }, []);

  // Estadísticas en tiempo real
  const timeStats = useMemo(() => calculateStats(timeEntries, projects, filter), [timeEntries, projects, filter]);

  // Filtrar entradas según el filtro actual para mostrar en EntradasTiempo
  const filteredTimeEntries = useMemo(() => {
    const now = new Date();
    
    switch (filter) {
      case 'today':
        return timeEntries.filter(entry => {
          const entryDate = new Date(entry.start_time);
          return entryDate.toDateString() === now.toDateString();
        });
      case 'this_week':
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        return timeEntries.filter(entry => {
          const entryDate = new Date(entry.start_time);
          return entryDate >= startOfWeek;
        });
      case 'this_month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return timeEntries.filter(entry => {
          const entryDate = new Date(entry.start_time);
          return entryDate >= startOfMonth;
        });
      case 'all':
      default:
        return timeEntries;
    }
  }, [timeEntries, filter]);

  // Animaciones
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Mapa completo de colores de Tailwind
  const TAILWIND_COLORS = {
    blue: {
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8'
    },
    indigo: {
      500: '#6366f1',
      600: '#4f46e5',
      700: '#4338ca'
    },
    red: {
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    green: {
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    yellow: {
      500: '#eab308',
      600: '#ca8a04',
      700: '#a16207'
    },
    orange: {
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c'
    },
    pink: {
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d'
    },
    purple: {
      500: '#a855f7',
      600: '#9333ea',
      700: '#7e22ce'
    },
    gray: {
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151'
    },
    cyan: {
      500: '#06b6d4',
      600: '#0891b2',
      700: '#0e7490'
    },
    teal: {
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e'
    },
    lime: {
      500: '#84cc16',
      600: '#65a30d',
      700: '#4d7c0f'
    },
    stone: {
      500: '#78716c',
      600: '#57534e',
      700: '#44403c'
    },
    zinc: {
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46'
    },
    neutral: {
      500: '#737373',
      600: '#525252',
      700: '#404040'
    }
  };

  const getGradientStyle = (color) => {
    const colors = TAILWIND_COLORS[color] || TAILWIND_COLORS.gray;
    return {
      background: `linear-gradient(to right, ${colors[600]}, ${colors[500]})`
    };
  };

  const getGradientHoverStyle = (color) => {
    const colors = TAILWIND_COLORS[color] || TAILWIND_COLORS.gray;
    return {
      background: `linear-gradient(to right, ${colors[700]}, ${colors[600]})`
    };
  };

  const handleTaskStatesUpdate = async (newStates) => {
    try {
      await updateTaskStates(newStates);
      showNotificationFromHook('Estados actualizados correctamente', 'success');
      
      // Recargar los datos sin recargar la página
      fetchTimeEntries(filter);
    } catch (error) {
      console.error('Error al actualizar estados:', error);
      showNotificationFromHook(error.message || 'Error al actualizar estados', 'error');
    }
  };

  // Funciones del timer
  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleStopTimer = () => {
    setIsTimerRunning(false);
    setTimerDescription('');
  };

  // Eliminar tarea - Método unificado
  const handleDelete = useCallback(async (taskId) => {
    
    if (!taskId || isNaN(taskId)) {
      console.error('TimeTracker - ID de tarea inválido:', taskId);
      showNotificationFromHook('ID de tarea inválido', 'error');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`http://localhost:8001/time-entries/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la entrada');
      }

      // Actualizar el estado local
      setTimeEntries(prev => prev.filter(task => task.entry_id !== taskId));
      showNotificationFromHook('Entrada eliminada correctamente', 'success');
    } catch (err) {
      console.error('TimeTracker - Error al eliminar tarea:', err);
      showNotificationFromHook(err.message, 'error');
    }
  }, [showNotificationFromHook]);

  // Modificar handleSubmit para normalizar el estado
  const handleSubmit = useCallback(async (data) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const normalizedData = {
        ...data,
        status: normalizeStatus(data.status),
        organization_id: user.organization_id
      };

      const isEdit = !!data.entry_id;
      const url = isEdit 
        ? `http://localhost:8001/time-entries/${data.entry_id}`
        : 'http://localhost:8001/time-entries/';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(normalizedData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al guardar la entrada');
      }

      await fetchTimeEntries(filter);
      setEditingEntry(null);
      // Las notificaciones las maneja FormularioEntrada
    } catch (err) {
      console.error('Error en handleSubmit:', err);
      // Las notificaciones de error las maneja FormularioEntrada
    }
  }, [fetchTimeEntries, filter, user?.organization_id]);

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col relative ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Contenido principal */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto focus:outline-none"
        tabIndex="0"
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
      >
        <div className="container mx-auto px-4 py-8">
          {/* Timer Panel */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <TimerPanel
              userId={user?.user_id}
              onNuevaEntrada={handleSubmit}
              isRunning={isTimerRunning}
              description={timerDescription}
              onDescriptionChange={setTimerDescription}
              onPlay={handleStartTimer}
              onPause={handlePauseTimer}
              onStop={handleStopTimer}
              billable={timerBillable}
              onBillableChange={setTimerBillable}
              loading={loadingTimer}
            />
          </motion.section>

          {/* Estadísticas */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <EstadisticasPanel
              todayHours={stats.todayHours}
              todayEntries={stats.todayEntries}
              weekHours={stats.weekHours}
              weekEntries={stats.weekEntries}
              productivityPoints={stats.productivityPoints}
              loading={loadingStats}
            />
          </motion.section>

          {/* Entradas de tiempo */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EntradasTiempo
              entradas={filteredTimeEntries}
              loading={loadingEntries}
              onEditar={handleEditar}
              onEliminar={handleDelete}
              onRefresh={fetchTimeEntries}
              currentFilters={{ ...currentFilters, timeFilter: filter }}
              onFilterChange={(filterType, value) => {
                if (filterType === 'timeFilter') {
                  setFilter(value);
                } else {
                  handleFilterChange(filterType, value);
                }
              }}
              onCalendarEntry={() => setShowCalendar(true)}
              onManualEntry={() => setEditingEntry({})}
              organizationStates={taskStates}
            />
          </motion.section>
        </div>
      </main>

      {/* Sistema de notificaciones mejorado */}
      <NotificationPortal notification={notification} />

      {/* Modales */}
      <AnimatePresence>
        {editingEntry && (
          <FormularioEntrada
            editId={editingEntry.entry_id}
            initialData={editingEntry}
            onClose={() => setEditingEntry(null)}
            onSubmit={handleSubmit}
            organizationStates={taskStates}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCalendar && (
          <CalendarioSemana
            onClose={() => setShowCalendar(false)}
            onSelectEntry={handleEditar}
            entries={timeEntries}
            onCreate={handleSubmit}
            onEdit={handleSubmit}
            organizationStates={taskStates}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />

      {/* Modal de gestión de estados */}
      <AnimatePresence>
        {showTaskStates && (
          <TaskStatesManager
            onClose={() => setShowTaskStates(false)}
            onUpdate={handleTaskStatesUpdate}
          />
        )}
      </AnimatePresence>

      {/* Modal de gestión de categorías de actividad */}
      <AnimatePresence>
        {showActivityCategories && (
          <ActivityCategoriesManager
            onClose={() => setShowActivityCategories(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default TimeTracker;