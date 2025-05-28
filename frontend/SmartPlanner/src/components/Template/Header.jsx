import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import { 
  FiMenu, FiBell, FiUser, FiSettings, FiLogOut, FiSearch, 
  FiChevronDown, FiSun, FiMoon, FiMaximize2, FiMinimize2,
  FiTarget, FiTrendingUp, FiUsers, FiClock, FiZap
} from 'react-icons/fi';
import SettingsLayout from '../Settings/SettingsLayout';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import ProfileModal from '../Profile/ProfileModal';

// Configuración de títulos dinámicos por ruta
const routeTitles = {
  '/manager/planning': {
    title: 'Planning Board',
    subtitle: 'Gestiona épicas e historias de usuario',
    icon: FiTarget,
    gradient: 'from-blue-600 to-purple-600'
  },
  '/manager/projects': {
    title: 'Gestión de Proyectos',
    subtitle: 'Administra tus proyectos y recursos',
    icon: FiTrendingUp,
    gradient: 'from-emerald-600 to-teal-600'
  },
  '/manager/organizations': {
    title: 'Organizaciones',
    subtitle: 'Configura tu organización',
    icon: FiUsers,
    gradient: 'from-purple-600 to-pink-600'
  },
  '/manager/settings': {
    title: 'Configuración',
    subtitle: 'Personaliza tu experiencia',
    icon: FiSettings,
    gradient: 'from-gray-600 to-slate-600'
  }
};

export default function Header({ onMenuClick, title = "SmartPlanner" }) {
  const { user, logout, profileImage } = useAuth();
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Obtener información de la ruta actual
  const currentRoute = routeTitles[location.pathname] || {
    title: title,
    subtitle: 'Panel de administración',
    icon: FiTarget,
    gradient: 'from-blue-600 to-purple-600'
  };

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
      if (!event.target.closest('.user-menu') && !event.target.closest('.notifications-menu')) {
        setShowUserMenu(false);
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
        className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm relative z-40"
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
              {/* Modo oscuro */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {darkMode ? <FiSun className="w-5 h-5 text-yellow-500" /> : <FiMoon className="w-5 h-5 text-gray-600" />}
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

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FiBell className="w-4 h-4 text-blue-600" />
                          Notificaciones
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-4 text-center text-gray-500">
                          <FiBell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No hay notificaciones nuevas</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Menú de usuario */}
              <div className="relative user-menu">
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
                      className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
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

                        <motion.button
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          onClick={() => {
                            navigate('/manager/settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left hover:bg-gray-50 transition-colors"
                        >
                          <FiSettings className="w-5 h-5 text-gray-500" />
                          <span className="font-medium text-gray-700">Configuración</span>
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