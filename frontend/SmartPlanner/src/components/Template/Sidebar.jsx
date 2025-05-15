import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Sidebar({ collapsed }) {
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('Home');
  const [collapsedSections, setCollapsedSections] = useState({
    favorites: false,
    it: false
  });

  const toggleSection = (section) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const NavItem = ({ icon, text, to, active, onClick, badge, color = 'blue' }) => (
    <li>
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          setActiveItem(text);
          if (to) navigate(to);
          if (onClick) onClick();
        }}
        className={`flex items-center justify-between gap-3 ${
          active ? `bg-${color}-50 text-${color}-600` : 'text-gray-700'
        } hover:bg-${color}-50 hover:text-${color}-600 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 group`}
      >
        <div className="flex items-center gap-3">
          <span className={`material-icons-outlined ${active ? `text-${color}-500` : 'text-gray-400'} group-hover:text-${color}-500`}>
            {icon}
          </span>
          {!collapsed && <span>{text}</span>}
        </div>
        {!collapsed && badge && (
          <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}-100 text-${color}-600`}>
            {badge}
          </span>
        )}
      </a>
    </li>
  );

  const SectionHeader = ({ title, collapsed, onToggle, sidebarCollapsed }) => (
    <div 
      className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-lg"
      onClick={onToggle}
    >
      {!sidebarCollapsed && (
        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{title}</span>
      )}
      <span className="material-icons-outlined text-gray-400 text-sm transform transition-transform duration-200">
        {collapsed ? 'chevron_right' : 'expand_more'}
      </span>
    </div>
  );

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''} flex flex-col z-30 bg-white border-r border-gray-100 shadow-sm transition-all duration-200`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-gray-100">
        <span className="text-2xl font-extrabold text-blue-600 tracking-tight flex items-center gap-2">
          <span className="material-icons-outlined text-blue-500">rocket_launch</span>
          {!collapsed && "SmartPlanner"}
        </span>
      </div>
      
      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          <NavItem 
            icon="home" 
            text="Inicio" 
            to="/"
            active={activeItem === 'Home'} 
            onClick={() => setActiveItem('Home')} 
          />
          <NavItem 
            icon="workspaces" 
            text="Mi Trabajo" 
            to="/tasks"
            active={activeItem === 'My Work'} 
            onClick={() => setActiveItem('My Work')}
            badge="3"
          />
          <NavItem 
            icon="dashboard" 
            text="Dashboard" 
            active={activeItem === 'Dashboard'} 
            onClick={() => setActiveItem('Dashboard')} 
          />
        </ul>

        {/* Config Section */}
        <div className="mt-6">
          <SectionHeader 
            title="Administración" 
            collapsed={collapsedSections.it} 
            onToggle={() => toggleSection('it')} 
            sidebarCollapsed={collapsed}
          />
          {!collapsedSections.it && (
            <ul className="mt-1 space-y-1">
              <NavItem 
                icon="group" 
                text="Gestión de Clientes" 
                to="/clients"
                active={activeItem === 'Customers Management'} 
                onClick={() => setActiveItem('Customers Management')} 
                badge="New"
              />
              <NavItem 
                icon="view_timeline" 
                text="Gestión de Proyectos" 
                to="/projects"
                active={activeItem === 'Projects Management'} 
                onClick={() => setActiveItem('Projects Management')} 
                badge="New"
              />
              <NavItem 
                icon="group" 
                text="Gestión de Usuarios" 
                to="/users"
                active={activeItem === 'Users Management'} 
                onClick={() => setActiveItem('Users Management')} 
                badge="New"
              />
              <NavItem 
                icon="inventory" 
                text="Gestión de Inventario" 
                to="/inventory"
                active={activeItem === 'Inventory Management'} 
                onClick={() => setActiveItem('Inventory Management')} 
              />
            </ul>
          )}
        </div>

        {/* IT Section */}
        <div className="mt-6">
          <SectionHeader 
            title="Departamento IT" 
            collapsed={collapsedSections.it} 
            onToggle={() => toggleSection('it')} 
            sidebarCollapsed={collapsed}
          />
          {!collapsedSections.it && (
            <ul className="mt-1 space-y-1">
              <NavItem 
                icon="confirmation_number" 
                text="Tickets" 
                active={activeItem === 'Workplace Tickets'} 
                onClick={() => setActiveItem('Workplace Tickets')} 
              />
              <NavItem 
                icon="dns" 
                text="Infraestructura" 
                active={activeItem === 'Infrastructure'} 
                onClick={() => setActiveItem('Infrastructure')} 
              />
            </ul>
          )}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
            JD
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">Admin</p>
            </div>
          )}
          <span className="material-icons-outlined text-gray-400 text-lg">{!collapsed && "more_vert"}</span>
        </div>
        <div className="mt-8">
          <ul>
            <NavItem 
            icon="logout" 
            text="Logout" 
            active={false} 
            onClick={() => console.log('Logout')} 
            color="red"
          />
          </ul>
        </div>
      </div>
    </aside>
  );
}