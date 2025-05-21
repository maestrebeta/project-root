import { useNavigate, useLocation, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiLogOut, FiZap } from 'react-icons/fi';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { sidebarItems } from './sidebarConfig';

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppTheme();
  const [expandedSection, setExpandedSection] = useState(null);

  // Hotkeys para navegación rápida (⌘ + Número)
  useHotkeys('cmd+1', () => navigate('/home'));
  useHotkeys('cmd+2', () => navigate('/user/time-tracker'));
  useHotkeys('cmd+3', () => navigate('/manager/planning'));

  // Renderiza un ítem o sección del sidebar
  const renderSidebarItem = (item, { isSubmenu = false } = {}) => {
    if (item.children) {
      // Sección colapsable
      const isExpanded = expandedSection === item.text;
      return (
        <div key={item.text} className="mt-4">
          <button
            type="button"
            onClick={() => setExpandedSection(isExpanded ? null : item.text)}
            className="flex items-center justify-between w-full px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-500 uppercase tracking-wider transition-all"
          >
            <div className="flex items-center gap-3">
              <item.icon className="text-gray-500 text-lg" />
              {!collapsed && <span>{item.text}</span>}
            </div>
            {!collapsed && (
              <motion.span
                animate={{ rotate: isExpanded ? 180 : 0 }}
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
                className="mt-1 space-y-1 pl-0"
                style={{ listStyle: 'none', paddingLeft: 0 }}
              >
                {item.children.map(child =>
                  renderSidebarItem(child, { isSubmenu: true })
                )}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      );
    }

    if (item.type === "divider") {
      return (
        <hr key={Math.random()} className="my-5 border-t border-gray-200" style={{ height: 0, marginTop: 18, marginBottom: 18 }} />
      );
    }

    // Ítem normal
    return (
      <li key={item.text} className={`relative ${isSubmenu ? 'pl-8' : ''} list-none`}>
        <NavLink
          to={item.to}
          className={({ isActive }) =>
            `flex items-center justify-between gap-3 w-full rounded-lg transition-all duration-200 group
            ${isActive
              ? `${theme.PRIMARY_BG_SOFT} ${theme.PRIMARY_FONT_CLASS} font-semibold`
              : 'text-gray-600 hover:bg-gray-50'}
            ${isSubmenu ? 'py-2' : 'py-2.5'} px-3`
          }
          style={{ textDecoration: 'none' }}
        >
          <div className="flex items-center gap-3">
            <item.icon className={`text-lg group-hover:${theme.PRIMARY_COLOR_CLASS}`} />
            {!collapsed && (
              <span>{item.text}</span>
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
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm z-30 transition-all duration-300 flex flex-col ${collapsed ? 'items-center' : ''}`}
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
          onClick={() => navigate('/profile')}
        >
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">Admin</p>
            </div>
          )}
        </button>
        <div className="mt-4 w-full">
          <button
            type="button"
            className={`flex items-center gap-3 w-full rounded-lg transition-all duration-200 group text-red-600 hover:bg-red-50 py-2 px-3`}
            onClick={() => console.log('Logout')}
          >
            <FiLogOut className="text-lg" />
            {!collapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}