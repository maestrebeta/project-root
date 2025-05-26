import { useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationsContext';
import { FiSettings, FiBell, FiMenu, FiSearch, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import SettingsLayout from '../Settings/SettingsLayout';
import NotificationsPanel from '../Notifications/NotificationsPanel';
import ProfileModal from '../Profile/ProfileModal';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick, title = "Workplace ticket" }) {
  const theme = useAppTheme();
  const { unreadCount } = useNotifications();
  const { user, logout, profileImage } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
      setProfileMenuOpen(false);
    }
  };

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
    setProfileMenuOpen(false);
  };

  return (
    <>
      <header className={`bg-white border-b border-gray-100 flex items-center justify-between px-6 h-16 sticky top-0 z-20 shadow-sm ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            className={`text-gray-500 hover:text-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-50 p-2 rounded-lg transition-colors duration-200`}
            aria-label="Toggle menu"
            onClick={onMenuClick}
          >
            <FiMenu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-800 tracking-tight">{title}</h2>
            <span className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded-full font-medium flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              En línea
            </span>
          </div>
        </div>

        {/* Center Search */}
        <div className={`flex-1 max-w-2xl mx-4 transition-all duration-200 ${searchFocused ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:border-blue-500 pl-10"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <FiSearch className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            {searchFocused && (
              <span className="absolute right-3 top-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <button 
            className={`p-2 rounded-lg hover:bg-${theme.PRIMARY_COLOR}-50 relative transition-colors duration-200`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label="Notificaciones"
          >
            <FiBell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className={`absolute top-1 right-1 ${theme.PRIMARY_BG_MEDIUM} text-white text-xs font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1`}>
                {unreadCount}
              </span>
            )}
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <button 
            className={`p-2 rounded-lg hover:bg-${theme.PRIMARY_COLOR}-50 transition-colors duration-200`}
            onClick={() => setShowSettings(true)}
            aria-label="Configuración"
            title="Configuración"
          >
            <FiSettings className={`w-5 h-5 ${theme.PRIMARY_COLOR_CLASS}`} />
          </button>

          <div className="w-px h-6 bg-gray-200 mx-1"></div>

          <div className="relative">
            <button 
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg pl-1 pr-2 py-1 transition-colors duration-200"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              aria-label="User menu"
            >
              <div className={`w-8 h-8 rounded-full ${theme.PRIMARY_BG_MEDIUM} flex items-center justify-center text-white font-medium overflow-hidden`}>
                {profileImage ? (
                  <img src={profileImage} alt={user?.full_name} className="w-full h-full object-cover" />
                ) : (
                  user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'
                )}
              </div>
              <span className="font-medium text-gray-700 text-sm">{user?.full_name || 'Usuario'}</span>
              <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileMenuOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user?.full_name || 'Usuario'}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ''}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${theme.PRIMARY_BG_SOFT}`}>
                      <span className={`text-xs font-medium ${theme.PRIMARY_COLOR_CLASS}`}>
                        {user?.role?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-${theme.PRIMARY_COLOR}-50 hover:text-${theme.PRIMARY_COLOR}-600 flex items-center gap-2`}
                  >
                    <FiUser className="w-4 h-4 text-gray-400" />
                    Perfil
                  </button>
                </div>
                <div className="py-1 border-t border-gray-100">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
                  >
                    <FiLogOut className="w-4 h-4 text-gray-400" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <SettingsLayout onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {notificationsOpen && (
          <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
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