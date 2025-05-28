import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiX, FiSettings, FiSliders, FiUsers, FiLayers, FiGlobe, FiShield, FiBell } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';
import ThemeManager from '../Config/ThemeManager';
import NotificationsSettings from './NotificationsSettings';
import WorkHoursSettings from './WorkHoursSettings';

const SETTINGS_SECTIONS = [
  {
    id: 'appearance',
    icon: FiSettings,
    label: 'Apariencia',
    description: 'Personaliza el aspecto de la aplicación'
  },
  {
    id: 'workflow',
    icon: FiLayers,
    label: 'Estados Kanban',
    description: 'Configura los estados del flujo de trabajo'
  },
  {
    id: 'roles',
    icon: FiShield,
    label: 'Roles y Permisos',
    description: 'Gestiona los roles de usuario'
  },
  {
    id: 'notifications',
    icon: FiBell,
    label: 'Notificaciones',
    description: 'Configura las preferencias de notificaciones'
  },
  {
    id: 'work-hours',
    icon: FiSliders,
    label: 'Horas de Trabajo',
    description: 'Configura los horarios laborales de la organización'
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
  const [activeSection, setActiveSection] = useState('appearance');

  const renderContent = () => {
    switch (activeSection) {
      case 'appearance':
        return <ThemeManager />;
      case 'notifications':
        return <NotificationsSettings />;
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS} overflow-hidden`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <FiSettings className={`w-6 h-6 ${theme.PRIMARY_COLOR_CLASS}`} />
            <h2 className="text-2xl font-bold text-gray-800">Configuración</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FiX className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto bg-gray-50">
            <nav className="p-4 space-y-1">
              {SETTINGS_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-start gap-3
                      ${isActive 
                        ? `${theme.PRIMARY_BG_SOFT} ${theme.PRIMARY_FONT_CLASS}` 
                        : 'hover:bg-gray-100 text-gray-700'
                      }`}
                  >
                    <section.icon className={`w-5 h-5 mt-0.5 ${isActive ? theme.PRIMARY_COLOR_CLASS : 'text-gray-500'}`} />
                    <div>
                      <div className="font-medium">{section.label}</div>
                      <div className={`text-sm ${isActive ? 'text-blue-600/70' : 'text-gray-500'}`}>
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 