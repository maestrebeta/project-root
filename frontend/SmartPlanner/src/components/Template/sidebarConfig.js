import {
  FiHome, FiClock, FiCalendar, FiPieChart, FiUsers, FiSettings, FiLayers,
  FiSliders, FiImage, FiUser, FiBriefcase, FiServer
} from 'react-icons/fi';

export const sidebarItems = [
  { icon: FiHome, text: "Inicio", to: "/home" },
  { icon: FiClock, text: "Registro Horas", to: "/user/time-tracker", badge:"Nuevo" },
  { icon: FiCalendar, text: "SmartPlaner", to: "/manager/planning", badge:"Nuevo" },
  { icon: FiPieChart, text: "Auditar Jira", to: "/manager/jira-summary", badge:"Nuevo" },
  { type: "divider" },
  {
    icon: FiSettings, text: "Configuración", children: [
      // { icon: FiLayers, text: "Estados Kanban", to: "/manager/kanban-states" },
      { icon: FiSliders, text: "Personalizar Tema", to: "/config/theme" },
      { icon: FiSliders, text: "Preferencias", to: "/config/preferences" },
    ]
  },
  {
    icon: FiBriefcase, text: "Consola Admin", children: [
      { icon: FiUsers, text: "Clientes", to: "/admin/customers" },
      { icon: FiLayers, text: "Proyectos", to: "/admin/projects" },
      { icon: FiUser, text: "Usuarios", to: "/admin/users" },
      { icon: FiImage, text: "Logo Empresa", to: "/config/logo" },
    ]
  },
  {
    icon: FiServer, text: "IT", children: [
      { icon: FiUsers, text: "Tickets", to: "/it/tickets" },
      { icon: FiServer, text: "Infraestructura", to: "/it/infra" },
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