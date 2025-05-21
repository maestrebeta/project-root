import React, { useState, useEffect } from "react";
import PlanningBoard from "./PlanningBoard";
import KanbanStatesManager from "./KanbanStatesManager";
import { v4 as uuidv4 } from 'uuid';

// --- Configuración dinámica de estados Kanban ---
const KANBAN_STATES_KEY = "smartplanner_kanban_states";
const DEFAULT_KANBAN_STATES = [
  { key: "nuevo", label: "Nuevo", color: "bg-gray-100", textColor: "text-gray-700" },
  { key: "en_progreso", label: "En Progreso", color: "bg-blue-50", textColor: "text-blue-700" },
  { key: "listo_pruebas", label: "Listo para Pruebas", color: "bg-yellow-50", textColor: "text-yellow-700" },
  { key: "cerrado", label: "Cerrado", color: "bg-green-50", textColor: "text-green-700" }
];

function getInitialKanbanStates() {
  const stored = localStorage.getItem(KANBAN_STATES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_KANBAN_STATES;
    }
  }
  return DEFAULT_KANBAN_STATES;
}

// --- Mock data empresarial ---
const generateMockData = () => {
  const MOCK_USERS = Array.from({ length: 20 }, (_, i) => ({
    id: uuidv4(),
    nombre: [
      "Ana Torres", "Luis Pérez", "Carlos Ruiz", "María Gómez", "Pedro Sánchez",
      "Laura Díaz", "Javier López", "Sofía Martínez", "Diego Rodríguez", "Elena Fernández",
      "Miguel González", "Carmen Jiménez", "Pablo Hernández", "Isabel Moreno", "Jorge Álvarez",
      "Lucía Romero", "Daniel Navarro", "Adriana Molina", "Raúl Ortega", "Patricia Rubio"
    ][i],
    email: [
      "ana.torres@empresa.com", "luis.perez@empresa.com", "carlos.ruiz@empresa.com",
      "maria.gomez@empresa.com", "pedro.sanchez@empresa.com", "laura.diaz@empresa.com",
      "javier.lopez@empresa.com", "sofia.martinez@empresa.com", "diego.rodriguez@empresa.com",
      "elena.fernandez@empresa.com", "miguel.gonzalez@empresa.com", "carmen.jimenez@empresa.com",
      "pablo.hernandez@empresa.com", "isabel.moreno@empresa.com", "jorge.alvarez@empresa.com",
      "lucia.romero@empresa.com", "daniel.navarro@empresa.com", "adriana.molina@empresa.com",
      "raul.ortega@empresa.com", "patricia.rubio@empresa.com"
    ][i],
    role: ["Developer", "QA", "UX Designer", "Product Owner", "Scrum Master"][Math.floor(Math.random() * 5)],
    isActive: true,
    lastActive: new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString()
  }));

  const MOCK_PROJECTS = Array.from({ length: 5 }, (_, i) => ({
    id: uuidv4(),
    nombre: [
      "Plataforma de Gestión Empresarial", 
      "Portal del Cliente", 
      "Sistema de Análisis de Datos",
      "Aplicación Móvil Corporativa",
      "Herramienta de Colaboración Interna"
    ][i],
    descripcion: [
      "Plataforma integral para la gestión de proyectos y recursos empresariales",
      "Portal autogestionable para clientes con acceso a servicios y documentación",
      "Sistema avanzado de análisis y visualización de datos corporativos",
      "Aplicación móvil para acceso remoto a los sistemas de la empresa",
      "Herramienta para mejorar la colaboración entre equipos distribuidos"
    ][i],
    estado: ["activo", "en_pausa", "completado", "activo", "activo"][i],
    fechaInicio: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString(),
    fechaFin: new Date(Date.now() + Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString(),
    liderId: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)].id,
    presupuesto: [50000, 75000, 120000, 90000, 60000][i],
    cliente: [
      "Interno", 
      "Corporación Acme", 
      "Global Solutions", 
      "Industrias Beta", 
      "Tech Innovations"
    ][i]
  }));

  const MOCK_EPICS = MOCK_PROJECTS.flatMap(project => 
    Array.from({ length: 3 }, (_, i) => ({
      id: uuidv4(),
      nombre: [
        "Onboarding Platform", "Project Management Core", "Documentation Hub",
        "Reporting Dashboard", "Admin Console", "API Gateway", "Notification System",
        "User Profile Management", "Billing Module", "Security Framework",
        "Mobile App Sync", "Data Export Engine", "Integration Marketplace",
        "AI Assistant", "Customization Studio"
      ][i % 15],
      descripcion: [
        "Flujo completo de registro y bienvenida de nuevos usuarios",
        "Funcionalidades centrales de gestión de proyectos y tareas",
        "Centralización de documentación técnica y de usuario",
        "Tableros analíticos y reportes ejecutivos",
        "Herramientas de administración del sistema",
        "Gestión centralizada de APIs y endpoints",
        "Sistema de notificaciones multicanal",
        "Gestión de perfiles de usuario y preferencias",
        "Módulo de facturación y pagos",
        "Marco de seguridad y control de accesos",
        "Sincronización con aplicación móvil nativa",
        "Motor de exportación de datos en múltiples formatos",
        "Plataforma de integraciones con terceros",
        "Asistente inteligente para soporte y productividad",
        "Herramientas de personalización de la plataforma"
      ][i % 15],
      status: ["planned", "in_progress", "completed"][Math.floor(Math.random() * 3)],
      startDate: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000).toISOString(),
      targetRelease: `Q${Math.floor(Math.random() * 4) + 1} ${new Date().getFullYear() + Math.floor(Math.random() * 2)}`,
      priority: ["high", "medium", "low"][Math.floor(Math.random() * 3)],
      ownerId: MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)].id,
      projectId: project.id
    }))
  );

  const MOCK_SPRINTS = MOCK_PROJECTS.flatMap(project => 
    Array.from({ length: 12 }, (_, i) => {
      const startDate = new Date(Date.now() - (11 - i) * 90 * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
      return {
        id: uuidv4(),
        nombre: `Sprint ${i + 1} - Q${Math.floor(i/3) + 1}`,
        fecha_inicio: startDate.toISOString().split('T')[0],
        fecha_fin: endDate.toISOString().split('T')[0],
        estado: i === 11 ? "Activo" : i > 8 ? "Pendiente" : "Completado",
        goal: [
          "Implementar flujo de onboarding básico",
          "Desarrollar core de gestión de proyectos",
          "Crear sistema de permisos básico",
          "Implementar notificaciones por email",
          "Desarrollar módulo de reportes básicos",
          "Crear API de integración inicial",
          "Implementar sistema de documentación técnica",
          "Desarrollar panel de administración",
          "Crear módulo de facturación inicial",
          "Implementar seguridad básica",
          "Preparar lanzamiento MVP",
          "Optimizar rendimiento general"
        ][i],
        velocity: Math.floor(Math.random() * 40) + 20,
        completedPoints: Math.floor(Math.random() * 40) + 15,
        projectId: project.id
      };
    })
  );

  const MOCK_STORIES = MOCK_PROJECTS.flatMap(project => {
    const projectEpics = MOCK_EPICS.filter(epic => epic.projectId === project.id);
    const projectSprints = MOCK_SPRINTS.filter(sprint => sprint.projectId === project.id);
    return Array.from({ length: 50 }, (_, i) => {
      const epic = projectEpics[Math.floor(Math.random() * projectEpics.length)];
      const statusOptions = ["nuevo", "en_progreso", "listo_pruebas", "cerrado"];
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      const sprint = status === "nuevo" ? null : 
        projectSprints[Math.floor(Math.random() * projectSprints.length)];
      return {
        id: uuidv4(),
        titulo: [
          "Implementar autenticación con Google",
          "Crear formulario de nuevo proyecto",
          "Diseñar tabla de proyectos",
          "Agregar filtros a la vista de proyectos",
          "Implementar exportación a PDF",
          "Crear API para listar usuarios",
          "Diseñar panel de administración",
          "Implementar notificaciones en-app",
          "Crear sistema de permisos básico",
          "Optimizar carga de dashboard",
          "Implementar búsqueda global",
          "Diseñar flujo de onboarding",
          "Crear documentación API",
          "Implementar dark mode",
          "Agregar tooltips a elementos UI"
        ][Math.floor(Math.random() * 15)] + ` ${Math.floor(Math.random() * 5) + 1}`,
        descripcion: `Como ${["usuario", "admin", "cliente", "desarrollador", "PO"][Math.floor(Math.random() * 5)]} quiero ${[
          "poder autenticarme con mi cuenta de Google",
          "crear nuevos proyectos con campos básicos",
          "ver todos mis proyectos en una tabla ordenable",
          "filtrar proyectos por estado y fecha",
          "exportar reportes en formato PDF",
          "obtener una lista de usuarios del sistema",
          "acceder a herramientas de administración",
          "recibir notificaciones dentro de la aplicación",
          "tener permisos diferenciados por rol",
          "experimentar tiempos de carga más rápidos",
          "buscar contenido en toda la plataforma",
          "completar un flujo de onboarding guiado",
          "acceder a documentación técnica completa",
          "cambiar el tema de la interfaz a oscuro",
          "ver información contextual al hacer hover"
        ][Math.floor(Math.random() * 15)]} para ${[
          "mejorar mi productividad",
          "acceder más rápido a la información",
          "tener más control sobre mis datos",
          "personalizar mi experiencia",
          "compartir información con mi equipo",
          "tomar mejores decisiones",
          "reducir errores en el sistema",
          "cumplir con requisitos regulatorios",
          "mejorar la experiencia general",
          "optimizar mis flujos de trabajo"
        ][Math.floor(Math.random() * 10)]}.`,
        epica_id: epic.id,
        proyecto_id: project.id,
        estado: status,
        prioridad: ["Alta", "Media", "Baja"][Math.floor(Math.random() * 3)],
        estimaciones: {
          UI: Math.floor(Math.random() * 3),
          Desarrollo: Math.floor(Math.random() * 8) + 2,
          Documentación: Math.floor(Math.random() * 2),
          Reuniones: Math.floor(Math.random() * 2),
          Otros: Math.floor(Math.random() * 2)
        },
        usuario_asignado: status === "nuevo" ? null : MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)].id,
        sprint_id: sprint?.id || null,
        etiquetas: Array.from(new Set([
          ["auth", "ui", "api", "security", "devops"][Math.floor(Math.random() * 5)],
          ["urgente", "mejora", "bug", "feature"][Math.floor(Math.random() * 4)]
        ])),
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 180) * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        points: Math.floor(Math.random() * 8) + 1,
        dependencies: Math.random() > 0.7 ? [uuidv4(), uuidv4()] : [],
        acceptanceCriteria: [
          "Debe funcionar en los últimos 3 versiones de Chrome",
          "El tiempo de respuesta debe ser menor a 2 segundos",
          "Debe pasar todos los tests unitarios",
          "Debe cumplir con las guías de accesibilidad WCAG 2.1",
          "Debe incluir documentación técnica"
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      };
    });
  });

  return { MOCK_USERS, MOCK_PROJECTS, MOCK_EPICS, MOCK_SPRINTS, MOCK_STORIES };
};

