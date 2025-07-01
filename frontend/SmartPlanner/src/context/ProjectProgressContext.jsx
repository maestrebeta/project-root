import React, { createContext, useContext, useReducer, useCallback } from 'react';
import projectProgressService from '../services/projectProgressService';

// Contexto para el progreso del proyecto
const ProjectProgressContext = createContext();

// Tipos de acciones
const ACTIONS = {
  SET_PROJECT_PROGRESS: 'SET_PROJECT_PROGRESS',
  UPDATE_PROJECT_PROGRESS: 'UPDATE_PROJECT_PROGRESS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_PROJECT_PROGRESS: 'CLEAR_PROJECT_PROGRESS',
  CLEAR_ALL_PROGRESS: 'CLEAR_ALL_PROGRESS'
};

// Estado inicial
const initialState = {
  projectProgress: {},
  loading: false,
  error: null
};

// Reducer para manejar el estado
const projectProgressReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.SET_PROJECT_PROGRESS:
      return {
        ...state,
        projectProgress: action.payload,
        loading: false,
        error: null
      };
    
    case ACTIONS.UPDATE_PROJECT_PROGRESS:
      return {
        ...state,
        projectProgress: {
          ...state.projectProgress,
          [action.payload.projectId]: action.payload.progress
        },
        loading: false,
        error: null
      };
    
    case ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case ACTIONS.CLEAR_PROJECT_PROGRESS:
      const newProgress = { ...state.projectProgress };
      delete newProgress[action.payload];
      return {
        ...state,
        projectProgress: newProgress
      };
    
    case ACTIONS.CLEAR_ALL_PROGRESS:
      return {
        ...state,
        projectProgress: {},
        error: null
      };
    
    default:
      return state;
  }
};

// Provider del contexto
export const ProjectProgressProvider = ({ children }) => {
  const [state, dispatch] = useReducer(projectProgressReducer, initialState);

  // Cargar progreso de múltiples proyectos
  const loadMultipleProjectsProgress = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const progressData = await projectProgressService.getMultipleProjectsProgress(projectIds);
      dispatch({ type: ACTIONS.SET_PROJECT_PROGRESS, payload: progressData });
    } catch (error) {
      console.error('Error cargando progreso de proyectos:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Obtener progreso de un proyecto específico
  const getProjectProgress = useCallback((projectId) => {
    return state.projectProgress[projectId] || {
      total_stories: 0,
      completed_stories: 0,
      total_estimated_hours: 0,
      total_actual_hours: 0,
      progress_percentage: 0,
      velocity: 0,
      points_velocity: 0,
      status_distribution: {},
      stories_by_status: {
        backlog: 0,
        nuevo: 0,
        en_progreso: 0,
        listo_pruebas: 0,
        done: 0,
        blocked: 0
      }
    };
  }, [state.projectProgress]);

  // Actualizar progreso de un proyecto específico
  const updateProjectProgress = useCallback(async (projectId) => {
    if (!projectId) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const progress = await projectProgressService.refreshProjectProgress(projectId);
      dispatch({
        type: ACTIONS.UPDATE_PROJECT_PROGRESS,
        payload: { projectId, progress }
      });
      return progress;
    } catch (error) {
      console.error('Error actualizando progreso del proyecto:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Calcular progreso local basado en historias
  const calculateProgressFromStories = useCallback((stories) => {
    return projectProgressService.calculateProgressFromStories(stories);
  }, []);

  // Actualizar progreso de múltiples proyectos
  const updateMultipleProjectsProgress = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const progressData = await projectProgressService.getMultipleProjectsProgress(projectIds);
      dispatch({ type: ACTIONS.SET_PROJECT_PROGRESS, payload: progressData });
    } catch (error) {
      console.error('Error actualizando progreso de múltiples proyectos:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Limpiar progreso de un proyecto específico
  const clearProjectProgress = useCallback((projectId) => {
    dispatch({ type: ACTIONS.CLEAR_PROJECT_PROGRESS, payload: projectId });
  }, []);

  // Limpiar todo el progreso
  const clearAllProgress = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL_PROGRESS });
  }, []);

  // Obtener el progreso promedio de todos los proyectos de un cliente
  const getClientProjectsProgress = useCallback(async (clientId) => {
    if (!clientId) return null;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const progress = await projectProgressService.getClientProjectsProgress(clientId);
      return progress;
    } catch (error) {
      console.error('Error obteniendo progreso de proyectos del cliente:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Cargar progreso de múltiples clientes
  const loadMultipleClientsProgress = useCallback(async (clientIds) => {
    if (!clientIds || clientIds.length === 0) return;
    
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    
    try {
      const progressData = await projectProgressService.getMultipleClientsProgress(clientIds);
      return progressData;
    } catch (error) {
      console.error('Error cargando progreso de clientes:', error);
      dispatch({ type: ACTIONS.SET_ERROR, payload: error.message });
    }
  }, []);

  // Calcular progreso promedio de proyectos de un cliente basado en datos locales
  const calculateClientProjectsProgress = useCallback((projects) => {
    return projectProgressService.calculateClientProjectsProgress(projects, state.projectProgress);
  }, [state.projectProgress]);

  // Valor del contexto
  const value = {
    ...state,
    loadMultipleProjectsProgress,
    getProjectProgress,
    updateProjectProgress,
    calculateProgressFromStories,
    updateMultipleProjectsProgress,
    clearProjectProgress,
    clearAllProgress,
    getClientProjectsProgress,
    loadMultipleClientsProgress,
    calculateClientProjectsProgress
  };

  return (
    <ProjectProgressContext.Provider value={value}>
      {children}
    </ProjectProgressContext.Provider>
  );
};

// Hook para usar el contexto
export const useProjectProgress = () => {
  const context = useContext(ProjectProgressContext);
  if (!context) {
    throw new Error('useProjectProgress debe ser usado dentro de un ProjectProgressProvider');
  }
  return context;
};

export default ProjectProgressContext; 