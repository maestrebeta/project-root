import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { useFocusMode } from '../../context/FocusModeContext';
import { getHeaderTitleFromSidebar } from './sidebarConfig';
import { 
  FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiSearch, 
  FiChevronDown, FiMaximize2, FiMinimize2,
  FiTarget, FiTrendingUp, FiUsers, FiClock, FiZap, FiHome, FiCheckSquare, FiMessageCircle, FiBriefcase, FiServer, FiGlobe
} from 'react-icons/fi';
import SettingsLayout from '../Settings/SettingsLayout';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import ProfileModal from '../Profile/ProfileModal';

// Configuración de títulos dinámicos por ruta
const routeTitles = {
  // Página principal
  '/home': {
    title: 'Inicio',
    subtitle: 'Dashboard principal y resumen ejecutivo',
    icon: FiHome,
    gradient: 'from-blue-600 to-indigo-600'
  },
  
  // Tareas y Comunicaciones
  '/tasks': {
    title: 'Sistema de Tareas',
    subtitle: 'Asignación y gestión de tareas por administradores',
    icon: FiCheckSquare,
    gradient: 'from-emerald-600 to-teal-600'
  },
  '/communications': {
    title: 'Sistema de Comunicaciones',
    subtitle: 'Chat y comunicación en tiempo real para equipos',
    icon: FiMessageCircle,
    gradient: 'from-purple-600 to-pink-600'
  },
  
  // Project Manager
  '/manager/planning': {
    title: 'SmartPlanner',
    subtitle: 'Gestiona épicas e historias de usuario',
    icon: FiTarget,
    gradient: 'from-blue-600 to-purple-600'
  },
  
  // Desarrolladores
  '/user/time-tracker': {
    title: 'Registro Horas',
    subtitle: 'Controla tu tiempo y productividad',
    icon: FiClock,
    gradient: 'from-orange-600 to-red-600'
  },
  
  // Consola Admin
  '/admin/customers': {
    title: 'Gestión Clientes',
    subtitle: 'Administra clientes y contactos',
    icon: FiUsers,
    gradient: 'from-green-600 to-emerald-600'
  },
  '/admin/users': {
    title: 'Gestión Usuarios',
    subtitle: 'Administra el equipo y permisos',
    icon: FiUser,
    gradient: 'from-blue-600 to-cyan-600'
  },
  '/admin/projects': {
    title: 'Centro de Proyectos',
    subtitle: 'Gestiona proyectos, cotizaciones y métricas',
    icon: FiTrendingUp,
    gradient: 'from-indigo-600 to-purple-600'
  },
  
  // IT
  '/it/tickets': {
    title: 'Sistema de Tickets',
    subtitle: 'Gestión de tickets IT y soporte técnico',
    icon: FiUsers,
    gradient: 'from-red-600 to-pink-600'
  },
  '/it/infra': {
    title: 'Gestión de Infraestructura',
    subtitle: 'Monitoreo y gestión de infraestructura IT',
    icon: FiServer,
    gradient: 'from-gray-600 to-slate-600'
  },
  
  // Desarrollo (solo super_user)
  '/admin/organizations': {
    title: 'Organizaciones',
    subtitle: 'Configuración avanzada de organizaciones',
    icon: FiUsers,
    gradient: 'from-purple-600 to-violet-600'
  },
  '/admin/unit-testing': {
    title: 'Testing Unitario',
    subtitle: 'Herramientas de desarrollo y testing',
    icon: FiTarget,
    gradient: 'from-yellow-600 to-orange-600'
  },
  
  // Configuración
  '/config/theme': {
    title: 'Configuración de Tema',
    subtitle: 'Personaliza la apariencia del sistema',
    icon: FiSettings,
    gradient: 'from-gray-600 to-slate-600'
  },
  '/manager/kanban-states': {
    title: 'Estados Kanban',
    subtitle: 'Configuración de estados del tablero',
    icon: FiTarget,
    gradient: 'from-blue-600 to-indigo-600'
  }
};

