import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSettings, FiSliders, FiUsers, FiLayers, FiGlobe, FiShield, FiBell, FiClock, FiTag } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import NotificationsSettings from './NotificationsSettings';
import WorkHoursSettings from './WorkHoursSettings';
import { TaskStatesManagerContent } from '../timeTracker/TaskStatesManager';
import { ActivityCategoriesManagerContent } from '../timeTracker/ActivityCategoriesManager';
import { KanbanStatesManagerContent } from '../Planning/KanbanStatesManager';

const SETTINGS_SECTIONS = [
  {
    id: 'time-tracking',
    icon: FiClock,
    label: 'Registro de Horas',
    description: 'Gestiona los estados de las tareas de tiempo'
  },
  {
    id: 'activity-categories',
    icon: FiTag,
    label: 'Categorías de Actividad',
    description: 'Personaliza las categorías de actividad'
  },
  {
    id: 'workflow',
    icon: FiLayers,
    label: 'Estados Kanban',
    description: 'Configura los estados del flujo de trabajo'
  },
  {
    id: 'work-hours',
    icon: FiSliders,
    label: 'Horas de Trabajo',
    description: 'Configura los horarios laborales de la organización'
  },
  {
    id: 'notifications',
    icon: FiBell,
    label: 'Notificaciones',
    description: 'Configura las preferencias de notificaciones'
  },
  {
    id: 'roles',
    icon: FiShield,
    label: 'Roles y Permisos',
    description: 'Gestiona los roles de usuario'
  },
  {
    id: 'preferences',
    icon: FiSliders,
    label: 'Preferencias',
    description: 'Ajusta las preferencias generales'
  },
  {
    id: 'integrations',
    icon: FiGlobe,
    label: 'Integraciones',
    description: 'Configura las integraciones con otros servicios'
  }
];

export default function SettingsLayout({ onClose }) {
  const theme = useAppTheme();
  const [activeSection, setActiveSection] = useState('time-tracking');

  const renderContent = () => {
    switch (activeSection) {
      case 'time-tracking':
        return <TaskStatesManagerContent onClose={() => {}} isEmbedded={true} />;
      case 'activity-categories':
        return <ActivityCategoriesManagerContent onClose={() => {}} isEmbedded={true} />;
      case 'workflow':
        return <KanbanStatesManagerContent onClose={() => {}} isEmbedded={true} />;
      case 'notifications':
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sección en desarrollo
          </div>
        );
      case 'work-hours':
        return <WorkHoursSettings />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Sección en desarrollo
          </div>
        );
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    onClose();
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className={`bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Header con diseño premium */}
          <div className="px-8 py-6 border-b border-gray-200/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${theme.PRIMARY_GRADIENT_CLASS} shadow-lg`}>
                <FiSettings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Configuración</h2>
                <p className="text-gray-600 font-medium">Gestiona las preferencias del sistema</p>
              </div>
            </div>
            <button
              onClick={handleCloseClick}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 group"
            >
              <FiX className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar con diseño premium */}
            <div className="w-80 border-r border-gray-200/50 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white/50">
              <nav className="p-6 space-y-2">
                {SETTINGS_SECTIONS.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <motion.button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full text-left px-6 py-4 rounded-2xl transition-all duration-300 flex items-start gap-4 group
                        ${isActive 
                          ? `${theme.PRIMARY_GRADIENT_CLASS} text-white shadow-lg` 
                          : 'hover:bg-white/80 text-gray-700 hover:shadow-md border border-transparent hover:border-gray-200/50'
                        }`}
                    >
                      <div className={`p-2 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                      }`}>
                        <section.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold text-lg ${isActive ? 'text-white' : 'text-gray-800'}`}>
                          {section.label}
                        </div>
                        <div className={`text-sm mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {section.description}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    {renderContent()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}