import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "../../context/AuthContext.jsx";
import { useOrganizationStates } from '../../hooks/useOrganizationStates';

// Estados predeterminados
const DEFAULT_STATES = [1, 2, 3];

// Categorías de actividad predeterminadas
const DEFAULT_CATEGORIES = [
  { id: 1, name: 'Desarrollo', value: 'desarrollo' },
  { id: 2, name: 'BPO', value: 'bpo' },
  { id: 3, name: 'Soporte', value: 'soporte' },
  { id: 4, name: 'Reunión', value: 'reunion' },
  { id: 5, name: 'Capacitación', value: 'capacitacion' },
  { id: 6, name: 'Documentación', value: 'documentacion' },
  { id: 7, name: 'Otra', value: 'otro' }
];

// Estados predeterminados del sistema (fallback)
const DEFAULT_TASK_STATES = {
  states: [
    {
      id: 1,
      label: 'Pendiente',
      icon: '🔴',
      color: 'red',
      isDefault: true
    },
    {
      id: 2,
      label: 'En progreso',
      icon: '🔵',
      color: 'blue',
      isDefault: true
    },
    {
      id: 3,
      label: 'Completada',
      icon: '🟢',
      color: 'green',
      isDefault: true
    }
  ],
  default_state: 1,
  final_states: [3]
};

// Función para obtener la actividad con más horas del usuario
const getMostUsedActivity = (timeEntries, activityCategories) => {
  
  if (!timeEntries || timeEntries.length === 0) {
    return 'desarrollo';
  }

  const activityHours = {};
  
  timeEntries.forEach(entry => {
    if (entry.activity_type && entry.duration_hours && entry.duration_hours > 0) {
      const activity = entry.activity_type;
      const hours = parseFloat(entry.duration_hours);
      activityHours[activity] = (activityHours[activity] || 0) + hours;
    }
  });

  if (Object.keys(activityHours).length === 0) {
    return 'desarrollo';
  }

  // Encontrar la actividad con más horas
  const mostUsedId = Object.entries(activityHours)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  // Convertir ID a nombre de categoría
  if (activityCategories && activityCategories.length > 0) {
    const category = activityCategories.find(cat => cat.id === parseInt(mostUsedId));
    return category ? category.name : 'desarrollo';
  }
  
  // Fallback a mapeo hardcodeado si no hay categorías personalizadas
  const idToNameMap = {
    1: 'desarrollo',
    2: 'reunion',
    3: 'capacitacion',
    4: 'documentacion',
    5: 'soporte',
    6: 'testing',
    7: 'diseno',
    8: 'otra'
  };
  
  return idToNameMap[parseInt(mostUsedId)] || 'desarrollo';
};

// Función para obtener el proyecto con más horas del usuario
const getMostUsedProject = (timeEntries, projects) => {
  
  if (!projects || projects.length === 0) {
    return '';
  }

  if (!timeEntries || timeEntries.length === 0) {
    return projects[0].project_id.toString();
  }

  const projectHours = {};
  
  timeEntries.forEach(entry => {
    if (entry.project_id && entry.duration_hours && entry.duration_hours > 0) {
      const projectId = entry.project_id.toString();
      const hours = parseFloat(entry.duration_hours);
      projectHours[projectId] = (projectHours[projectId] || 0) + hours;
    }
  });

  if (Object.keys(projectHours).length === 0) {
    return projects[0].project_id.toString();
  }

  // Encontrar el proyecto con más horas
  const mostUsed = Object.entries(projectHours)
    .sort(([,a], [,b]) => b - a)[0][0];

  return mostUsed;
};

// Función para obtener el cliente del proyecto
const getClientForProject = (projectId, projects) => {
  if (!projectId || !projects || projects.length === 0) {
    return '';
  }
  
  const project = projects.find(p => p.project_id.toString() === projectId);
  const clientId = project?.client_id?.toString() || '';
  return clientId;
};

