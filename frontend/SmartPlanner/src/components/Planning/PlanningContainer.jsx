import React, { useState, useEffect } from "react";
import PlanningBoard from "./PlanningBoard";
import KanbanStatesManager from "./KanbanStatesManager";
import { useAppTheme } from "../../context/ThemeContext";
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route } from "react-router-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

// --- Configuración dinámica de estados Kanban ---
const DEFAULT_KANBAN_STATES = [
  { key: "nuevo", label: "Nuevo", color: "bg-gray-100", textColor: "text-gray-700" },
  { key: "en_progreso", label: "En Progreso", color: "bg-blue-50", textColor: "text-blue-700" },
  { key: "listo_pruebas", label: "Listo para Pruebas", color: "bg-yellow-50", textColor: "text-yellow-700" },
  { key: "cerrado", label: "Cerrado", color: "bg-green-50", textColor: "text-green-700" }
];

function getInitialKanbanStates() {
  // Siempre retornar los estados por defecto
  return [...DEFAULT_KANBAN_STATES];
}

// --- Mock data empresarial ---
const generateMockData = () => {
  // Generar usuarios mock
  const MOCK_USERS = Array.from({ length: 20 }, (_, i) => ({
    id: uuidv4(),
    nombre: [
      "Ana Torres", "Luis Pérez", "Carlos Ruiz", "María Gómez", "Pedro Sánchez",
      "Laura Díaz", "Javier López", "Sofía Martínez", "Diego Rodríguez", "Elena Fernández",
      "Miguel González", "Carmen Jiménez", "Pablo Hernández", "Isabel Moreno", "Jorge Álvarez",
      "Lucía Romero", "Daniel Navarro", "Adriana Molina", "Raúl Ortega", "Patricia Rubio"
    ][i],
    email: `usuario${i + 1}@empresa.com`,
    role: ["Developer", "QA", "UX Designer", "Product Owner", "Scrum Master"][Math.floor(Math.random() * 5)]
  }));

  // Generar proyectos mock
  const MOCK_PROJECTS = [
    { id: uuidv4(), nombre: "Sistema de Gestión v2.0", descripcion: "Nueva versión del sistema de gestión" },
    { id: uuidv4(), nombre: "App Móvil Cliente", descripcion: "Aplicación móvil para clientes" },
    { id: uuidv4(), nombre: "Portal Empleados", descripcion: "Portal interno para empleados" }
  ];

  // Generar épicas mock
  const MOCK_EPICS = [
    { 
      id: uuidv4(), 
      nombre: "Autenticación y Seguridad",
      descripcion: "Implementación del sistema de autenticación y seguridad",
      proyecto_id: MOCK_PROJECTS[0].id
    },
    { 
      id: uuidv4(), 
      nombre: "Gestión de Usuarios",
      descripcion: "Módulo de gestión de usuarios y permisos",
      proyecto_id: MOCK_PROJECTS[0].id
    },
    { 
      id: uuidv4(), 
      nombre: "Dashboard Analytics",
      descripcion: "Panel de análisis y métricas",
      proyecto_id: MOCK_PROJECTS[1].id
    }
  ];

  // Generar sprints mock
  const MOCK_SPRINTS = [
    {
      id: uuidv4(),
      nombre: "Sprint 1",
      fecha_inicio: "2024-03-01",
      fecha_fin: "2024-03-15",
      estado: "Completado"
    },
    {
      id: uuidv4(),
      nombre: "Sprint 2",
      fecha_inicio: "2024-03-16",
      fecha_fin: "2024-03-30",
      estado: "Activo"
    },
    {
      id: uuidv4(),
      nombre: "Sprint 3",
      fecha_inicio: "2024-03-31",
      fecha_fin: "2024-04-14",
      estado: "Planificado"
    }
  ];

  // Generar historias mock
  const MOCK_STORIES = [
    {
      id: uuidv4(),
      titulo: "Implementar autenticación JWT",
      descripcion: "Configurar sistema de autenticación con JWT",
      estado: "nuevo",
      prioridad: "Alta",
      usuario_asignado: MOCK_USERS[0].id,
      sprint_id: MOCK_SPRINTS[1].id,
      epica_id: MOCK_EPICS[0].id,
      etiquetas: ["backend", "seguridad"],
      estimaciones: { UI: 0, Desarrollo: 8, Testing: 4 }
    },
    {
      id: uuidv4(),
      titulo: "Diseñar interfaz de login",
      descripcion: "Crear diseño responsive para la pantalla de login",
      estado: "en_progreso",
      prioridad: "Media",
      usuario_asignado: MOCK_USERS[2].id,
      sprint_id: MOCK_SPRINTS[1].id,
      epica_id: MOCK_EPICS[0].id,
      etiquetas: ["frontend", "diseño"],
      estimaciones: { UI: 4, Desarrollo: 4, Testing: 2 }
    },
    {
      id: uuidv4(),
      titulo: "Implementar recuperación de contraseña",
      descripcion: "Sistema de recuperación de contraseña por email",
      estado: "listo_pruebas",
      prioridad: "Media",
      usuario_asignado: MOCK_USERS[1].id,
      sprint_id: MOCK_SPRINTS[1].id,
      epica_id: MOCK_EPICS[0].id,
      etiquetas: ["backend", "email"],
      estimaciones: { UI: 2, Desarrollo: 6, Testing: 4 }
    },
    {
      id: uuidv4(),
      titulo: "Gestión de roles y permisos",
      descripcion: "Implementar sistema de roles y permisos",
      estado: "nuevo",
      prioridad: "Alta",
      usuario_asignado: MOCK_USERS[3].id,
      sprint_id: MOCK_SPRINTS[1].id,
      epica_id: MOCK_EPICS[1].id,
      etiquetas: ["backend", "seguridad"],
      estimaciones: { UI: 0, Desarrollo: 12, Testing: 6 }
    }
  ];

  return {
    users: MOCK_USERS,
    projects: MOCK_PROJECTS,
    epics: MOCK_EPICS,
    sprints: MOCK_SPRINTS,
    stories: MOCK_STORIES
  };
};