export default function PlanningContainer() {
  const [epics, setEpics] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kanbanStates, setKanbanStates] = useState(getInitialKanbanStates());
  const [showStatesManager, setShowStatesManager] = useState(false);
  const [filters, setFilters] = useState({
    status: undefined,
    priority: undefined,
    assignedTo: undefined,
    project: undefined
  });

  // Persistir cambios de estados Kanban
  useEffect(() => {
    localStorage.setItem(KANBAN_STATES_KEY, JSON.stringify(kanbanStates));
  }, [kanbanStates]);

  // Simular carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      const { MOCK_USERS, MOCK_PROJECTS, MOCK_EPICS, MOCK_SPRINTS, MOCK_STORIES } = generateMockData();
      setUsers(MOCK_USERS);
      setProjects(MOCK_PROJECTS);
      setEpics(MOCK_EPICS);
      setSprints(MOCK_SPRINTS);
      setStories(MOCK_STORIES);
      setIsLoading(false);
    };
    loadData();
  }, []);

  // CRUD Handlers
  const handleUpdateStory = (updatedStory) => {
    setStories(prev => 
      prev.map(story => 
        story.id === updatedStory.id ? { 
          ...updatedStory, 
          updatedAt: new Date().toISOString() 
        } : story
      )
    );
  };

  const handleCreateStory = (newStory) => {
    const storyWithId = { 
      ...newStory, 
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setStories(prev => [...prev, storyWithId]);
    return storyWithId;
  };

  const handleCreateEpic = (newEpic) => {
    const epicWithId = { 
      ...newEpic, 
      id: uuidv4(),
      status: "planned"
    };
    setEpics(prev => [...prev, epicWithId]);
    return epicWithId;
  };

  const handleCreateProject = (newProject) => {
    const projectWithId = {
      ...newProject,
      id: uuidv4(),
      estado: "activo"
    };
    setProjects(prev => [...prev, projectWithId]);
    return projectWithId;
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Cargando datos del proyecto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Botón para abrir el gestor de estados Kanban */}
      <button
        className="absolute top-16 right-4 z-10 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        onClick={() => setShowStatesManager(true)}
      >
        Gestionar Estados Kanban
      </button>

      {/* Modal del gestor */}
      {showStatesManager && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg px-6 pt-6 pb-6 relative min-w-[350px]">
            <button
              className="absolute top-9 right-10 text-gray-500 hover:text-gray-700 text-2xl"
              onClick={() => setShowStatesManager(false)}
              aria-label="Cerrar gestor de estados"
              type="button"
            >
              ✕
            </button>
            <KanbanStatesManager
              states={kanbanStates}
              setStates={setKanbanStates}
            />
          </div>
        </div>
      )}

      <PlanningBoard
        epics={epics}
        sprints={sprints}
        stories={stories}
        users={users}
        projects={projects}
        setStories={setStories}
        onUpdateStory={handleUpdateStory}
        onCreateStory={handleCreateStory}
        onCreateEpic={handleCreateEpic}
        onCreateProject={handleCreateProject}
        filters={filters}
        onFilterChange={handleFilterChange}
        kanbanStates={kanbanStates}
        onEditKanbanStates={setKanbanStates}
      />
    </div>
  );
}