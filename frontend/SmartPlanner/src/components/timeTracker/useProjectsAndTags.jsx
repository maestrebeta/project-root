import { useEffect, useState, useMemo } from 'react';

// Hook reutilizable para obtener proyectos, tipos/categorías y clientes
export function useProjectsAndTags() {
  const [projectOptions, setProjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [clientOptions, setClientOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nuevos estados para sugerencias y status únicos
  const [suggestedProject, setSuggestedProject] = useState('');
  const [suggestedActivity, setSuggestedActivity] = useState('');
  const [statusOptions, setStatusOptions] = useState([]);

  useEffect(() => {
    setLoading(true);

    // Fetch proyectos, clientes y time-entries en paralelo
    Promise.all([
      fetch('http://localhost:8000/projects/').then(res => res.json()),
      fetch('http://localhost:8000/clients/').then(res => res.json()),
      fetch('http://localhost:8000/time-entries/').then(res => res.json())
    ])
      .then(([projects, clients, entries]) => {
        // Proyectos
        setProjectOptions(
          projects.map(p => ({
            value: p.project_id || p.id || p.id_project || p.name,
            label: p.name,
            client_id: p.client_id,
            category: p.project_type || p.type || '',
            raw: p,
          }))
        );
        // Clientes
        setClientOptions(
          clients.map(c => ({
            value: c.client_id || c.id || c.name,
            label: c.name,
            raw: c,
          }))
        );
        // Tags (categorías)
        const tags = Array.from(
          new Set(
            projects
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
      })
      .catch(() => {
        setProjectOptions([]);
        setTagOptions([]);
        setClientOptions([]);
        setSuggestedProject('');
        setSuggestedActivity('');
        setStatusOptions([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Helper: obtener cliente de un proyecto
  const getClientByProject = (projectId) => {
    const project = projectOptions.find(p => String(p.value) === String(projectId));
    if (!project) return null;
    return clientOptions.find(c => String(c.value) === String(project.client_id)) || null;
  };

  // Mapa de project_id a project_name
  const projectIdToName = useMemo(() => {
    const map = {};
    projectOptions.forEach(p => {
      map[String(p.value)] = p.label;
    });
    return map;
  }, [projectOptions]);

  return {
    projectOptions,
    tagOptions,
    clientOptions,
    getClientByProject,
    projectIdToName,
    loading,
    suggestedProject,      // <-- Proyecto con mayor duración
    suggestedActivity,     // <-- Actividad con mayor duración
    statusOptions          // <-- Status únicos para filtros
  };
}