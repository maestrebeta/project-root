import React, { useState, useEffect, useMemo, useRef } from "react";
import PlanningBoard from "./PlanningBoard";
import EpicModal from "./EpicModal";
import KanbanStatesManager from "./KanbanStatesManager";
import { useAppTheme } from "../../context/ThemeContext";
import { v4 as uuidv4 } from 'uuid';
import { Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  planningService, 
  epicService, 
  userStoryService, 
  projectService, 
  userService,
  planningStatsService 
} from "../../services/planningService";
import { FiTarget, FiTrendingUp, FiUsers, FiClock, FiChevronDown, FiPlus, FiFilter, FiSearch, FiGrid, FiList, FiZap, FiStar, FiActivity, FiBarChart2, FiLayers, FiCheckCircle, FiAlertCircle, FiX } from "react-icons/fi";
import { createPortal } from 'react-dom';

// Estados iniciales del kanban mejorados
function getInitialKanbanStates() {
  return [
    { id: 'backlog', label: 'Backlog', color: '#6B7280', icon: '📋', gradient: 'from-gray-400 to-gray-600' },
    { id: 'todo', label: 'Por Hacer', color: '#3B82F6', icon: '📝', gradient: 'from-blue-400 to-blue-600' },
    { id: 'in_progress', label: 'En Progreso', color: '#F59E0B', icon: '⚡', gradient: 'from-amber-400 to-orange-500' },
    { id: 'in_review', label: 'En Revisión', color: '#8B5CF6', icon: '👀', gradient: 'from-purple-400 to-purple-600' },
    { id: 'testing', label: 'Pruebas', color: '#EC4899', icon: '🧪', gradient: 'from-pink-400 to-pink-600' },
    { id: 'done', label: 'Completado', color: '#10B981', icon: '✅', gradient: 'from-emerald-400 to-green-600' }
  ];
}

// Mock data mejorado como fallback
const generateMockData = () => {
  const MOCK_USERS = Array.from({ length: 8 }, (_, i) => ({
    user_id: i + 1,
    username: `usuario${i + 1}`,
    full_name: [
      "Ana Torres", "Luis Pérez", "Carlos Ruiz", "María Gómez", 
      "Pedro Sánchez", "Laura Díaz", "Javier López", "Sofía Martínez"
    ][i],
    email: `usuario${i + 1}@empresa.com`,
    role: ["developer", "qa", "designer", "product_owner"][Math.floor(Math.random() * 4)]
  }));

  const MOCK_PROJECTS = [
    { 
      project_id: 1, 
      name: "Sistema de Gestión v2.0", 
      description: "Nueva versión del sistema de gestión",
      status: "in_progress",
      project_type: "development",
      priority: "high",
      progress: 65
    },
    { 
      project_id: 2, 
      name: "App Móvil Cliente", 
      description: "Aplicación móvil para clientes",
      status: "in_planning",
      project_type: "development",
      priority: "medium",
      progress: 25
    },
    { 
      project_id: 3, 
      name: "Dashboard Analytics", 
      description: "Panel de análisis y métricas",
      status: "in_progress",
      project_type: "development",
      priority: "high",
      progress: 80
    }
  ];

  const MOCK_EPICS = [
    { 
      epic_id: 1,
      project_id: 1,
      name: "Autenticación y Seguridad",
      description: "Implementación del sistema de autenticación y seguridad",
      status: "in_progress",
      priority: "high",
      color: "#3B82F6",
      progress_percentage: 65
    },
    { 
      epic_id: 2,
      project_id: 1,
      name: "Gestión de Usuarios",
      description: "Módulo de gestión de usuarios y permisos",
      status: "planned",
      priority: "medium",
      color: "#10B981",
      progress_percentage: 25
    }
  ];

  const MOCK_STORIES = Array.from({ length: 12 }, (_, i) => ({
    story_id: i + 1,
    epic_id: Math.floor(Math.random() * 2) + 1,
    project_id: 1,
    title: [
      "Implementar login con OAuth",
      "Crear dashboard de usuario",
      "Diseñar sistema de notificaciones",
      "Optimizar rendimiento de consultas",
      "Implementar chat en tiempo real",
      "Crear sistema de reportes",
      "Diseñar interfaz móvil",
      "Implementar búsqueda avanzada",
      "Crear sistema de backup",
      "Optimizar carga de imágenes",
      "Implementar modo oscuro",
      "Crear API de integración"
    ][i],
    description: "Descripción detallada de la historia de usuario",
    status: ['backlog', 'todo', 'in_progress', 'in_review', 'testing', 'done'][Math.floor(Math.random() * 6)],
    priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
    assigned_user_id: Math.floor(Math.random() * 8) + 1,
    estimated_hours: [2, 4, 8, 16][Math.floor(Math.random() * 4)],
    ui_hours: Math.floor(Math.random() * 10),
    development_hours: Math.floor(Math.random() * 20) + 5,
    testing_hours: Math.floor(Math.random() * 8) + 2,
    documentation_hours: Math.floor(Math.random() * 5) + 1
  }));

  return {
    projects: MOCK_PROJECTS,
    users: MOCK_USERS,
    epics: MOCK_EPICS,
    stories: MOCK_STORIES
  };
};