// Función para obtener información de la ruta con fallback inteligente
const getRouteInfo = (pathname) => {
  // Primero intentar obtener la configuración exacta
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }
  
  // Si no existe, usar el sistema de sidebarConfig como fallback
  const sidebarTitle = getHeaderTitleFromSidebar(pathname);
  
  // Determinar icono y gradiente basado en el path
  let icon = FiTarget;
  let gradient = 'from-blue-600 to-purple-600';
  let subtitle = 'Panel de administración';
  
  if (pathname.includes('/admin/')) {
    icon = FiUsers;
    gradient = 'from-indigo-600 to-purple-600';
    subtitle = 'Administración del sistema';
    
    // Subtítulos específicos para rutas admin
    if (pathname.includes('/admin/customers')) {
      subtitle = 'Administra clientes y contactos';
    } else if (pathname.includes('/admin/users')) {
      subtitle = 'Administra el equipo y permisos';
    } else if (pathname.includes('/admin/projects')) {
      subtitle = 'Gestiona proyectos, cotizaciones y métricas';
    } else if (pathname.includes('/admin/organizations')) {
      subtitle = 'Configuración avanzada de organizaciones';
    } else if (pathname.includes('/admin/unit-testing')) {
      subtitle = 'Herramientas de desarrollo y testing';
    }
  } else if (pathname.includes('/manager/')) {
    icon = FiBriefcase;
    gradient = 'from-blue-600 to-cyan-600';
    subtitle = 'Gestión de proyectos';
    
    // Subtítulos específicos para rutas manager
    if (pathname.includes('/manager/planning')) {
      subtitle = 'Gestiona épicas e historias de usuario';
    } else if (pathname.includes('/manager/kanban-states')) {
      subtitle = 'Configuración de estados del tablero';
    }
  } else if (pathname.includes('/user/')) {
    icon = FiUser;
    gradient = 'from-green-600 to-emerald-600';
    subtitle = 'Herramientas de usuario';
    
    // Subtítulos específicos para rutas user
    if (pathname.includes('/user/time-tracker')) {
      subtitle = 'Controla tu tiempo y productividad';
    }
  } else if (pathname.includes('/it/')) {
    icon = FiServer;
    gradient = 'from-red-600 to-pink-600';
    subtitle = 'Soporte técnico e infraestructura';
    
    // Subtítulos específicos para rutas IT
    if (pathname.includes('/it/tickets')) {
      subtitle = 'Gestión de tickets IT y soporte técnico';
    } else if (pathname.includes('/it/infra')) {
      subtitle = 'Monitoreo y gestión de infraestructura IT';
    }
  } else if (pathname.includes('/config/')) {
    icon = FiSettings;
    gradient = 'from-gray-600 to-slate-600';
    subtitle = 'Configuración del sistema';
    
    // Subtítulos específicos para rutas config
    if (pathname.includes('/config/theme')) {
      subtitle = 'Personaliza la apariencia del sistema';
    }
  } else if (pathname === '/home') {
    icon = FiHome;
    gradient = 'from-blue-600 to-indigo-600';
    subtitle = 'Dashboard principal y resumen ejecutivo';
  } else if (pathname === '/tasks') {
    icon = FiCheckSquare;
    gradient = 'from-emerald-600 to-teal-600';
    subtitle = 'Asignación y gestión de tareas por administradores';
  } else if (pathname === '/communications') {
    icon = FiMessageCircle;
    gradient = 'from-purple-600 to-pink-600';
    subtitle = 'Chat y comunicación en tiempo real para equipos';
  } else if (pathname === '/external/form-manager') {
    icon = FiGlobe;
    gradient = 'from-blue-600 to-purple-600';
    subtitle = 'Configuración del portal público de tickets';
  }
  
  return {
    title: sidebarTitle || 'SmartPlanner',
    subtitle: subtitle,
    icon: icon,
    gradient: gradient
  };
};

