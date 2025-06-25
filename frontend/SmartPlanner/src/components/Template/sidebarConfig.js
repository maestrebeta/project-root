import {
  FiHome, FiClock, FiCalendar, FiPieChart, FiUsers, FiSettings, FiLayers,
  FiSliders, FiImage, FiUser, FiBriefcase, FiServer, FiCode, FiTrello, FiGrid, FiMessageCircle, FiCheckCircle, FiDollarSign, FiCheckSquare, FiGlobe, FiUserPlus
} from 'react-icons/fi';

export const sidebarItems = [
  { icon: FiHome, text: "Inicio", to: "/home" },
  { icon: FiCheckSquare, text: "Tareas", to: "/tasks" },
  { icon: FiMessageCircle, text: "Comunicaciones", to: "/communications" },
  
  { type: "divider" },
  
  {
    icon: FiBriefcase,
    text: "Espacios de trabajo",
    children: [
      {
        icon: FiTrello,
        text: "Project Manager",
        children: [
          { icon: FiCalendar, text: "SmartPlanner", to: "/manager/planning", badge: "Nuevo" },
        ]
      },
      {
        icon: FiCode,
        text: "Desarrolladores",
        children: [
          { icon: FiClock, text: "Registro Horas", to: "/user/time-tracker", badge: "Nuevo" },
        ]
      },
      {
        icon: FiBriefcase,
        text: "Consola Admin",
        children: [
          { icon: FiUsers, text: "Gestión Clientes", to: "/admin/customers" },
          { icon: FiUser, text: "Gestión Usuarios", to: "/admin/users" },
          { icon: FiLayers, text: "Centro de Proyectos", to: "/admin/projects" },
        ]
      },
      {
        icon: FiServer,
        text: "IT",
        children: [
          { icon: FiUsers, text: "Tickets", to: "/it/tickets" },
          { icon: FiUserPlus, text: "Usuarios Externos", to: "/it/external-users" },
          { icon: FiGlobe, text: "Portal Externo", to: "/external/form-manager" },
          { icon: FiServer, text: "Infraestructura", to: "/it/infra" },
        ]
      }
    ]
  }
];

// Función para obtener items del sidebar filtrados por rol de usuario
export function getSidebarItemsForUser(userRole) {
  const baseItems = [...sidebarItems];
  
  // Solo super_user puede ver la sección "Desarrollo"
  if (userRole === 'super_user') {
    baseItems.push({ type: "divider" });
    baseItems.push({
      icon: FiSettings,
      text: "Desarrollo",
      children: [
        { icon: FiGrid, text: "Organizaciones", to: "/admin/organizations" },
        { icon: FiCheckCircle, text: "Testing Unitario", to: "/admin/unit-testing" },
      ]
    });
  }
  
  return baseItems;
}

export function getHeaderTitleFromSidebar(pathname) {
  // Mapeo específico para rutas que pueden no estar en el sidebar o necesitan títulos personalizados
  const routeTitleMap = {
    '/admin/unit-testing': 'Testing Unitario',
    '/admin/organizations': 'Organizaciones',
    '/manager/planning': 'SmartPlanner',
    '/user/time-tracker': 'Registro Horas',
    '/admin/customers': 'Gestión Clientes',
    '/admin/users': 'Gestión Usuarios',
    '/admin/projects': 'Centro de Proyectos',
    '/admin/quotations': 'Cotizaciones',
    '/it/tickets': 'Tickets',
    '/it/external-users': 'Usuarios Externos',
    '/it/infra': 'Infraestructura',
    '/external/form-manager': 'Portal Externo',
    '/communications': 'Comunicaciones',
    '/tasks': 'Tareas',
    '/home': 'Inicio'
  };

  // Primero verificar si hay un mapeo específico
  if (routeTitleMap[pathname]) {
    return routeTitleMap[pathname];
  }

  // Si no hay mapeo específico, buscar en todos los items del sidebar
  function search(items) {
    for (const item of items) {
      if (item.to && pathname.startsWith(item.to)) return item.text;
      if (item.children) {
        const found = search(item.children);
        if (found) return found;
      }
    }
    return null;
  }

  // Buscar en todos los items disponibles (incluyendo la sección de Desarrollo)
  const allItems = getSidebarItemsForUser('super_user'); // Usar super_user para obtener todos los items
  const found = search(allItems);
  
  return found || "Workplace ticket";
}