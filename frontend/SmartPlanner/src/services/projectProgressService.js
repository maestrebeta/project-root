import { getAuthHeaders } from '../utils/authUtils';

const API_BASE_URL = 'http://localhost:8001';

/**
 * Servicio para manejar el progreso del proyecto basado en historias de usuario
 * Esta es la fuente de verdad para el progreso del proyecto
 */
class ProjectProgressService {
  /**
   * Obtener el progreso del proyecto basado en historias de usuario
   * @param {number} projectId - ID del proyecto
   * @returns {Promise<Object>} Datos del progreso del proyecto
   */
  async getProjectProgress(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}/progress`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al obtener progreso del proyecto');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener progreso del proyecto:', error);
      throw error;
    }
  }

  /**
   * Calcular progreso basado en historias de usuario (cálculo local)
   * @param {Array} stories - Array de historias de usuario
   * @returns {Object} Datos del progreso calculado
   */
  calculateProgressFromStories(stories) {
    if (!stories || stories.length === 0) {
      return {
        totalStories: 0,
        completedStories: 0,
        totalEstimatedHours: 0,
        totalActualHours: 0,
        progressPercentage: 0,
        velocity: 0,
        pointsVelocity: 0,
        statusDistribution: {},
        storiesByStatus: {
          backlog: 0,
          nuevo: 0,
          en_progreso: 0,
          listo_pruebas: 0,
          done: 0,
          blocked: 0
        }
      };
    }

    const totalStories = stories.length;
    const completedStories = stories.filter(story => story.status === 'done').length;
    const totalEstimatedHours = stories.reduce((sum, story) => sum + (Number(story.estimated_hours) || 0), 0);
    
    // Solo sumar actual_hours de historias completadas (estado 'done')
    const completedStoriesList = stories.filter(story => story.status === 'done');
    const totalActualHours = completedStoriesList.reduce((sum, story) => sum + (Number(story.actual_hours) || 0), 0);

    // Calcular progreso basado en historias completadas
    const progressPercentage = totalStories > 0 ? (completedStories / totalStories) * 100 : 0;
    const velocity = progressPercentage;
    const pointsVelocity = totalEstimatedHours > 0 ? (totalActualHours / totalEstimatedHours) * 100 : 0;

    // Distribución por estado
    const statusDistribution = {};
    const storiesByStatus = {
      backlog: 0,
      nuevo: 0,
      en_progreso: 0,
      listo_pruebas: 0,
      done: 0,
      blocked: 0
    };

    stories.forEach(story => {
      const status = story.status;
      statusDistribution[status] = (statusDistribution[status] || 0) + 1;
      
      if (storiesByStatus.hasOwnProperty(status)) {
        storiesByStatus[status]++;
      }
    });

    return {
      totalStories,
      completedStories,
      totalEstimatedHours: Math.round(totalEstimatedHours * 100) / 100,
      totalActualHours: Math.round(totalActualHours * 100) / 100,
      progressPercentage: Math.round(progressPercentage * 10) / 10,
      velocity: Math.round(velocity * 10) / 10,
      pointsVelocity: Math.round(pointsVelocity * 10) / 10,
      statusDistribution,
      storiesByStatus
    };
  }

  /**
   * Obtener progreso de múltiples proyectos
   * @param {Array} projectIds - Array de IDs de proyectos
   * @returns {Promise<Object>} Progreso de todos los proyectos
   */
  async getMultipleProjectsProgress(projectIds) {
    try {
      const progressPromises = projectIds.map(projectId => 
        this.getProjectProgress(projectId).catch(error => {
          console.error(`Error obteniendo progreso del proyecto ${projectId}:`, error);
          return {
            project_id: projectId,
            total_stories: 0,
            completed_stories: 0,
            total_estimated_hours: 0,
            total_actual_hours: 0,
            progress_percentage: 0,
            velocity: 0,
            points_velocity: 0,
            error: true
          };
        })
      );

      const results = await Promise.all(progressPromises);
      
      // Crear un mapa de progreso por proyecto
      const progressMap = {};
      results.forEach(result => {
        progressMap[result.project_id] = result;
      });

      return progressMap;
    } catch (error) {
      console.error('Error al obtener progreso de múltiples proyectos:', error);
      throw error;
    }
  }

  /**
   * Actualizar progreso del proyecto después de cambios en historias
   * @param {number} projectId - ID del proyecto
   * @returns {Promise<Object>} Progreso actualizado
   */
  async refreshProjectProgress(projectId) {
    return this.getProjectProgress(projectId);
  }

  /**
   * Obtener el progreso promedio de todos los proyectos de un cliente
   * @param {number} clientId - ID del cliente
   * @returns {Promise<Object>} Progreso promedio de los proyectos del cliente
   */
  async getClientProjectsProgress(clientId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/by-client/${clientId}/progress`, {
        method: 'GET',
        headers: getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al obtener progreso de proyectos del cliente');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al obtener progreso de proyectos del cliente:', error);
      throw error;
    }
  }

  /**
   * Obtener progreso de múltiples clientes
   * @param {Array} clientIds - Array de IDs de clientes
   * @returns {Promise<Object>} Progreso de todos los clientes
   */
  async getMultipleClientsProgress(clientIds) {
    try {
      const progressPromises = clientIds.map(clientId => 
        this.getClientProjectsProgress(clientId).catch(error => {
          console.error(`Error obteniendo progreso de proyectos del cliente ${clientId}:`, error);
          return {
            client_id: clientId,
            total_projects: 0,
            average_progress: 0,
            projects_progress: [],
            total_stories: 0,
            completed_stories: 0,
            total_estimated_hours: 0,
            total_actual_hours: 0,
            error: true
          };
        })
      );

      const results = await Promise.all(progressPromises);
      
      // Crear un mapa de progreso por cliente
      const progressMap = {};
      results.forEach(result => {
        progressMap[result.client_id] = result;
      });

      return progressMap;
    } catch (error) {
      console.error('Error al obtener progreso de múltiples clientes:', error);
      throw error;
    }
  }

  /**
   * Calcular progreso promedio de proyectos de un cliente basado en datos locales
   * @param {Array} projects - Array de proyectos del cliente
   * @param {Object} projectProgress - Objeto con progreso de proyectos por ID
   * @returns {Object} Progreso promedio calculado
   */
  calculateClientProjectsProgress(projects, projectProgress) {
    if (!projects || projects.length === 0) {
      return {
        total_projects: 0,
        average_progress: 0,
        total_stories: 0,
        completed_stories: 0,
        total_estimated_hours: 0,
        total_actual_hours: 0
      };
    }

    let totalProgress = 0;
    let totalStories = 0;
    let completedStories = 0;
    let totalEstimatedHours = 0;
    let totalActualHours = 0;
    let projectsWithProgress = 0;

    projects.forEach(project => {
      const progress = projectProgress[project.project_id];
      if (progress && !progress.error) {
        totalProgress += progress.progress_percentage || 0;
        totalStories += progress.total_stories || 0;
        completedStories += progress.completed_stories || 0;
        totalEstimatedHours += progress.total_estimated_hours || 0;
        totalActualHours += progress.total_actual_hours || 0;
        projectsWithProgress++;
      }
    });

    const averageProgress = projectsWithProgress > 0 ? totalProgress / projectsWithProgress : 0;

    return {
      total_projects: projects.length,
      average_progress: Math.round(averageProgress * 10) / 10,
      total_stories,
      completed_stories,
      total_estimated_hours: Math.round(totalEstimatedHours * 100) / 100,
      total_actual_hours: Math.round(totalActualHours * 100) / 100
    };
  }
}

// Exportar una instancia singleton
export const projectProgressService = new ProjectProgressService();
export default projectProgressService; 