export default function Header({ onMenuClick }) {
  const { user, logout, profileImage } = useAuth();
  const { unreadCount } = useNotifications();
  const { isFocusMode, toggleFocusMode } = useFocusMode();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Obtener información de la ruta actual usando la función mejorada
  const currentRoute = getRouteInfo(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setShowUserMenu(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Para el menú de usuario
      if (!event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
      
      // Para el panel de notificaciones - solo cerrar si se hace clic fuera del panel completo
      // No cerrar si se hace clic en botones dentro del panel
      if (!event.target.closest('.notifications-menu') && !event.target.closest('.notifications-panel')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Detectar cambios de fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const IconComponent = currentRoute.icon;

  return (
    <>
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm w-full relative z-50"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Lado izquierdo: Menú y título dinámico */}
            <div className="flex items-center gap-4">
              {/* Botón de menú */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onMenuClick}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors lg:hidden"
              >
                <FiMenu className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Título dinámico con contexto */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${currentRoute.gradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {currentRoute.title}
                    {location.pathname === '/manager/planning' && (
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 bg-green-500 rounded-full"
                      />
                    )}
                  </h1>
                  <p className="text-sm text-gray-600">{currentRoute.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Centro: Barra de búsqueda global */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar en SmartPlanner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </motion.button>
                )}
              </div>
            </div>

            {/* Lado derecho: Acciones y usuario */}
            <div className="flex items-center gap-3">
              {/* Modo Enfoque */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFocusMode}
                className={`p-2 rounded-xl transition-colors ${
                  isFocusMode 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={isFocusMode ? 'Desactivar Modo Enfoque' : 'Activar Modo Enfoque'}
              >
                <FiTarget className={`w-5 h-5 ${isFocusMode ? 'text-white' : 'text-gray-600'}`} />
              </motion.button>

              {/* Fullscreen */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors hidden md:block"
              >
                {isFullscreen ? <FiMinimize2 className="w-5 h-5 text-gray-600" /> : <FiMaximize2 className="w-5 h-5 text-gray-600" />}
              </motion.button>

              {/* Configuración */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FiSettings className="w-5 h-5 text-gray-600" />
              </motion.button>

              {/* Notificaciones */}
              <div className="relative notifications-menu">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors relative"
                >
                  <FiBell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
                    />
                  )}
                </motion.button>
              </div>

              {/* Menú de usuario */}
              <div className="relative user-menu z-[9999]">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img src={profileImage} alt={user?.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold">
                        {user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{user?.full_name || user?.username}</div>
                    <div className="text-xs opacity-90">{user?.role === 'super_user' ? 'Super Admin' : 'Usuario'}</div>
                  </div>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] overflow-hidden"
                    >
                      {/* Header del menú */}
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                            {profileImage ? (
                              <img src={profileImage} alt={user?.full_name} className="w-full h-full object-cover" />
                            ) : (
                              user?.full_name?.charAt(0) || user?.username?.charAt(0) || 'U'
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{user?.full_name || user?.username}</div>
                            <div className="text-sm text-gray-600">{user?.email}</div>
                          </div>
                        </div>
                      </div>

                      {/* Opciones del menú */}
                      <div className="p-2">
                        <motion.button
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          onClick={handleProfileClick}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                        >
                          <FiUser className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">Mi Perfil</span>
                        </motion.button>

                        <div className="border-t border-gray-100 my-2" />

                        <motion.button
                          whileHover={{ backgroundColor: '#fef2f2' }}
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-red-50 transition-colors text-red-600"
                        >
                          <FiLogOut className="w-5 h-5" />
                          <span className="font-medium">Cerrar Sesión</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Barra de búsqueda móvil */}
          <div className="md:hidden mt-4">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
              />
            </div>
          </div>
        </div>
      </motion.header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsLayout onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationsPanel onClose={() => setShowNotifications(false)} />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}