export default function PlanningContainer() {
  const [stories, setStories] = useState([]);
  const [epics, setEpics] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filters, setFilters] = useState({});
  const [kanbanStates, setKanbanStates] = useState(getInitialKanbanStates());
  const [isLoading, setIsLoading] = useState(true);
  const theme = useAppTheme();
  const navigate = useNavigate();

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      // Simular delay de red
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simular carga desde API
      const mockData = generateMockData();
      setStories(mockData.stories || []);
      setEpics(mockData.epics || []);
      setSprints(mockData.sprints || []);
      setUsers(mockData.users || []);
      setProjects(mockData.projects || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleUpdateKanbanStates = (newStates) => {
    setKanbanStates(newStates);
    
    // Actualizar historias solo si un estado ha sido eliminado
    setStories(prevStories => 
      prevStories.map(story => {
        // Buscar el estado actual de la historia
        const currentState = newStates.find(state => state.key === story.estado);
        
        // Si el estado ya no existe, mover la historia al primer estado disponible
        if (!currentState) {
          return {
            ...story,
            estado: newStates[0]?.key || 'nuevo'
          };
        }
        
        // Si el estado existe, mantener la historia en su estado actual
        return story;
      })
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3]">
        <div className="text-center">
          <div className={`w-16 h-16 border-4 border-t-${theme.PRIMARY_COLOR}-600 border-${theme.PRIMARY_COLOR}-200 rounded-full animate-spin mx-auto mb-4`} />
          <h2 className={`text-xl font-semibold ${theme.PRIMARY_COLOR_CLASS} mb-2`}>
            Cargando SmartPlanner
          </h2>
          <p className="text-gray-500 text-sm">
            Preparando el espacio de trabajo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Routes>
        <Route
          path="/"
          element={
            <PlanningBoard
              epics={epics}
              sprints={sprints}
              stories={stories}
              users={users}
              projects={projects}
              setStories={setStories}
              onUpdateStory={handleUpdateStory}
              onCreateStory={handleCreateStory}
              kanbanStates={kanbanStates}
              onEditKanbanStates={handleUpdateKanbanStates}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          }
        />
        <Route
          path="/kanban-states"
          element={
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => navigate('/manager/planning')}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Gestión de Estados Kanban</h1>
              </div>
              <KanbanStatesManager
                states={kanbanStates}
                setStates={handleUpdateKanbanStates}
              />
            </motion.div>
          }
        />
      </Routes>
    </div>
  );
}