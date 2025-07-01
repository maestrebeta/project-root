import { useState, useEffect, useCallback } from 'react';
import projectProgressService from '../services/projectProgressService';

/**
 * Hook personalizado para manejar el progreso del proyecto
 * Proporciona funciones para obtener y actualizar el progreso basado en historias de usuario
 */
export const useProjectProgress = () => {
  const [projectProgress, setProjectProgress] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Cargar progreso de múltiples proyectos
   * @param {Array} projectIds - Array de IDs de proyectos
   */
  const loadMultipleProjectsProgress = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const progressData = await projectProgressService.getMultipleProjectsProgress(projectIds);
      setProjectProgress(progressData);
    } catch (err) {
      console.error('Error cargando progreso de proyectos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtener progreso de un proyecto específico
   * @param {number} projectId - ID del proyecto
   * @returns {Object} Datos del progreso del proyecto
   */
  const getProjectProgress = useCallback((projectId) => {
    return projectProgress[projectId] || {
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
  }, [projectProgress]);

  /**
   * Actualizar progreso de un proyecto específico
   * @param {number} projectId - ID del proyecto
   */
  const updateProjectProgress = useCallback(async (projectId) => {
    if (!projectId) return;
    
    setError(null);
    
    try {
      const progress = await projectProgressService.refreshProjectProgress(projectId);
      setProjectProgress(prev => ({
        ...prev,
        [projectId]: progress
      }));
      return progress;
    } catch (err) {
      console.error('Error actualizando progreso del proyecto:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Calcular progreso local basado en historias
   * @param {Array} stories - Array de historias de usuario
   * @returns {Object} Datos del progreso calculado
   */
  const calculateProgressFromStories = useCallback((stories) => {
    return projectProgressService.calculateProgressFromStories(stories);
  }, []);

  /**
   * Actualizar progreso de múltiples proyectos
   * @param {Array} projectIds - Array de IDs de proyectos
   */
  const updateMultipleProjectsProgress = useCallback(async (projectIds) => {
    if (!projectIds || projectIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const progressData = await projectProgressService.getMultipleProjectsProgress(projectIds);
      setProjectProgress(prev => ({
        ...prev,
        ...progressData
      }));
    } catch (err) {
      console.error('Error actualizando progreso de múltiples proyectos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Limpiar progreso de un proyecto específico
   * @param {number} projectId - ID del proyecto
   */
  const clearProjectProgress = useCallback((projectId) => {
    setProjectProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[projectId];
      return newProgress;
    });
  }, []);

  /**
   * Limpiar todo el progreso
   */
  const clearAllProgress = useCallback(() => {
    setProjectProgress({});
    setError(null);
  }, []);

  /**
   * Obtener el progreso promedio de todos los proyectos de un cliente
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} Progreso promedio de los proyectos del cliente
   */
  const getClientProjectsProgress = useCallback(async (clientId) => {
    if (!clientId) return null;
    
    setError(null);
    
    try {
      const progress = await projectProgressService.getClientProjectsProgress(clientId);
      return progress;
    } catch (err) {
      console.error('Error obteniendo progreso de proyectos del cliente:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  /**
   * Cargar progreso de múltiples clientes
   * @param {Array} clientIds - Array de IDs de clientes
   */
  const loadMultipleClientsProgress = useCallback(async (clientIds) => {
    if (!clientIds || clientIds.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const progressData = await projectProgressService.getMultipleClientsProgress(clientIds);
      // Aquí podrías almacenar el progreso de clientes si es necesario
      return progressData;
    } catch (err) {
      console.error('Error cargando progreso de clientes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calcular progreso promedio de proyectos de un cliente basado en datos locales
   * @param {Array} projects - Array de proyectos del cliente
   * @returns {Object} Progreso promedio calculado
   */
  const calculateClientProjectsProgress = useCallback((projects) => {
    return projectProgressService.calculateClientProjectsProgress(projects, projectProgress);
  }, [projectProgress]);

  return {
    projectProgress,
    loading,
    error,
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
};

export default useProjectProgress; 