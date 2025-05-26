import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from "../../context/AuthContext.jsx";

// Definir las categorías predeterminadas exactamente como en el backend
const DEFAULT_CATEGORIES = [
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'otro', label: 'Otro' }
];

// Estados predeterminados del sistema
const DEFAULT_STATES = ['pendiente', 'en_progreso', 'completada'];

// Estados predeterminados
const DEFAULT_TASK_STATES = {
  states: [
    {
      id: 'pendiente',
      label: 'Pendiente',
      icon: '🟡',
      color: 'yellow',
      isDefault: true
    },
    {
      id: 'en_progreso',
      label: 'En progreso',
      icon: '🔵',
      color: 'blue',
      isDefault: true
    },
    {
      id: 'completada',
      label: 'Completada',
      icon: '🟢',
      color: 'green',
      isDefault: true
    }
  ],
  default_state: 'pendiente',
  final_states: ['completada']
};

// Función para obtener la actividad con más horas del usuario
const getMostUsedActivity = (timeEntries) => {
  console.log('Calculando actividad más usada con entradas:', timeEntries);
  
  if (!timeEntries || timeEntries.length === 0) {
    console.log('No hay entradas, devolviendo desarrollo');
    return 'desarrollo';
  }

  const activityHours = {};
  
  timeEntries.forEach(entry => {
    if (entry.activity_type && entry.duration_hours && entry.duration_hours > 0) {
      const activity = entry.activity_type;
      const hours = parseFloat(entry.duration_hours);
      activityHours[activity] = (activityHours[activity] || 0) + hours;
      console.log(`Actividad: ${activity}, Horas: ${hours}, Total acumulado: ${activityHours[activity]}`);
    }
  });

  console.log('Horas por actividad:', activityHours);

  if (Object.keys(activityHours).length === 0) {
    console.log('No hay horas registradas, devolviendo desarrollo');
    return 'desarrollo';
  }

  // Encontrar la actividad con más horas
  const mostUsed = Object.entries(activityHours)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  console.log('Actividad más usada:', mostUsed);
  return mostUsed;
};

// Función para obtener el proyecto con más horas del usuario
const getMostUsedProject = (timeEntries, projects) => {
  console.log('Calculando proyecto más usado con entradas:', timeEntries, 'y proyectos:', projects);
  
  if (!projects || projects.length === 0) {
    console.log('No hay proyectos disponibles');
    return '';
  }

  if (!timeEntries || timeEntries.length === 0) {
    console.log('No hay entradas, devolviendo primer proyecto:', projects[0].project_id);
    return projects[0].project_id.toString();
  }

  const projectHours = {};
  
  timeEntries.forEach(entry => {
    if (entry.project_id && entry.duration_hours && entry.duration_hours > 0) {
      const projectId = entry.project_id.toString();
      const hours = parseFloat(entry.duration_hours);
      projectHours[projectId] = (projectHours[projectId] || 0) + hours;
      console.log(`Proyecto: ${projectId}, Horas: ${hours}, Total acumulado: ${projectHours[projectId]}`);
    }
  });

  console.log('Horas por proyecto:', projectHours);

  if (Object.keys(projectHours).length === 0) {
    console.log('No hay horas registradas, devolviendo primer proyecto:', projects[0].project_id);
    return projects[0].project_id.toString();
  }

  // Encontrar el proyecto con más horas
  const mostUsed = Object.entries(projectHours)
    .sort(([,a], [,b]) => b - a)[0][0];
  
  console.log('Proyecto más usado:', mostUsed);
  return mostUsed;
};

// Función para obtener el cliente del proyecto
const getClientForProject = (projectId, projects) => {
  if (!projectId || !projects || projects.length === 0) {
    return '';
  }
  
  const project = projects.find(p => p.project_id.toString() === projectId);
  const clientId = project?.client_id?.toString() || '';
  console.log(`Cliente para proyecto ${projectId}:`, clientId);
  return clientId;
};