// Hook principal
export const useProjectsAndTags = () => {
  const { user } = useAuth();
  const { taskStates } = useOrganizationStates();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [activityCategories, setActivityCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [statesLoading, setStatesLoading] = useState(false);
  const [userTimeEntries, setUserTimeEntries] = useState([]);

  // Obtener categorías de actividad personalizables
  const {
    categories: activityCategoriesPersonalizable,
    loading: categoriesLoadingPersonalizable
  } = useActivityCategories();

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
          throw new Error('No hay sesión activa');
        }

      // Cargar proyectos, clientes y entradas de tiempo en paralelo
      const [projectsResponse, clientsResponse, timeEntriesResponse] = await Promise.all([
        fetch('http://localhost:8001/projects/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        }),
        fetch('http://localhost:8001/clients/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        }),
        fetch('http://localhost:8001/time-entries/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        })
      ]);

      const [projectsData, clientsData, timeEntriesData] = await Promise.all([
        projectsResponse.json(),
        clientsResponse.json(),
        timeEntriesResponse.json()
      ]);

      // Asegurar que timeEntriesData sea un array
      const timeEntriesArray = Array.isArray(timeEntriesData) ? timeEntriesData : [];

      // Filtrar entradas de tiempo por usuario actual
      const userEntries = timeEntriesArray.filter(entry => 
        entry.user_id === parseInt(session.user.user_id)
      );

      setProjects(projectsData);
      setClients(clientsData);
      setUserTimeEntries(userEntries);
      setError(null);

    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error.message);
    } finally {
        setLoading(false);
      }
  }, [user?.user_id]);

  // Efecto para cargar datos cuando cambie el usuario
  useEffect(() => {
    if (user?.user_id) {
      fetchData();
    }
  }, [fetchData, user?.user_id]);

  // Calcular valores sugeridos
  const suggestedValues = useMemo(() => {
    
    const mostUsedActivity = getMostUsedActivity(userTimeEntries, activityCategoriesPersonalizable);
    const mostUsedProject = getMostUsedProject(userTimeEntries, projects);
    const clientForProject = getClientForProject(mostUsedProject, projects);
    
    const result = {
      suggestedProject: mostUsedProject,
      suggestedActivity: mostUsedActivity,
      defaultClient: clientForProject,
      userHasEntries: userTimeEntries.length > 0
    };
    
    return result;
  }, [userTimeEntries, projects, activityCategoriesPersonalizable]);

  // Memoizar datos derivados
  const projectOptions = useMemo(() => {
    return projects.map(project => ({
      project_id: project.project_id.toString(),
      client_id: project.client_id ? project.client_id.toString() : '',
      name: project.name || '',
      client_name: clients.find(c => c.client_id === project.client_id)?.name || 'Sin cliente'
    }));
  }, [projects, clients]);

  const clientOptions = useMemo(() => {
    return clients.map(client => ({
      client_id: client.client_id.toString(),
      name: client.name || ''
    }));
  }, [clients]);

  // Memoizar el mapeo de ID a nombre de proyecto
  const projectIdToName = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[String(project.project_id)] = project.name;
      return acc;
    }, {});
  }, [projects]);

  // Usar las categorías de actividad personalizables
  const tagOptions = useMemo(() => {
    if (activityCategoriesPersonalizable && activityCategoriesPersonalizable.length > 0) {
      return activityCategoriesPersonalizable.map(cat => cat.name);
    }
    // Fallback a categorías predeterminadas si no hay personalizadas
    return DEFAULT_CATEGORIES.map(cat => cat.name);
  }, [activityCategoriesPersonalizable]);

  // Usar los estados de la organización si están disponibles, sino usar los predeterminados
  const statusOptions = useMemo(() => {
    if (taskStates?.states && Array.isArray(taskStates.states)) {
      return taskStates.states.map(state => state.id);
    }
    return DEFAULT_STATES;
  }, [taskStates?.states]);

  return {
    projects: projectOptions,
    clients: clientOptions,
    loading: loading || categoriesLoadingPersonalizable || statesLoading,
    error,
    suggestedProject: suggestedValues.suggestedProject,
    suggestedActivity: suggestedValues.suggestedActivity,
    defaultClient: suggestedValues.defaultClient,
    userHasEntries: suggestedValues.userHasEntries,
    activityTypes: activityCategoriesPersonalizable || DEFAULT_CATEGORIES,
    projectIdToName,
    tagOptions,
    statusOptions,
    refresh: fetchData
  };
};

export const useActivityCategories = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.organization_id) {
      fetchActivityCategories();
    }
  }, [user?.organization_id]);

  const fetchActivityCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`http://localhost:8001/organizations/${user.organization_id}/activity-categories`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.activity_categories || []);
      } else {
        throw new Error('Error al cargar las categorías de actividad');
      }
    } catch (err) {
      console.error('Error fetching activity categories:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    fetchActivityCategories();
  };

  return {
    categories,
    loading,
    error,
    refresh
  };
};