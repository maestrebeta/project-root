import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiLogOut, FiZap } from 'react-icons/fi';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { sidebarItems } from './sidebarConfig';
import ProfileModal from '../Profile/ProfileModal';

const Sidebar = ({ collapsed, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppTheme();
  const { user, logout, profileImage } = useAuth();
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Hotkeys para navegación rápida (⌘ + Número)
  useHotkeys('cmd+1', () => navigate('/home'));
  useHotkeys('cmd+2', () => navigate('/user/time-tracker'));
  useHotkeys('cmd+3', () => navigate('/manager/planning'));

  // Limpiar secciones expandidas cuando se colapsa el sidebar
  useEffect(() => {
    if (collapsed) {
      setExpandedSections(new Set());
    }
  }, [collapsed]);

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      logout();
    }
  };

  // Obtener las iniciales del nombre del usuario
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const toggleSection = (text, isMainWorkspace = false) => {
    if (collapsed && isMainWorkspace) {
      // Si está colapsado y es el botón de Espacios de trabajo, expandir el sidebar
      onMenuClick();
      // Programar la expansión de la sección después de que el sidebar se expanda
      setTimeout(() => {
        setExpandedSections(prev => {
          const next = new Set();
          next.add(text);
          return next;
        });
      }, 100);
      return;
    }

    setExpandedSections(prev => {
      const next = new Set();
      
      // Si el espacio de trabajo clickeado ya estaba expandido, lo cerramos
      if (prev.has(text)) {
        // Si es "Espacios de trabajo", cerramos todo
        if (text === "Espacios de trabajo") {
          return next;
        }
        // Si no es "Espacios de trabajo", mantenemos "Espacios de trabajo" expandido
        next.add("Espacios de trabajo");
        prev.forEach(item => {
          if (item !== text && item !== "Espacios de trabajo") {
            next.add(item);
          }
        });
      } else {
        // Si no estaba expandido, lo expandimos
        next.add(text);
        // Si no es "Espacios de trabajo", también mantenemos "Espacios de trabajo" expandido
        if (text !== "Espacios de trabajo" && prev.has("Espacios de trabajo")) {
          next.add("Espacios de trabajo");
        }
      }
      
      return next;
    });
  };

  // Renderiza un ítem o sección del sidebar
  const renderSidebarItem = (item, { isSubmenu = false, level = 0 } = {}) => {
    if (item.children) {
      const isExpanded = expandedSections.has(item.text);
      const paddingLeft = level * 12;
      const isMainWorkspace = item.text === "Espacios de trabajo";
      const isWorkspaceChild = level === 1; // Hijos directos de "Espacios de trabajo"

      return (
        <div key={item.text} className={`mt-2 ${level > 0 ? 'ml-2' : ''}`}>
          <button
            type="button"
            onClick={() => toggleSection(item.text, isMainWorkspace)}
            className={`
              flex items-center justify-between w-full px-3 py-2 cursor-pointer 
              hover:bg-gray-50 rounded-lg
              ${isMainWorkspace || isWorkspaceChild ? 'text-xs font-semibold text-gray-500 uppercase tracking-wider' : 'text-sm font-medium text-gray-700'}
              transition-all
            `}
            style={{ paddingLeft: collapsed ? 12 : paddingLeft + 12 }}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`text-lg ${isMainWorkspace || isWorkspaceChild ? 'text-gray-500' : theme.PRIMARY_COLOR_CLASS}`} />
              {!collapsed && <span>{item.text}</span>}
            </div>
            {!collapsed && (
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-400"
              >
                <FiChevronDown />
              </motion.span>
            )}
          </button>
          <AnimatePresence>
            {(!collapsed && isExpanded) && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-1 space-y-1"
                style={{ listStyle: 'none', paddingLeft: 0 }}
              >
                {item.children.map(child =>
                  renderSidebarItem(child, { isSubmenu: true, level: level + 1 })
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (item.type === "divider") {
      return (
        <hr key={Math.random()} className="my-4 border-t border-gray-200" />
      );
    }

    // Ítem normal
    const paddingLeft = (level * 12) + (isSubmenu ? 12 : 0);

    return (
      <li key={item.text} className="relative list-none">
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `flex items-center justify-between gap-3 w-full rounded-lg transition-all duration-200 group
            ${isActive
              ? `${theme.PRIMARY_BG_SOFT} ${theme.PRIMARY_FONT_CLASS}`
              : 'text-gray-600 hover:bg-gray-50'}
            ${isSubmenu ? 'py-2' : 'py-2.5'} px-3`
          }
          style={{ 
            textDecoration: 'none',
            paddingLeft: collapsed ? 12 : paddingLeft + 12
          }}
        >
          <div className="flex items-center gap-3">
            <item.icon className={`text-lg ${theme.PRIMARY_HOVER_TEXT}`} />
            {!collapsed && (
              <span className="text-sm">{item.text}</span>
            )}
          </div>
          {/* Badge si existe */}
          {!collapsed && item.badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${theme.PRIMARY_BG_CLASS} ${theme.PRIMARY_FONT_CLASS}`}>
              {item.badge}
            </span>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <motion.aside
      initial={{ width: collapsed ? 80 : 260 }}
      animate={{ width: collapsed ? 80 : 260 }}
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm z-30 transition-all duration-300 flex flex-col ${collapsed ? 'items-center' : ''} ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}
      style={{ minWidth: collapsed ? 80 : 260, width: collapsed ? 80 : 260 }}
    >
      {/* Logo */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center justify-center h-16 border-b border-gray-100 cursor-pointer"
        onClick={() => navigate('/home')}
      >
        <div className={`flex items-center gap-2 w-full ${collapsed ? 'justify-center' : 'px-6'}`}>
          <span className={`text-2xl flex items-center ${theme.PRIMARY_COLOR_CLASS}`}>
            <FiZap />
          </span>
          {!collapsed && (
            <span className={`text-2xl font-extrabold tracking-tight ml-2 select-none ${theme.PRIMARY_FONT_CLASS}`}>
              SmartPlanner
            </span>
          )}
        </div>
      </motion.div>

      {/* Navegación Principal */}
      <nav className="flex-1 overflow-y-auto px-3 py-6">
        <ul className="space-y-1 pl-0" style={{ listStyle: 'none', paddingLeft: 0 }}>
          {sidebarItems.map(item => renderSidebarItem(item))}
        </ul>
      </nav>

      {/* Perfil de Usuario */}
      <div className={`p-4 border-t border-gray-100 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <button
          type="button"
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer w-full ${collapsed ? 'justify-center' : ''}`}
          onClick={() => setIsProfileModalOpen(true)}
        >
          <div className={`w-8 h-8 rounded-full ${theme.PRIMARY_BG_MEDIUM} flex items-center justify-center text-white font-medium overflow-hidden`}>
            {profileImage ? (
              <img src={profileImage} alt={user?.full_name} className="w-full h-full object-cover" />
            ) : (
              getInitials(user?.full_name)
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          )}
        </button>
        <div className="mt-4 w-full">
          <button
            type="button"
            className="flex items-center gap-3 w-full rounded-lg transition-all duration-200 group text-red-600 hover:bg-red-50 py-2 px-3"
            onClick={handleLogout}
          >
            <FiLogOut className="text-lg" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </motion.aside>
  );
};

export default Sidebar;