// Hook principal
export const useProjectsAndTags = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userTimeEntries, setUserTimeEntries] = useState([]);

  // Cargar datos
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      console.log('Cargando datos para usuario:', session.user.user_id);

      // Cargar proyectos, clientes y entradas de tiempo en paralelo
      const [projectsResponse, clientsResponse, timeEntriesResponse] = await Promise.all([
        fetch('http://localhost:8000/projects/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        }),
        fetch('http://localhost:8000/clients/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        }),
        fetch('http://localhost:8000/time-entries/', {
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

      // Filtrar entradas de tiempo por usuario actual
      const userEntries = timeEntriesData.filter(entry => 
        entry.user_id === parseInt(session.user.user_id)
      );

      console.log('Datos cargados:');
      console.log('- Proyectos:', projectsData.length);
      console.log('- Clientes:', clientsData.length);
      console.log('- Entradas totales:', timeEntriesData.length);
      console.log('- Entradas del usuario:', userEntries.length);

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
    console.log('Recalculando valores sugeridos...');
    console.log('- Entradas del usuario:', userTimeEntries.length);
    console.log('- Proyectos disponibles:', projects.length);
    
    const mostUsedActivity = getMostUsedActivity(userTimeEntries);
    const mostUsedProject = getMostUsedProject(userTimeEntries, projects);
    const clientForProject = getClientForProject(mostUsedProject, projects);
    
    const result = {
      suggestedProject: mostUsedProject,
      suggestedActivity: mostUsedActivity,
      defaultClient: clientForProject,
      userHasEntries: userTimeEntries.length > 0
    };
    
    console.log('Valores sugeridos calculados:', result);
    return result;
  }, [userTimeEntries, projects]);

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

  // Usar solo los valores de las categorías predeterminadas
  const tagOptions = useMemo(() => {
    return DEFAULT_CATEGORIES.map(cat => cat.value);
  }, []);

  // Usar los estados predeterminados del sistema
  const statusOptions = useMemo(() => {
    return DEFAULT_STATES;
  }, []);

  return {
    projects: projectOptions,
    clients: clientOptions,
    loading,
    error,
    suggestedProject: suggestedValues.suggestedProject,
    suggestedActivity: suggestedValues.suggestedActivity,
    defaultClient: suggestedValues.defaultClient,
    userHasEntries: suggestedValues.userHasEntries,
    activityTypes: DEFAULT_CATEGORIES,
    projectIdToName,
    tagOptions,
    statusOptions,
    refresh: fetchData
  };
};

export const useTaskStates = () => {
  const { user } = useAuth();
  const [taskStates, setTaskStates] = useState(() => {
    const savedStates = localStorage.getItem('taskStates');
    return savedStates ? JSON.parse(savedStates) : DEFAULT_TASK_STATES;
  });

  // Cargar estados del backend
  useEffect(() => {
    const fetchTaskStates = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.token || !user?.organization_id) return;

        const response = await fetch(`http://localhost:8000/organizations/${user.organization_id}/task-states`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTaskStates(data);
          localStorage.setItem('taskStates', JSON.stringify(data));
        } else {
          console.error('Error al cargar estados:', await response.text());
        }
      } catch (error) {
        console.error('Error al cargar estados:', error);
      }
    };

    fetchTaskStates();
  }, [user?.organization_id]);

  // Actualizar estados en el backend y localmente
  const updateTaskStates = useCallback(async (newStates) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token || !user?.organization_id) return;

      const response = await fetch(`http://localhost:8000/organizations/${user.organization_id}/task-states`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(newStates)
      });

      if (response.ok) {
        setTaskStates(newStates);
        localStorage.setItem('taskStates', JSON.stringify(newStates));
      } else {
        console.error('Error al actualizar estados:', await response.text());
        // Recargar estados del backend en caso de error
        const currentStates = await fetch(`http://localhost:8000/organizations/${user.organization_id}/task-states`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        });
        if (currentStates.ok) {
          const data = await currentStates.json();
          setTaskStates(data);
          localStorage.setItem('taskStates', JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error('Error al actualizar estados:', error);
    }
  }, [user?.organization_id]);

  return { taskStates, updateTaskStates };
};