const API_BASE_URL = 'http://localhost:8001';

const getAuthHeaders = () => {
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      throw new Error('No hay sesión activa');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`
    };
  } catch (error) {
    throw new Error('Error de autenticación');
  }
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
    throw new Error(errorData.detail || `Error ${response.status}`);
  }
  return response.json();
};

export const epicService = {
  async getEpics() {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener épicas:', error);
      throw error;
    }
  },

  async getEpicsByProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/project/${projectId}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener épicas del proyecto:', error);
      throw error;
    }
  },

  async createEpic(epicData) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(epicData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al crear épica:', error);
      throw error;
    }
  },

  async updateEpic(epicId, epicData) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/${epicId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(epicData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al actualizar épica:', error);
      throw error;
    }
  },

  async deleteEpic(epicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/${epicId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al eliminar épica:', error);
      throw error;
    }
  },

  async getEpicStats(epicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/${epicId}/stats`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de épica:', error);
      throw error;
    }
  }
};

export const userStoryService = {
  async getUserStories() {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener historias de usuario:', error);
      throw error;
    }
  },

  async getUserStoriesByEpic(epicId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/epic/${epicId}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener historias de la épica:', error);
      throw error;
    }
  },

  async getUserStoriesByProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/project/${projectId}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener historias del proyecto:', error);
      throw error;
    }
  },

  async createUserStory(storyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(storyData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al crear historia de usuario:', error);
      throw error;
    }
  },

  async updateUserStory(storyId, storyData) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/${storyId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(storyData)
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al actualizar historia de usuario:', error);
      throw error;
    }
  },

  async deleteUserStory(storyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/stories/${storyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al eliminar historia de usuario:', error);
      throw error;
    }
  }
};

export const projectService = {
  async getProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener proyectos:', error);
      throw error;
    }
  },

  async getProject(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener proyecto:', error);
      throw error;
    }
  },

  async getProjectStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/stats`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de proyectos:', error);
      throw error;
    }
  },

  async getProjectTimeAnalytics() {
    try {
      const response = await fetch(`${API_BASE_URL}/projects/time-analytics`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener analíticas de tiempo:', error);
      throw error;
    }
  }
};

export const userService = {
  async getUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/users/`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }
};

export const planningStatsService = {
  async getPlanningStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/planning/stats`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de planificación:', error);
      throw error;
    }
  },

  async getProjectPlanningStats(projectId) {
    try {
      const response = await fetch(`${API_BASE_URL}/epics/planning/project/${projectId}`, {
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('Error al obtener estadísticas de planificación del proyecto:', error);
      throw error;
    }
  }
};

export const planningService = {
  async loadPlanningData() {
    try {
      const [projects, epics, userStories, users, planningStats] = await Promise.all([
        projectService.getProjects(),
        epicService.getEpics(),
        userStoryService.getUserStories(),
        userService.getUsers(),
        planningStatsService.getPlanningStats()
      ]);

      return {
        projects,
        epics,
        userStories,
        users,
        planningStats,
        success: true
      };
    } catch (error) {
      console.error('Error al cargar datos de planificación:', error);
      return {
        projects: [],
        epics: [],
        userStories: [],
        users: [],
        planningStats: null,
        success: false,
        error: error.message
      };
    }
  },

  async loadProjectPlanningData(projectId) {
    try {
      const [project, epics, userStories, planningStats] = await Promise.all([
        projectService.getProject(projectId),
        epicService.getEpicsByProject(projectId),
        userStoryService.getUserStoriesByProject(projectId),
        planningStatsService.getProjectPlanningStats(projectId)
      ]);

      return {
        project,
        epics,
        userStories,
        planningStats,
        success: true
      };
    } catch (error) {
      console.error('Error al cargar datos de planificación del proyecto:', error);
      return {
        project: null,
        epics: [],
        userStories: [],
        planningStats: null,
        success: false,
        error: error.message
      };
    }
  },

  async updateEpicProgress(epicId) {
    try {
      const stories = await userStoryService.getUserStoriesByEpic(epicId);
      
      if (stories.length === 0) return;

      const completedStories = stories.filter(story => story.status === 'done').length;
      const progressPercentage = Math.round((completedStories / stories.length) * 100);

      await epicService.updateEpic(epicId, {
        progress_percentage: progressPercentage
      });

      return { success: true, progress: progressPercentage };
    } catch (error) {
      console.error('Error al actualizar progreso de épica:', error);
      return { success: false, error: error.message };
    }
  },

  async moveUserStory(storyId, newStatus) {
    try {
      const updatedStory = await userStoryService.updateUserStory(storyId, {
        status: newStatus
      });

      if (updatedStory.epic_id) {
        await this.updateEpicProgress(updatedStory.epic_id);
      }

      return { success: true, story: updatedStory };
    } catch (error) {
      console.error('Error al mover historia de usuario:', error);
      return { success: false, error: error.message };
    }
  }
};

export default planningService; 