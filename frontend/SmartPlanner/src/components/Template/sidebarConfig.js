import {
  FiHome, FiClock, FiCalendar, FiPieChart, FiUsers, FiSettings, FiLayers,
  FiSliders, FiImage, FiUser, FiBriefcase, FiServer, FiCode, FiTrello, FiGrid
} from 'react-icons/fi';

export const sidebarItems = [
  { icon: FiHome, text: "Inicio", to: "/home" },
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
          { icon: FiPieChart, text: "Auditar Jira", to: "/manager/jira-summary", badge: "Nuevo" },
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
          { icon: FiGrid, text: "Organizaciones", to: "/admin/organizations" },
          { icon: FiUsers, text: "Clientes", to: "/admin/customers" },
          { icon: FiLayers, text: "Centro de Proyectos", to: "/admin/projects" },
          { icon: FiUser, text: "Usuarios", to: "/admin/users" },
          { icon: FiImage, text: "Logo Empresa", to: "/config/logo" },
        ]
      },
      {
        icon: FiServer,
        text: "IT",
        children: [
          { icon: FiUsers, text: "Tickets", to: "/it/tickets" },
          { icon: FiServer, text: "Infraestructura", to: "/it/infra" },
        ]
      }
    ]
  }
];

export function getHeaderTitleFromSidebar(pathname) {
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
  return search(sidebarItems) || "Workplace ticket";
}