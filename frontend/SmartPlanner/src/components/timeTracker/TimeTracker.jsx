import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FiClock, FiCalendar, FiPlus, FiChevronRight, FiX, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { isSameDay, isThisWeek, parseISO } from 'date-fns';
import TimerPanel from './TimerPanel';
import EstadisticasPanel from './EstadisticasPanel';
import EntradasTiempo from './EntradasTiempo';
import FormularioEntrada from './FormularioEntrada';
import CalendarioSemana from './CalendarioSemana';
import NotificationPortal from './NotificationPortal';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import Footer from "../Template/Footer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProjectsAndTags } from "./useProjectsAndTags.jsx";

const calculateStats = (entries, projects) => {
  const totalHours = entries.reduce((sum, entry) => {
    // Calcular duración en horas
    const start = new Date(entry.start_time);
    const end = entry.end_time ? new Date(entry.end_time) : new Date();
    const duration = (end - start) / (1000 * 60 * 60);
    return sum + (isNaN(duration) ? 0 : duration);
  }, 0);

  // Filtrar entradas de hoy y esta semana
  const now = new Date();
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

  // Agrupar por proyecto
  const projectStats = entries.reduce((stats, entry) => {
    const project = projects.find(p => p.project_id === entry.project_id);
    if (project) {
      const projectName = project.name;
      const duration = ((new Date(entry.end_time || new Date()) - new Date(entry.start_time)) / (1000 * 60 * 60));
      stats[projectName] = (stats[projectName] || 0) + (isNaN(duration) ? 0 : duration);
    }
    return stats;
  }, {});

  return {
    totalHours: Number(totalHours.toFixed(2)) || 0,
    projectStats,
    todayHours: Number(todayHours.toFixed(2)) || 0,
    todayEntries: todayEntries.length,
    weekHours: Number(weekHours.toFixed(2)) || 0,
    weekEntries: weekEntries.length,
    productivityPoints: Math.round(totalHours * 10)
  };
};

