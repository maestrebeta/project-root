import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiHome, FiClock, FiCalendar, FiPieChart, FiUsers, FiSettings, FiLayers, FiSliders, FiImage, FiLogOut, FiChevronDown, FiUser, FiBriefcase, FiServer, FiZap } from 'react-icons/fi';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAppTheme } from "../../context/ThemeContext.jsx";

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useAppTheme();
  const [activeItem, setActiveItem] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Hotkeys para navegación rápida (⌘ + Número)
  useHotkeys('cmd+1', () => navigate('/home'));
  useHotkeys('cmd+2', () => navigate('/user/time-tracker'));
  useHotkeys('cmd+3', () => navigate('/manager/planning'));

  // Auto-detecta la ruta activa
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('time-tracker')) setActiveItem('Registro Horas');
    else if (path.includes('planning')) setActiveItem('SmartPlaner');
    else if (path.includes('jira-summary')) setActiveItem('Auditar Jira');
    else if (path.includes('customers')) setActiveItem('Clientes');
    else if (path.includes('projects')) setActiveItem('Proyectos');
    else if (path.includes('users')) setActiveItem('Usuarios');
    else if (path.includes('settings')) setActiveItem('Configuración');
    else setActiveItem('Inicio');
  }, [location]);

  // Componente de ítem del menú con animaciones
  const NavItem = ({ icon, text, to, badge, color = theme.PRIMARY_COLOR, onClick, isSubmenu = false }) => {
    const isActive = activeItem === text;
    const Icon = icon;

    return (
      <motion.li
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`relative ${isSubmenu ? 'pl-8' : ''}`}
      >
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (to) navigate(to);
            if (onClick) onClick();
            setActiveItem(text);
          }}
          className={`flex items-center justify-between gap-3 ${
            isActive 
              ? `bg-${color}-50 text-${color}-600 font-semibold` 
              : 'text-gray-600 hover:bg-gray-50'
          } ${isSubmenu ? 'py-2' : 'py-2.5'} px-3 rounded-lg transition-all duration-200 group`}
        >
          <div className="flex items-center gap-3">
            <Icon className={`text-lg ${
              isActive ? `text-${color}-500` : 'text-gray-400'
            } group-hover:text-${color}-500`} />
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {text}
              </motion.span>
            )}
          </div>
          {!collapsed && badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-600`}>
              {badge}
            </span>
          )}
          {isActive && !collapsed && (
            <motion.div 
              layoutId="activeIndicator"
              className={`absolute right-3 w-1.5 h-6 rounded-full bg-${color}-500`}
            />
          )}
        </a>
      </motion.li>
    );
  };

  // Componente de sección colapsable
  const CollapsibleSection = ({ title, icon, children, sectionKey }) => {
    const isExpanded = expandedSection === sectionKey;
    const Icon = icon;

    return (
      <div className="mt-4">
        <div
          onClick={() => setExpandedSection(isExpanded ? null : sectionKey)}
          className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <Icon className="text-gray-500 text-lg" />
            {!collapsed && (
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {title}
              </span>
            )}
          </div>
          {!collapsed && (
            <motion.span
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-gray-400"
            >
              <FiChevronDown />
            </motion.span>
          )}
        </div>
        <AnimatePresence>
          {(!collapsed && isExpanded) && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-1 space-y-1"
            >
              {children}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Submenú deslizante para Configuración
  const SettingsSubmenu = () => (
    <AnimatePresence>
      {submenuOpen && (
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -20, opacity: 0 }}
          className="ml-2 pl-2 border-l-2 border-gray-100"
        >
          <NavItem 
            icon={FiLayers} 
            text="Estados Kanban" 
            to="/manager/kanban-states" 
            isSubmenu 
          />
          <NavItem 
            icon={FiSliders} 
            text="Personalizar Tema" 
            to="/config/theme" 
            onClick={() => setActiveSubmenu('theme')} 
            isSubmenu 
          />
          <NavItem 
            icon={FiImage} 
            text="Logo Empresa" 
            onClick={() => setActiveSubmenu('logo')} 
            isSubmenu 
          />
          <NavItem 
            icon={FiSliders} 
            text="Preferencias" 
            onClick={() => setActiveSubmenu('preferences')} 
            isSubmenu 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <motion.aside
      initial={{ width: collapsed ? 80 : 260 }}
      animate={{ width: collapsed ? 80 : 260 }}
      className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-100 shadow-sm z-30 transition-all duration-300 ${collapsed ? 'items-center' : ''}`}
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
        <ul className="space-y-1">
          <NavItem 
            icon={FiHome} 
            text="Inicio" 
            to="/home" 
            badge={collapsed ? 'H' : null} 
          />
          <NavItem 
            icon={FiClock} 
            text="Registro Horas" 
            to="/user/time-tracker" 
            badge={collapsed ? 'RH' : 'Nuevo'} 
          />
          <NavItem 
            icon={FiCalendar} 
            text="SmartPlaner" 
            to="/manager/planning" 
            badge={collapsed ? 'SP' : 'Nuevo'} 
          />
          <NavItem 
            icon={FiPieChart} 
            text="Auditar Jira" 
            to="/manager/jira-summary" 
            badge={collapsed ? 'AJ' : 'Beta'} 
          />
        </ul>

        {/* Configuración General (con submenú deslizante) */}
        <div className="mt-6">
          <NavItem 
            icon={FiSettings} 
            text="Configuración" 
            onClick={() => setSubmenuOpen(!submenuOpen)} 
          />
          {!collapsed && <SettingsSubmenu />}
        </div>

        {/* Consola de Administración */}
        <CollapsibleSection 
          title="Consola Admin" 
          icon={FiBriefcase} 
          sectionKey="admin"
        >
          <NavItem 
            icon={FiUsers} 
            text="Clientes" 
            to="/admin/customers" 
          />
          <NavItem 
            icon={FiLayers} 
            text="Proyectos" 
            to="/admin/projects" 
          />
          <NavItem 
            icon={FiUser} 
            text="Usuarios" 
            to="/admin/users" 
          />
        </CollapsibleSection>

        {/* IT (Opcional) */}
        <CollapsibleSection 
          title="IT" 
          icon={FiServer} 
          sectionKey="it"
        >
          <NavItem 
            icon={FiUsers} 
            text="Tickets" 
            to="/it/tickets" 
          />
          <NavItem 
            icon={FiServer} 
            text="Infraestructura" 
            to="/it/infra" 
          />
        </CollapsibleSection>
      </nav>

      {/* Perfil de Usuario */}
      <div className={`p-4 border-t border-gray-100 ${collapsed ? 'flex flex-col items-center' : ''}`}>
        <div 
          className={`flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
            collapsed ? 'justify-center' : ''
          }`}
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
        </div>
        <div className="mt-4">
          <NavItem 
            icon={FiLogOut} 
            text={collapsed ? '' : "Cerrar Sesión"} 
            color="red" 
            onClick={() => console.log('Logout')} 
          />
        </div>
      </div>
    </motion.aside>
  );
}