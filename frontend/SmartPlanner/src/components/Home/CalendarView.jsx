import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiCalendar, FiClock, FiCheckCircle, FiAlertCircle, FiUsers, FiTarget } from 'react-icons/fi';

const CalendarView = ({ isOpen, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Generar días del mes
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Agregar días del mes anterior para completar la primera semana
    for (let i = 0; i < startingDay; i++) {
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      days.push({
        date: new Date(year, month - 1, prevMonthLastDay - startingDay + i + 1),
        isCurrentMonth: false
      });
    }
    
    // Agregar días del mes actual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Completar la última semana con días del siguiente mes
    const remainingDays = 42 - days.length; // 6 semanas * 7 días
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Datos de ejemplo para eventos
  const events = [
    { date: '2024-03-15', title: 'Deadline API', type: 'deadline', priority: 'high' },
    { date: '2024-03-20', title: 'Revisión Sistema', type: 'review', priority: 'medium' },
    { date: '2024-03-25', title: 'Entrega App Móvil', type: 'delivery', priority: 'high' },
    { date: '2024-03-28', title: 'Reunión Equipo', type: 'meeting', priority: 'low' }
  ];

  const getEventForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.find(event => event.date === dateStr);
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'deadline': return 'bg-red-100 text-red-600';
      case 'review': return 'bg-blue-100 text-blue-600';
      case 'delivery': return 'bg-green-100 text-green-600';
      case 'meeting': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <FiCalendar className="w-7 h-7" />
                Calendario de Proyectos
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            {/* Navegación del mes */}
            <div className="flex items-center justify-between">
              <button
                onClick={prevMonth}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiChevronLeft className="w-6 h-6" />
              </button>
              <h3 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h3>
              <button
                onClick={nextMonth}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <FiChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Contenido del calendario con scroll */}
          <div className="p-6 overflow-y-auto flex-1">
            {/* Días de la semana */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {days.map((day, index) => {
                const event = getEventForDate(day.date);
                const today = isToday(day.date);
                const selected = isSelected(day.date);
                
                return (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      relative p-3 rounded-xl text-left transition-all duration-200 min-h-[80px]
                      ${day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400'}
                      ${today ? 'bg-blue-100 border-2 border-blue-500' : ''}
                      ${selected ? 'bg-blue-50 border-2 border-blue-300' : 'hover:bg-gray-50'}
                      ${!day.isCurrentMonth ? 'bg-gray-50' : ''}
                    `}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {day.date.getDate()}
                    </div>
                    
                    {event && (
                      <div className={`text-xs px-2 py-1 rounded-full ${getEventColor(event.type)} font-medium truncate`}>
                        {event.title}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Panel de eventos del día seleccionado */}
            {selectedDate && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gray-50 rounded-2xl mb-6"
              >
                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <FiTarget className="w-5 h-5" />
                  {selectedDate.toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h4>
                
                {getEventForDate(selectedDate) ? (
                  <div className="space-y-3">
                    {events.filter(event => event.date === selectedDate.toISOString().split('T')[0]).map((event, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-xl ${getEventColor(event.type)} flex items-center gap-3`}
                      >
                        <div className="flex-1">
                          <div className="font-semibold">{event.title}</div>
                          <div className="text-xs opacity-80">
                            {event.type === 'deadline' ? 'Fecha límite' :
                             event.type === 'review' ? 'Revisión' :
                             event.type === 'delivery' ? 'Entrega' : 'Reunión'}
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                          event.priority === 'high' ? 'bg-red-200 text-red-700' :
                          event.priority === 'medium' ? 'bg-yellow-200 text-yellow-700' :
                          'bg-green-200 text-green-700'
                        }`}>
                          {event.priority === 'high' ? 'Alta' :
                           event.priority === 'medium' ? 'Media' : 'Baja'}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 text-center py-4">
                    <FiCalendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No hay eventos programados para este día</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Leyenda */}
            <div className="pt-4 border-t border-gray-200">
              <h5 className="font-semibold text-gray-800 mb-3">Leyenda</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                  <span className="text-sm text-gray-600">Fechas límite</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-100 rounded-full"></div>
                  <span className="text-sm text-gray-600">Revisiones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                  <span className="text-sm text-gray-600">Entregas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-100 rounded-full"></div>
                  <span className="text-sm text-gray-600">Reuniones</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default CalendarView; 