const TimeTracker = () => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { 
    projects, 
    clients, 
    loading: projectsLoading, 
    error: projectsError 
  } = useProjectsAndTags();

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
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [confirmDelete, setConfirmDelete] = useState({ 
    open: false, 
    entryId: null, 
    description: '' 
  });
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('today');

  const handleFilterChange = (newFilter) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilter }));
  };

  // Refs
  const mainRef = useRef(null);
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

      const response = await fetch(`http://localhost:8000/time-entries/?skip=0&limit=100&filter=${filter}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || 'Error al cargar las entradas de tiempo');
      }

      const data = await response.json();
      setTimeEntries(data);
      
      // Calcular estadísticas
      const calculatedStats = calculateStats(data, projects);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error al cargar entradas de tiempo:', error);
      
      // Manejar específicamente errores de autenticación
      if (error.message.includes('Unauthorized') || error.message.includes('token')) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        // Opcional: Redirigir a la página de login
        // navigate('/login');
      } else {
        alert(error.message || 'Error al cargar las entradas de tiempo');
      }
    }
  };

  // Efectos
  useEffect(() => {
    if (user?.user_id && projects.length > 0) {
      fetchTimeEntries(filter);
    }
  }, [user?.user_id, filter, projects]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(mainRef.current?.scrollTop > 10);
    };

    const mainElement = mainRef.current;
    mainElement?.addEventListener('scroll', handleScroll);
    return () => mainElement?.removeEventListener('scroll', handleScroll);
  }, []);

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
  const handleEliminarClick = useCallback((entry) => {
    setConfirmDelete({
      open: true,
      entryId: entry.entry_id || entry.id,
      description: entry.description || '¿Seguro que deseas eliminar esta entrada?',
    });
  }, []);

  const handleEliminar = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/time-entries/${confirmDelete.entryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Error al eliminar la entrada');
      
      await fetchTimeEntries();
      showNotification('success', 'Entrada eliminada correctamente');
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setConfirmDelete({ open: false, entryId: null, description: '' });
    }
  }, [confirmDelete.entryId, fetchTimeEntries, showNotification]);

  const handleSubmit = useCallback(async (data) => {
    try {
      const isEdit = !!data.entry_id;
      const url = isEdit 
        ? `http://localhost:8000/time-entries/${data.entry_id}`
        : 'http://localhost:8000/time-entries/';
      
      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Error al guardar la entrada');

      await fetchTimeEntries();
      setEditingEntry(null);
      showNotification(
        'success',
        isEdit ? '¡Entrada actualizada con éxito!' : '¡Entrada creada con éxito!'
      );
    } catch (err) {
      showNotification('error', err.message);
    }
  }, [fetchTimeEntries, showNotification]);

  const handleEditar = useCallback((entry) => {
    setEditingEntry(entry);
  }, []);

  // Estadísticas en tiempo real
  const timeStats = useMemo(() => calculateStats(timeEntries, projects), [timeEntries, projects]);

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

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col relative ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Header */}
      <header className={`bg-white shadow-sm sticky top-0 z-20 transition-all duration-300 ${
        isScrolled ? 'py-2 shadow-md' : 'py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <motion.h1 
              className="text-xl md:text-2xl font-bold text-gray-900 flex items-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span 
                className={`text-white p-2 rounded-lg mr-3 ${theme.PRIMARY_GRADIENT_CLASS}`}
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity, repeatDelay: 5 }}
              >
                <FiClock className="w-5 h-5 md:w-6 md:h-6" />
              </motion.span>
              Seguimiento de Tiempo Pro
            </motion.h1>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden md:flex items-center bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 focus:outline-none"
              onClick={() => setShowCalendar(true)}
            >
              <FiCalendar className="mr-2" />
              Entrada calendario
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center text-white px-3 py-2 rounded-md shadow-sm text-sm font-medium focus:outline-none ${theme.PRIMARY_GRADIENT_CLASS} ${theme.PRIMARY_GRADIENT_HOVER_CLASS}`}
              onClick={() => setEditingEntry({})}
            >
              <FiPlus className="mr-2" />
              Entrada manual
            </motion.button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main 
        ref={mainRef}
        className="flex-1 overflow-y-auto focus:outline-none"
        tabIndex="0"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Manejo de errores */}
          {(projectsError || error) && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-xl">error_outline</span>
                {projectsError || error}
              </div>
            </div>
          )}

          {/* Panel de timer */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="mb-8"
          >
            <TimerPanel 
              billable={billable}
              onBillableChange={() => setBillable(b => !b)}
              onNuevaEntrada={fetchTimeEntries}
              onSaveSuccess={() => {
                fetchTimeEntries();
                showNotification('success', 'Tiempo registrado correctamente');
              }}
              onSaveError={(error) => showNotification('error', error.message)}
            />
          </motion.section>

          {/* Estadísticas */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <EstadisticasPanel 
              todayHours={stats.todayHours}
              todayEntries={stats.todayEntries}
              weekHours={stats.weekHours}
              weekEntries={stats.weekEntries}
              productivityPoints={stats.productivityPoints}
              loading={loadingEntries}
            />
          </motion.section>

          {/* Entradas de tiempo */}
          <motion.section
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ delay: 0.2 }}
          >
            <EntradasTiempo
              entradas={timeEntries}
              loading={loadingEntries}
              onEditar={handleEditar}
              onEliminar={handleEliminarClick}
              onRefresh={fetchTimeEntries}
              currentFilters={currentFilters}
              onFilterChange={handleFilterChange}
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
          />
        )}
      </AnimatePresence>

      {/* Confirmación de eliminación */}
      {confirmDelete.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-700 mb-4">{confirmDelete.description}</p>
            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                onClick={() => setConfirmDelete({ open: false, entryId: null, description: '' })}
              >
                Cancelar
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 flex items-center"
                onClick={handleEliminar}
              >
                <FiX className="mr-1" />
                Eliminar
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TimeTracker;