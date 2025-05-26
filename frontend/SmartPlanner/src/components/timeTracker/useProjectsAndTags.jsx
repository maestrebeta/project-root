import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

// Hook reutilizable para obtener proyectos, tipos/categorías y clientes
export function useProjectsAndTags(entries = []) {
  const [projectOptions, setProjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Nuevos estados para sugerencias y status únicos
  const [suggestedProject, setSuggestedProject] = useState('');
  const [suggestedActivity, setSuggestedActivity] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    const fetchProjectsAndClients = async () => {
      try {
        // Obtener token de la sesión
        const session = localStorage.getItem('session');
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        const { token, user } = JSON.parse(session);
        if (!user?.organization_id) {
          throw new Error('El usuario no tiene una organización asignada');
        }

        // Cargar proyectos de la organización
        const projectsResponse = await fetch('http://localhost:8000/projects/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!projectsResponse.ok) {
          const errorData = await projectsResponse.text();
          throw new Error(errorData || 'Error al cargar los proyectos');
        }

        const projectsData = await projectsResponse.json();

        // Cargar clientes de la organización
        const clientsResponse = await fetch('http://localhost:8000/clients/', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!clientsResponse.ok) {
          const errorData = await clientsResponse.text();
          throw new Error(errorData || 'Error al cargar los clientes');
        }

        const clientsData = await clientsResponse.json();

        // Mapear proyectos con información de cliente
        const projectsWithClients = projectsData.map(project => {
          const client = clientsData.find(c => c.client_id === project.client_id);
          return {
            ...project,
            client_name: client ? client.name : 'Sin cliente'
          };
        });

        console.log('Proyectos cargados:', projectsWithClients);
        console.log('Clientes cargados:', clientsData);

        setProjectOptions(projectsWithClients);
        setClientOptions(clientsData);
        setLoading(false);

        // Tags (categorías)
        const tags = Array.from(
          new Set(
            projectsWithClients
              .map(p => p.project_type || p.type)
              .filter(Boolean)
          )
        );
        setTagOptions(tags);

        // Sugerencias: proyecto y actividad con mayor duración
        if (Array.isArray(entries) && entries.length > 0) {
          // Proyecto con mayor suma de duration_hours
          const projectDurations = {};
          const activityDurations = {};
          const statusSet = new Set();

          entries.forEach(e => {
            // Proyecto
            if (e.project_id) {
              projectDurations[e.project_id] = (projectDurations[e.project_id] || 0) + (e.duration_hours || 0);
            }
            // Actividad
            if (e.activity_type) {
              activityDurations[e.activity_type] = (activityDurations[e.activity_type] || 0) + (e.duration_hours || 0);
            }
            // Status
            if (e.status) statusSet.add(e.status);
          });

          // Proyecto sugerido
          const maxProject = Object.entries(projectDurations).sort((a, b) => b[1] - a[1])[0];
          setSuggestedProject(maxProject ? String(maxProject[0]) : '');

          // Actividad sugerida
          const maxActivity = Object.entries(activityDurations).sort((a, b) => b[1] - a[1])[0];
          setSuggestedActivity(maxActivity ? maxActivity[0] : '');

          // Status únicos
          setStatusOptions(Array.from(statusSet));
        } else {
          setSuggestedProject('');
          setSuggestedActivity('');
          setStatusOptions([]);
        }
      } catch (error) {
        console.error('Error al cargar proyectos y clientes:', error);
        
        // Manejar específicamente errores de autenticación
        if (error.message.includes('Unauthorized') || error.message.includes('token')) {
          setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          setError('Error de conexión. Por favor, verifica tu conexión de red o el servidor.');
        } else {
          setError(error.message || 'Error al cargar proyectos y clientes');
        }
        
        setLoading(false);
      }
    };

    // Solo cargar si hay una sesión de usuario
    if (user?.organization_id) {
      fetchProjectsAndClients();
    }
  }, [user?.organization_id]);

  // Helper: obtener cliente de un proyecto
  const getClientByProject = (projectId) => {
    const project = projectOptions.find(p => String(p.project_id) === String(projectId));
    return project ? project.client_name : 'Sin cliente';
  };

  // Mapa de project_id a project_name
  const projectIdToName = useMemo(() => {
    const map = {};
    projectOptions.forEach(p => {
      map[String(p.project_id)] = p.name;
    });
    return map;
  }, [projectOptions]);

  return {
    projects: projectOptions,
    clients: clientOptions,
    loading: loading,
    error: error,
    tagOptions,
    getClientByProject: (projectId) => {
      const project = projectOptions.find(p => String(p.project_id) === String(projectId));
      return project ? project.client_name : 'Sin cliente';
    },
    projectIdToName: (projectId) => {
      const project = projectOptions.find(p => String(p.project_id) === String(projectId));
      return project ? project.name : 'Proyecto no encontrado';
    },
    suggestedProject,
    suggestedActivity,
    statusOptions,
  };
}