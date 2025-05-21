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

const getStats = (entries) => {
  const today = new Date();
  let todayHours = 0, todayEntries = 0, weekHours = 0, weekEntries = 0;

  entries.forEach(entry => {
    const rawDate = entry.entry_date || entry.fecha || entry.date;
    if (!rawDate) return;
    
    let entryDate;
    try {
      entryDate = typeof rawDate === 'string' ? parseISO(rawDate) : new Date(rawDate);
      if (isNaN(entryDate)) return;
    } catch {
      return;
    }

    const hours = Number(entry.duration_hours || entry.duration || 0);
    if (isSameDay(entryDate, today)) {
      todayHours += hours;
      todayEntries += 1;
    }
    if (isThisWeek(entryDate, { weekStartsOn: 1 })) {
      weekHours += hours;
      weekEntries += 1;
    }
  });

  return { 
    todayHours, 
    todayEntries, 
    weekHours, 
    weekEntries, 
    productivityPoints: Math.min(Math.round(weekHours * 10), 100) // Puntos de productividad (0-100) como entero
  };
};

const TimeTracker = () => {
  // Estados principales
  const [showCalendar, setShowCalendar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [billable, setBillable] = useState(true);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [notification, setNotification] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentFilters, setCurrentFilters] = useState({});
  const [confirmDelete, setConfirmDelete] = useState({ 
    open: false, 
    entryId: null, 
    description: '' 
  });

  const handleFilterChange = (newFilter) => {
    setCurrentFilters(prev => ({ ...prev, ...newFilter }));
  };

  // Refs
  const mainRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  // Fetch de entradas de tiempo
  const fetchEntries = useCallback(async () => {
    setLoadingEntries(true);
    try {
      const res = await fetch('http://localhost:8000/time-entries/');
      if (!res.ok) throw new Error('Error al cargar entradas');
      const data = await res.json();
      setTimeEntries(data);
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  // Efectos
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

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
      
      await fetchEntries();
      showNotification('success', 'Entrada eliminada correctamente');
    } catch (err) {
      showNotification('error', err.message);
    } finally {
      setConfirmDelete({ open: false, entryId: null, description: '' });
    }
  }, [confirmDelete.entryId, fetchEntries, showNotification]);

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

      await fetchEntries();
      setEditingEntry(null);
      showNotification(
        'success',
        isEdit ? '¡Entrada actualizada con éxito!' : '¡Entrada creada con éxito!'
      );
    } catch (err) {
      showNotification('error', err.message);
    }
  }, [fetchEntries, showNotification]);

  const handleEditar = useCallback((entry) => {
    setEditingEntry(entry);
  }, []);

  // Estadísticas en tiempo real
  const stats = useMemo(() => getStats(timeEntries), [timeEntries]);

  // Animaciones
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative">
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
                className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 rounded-lg mr-3"
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
              className="flex items-center bg-gradient-to-r from-blue-600 to-blue-500 text-white px-3 py-2 rounded-md shadow-sm text-sm font-medium hover:from-blue-700 hover:to-blue-600 focus:outline-none transition-all"
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
              onNuevaEntrada={fetchEntries}
              onSaveSuccess={() => {
                fetchEntries();
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
              onRefresh={fetchEntries}
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
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Seguimiento de Tiempo Pro. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Términos</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Privacidad</a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">Ayuda</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TimeTracker;