// Componente de notificación elegante
function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-cerrar después de 5 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default: return <FiAlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'error': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`fixed top-4 right-4 z-[10000] max-w-md p-4 rounded-xl border shadow-lg backdrop-blur-sm ${getColors()}`}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="font-semibold">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm mt-1 opacity-90">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="opacity-60 hover:opacity-100 transition-opacity"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export default function PlanningContainer() {
  // Estados principales
  const [projects, setProjects] = useState([]);
  const [epics, setEpics] = useState([]);
  const [stories, setStories] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedEpic, setSelectedEpic] = useState(null);
  const [planningStats, setPlanningStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  
  // Estados de UI
  const [filters, setFilters] = useState({});
  const [kanbanStates, setKanbanStates] = useState(getInitialKanbanStates());
  const [viewMode, setViewMode] = useState('kanban'); // kanban, list, timeline
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Estados de modales
  const [showEpicModal, setShowEpicModal] = useState(false);
  const [editingEpic, setEditingEpic] = useState(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  
  const projectButtonRef = useRef(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 120, left: 24 });

  const theme = useAppTheme();
  const navigate = useNavigate();

  // Calcular posición del dropdown
  const calculateDropdownPosition = () => {
    if (projectButtonRef.current) {
      const rect = projectButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8, // 8px debajo del botón
        left: rect.left
      });
    }
  };

  // Cerrar dropdown al hacer click fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el dropdown está abierto y el click no es en el botón del proyecto
      if (showProjectSelector && projectButtonRef.current && !projectButtonRef.current.contains(event.target)) {
        // Verificar si el click es dentro del dropdown (que ahora está en el portal)
        const dropdownElement = document.querySelector('[data-dropdown="project-selector"]');
        if (!dropdownElement || !dropdownElement.contains(event.target)) {
          setShowProjectSelector(false);
        }
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && showProjectSelector) {
        setShowProjectSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showProjectSelector]);

  // Cargar datos iniciales
  useEffect(() => {
    loadPlanningData();
  }, []);

  // Cargar datos cuando cambia el proyecto seleccionado
  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject.project_id);
    }
  }, [selectedProject]);

  const loadPlanningData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Cargando datos de planificación desde el backend...');
      
      // Cargar proyectos
      const projectsData = await projectService.getProjects();
      console.log('✅ Proyectos cargados:', projectsData);
      setProjects(projectsData || []);
      
      // Cargar usuarios
      const usersData = await userService.getUsers();
      console.log('✅ Usuarios cargados:', usersData);
      setUsers(usersData || []);
      
      // Cargar todas las épicas
      const epicsData = await epicService.getEpics();
      console.log('✅ Épicas cargadas:', epicsData);
      setEpics(epicsData || []);
      
      // Cargar todas las historias de usuario
      const storiesData = await userStoryService.getUserStories();
      console.log('✅ Historias cargadas:', storiesData);
      setStories(storiesData || []);
      
      // Cargar estadísticas de planificación
      const statsData = await planningStatsService.getPlanningStats();
      console.log('✅ Estadísticas cargadas:', statsData);
      setPlanningStats(statsData);
      
      // Seleccionar el primer proyecto por defecto
      if (projectsData && projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }
      
    } catch (error) {
      console.error('❌ Error al cargar datos de planificación:', error);
      setError(error.message);
      
      // Usar datos mock como fallback solo en caso de error crítico
      const mockData = generateMockData();
      setProjects(mockData.projects);
      setUsers(mockData.users);
      setEpics(mockData.epics);
      setStories(mockData.stories);
      setSelectedProject(mockData.projects[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      setIsLoading(true);
      
      // Cargar épicas del proyecto
      const projectEpics = await epicService.getEpicsByProject(projectId);
      setEpics(projectEpics);
      
      // Auto-seleccionar la primera épica si existe
      if (projectEpics.length > 0) {
        const firstEpic = projectEpics[0];
        setSelectedEpic(firstEpic);
        console.log('✅ Auto-seleccionada primera épica:', firstEpic.name);
        
        // Cargar historias de la primera épica
        const epicStories = await userStoryService.getUserStoriesByProject(projectId);
        setStories(epicStories);
      } else {
        // No hay épicas, limpiar historias
        setStories([]);
        console.log('ℹ️ No hay épicas en el proyecto');
      }
      
    } catch (error) {
      console.error('❌ Error al cargar datos del proyecto:', error);
      setError(`Error al cargar proyecto: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar actualización de historias
  const handleUpdateStory = async (updatedStory) => {
    try {
      console.log('🔄 Actualizando historia:', updatedStory);
      
      const result = await userStoryService.updateUserStory(updatedStory.story_id, updatedStory);
      
      // Actualizar estado local
      setStories(prevStories => 
        prevStories.map(story => 
          story.story_id === updatedStory.story_id ? result : story
        )
      );
      
      // Si la historia cambió de estado, actualizar progreso de la épica
      if (result.epic_id) {
        await updateEpicProgress(result.epic_id);
      }
      
      console.log('✅ Historia actualizada exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar historia:', error);
      // Actualizar estado local como fallback
      setStories(prevStories => 
        prevStories.map(story => 
          story.story_id === updatedStory.story_id ? updatedStory : story
        )
      );
    }
  };

  // Manejar creación de historias
  const handleCreateStory = async (newStory) => {
    try {
      console.log('🔄 Creando nueva historia:', newStory);
      
      const storyData = {
        ...newStory,
        project_id: selectedProject?.project_id,
        epic_id: selectedEpic?.epic_id || null, // Asignar épica seleccionada automáticamente
        // Respetar el estado proporcionado o usar 'backlog' por defecto
        status: newStory.status || 'backlog'
      };
      
      console.log('📤 Enviando datos al backend:', storyData);
      
      const createdStory = await userStoryService.createUserStory(storyData);
      
      // Actualizar estado local solo si la creación fue exitosa
      setStories(prevStories => [...prevStories, createdStory]);
      
      console.log('✅ Historia creada exitosamente con estado:', createdStory.status);
      console.log('✅ Historia creada con ID real:', createdStory.story_id);
      console.log('✅ Historia asignada a épica:', selectedEpic?.name || 'Sin épica');
      
      // Mostrar notificación de éxito
      setSuccessMessage(`Historia "${createdStory.title}" creada exitosamente en "${selectedEpic?.name || 'Sin épica'}"`);
      
      return createdStory;
    } catch (error) {
      console.error('❌ Error al crear historia:', error);
      console.error('❌ Datos que causaron el error:', newStory);
      
      // Usar el sistema de notificaciones en lugar de alert
      setError(`Error al crear historia: ${error.message}`);
      
      // Re-lanzar el error para que el componente que llama pueda manejarlo
      throw error;
    }
  };

  // Manejar creación de épicas
  const handleCreateEpic = async (newEpic) => {
    try {
      console.log('🔄 Creando nueva épica:', newEpic);
      
      const createdEpic = await epicService.createEpic(newEpic);
      
      // Actualizar estado local solo si la creación fue exitosa
      setEpics(prevEpics => [...prevEpics, createdEpic]);
      
      console.log('✅ Épica creada exitosamente con ID real:', createdEpic.epic_id);
      return createdEpic;
    } catch (error) {
      console.error('❌ Error al crear épica:', error);
      console.error('❌ Datos que causaron el error:', newEpic);
      
      // Usar el sistema de notificaciones en lugar de alert
      setError(`Error al crear épica: ${error.message}`);
      
      // Re-lanzar el error para que el componente que llama pueda manejarlo
      throw error;
    }
  };

  // Manejar edición de épicas
  const handleEditEpic = async (updatedEpic) => {
    try {
      console.log('🔄 Actualizando épica:', updatedEpic);
      
      // Procesar correctamente todos los campos
      const epicData = {
        name: updatedEpic.name,
        description: updatedEpic.description,
        status: updatedEpic.status,
        priority: updatedEpic.priority,
        start_date: updatedEpic.start_date,
        end_date: updatedEpic.end_date,
        acceptance_criteria: updatedEpic.acceptance_criteria,
        business_value: updatedEpic.business_value,
        tags: updatedEpic.tags // Ya viene en formato diccionario desde el modal
      };
      
      const result = await epicService.updateEpic(updatedEpic.epic_id, epicData);
      
      // Actualizar estado local inmediatamente
      setEpics(prevEpics => 
        prevEpics.map(epic => 
          epic.epic_id === updatedEpic.epic_id ? result : epic
        )
      );
      
      // Si es la épica seleccionada, actualizarla también
      if (selectedEpic && selectedEpic.epic_id === updatedEpic.epic_id) {
        setSelectedEpic(result);
      }
      
      console.log('✅ Épica actualizada exitosamente');
      return result;
    } catch (error) {
      console.error('❌ Error al actualizar épica:', error);
      setError(`Error al actualizar épica: ${error.message}`);
      throw error;
    }
  };

  // Actualizar progreso de épica
  const updateEpicProgress = async (epicId) => {
    try {
      const epicStories = stories.filter(story => story.epic_id === epicId);
      const completedStories = epicStories.filter(story => story.status === 'done');
      const progress = epicStories.length > 0 ? (completedStories.length / epicStories.length) * 100 : 0;
      
      setEpics(prevEpics => 
        prevEpics.map(epic => 
          epic.epic_id === epicId ? { ...epic, progress_percentage: progress } : epic
        )
      );
    } catch (error) {
      console.error('❌ Error al actualizar progreso de épica:', error);
    }
  };

  // Manejar cambios de filtros
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  // Manejar actualización de estados kanban
  const handleUpdateKanbanStates = (newStates) => {
    setKanbanStates(newStates);
  };

  // Manejar cambio de proyecto
  const handleProjectChange = (project) => {
    console.log('🔄 Cambiando proyecto:', project);
    setSelectedProject(project);
    setSelectedEpic(null);
    setStories([]);
    setEpics([]);
    
    // Auto-seleccionar primera épica si existe
    if (project?.project_id) {
      loadProjectData(project.project_id);
    }
    
    console.log('✅ Proyecto cambiado a:', project.name);
  };

  // Manejar selección de épica
  const handleEpicSelect = async (epic) => {
    console.log('🎯 Épica seleccionada:', epic?.name);
    setSelectedEpic(epic);
    
    if (epic && selectedProject) {
      try {
        // Cargar historias de la épica seleccionada
        const epicStories = await userStoryService.getUserStoriesByProject(selectedProject.project_id);
        // Filtrar solo las historias de esta épica (o sin épica si epic_id es null)
        const filteredStories = epic.epic_id 
          ? epicStories.filter(story => story.epic_id === epic.epic_id)
          : epicStories.filter(story => !story.epic_id);
        
        setStories(filteredStories);
        console.log(`✅ Cargadas ${filteredStories.length} historias para la épica "${epic.name}"`);
      } catch (error) {
        console.error('❌ Error al cargar historias de la épica:', error);
        setError(`Error al cargar historias: ${error.message}`);
      }
    } else {
      setStories([]);
    }
  };

  // Manejar apertura del modal de épicas
  const handleNewEpic = () => {
    setEditingEpic(null);
    setShowEpicModal(true);
  };

  const handleEditEpicModal = (epic) => {
    setEditingEpic(epic);
    setShowEpicModal(true);
  };

  // Manejar guardado de épica (crear/editar)
  const handleSaveEpic = async (epicData) => {
    try {
      if (editingEpic) {
        // Editar épica existente
        const updatedEpic = await handleEditEpic(epicData);
        setShowEpicModal(false);
        setEditingEpic(null);
        return updatedEpic;
      } else {
        // Crear nueva épica
        const newEpicData = {
          ...epicData,
          project_id: selectedProject?.project_id
        };
        
        const createdEpic = await handleCreateEpic(newEpicData);
        
        // Auto-seleccionar la épica recién creada
        if (createdEpic) {
          await handleEpicSelect(createdEpic);
          console.log('✅ Épica creada y auto-seleccionada:', createdEpic.name);
        }
        
        setShowEpicModal(false);
        setEditingEpic(null);
        return createdEpic;
      }
    } catch (error) {
      console.error('❌ Error al guardar épica:', error);
      throw error;
    }
  };

  // Filtrar historias según filtros aplicados y épica seleccionada
  const getFilteredStories = () => {
    if (!selectedEpic) return [];
    
    return stories.filter(story => {
      // Filtrar por épica seleccionada
      const belongsToEpic = selectedEpic.epic_id 
        ? story.epic_id === selectedEpic.epic_id
        : !story.epic_id; // Historias sin épica
      
      if (!belongsToEpic) return false;
      
      // Aplicar filtros adicionales
      if (filters.assignedUser && story.assigned_user_id !== filters.assignedUser) {
        return false;
      }
      
      if (filters.priority && story.priority !== filters.priority) {
        return false;
      }
      
      if (filters.status && story.status !== filters.status) {
        return false;
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          story.title.toLowerCase().includes(searchTerm) ||
          (story.description && story.description.toLowerCase().includes(searchTerm))
        );
      }
      
      return true;
    });
  };

  // Filtrar épicas por proyecto seleccionado
  const getFilteredEpics = () => {
    if (!selectedProject) return epics;
    return epics.filter(epic => epic.project_id === selectedProject.project_id);
  };

  // Calcular estadísticas del proyecto actual
  const getProjectStats = () => {
    const projectStories = getFilteredStories();
    const projectEpics = getFilteredEpics();
    
    return {
      totalEpics: projectEpics.length,
      totalStories: projectStories.length,
      completedStories: projectStories.filter(s => s.status === 'done').length,
      inProgressStories: projectStories.filter(s => s.status === 'in_progress').length,
      totalHours: projectStories.reduce((sum, s) => sum + (s.development_hours || 0) + (s.ui_hours || 0) + (s.testing_hours || 0), 0),
      avgProgress: projectEpics.length > 0 ? projectEpics.reduce((sum, e) => sum + (e.progress_percentage || 0), 0) / projectEpics.length : 0
    };
  };

  const stats = getProjectStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.h3 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-800 mb-2"
          >
            Cargando SmartPlanner
          </motion.h3>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-gray-600"
          >
            Preparando tu experiencia épica...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* HEADER ÉPICO Y DINÁMICO - OPTIMIZADO */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="w-full px-6 py-4">
          <div className="flex items-center justify-between w-full gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <motion.div 
                className="relative project-selector-container"
                whileHover={{ scale: 1.02 }}
              >
                <button
                  ref={projectButtonRef}
                  onClick={() => {
                    calculateDropdownPosition();
                    setShowProjectSelector(!showProjectSelector);
                  }}
                  className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 group min-w-[280px]"
                >
                  <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FiTarget className="w-3 h-3" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-sm truncate">{selectedProject?.name || 'Seleccionar Proyecto'}</div>
                  </div>
                  <FiChevronDown className={`w-4 h-4 transition-transform duration-300 flex-shrink-0 ${showProjectSelector ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown de proyectos como Portal */}
                {showProjectSelector && createPortal(
                  <AnimatePresence key="project-selector-dropdown">
                    {/* Backdrop que cierra el dropdown */}
                    <motion.div
                      key="backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[999998] bg-black/10"
                      onClick={() => setShowProjectSelector(false)}
                    />
                    
                    {/* Dropdown */}
                    <motion.div
                      key="dropdown"
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed z-[999999] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                      data-dropdown="project-selector"
                      onClick={(e) => e.stopPropagation()} // Evitar que el click se propague al backdrop
                      style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                        width: '320px',
                        maxHeight: '400px',
                        zIndex: 999999
                      }}
                    >
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <FiZap className="w-4 h-4 text-blue-600" />
                          Cambiar Proyecto
                        </h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {projects.map(project => (
                          <motion.button
                            key={`project-${project.project_id}`}
                            whileHover={{ backgroundColor: '#f8fafc' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ Click en proyecto:', project.name);
                              handleProjectChange(project);
                              setShowProjectSelector(false);
                            }}
                            className="w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{project.name}</div>
                                <div className="text-sm text-gray-500 mt-1">{project.description}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    project.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    project.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {project.priority === 'high' ? 'Alta' : project.priority === 'medium' ? 'Media' : 'Baja'}
                                  </span>
                                  <span className="text-xs text-gray-500">{project.progress || 0}% completado</span>
                                </div>
                              </div>
                              {selectedProject?.project_id === project.project_id && (
                                <FiStar className="w-5 h-5 text-yellow-500 fill-current" />
                              )}
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>,
                  document.body
                )}
              </motion.div>

              {/* Estadísticas rápidas compactas */}
              {selectedProject && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg"
                >
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="font-medium">{stats.totalEpics}</span>
                    <span>épicas</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300"></div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium">{stats.totalStories}</span>
                    <span>historias</span>
                  </div>
                  <div className="w-px h-3 bg-gray-300"></div>
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span className="font-medium">{Math.round(stats.avgProgress)}%</span>
                    <span>progreso</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Acciones principales */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Selector de vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'kanban' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Vista Kanban"
                >
                  <FiGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  title="Vista Lista"
                >
                  <FiList className="w-4 h-4" />
                </button>
              </div>

              {/* Botón nueva épica */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleNewEpic}
                disabled={!selectedProject}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <FiPlus className="w-4 h-4" />
                Nueva Épica
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contenido principal */}
      <div className="flex-1 overflow-hidden">
        <PlanningBoard
          epics={getFilteredEpics()}
          stories={getFilteredStories()}
          users={users}
          projects={projects}
          selectedProject={selectedProject}
          selectedEpic={selectedEpic}
          setStories={setStories}
          onUpdateStory={handleUpdateStory}
          onCreateStory={handleCreateStory}
          onEpicSelect={handleEpicSelect}
          onEditEpic={handleEditEpicModal}
          onNewEpic={handleNewEpic}
          kanbanStates={kanbanStates}
          onEditKanbanStates={handleUpdateKanbanStates}
          filters={filters}
          onFilterChange={handleFilterChange}
          viewMode={viewMode}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Modal de épicas */}
      <EpicModal
        epic={editingEpic}
        projects={projects}
        selectedProject={selectedProject}
        isOpen={showEpicModal}
        onClose={() => {
          setShowEpicModal(false);
          setEditingEpic(null);
        }}
        onSave={handleSaveEpic}
      />

      {/* Notificación elegante */}
      {error && (
        <NotificationToast
          notification={{
            type: 'error',
            title: 'Error',
            message: error
          }}
          onClose={() => setError(null)}
        />
      )}

      {/* Notificación de éxito */}
      {successMessage && (
        <NotificationToast
          notification={{
            type: 'success',
            title: 'Éxito',
            message: successMessage
          }}
          onClose={() => setSuccessMessage(null)}
        />
      )}
    </div>
  );
}