import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProjectModal from './ProjectModal';

export default function ProjectManagement() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  
  // Estados principales
  const [stats, setStats] = useState({
    total_projects: { value: '0', change: '0' },
    active_projects: { value: '0', change: '0' },
    completed_projects: { value: '0', change: '0' },
    overdue_projects: { value: '0', change: '0' }
  });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [timeAnalytics, setTimeAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Estados para sorting y filtrado - NIVEL BILL GATES
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [clientFilter, setClientFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Estados para selección múltiple y eliminación masiva (solo super_user)
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Verificar si el usuario es super_user
  const isSuperUser = user?.role === 'super_user';

  // 🚀 FUNCIONES ÉPICAS PARA SELECCIÓN MÚLTIPLE Y ELIMINACIÓN MASIVA - SOLO SUPER_USER
  
  const toggleProjectSelection = (projectId) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const selectAllProjects = () => {
    const currentProjects = activeTab === 'analytics' 
      ? getSortedAndFilteredProjects() 
      : getFilteredProjectsList();
    
    const allIds = new Set(currentProjects.map(p => p.project_id));
    setSelectedProjects(allIds);
  };

  const clearSelection = () => {
    setSelectedProjects(new Set());
    setIsSelectionMode(false);
  };

  const handleBulkDelete = async () => {
    if (selectedProjects.size === 0) {
      setError('No hay proyectos seleccionados para eliminar');
      setTimeout(() => setError(''), 3000);
      return;
    }

    const projectIds = Array.from(selectedProjects);
    const projectNames = projectIds.map(id => {
      const project = projects.find(p => p.project_id === id) || 
                     timeAnalytics?.projects?.find(p => p.project_id === id);
      return project?.name || `ID: ${id}`;
    }).join(', ');

    const confirmDelete = window.confirm(
      `🚨 ELIMINACIÓN MASIVA DE PROYECTOS 🚨\n\n` +
      `¿Estás ABSOLUTAMENTE SEGURO de que deseas eliminar ${selectedProjects.size} proyecto(s)?\n\n` +
      `Proyectos a eliminar:\n${projectNames}\n\n` +
      `⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️\n\n` +
      `Se eliminarán:\n` +
      `• Todos los registros de tiempo asociados\n` +
      `• Toda la información de los proyectos\n` +
      `• Todas las relaciones con clientes\n\n` +
      `¿Continuar con la eliminación masiva?`
    );

    if (!confirmDelete) {
      return;
    }

    setBulkDeleteLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:8000/projects/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(projectIds)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en eliminación masiva');
      }

      const result = await response.json();
      
      // Mostrar resultado detallado
      if (result.deleted_count > 0) {
        setSuccessMessage(`${result.deleted_count} proyectos eliminados exitosamente`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }

      if (result.failed_count > 0) {
        setError(`${result.failed_count} proyectos no pudieron ser eliminados`);
        setTimeout(() => setError(''), 8000);
      }

      // Limpiar selección y recargar datos
      clearSelection();
      await fetchAllData();

    } catch (err) {
      console.error('Error en eliminación masiva:', err);
      setError(`Error en eliminación masiva: ${err.message}`);
      setTimeout(() => setError(''), 8000);
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  // Limpiar selección al cambiar de pestaña
  useEffect(() => {
    if (isSelectionMode) {
      clearSelection();
    }
  }, [activeTab]);

  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchAllData();
    }
  }, [isAuthenticated, user]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchProjects(),
        fetchClients(),
        fetchTimeAnalytics()
      ]);
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8000/projects/stats', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8000/projects/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchClients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8000/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchTimeAnalytics = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8000/projects/time-analytics', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTimeAnalytics(data);
      }
    } catch (err) {
      console.error('Error fetching time analytics:', err);
    }
  };

  const handleCreateProject = () => {
    setSelectedProject(null);
    setShowModal(true);
  };

  const handleEditProject = async (project) => {
    console.log('handleEditProject called with:', project);
    
    try {
      // Si tenemos el proyecto completo, usarlo directamente
      if (project && project.description !== undefined && project.code !== undefined) {
        console.log('Using complete project data:', project);
        setSelectedProject(project);
        setShowModal(true);
        return;
      }
      
      // Si no tenemos datos completos, buscar en la lista local primero
      let fullProject = project;
      if (projects.length > 0) {
        const foundProject = projects.find(p => p.project_id === project.project_id);
        if (foundProject) {
          fullProject = foundProject;
          console.log('Found full project in local list:', fullProject);
          setSelectedProject(fullProject);
          setShowModal(true);
          return;
        }
      }
      
      // Si aún no tenemos datos completos, obtener del backend
      console.log('Fetching complete project data from backend...');
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8000/projects/${project.project_id}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const completeProject = await response.json();
        console.log('Fetched complete project from backend:', completeProject);
        setSelectedProject(completeProject);
        setShowModal(true);
      } else {
        console.error('Failed to fetch project details');
        // Usar datos parciales como fallback
        setSelectedProject(project);
        setShowModal(true);
      }
    } catch (error) {
      console.error('Error in handleEditProject:', error);
      // Usar datos parciales como fallback
      setSelectedProject(project);
      setShowModal(true);
    }
  };

  const handleSaveProject = async () => {
    try {
      setError(''); // Limpiar errores previos
      setShowModal(false);
      await fetchAllData(); // Recargar todos los datos
      
      // Mostrar mensaje de éxito
      const message = selectedProject ? 'Proyecto actualizado exitosamente' : 'Proyecto creado exitosamente';
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error reloading data:', err);
      setError('Error al recargar los datos');
    }
  };

  const handleDeleteProject = async (project) => {
    console.log('handleDeleteProject called with:', project);
    
    // Confirmar eliminación
    const projectName = project.name || 'este proyecto';
    const projectId = project.project_id;
    
    console.log('Project ID:', projectId, 'Project Name:', projectName);
    
    if (!projectId) {
      const errorMsg = 'Error: No se pudo identificar el proyecto a eliminar';
      console.error(errorMsg);
      setError(errorMsg);
      setTimeout(() => setError(''), 5000);
      return;
    }
    
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar el proyecto "${projectName}"?\n\nEsta acción no se puede deshacer y eliminará:\n- Todos los registros de tiempo asociados\n- Toda la información del proyecto\n\n¿Continuar?`
    );
    
    if (!confirmDelete) {
      console.log('Delete cancelled by user');
      return;
    }

    try {
      setError(''); // Limpiar errores previos
      setSuccessMessage(''); // Limpiar mensajes de éxito previos
      
      console.log('Attempting to delete project with ID:', projectId);
      
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`http://localhost:8000/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        console.log('Project deleted successfully');
        // Recargar todos los datos
        await fetchAllData();
        
        // Mostrar notificación temporal de éxito
        setSuccessMessage(`Proyecto "${projectName}" eliminado exitosamente`);
        setTimeout(() => setSuccessMessage(''), 4000); // Limpiar después de 4 segundos
      } else {
        const errorData = await response.json();
        console.error('Delete failed with error:', errorData);
        throw new Error(errorData.detail || 'Error al eliminar el proyecto');
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(`Error al eliminar el proyecto: ${err.message}`);
      setTimeout(() => setError(''), 5000); // Limpiar error después de 5 segundos
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'registered_initiative': 'bg-blue-100 text-blue-800',
      'in_quotation': 'bg-blue-100 text-blue-800',
      'proposal_approved': 'bg-green-100 text-green-800',
      'in_planning': 'bg-green-100 text-green-800',
      'in_progress': 'bg-indigo-100 text-indigo-800',
      'at_risk': 'bg-yellow-100 text-yellow-800',
      'suspended': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'canceled': 'bg-red-100 text-red-800',
      'post_delivery_support': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'registered_initiative': 'Iniciativa Registrada',
      'in_quotation': 'En Cotización',
      'proposal_approved': 'Propuesta Aprobada',
      'in_planning': 'En Planeación',
      'in_progress': 'En Curso',
      'at_risk': 'En Riesgo',
      'suspended': 'Suspendido',
      'completed': 'Completado',
      'canceled': 'Cancelado',
      'post_delivery_support': 'Soporte Post-Entrega'
    };
    return labels[status] || status;
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency === 'En tiempo') return 'text-green-600';
    if (efficiency === 'Ligeramente retrasado') return 'text-yellow-600';
    if (efficiency === 'Retrasado') return 'text-red-600';
    return 'text-gray-600';
  };

  // 🚀 FUNCIONES ÉPICAS DE SORTING Y FILTRADO - NIVEL BILL GATES
  
  // Mapeo de términos en español a inglés para filtros inteligentes
  const getSearchTermsMapping = (searchTerm) => {
    const lowerTerm = searchTerm.toLowerCase();
    const mappings = {
      // Estados en español -> inglés
      'iniciativa registrada': 'registered_initiative',
      'en cotización': 'in_quotation',
      'cotización': 'in_quotation',
      'propuesta aprobada': 'proposal_approved',
      'aprobada': 'proposal_approved',
      'en planeación': 'in_planning',
      'planeación': 'in_planning',
      'en curso': 'in_progress',
      'curso': 'in_progress',
      'progreso': 'in_progress',
      'en riesgo': 'at_risk',
      'riesgo': 'at_risk',
      'suspendido': 'suspended',
      'completado': 'completed',
      'finalizado': 'completed',
      'terminado': 'completed',
      'cancelado': 'canceled',
      'soporte post-entrega': 'post_delivery_support',
      'post-entrega': 'post_delivery_support',
      
      // Eficiencia
      'retrasado': 'Retrasado',
      'en tiempo': 'En tiempo',
      'ligeramente retrasado': 'Ligeramente retrasado',
      
      // Tipos de proyecto
      'desarrollo': 'development',
      'soporte': 'support',
      'reunión': 'meeting',
      'capacitación': 'training',
      'otro': 'other'
    };
    
    return mappings[lowerTerm] || searchTerm;
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredProjects = () => {
    if (!timeAnalytics?.projects) return [];
    
    let filteredProjects = [...timeAnalytics.projects];
    
    // Filtro por cliente
    if (clientFilter) {
      filteredProjects = filteredProjects.filter(project => {
        const client = clients.find(c => c.client_id === project.client_id);
        return client?.name.toLowerCase().includes(clientFilter.toLowerCase());
      });
    }
    
    // Filtro por búsqueda general con mapeo inteligente
    if (searchFilter) {
      const mappedTerm = getSearchTermsMapping(searchFilter);
      const lowerSearchFilter = searchFilter.toLowerCase();
      const lowerMappedTerm = mappedTerm.toLowerCase();
      
      filteredProjects = filteredProjects.filter(project => {
        // Buscar en nombre del proyecto
        const nameMatch = project.name.toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en estado (tanto en inglés como en la versión traducida)
        const statusMatch = project.status.toLowerCase().includes(lowerMappedTerm) ||
                           getStatusLabel(project.status).toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en código del proyecto si existe
        const codeMatch = project.code && project.code.toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en descripción si existe
        const descriptionMatch = project.description && 
                                project.description.toLowerCase().includes(lowerSearchFilter);
        
        return nameMatch || statusMatch || codeMatch || descriptionMatch;
      });
    }
    
    // Sorting épico
    if (sortConfig.key) {
      filteredProjects.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        // Manejo especial para diferentes tipos de datos
        if (sortConfig.key === 'name') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        } else if (sortConfig.key === 'total_hours' || sortConfig.key === 'progress_percentage' || sortConfig.key === 'unique_users') {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else if (sortConfig.key === 'efficiency') {
          // Orden personalizado para eficiencia
          const efficiencyOrder = { 'En tiempo': 3, 'Ligeramente retrasado': 2, 'Retrasado': 1 };
          aValue = efficiencyOrder[aValue] || 0;
          bValue = efficiencyOrder[bValue] || 0;
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return filteredProjects;
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortConfig.direction === 'asc' ? (
      <svg className="w-4 h-4 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Función para filtrar proyectos en la pestaña de Lista de Proyectos
  const getFilteredProjectsList = () => {
    if (!projects) return [];
    
    let filteredProjects = [...projects];
    
    // Filtro por cliente
    if (clientFilter) {
      filteredProjects = filteredProjects.filter(project => {
        const client = clients.find(c => c.client_id === project.client_id);
        return client?.name.toLowerCase().includes(clientFilter.toLowerCase());
      });
    }
    
    // Filtro por búsqueda general con mapeo inteligente
    if (searchFilter) {
      const mappedTerm = getSearchTermsMapping(searchFilter);
      const lowerSearchFilter = searchFilter.toLowerCase();
      const lowerMappedTerm = mappedTerm.toLowerCase();
      
      filteredProjects = filteredProjects.filter(project => {
        // Buscar en nombre del proyecto
        const nameMatch = project.name.toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en estado (tanto en inglés como en la versión traducida)
        const statusMatch = project.status.toLowerCase().includes(lowerMappedTerm) ||
                           getStatusLabel(project.status).toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en código del proyecto si existe
        const codeMatch = project.code && project.code.toLowerCase().includes(lowerSearchFilter);
        
        // Buscar en descripción si existe
        const descriptionMatch = project.description && 
                                project.description.toLowerCase().includes(lowerSearchFilter);
        
        return nameMatch || statusMatch || codeMatch || descriptionMatch;
      });
    }
    
    return filteredProjects;
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Header skeleton */}
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-3">
              <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded-lg w-80 animate-pulse"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-96 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gradient-to-r from-blue-300 to-blue-200 rounded-lg w-40 animate-pulse"></div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse"></div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-200 rounded-xl animate-pulse"></div>
                    <div className="w-16 h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-24 animate-pulse"></div>
                    <div className="h-8 bg-gradient-to-r from-gray-300 to-gray-200 rounded w-16 animate-pulse"></div>
                    <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-32 animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-spin">
                <div className="w-6 h-6 bg-white rounded-full m-1"></div>
              </div>
              <span className="text-gray-600 font-medium">Cargando centro de proyectos...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${theme.PRIMARY_COLOR_CLASS}`}>
            Centro de Proyectos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestión integral y analíticas de proyectos de la organización
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Controles de selección múltiple - Solo para super_user */}
          {isSuperUser && (
            <>
              {!isSelectionMode ? (
                <button
                  onClick={() => setIsSelectionMode(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Selección Múltiple</span>
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 text-purple-800 px-4 py-3 rounded-lg font-medium flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedProjects.size} seleccionados</span>
                  </div>
                  <button
                    onClick={selectAllProjects}
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-300 font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Seleccionar Todo</span>
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedProjects.size === 0 || bulkDeleteLoading}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center space-x-2"
                  >
                    {bulkDeleteLoading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Eliminando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Eliminar</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={clearSelection}
                    className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-300 font-medium flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancelar</span>
                  </button>
                </div>
              )}
            </>
          )}
          <button
            onClick={handleCreateProject}
            className={`px-6 py-3 ${theme.PRIMARY_BUTTON_CLASS} rounded-lg transition-colors font-medium flex items-center space-x-2`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* 🚀 INDICADOR ÉPICO DE FILTROS ACTIVOS - NIVEL BILL GATES */}
      {(searchFilter || clientFilter || sortConfig.key) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl shadow-lg animate-pulse">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-800">🎯 Filtros Activos</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {searchFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 animate-pulse">
                      🔍 "{searchFilter}"
                    </span>
                  )}
                  {clientFilter && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse" style={{ animationDelay: '0.1s' }}>
                      🏢 {clientFilter}
                    </span>
                  )}
                  {sortConfig.key && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 animate-pulse" style={{ animationDelay: '0.2s' }}>
                      📊 {sortConfig.key} ({sortConfig.direction === 'asc' ? '↑' : '↓'})
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setSearchFilter('');
                setClientFilter('');
                setSortConfig({ key: null, direction: 'asc' });
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Limpiar Todo
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Proyectos */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-5 shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          {/* Elementos flotantes animados */}
          <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/5 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white animate-pulse group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                </svg>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-110 ${
                stats.total_projects.change.startsWith('+') ? 'bg-green-100 text-green-800 animate-pulse' : 
                stats.total_projects.change.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-white/20 text-white'
              }`}>
                {stats.total_projects.change}
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1 group-hover:text-white transition-colors duration-300">Total Proyectos</p>
              <p className="text-2xl font-bold text-white mb-1 transform-gpu group-hover:scale-110 transition-transform duration-300 origin-left">{stats.total_projects.value}</p>
              <p className="text-blue-200 text-xs group-hover:text-blue-100 transition-colors duration-300">En la organización</p>
            </div>
          </div>
          {/* Efecto de brillo en hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {/* Proyectos Activos */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-5 shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          {/* Elementos flotantes animados */}
          <div className="absolute top-0 right-0 w-12 h-12 bg-white/5 rounded-full animate-ping"></div>
          <div className="absolute bottom-2 left-2 w-8 h-8 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-110 ${
                stats.active_projects.change.startsWith('+') ? 'bg-green-100 text-green-800 animate-pulse' : 
                stats.active_projects.change.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-white/20 text-white'
              }`}>
                {stats.active_projects.change}
              </div>
            </div>
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1 group-hover:text-white transition-colors duration-300">Activos</p>
              <p className="text-2xl font-bold text-white mb-1 transform-gpu group-hover:scale-110 transition-transform duration-300 origin-left">{stats.active_projects.value}</p>
              <p className="text-blue-200 text-xs group-hover:text-blue-100 transition-colors duration-300">En desarrollo</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {/* Completados */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-5 shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          {/* Elementos flotantes animados */}
          <div className="absolute top-1 left-1 w-6 h-6 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-0 right-0 w-14 h-14 bg-white/5 rounded-full animate-pulse" style={{ animationDelay: '1.5s' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white group-hover:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-110 ${
                stats.completed_projects.change.startsWith('+') ? 'bg-green-100 text-green-800 animate-pulse' : 
                stats.completed_projects.change.startsWith('-') ? 'bg-red-100 text-red-800' : 'bg-white/20 text-white'
              }`}>
                {stats.completed_projects.change}
              </div>
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium mb-1 group-hover:text-white transition-colors duration-300">Completados</p>
              <p className="text-2xl font-bold text-white mb-1 transform-gpu group-hover:scale-110 transition-transform duration-300 origin-left">{stats.completed_projects.value}</p>
              <p className="text-green-200 text-xs group-hover:text-green-100 transition-colors duration-300">Finalizados</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>

        {/* Atrasados */}
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-5 shadow-md hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          {/* Elementos flotantes animados */}
          <div className="absolute top-2 right-2 w-10 h-10 bg-white/5 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute bottom-1 left-3 w-4 h-4 bg-white/10 rounded-full animate-ping" style={{ animationDelay: '2s' }}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                <svg className="w-5 h-5 text-white group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 group-hover:scale-110 ${
                stats.overdue_projects.change.startsWith('+') ? 'bg-red-100 text-red-800 animate-pulse' : 
                stats.overdue_projects.change.startsWith('-') ? 'bg-green-100 text-green-800' : 'bg-white/20 text-white'
              }`}>
                {stats.overdue_projects.change}
              </div>
            </div>
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1 group-hover:text-white transition-colors duration-300">Atrasados</p>
              <p className="text-2xl font-bold text-white mb-1 transform-gpu group-hover:scale-110 transition-transform duration-300 origin-left">{stats.overdue_projects.value}</p>
              <p className="text-orange-200 text-xs group-hover:text-orange-100 transition-colors duration-300">Requieren atención</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        <div className="relative z-10 border-b border-gray-200">
          <nav className="flex space-x-2 px-6 py-4">
            {[
              { id: 'overview', label: 'Resumen Ejecutivo', icon: '📊' },
              { id: 'analytics', label: 'Analíticas de Tiempo', icon: '📈' },
              { id: 'projects', label: 'Lista de Proyectos', icon: '📋' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 z-20
                  border-2 focus:ring-4 focus:ring-blue-200 focus:outline-none
                  ${activeTab === tab.id
                    ? `${theme.PRIMARY_BG_CLASS} ${theme.PRIMARY_FONT_CLASS} border-white shadow-lg z-30`
                    : 'text-gray-600 hover:bg-gray-100 border-transparent z-10'
                  }
                `}
                style={{ minWidth: '180px' }}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span className="font-semibold">{tab.label}</span>
                </div>
                {/* Indicador visual para tab activo */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="relative z-10 p-6">
          {/* Pestaña Resumen Ejecutivo */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Verificar si hay datos disponibles */}
              {timeAnalytics && timeAnalytics.projects && timeAnalytics.projects.length > 0 ? (
                <>
                  {/* Métricas principales del resumen */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total de proyectos activos */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/60 p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-gray-50/30"></div>
                      <div className="absolute -top-3 -right-3 w-16 h-16 bg-slate-100/30 rounded-full"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2z" />
                            </svg>
                          </div>
              </div>
              <div>
                          <p className="text-slate-600 text-sm font-medium mb-1 group-hover:text-slate-700 transition-colors duration-300">Proyectos Activos</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1 transform-gpu group-hover:scale-105 transition-transform duration-300 origin-left">
                            {timeAnalytics.projects.filter(p => ['in_progress', 'in_planning', 'at_risk'].includes(p.status)).length}
                          </p>
                          <p className="text-slate-500 text-xs group-hover:text-slate-600 transition-colors duration-300">En desarrollo</p>
              </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Horas totales registradas */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/60 p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 to-green-50/20"></div>
                      <div className="absolute top-0 right-0 w-14 h-14 bg-emerald-100/20 rounded-full"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-emerald-700 text-sm font-medium mb-1 group-hover:text-emerald-800 transition-colors duration-300">Horas Registradas</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1 transform-gpu group-hover:scale-105 transition-transform duration-300 origin-left">
                            {timeAnalytics.projects.reduce((sum, p) => sum + (p.total_hours || 0), 0)}h
                          </p>
                          <p className="text-emerald-600 text-xs group-hover:text-emerald-700 transition-colors duration-300">Total acumulado</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Eficiencia promedio */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/60 p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50/40 to-yellow-50/20"></div>
                      <div className="absolute bottom-1 left-1 w-10 h-10 bg-amber-100/20 rounded-full"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-amber-700 text-sm font-medium mb-1 group-hover:text-amber-800 transition-colors duration-300">Eficiencia</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1 transform-gpu group-hover:scale-105 transition-transform duration-300 origin-left">
                            {Math.round((timeAnalytics.projects.filter(p => p.efficiency === 'En tiempo').length / timeAnalytics.projects.length) * 100)}%
                          </p>
                          <p className="text-amber-600 text-xs group-hover:text-amber-700 transition-colors duration-300">En tiempo</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>

                    {/* Usuarios activos */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/60 p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-indigo-50/20"></div>
                      <div className="absolute top-1 right-1 w-12 h-12 bg-blue-100/20 rounded-full"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-blue-700 text-sm font-medium mb-1 group-hover:text-blue-800 transition-colors duration-300">Usuarios Activos</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1 transform-gpu group-hover:scale-105 transition-transform duration-300 origin-left">
                            {timeAnalytics.projects.reduce((sum, p) => sum + (p.unique_users || 0), 0)}
                          </p>
                          <p className="text-blue-600 text-xs group-hover:text-blue-700 transition-colors duration-300">Colaboradores</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  </div>

                  {/* Sección de Top Proyectos y Distribución */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Top 5 Proyectos por Horas */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">🏆 Top Proyectos</h3>
                            <p className="text-sm text-gray-600">Por horas registradas</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {timeAnalytics.projects
                          .sort((a, b) => (b.total_hours || 0) - (a.total_hours || 0))
                          .slice(0, 5)
                          .map((project, index) => (
                            <div key={project.project_id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-slate-50/80 rounded-xl hover:from-slate-50/90 hover:to-gray-100/90 transition-all duration-300 group border border-gray-100/50">
                              <div className="flex items-center space-x-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                  index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                  index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                  'bg-gradient-to-r from-slate-400 to-slate-500'
                                }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 group-hover:text-slate-700 transition-colors duration-300">{project.name}</h4>
                                  <p className="text-sm text-gray-600">{clients.find(c => c.client_id === project.client_id)?.name || 'Sin cliente'}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-gray-900">{project.total_hours || 0}h</p>
                                <p className="text-sm text-gray-600">{project.total_entries || 0} entradas</p>
            </div>
          </div>
        ))}
                      </div>
      </div>

                    {/* Distribución por Estado */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
      </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">📊 Distribución</h3>
                            <p className="text-sm text-gray-600">Por estado de proyecto</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {(() => {
                          // Definir el orden lógico de los estados y sus colores estratégicos
                          const statusOrder = [
                            { key: 'registered_initiative', label: 'Iniciativa Registrada', color: 'from-gray-400 to-gray-500' },
                            { key: 'in_quotation', label: 'En Cotización', color: 'from-blue-400 to-blue-500' },
                            { key: 'proposal_approved', label: 'Propuesta Aprobada', color: 'from-indigo-400 to-indigo-500' },
                            { key: 'in_planning', label: 'En Planeación', color: 'from-purple-400 to-purple-500' },
                            { key: 'in_progress', label: 'En Progreso', color: 'from-emerald-400 to-emerald-500' },
                            { key: 'at_risk', label: 'En Riesgo', color: 'from-amber-400 to-amber-500' },
                            { key: 'suspended', label: 'Suspendido', color: 'from-orange-400 to-orange-500' },
                            { key: 'completed', label: 'Completado', color: 'from-green-500 to-green-600' },
                            { key: 'canceled', label: 'Cancelado', color: 'from-red-400 to-red-500' },
                            { key: 'post_delivery_support', label: 'Soporte Post-Entrega', color: 'from-teal-400 to-teal-500' }
                          ];

                          // Contar proyectos por estado
                          const statusCounts = timeAnalytics.projects.reduce((acc, project) => {
                            acc[project.status] = (acc[project.status] || 0) + 1;
                            return acc;
                          }, {});

                          // Filtrar solo los estados que tienen proyectos y mantener el orden
                          return statusOrder
                            .filter(status => statusCounts[status.key] > 0)
                            .map((status, index) => {
                              const count = statusCounts[status.key];
                              const percentage = Math.round((count / timeAnalytics.projects.length) * 100);
                              
                              return (
                                <div key={status.key} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{status.label}</span>
                                    <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-2 bg-gradient-to-r ${status.color} rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              );
                            });
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Sección de Eficiencia y Progreso */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Análisis de Eficiencia */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">⚡ Eficiencia</h3>
                            <p className="text-sm text-gray-600">Análisis de rendimiento</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {['En tiempo', 'Ligeramente retrasado', 'Retrasado'].map((efficiency, index) => {
                          const count = timeAnalytics.projects.filter(p => p.efficiency === efficiency).length;
                          const percentage = Math.round((count / timeAnalytics.projects.length) * 100);
                          const colors = ['from-emerald-500 to-emerald-600', 'from-amber-500 to-amber-600', 'from-rose-500 to-rose-600'];
                          const icons = ['✅', '⚠️', '🚨'];
                          return (
                            <div key={efficiency} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{icons[index]}</span>
                                  <span className="text-sm font-medium text-gray-700">{efficiency}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                  className={`h-3 bg-gradient-to-r ${colors[index]} rounded-full transition-all duration-1000 ease-out`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Progreso General */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-300">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-gray-800">📈 Progreso</h3>
                            <p className="text-sm text-gray-600">Avance general</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {/* Progreso promedio */}
                        <div className="text-center">
                          <div className="relative inline-flex items-center justify-center w-32 h-32">
                            {(() => {
                              const averageProgress = Math.round(timeAnalytics.projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / timeAnalytics.projects.length);
                              
                              // Definir colores dinámicos según el progreso
                              const getProgressColors = (progress) => {
                                if (progress >= 90) return { start: '#10b981', end: '#059669' }; // Verde intenso
                                if (progress >= 75) return { start: '#34d399', end: '#10b981' }; // Verde
                                if (progress >= 50) return { start: '#fbbf24', end: '#f59e0b' }; // Amarillo/Ámbar
                                if (progress >= 25) return { start: '#fb923c', end: '#ea580c' }; // Naranja
                                return { start: '#f87171', end: '#dc2626' }; // Rojo
                              };

                              const colors = getProgressColors(averageProgress);
                              
                              return (
                                <>
                                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                                    <path
                                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                                      fill="none"
                                      stroke="#e5e7eb"
                                      strokeWidth="2"
                                    />
                                    <path
                                      d="m18,2.0845 a 15.9155,15.9155 0 0,1 0,31.831 a 15.9155,15.9155 0 0,1 0,-31.831"
                                      fill="none"
                                      stroke={`url(#progressGradient-${averageProgress})`}
                                      strokeWidth="2"
                                      strokeDasharray={`${averageProgress}, 100`}
                                      strokeLinecap="round"
                                    />
                                    <defs>
                                      <linearGradient id={`progressGradient-${averageProgress}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={colors.start} />
                                        <stop offset="100%" stopColor={colors.end} />
                                      </linearGradient>
                                    </defs>
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-gray-900">
                                      {averageProgress}%
                                    </span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Progreso promedio</p>
                        </div>

                        {/* Estadísticas adicionales */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
                            <p className="text-2xl font-bold text-slate-600">
                              {timeAnalytics.projects.filter(p => (p.progress_percentage || 0) === 100).length}
                            </p>
                            <p className="text-sm text-slate-700">Completados</p>
                          </div>
                          <div className="text-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/50">
                            <p className="text-2xl font-bold text-slate-600">
                              {timeAnalytics.projects.filter(p => ['in_progress', 'in_planning', 'at_risk'].includes(p.status)).length}
                            </p>
                            <p className="text-sm text-slate-700">En progreso</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Mensaje elegante cuando no hay datos */
                <div className="text-center py-12">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <svg className="w-12 h-12 text-blue-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Resumen Ejecutivo</h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Vista general de todos los proyectos de la organización con métricas clave y tendencias de rendimiento.
                  </p>
                  <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-lg">
                    <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Próximamente disponible
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pestaña Analíticas de Tiempo */}
          {activeTab === 'analytics' && timeAnalytics && (
            <div className="space-y-6">
              {/* 🚀 FILTROS ÉPICOS - NIVEL BILL GATES */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">Filtros Avanzados</h3>
                      <p className="text-sm text-gray-600">Encuentra exactamente lo que buscas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      {getSortedAndFilteredProjects().length} resultados
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Búsqueda general */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔍 Búsqueda General
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ej: 'en curso', 'completado', 'retrasado', nombre del proyecto..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchFilter && (
                        <button
                          onClick={() => setSearchFilter('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Filtro por cliente */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏢 Filtrar por Cliente
                    </label>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="">Todos los clientes</option>
                      {clients.map(client => (
                        <option key={client.client_id} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Botón de limpiar filtros */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchFilter('');
                        setClientFilter('');
                        setSortConfig({ key: null, direction: 'asc' });
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
                    >
                      🧹 Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        {/* Columna de selección - Solo para super_user */}
                        {isSuperUser && isSelectionMode && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            <input
                              type="checkbox"
                              checked={selectedProjects.size === getSortedAndFilteredProjects().length && getSortedAndFilteredProjects().length > 0}
                              onChange={selectedProjects.size === getSortedAndFilteredProjects().length ? clearSelection : selectAllProjects}
                              className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                            />
                          </th>
                        )}
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('name')}
                          data-sort="name"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Proyecto</span>
                            {getSortIcon('name')}
                          </div>
                        </th>
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('status')}
                          data-sort="status"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Estado</span>
                            {getSortIcon('status')}
                          </div>
                        </th>
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('progress_percentage')}
                          data-sort="progress_percentage"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Progreso</span>
                            {getSortIcon('progress_percentage')}
                          </div>
                        </th>
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('total_hours')}
                          data-sort="total_hours"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Horas</span>
                            {getSortIcon('total_hours')}
                          </div>
                        </th>
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('efficiency')}
                          data-sort="efficiency"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Eficiencia</span>
                            {getSortIcon('efficiency')}
                          </div>
                        </th>
                        <th 
                          className="group px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-blue-50 transition-all duration-300"
                          onClick={() => handleSort('unique_users')}
                          data-sort="unique_users"
                        >
                          <div className="flex items-center space-x-2">
                            <span>Equipo</span>
                            {getSortIcon('unique_users')}
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {getSortedAndFilteredProjects().length === 0 ? (
                        <tr>
                          <td colSpan={isSuperUser && isSelectionMode ? "8" : "7"} className="px-4 py-12 text-center">
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <div className="relative">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                                  <svg className="w-10 h-10 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full animate-ping"></div>
                              </div>
                              <div className="text-center">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 No se encontraron proyectos</h3>
                                <p className="text-gray-500 mb-4">Intenta ajustar tus filtros o buscar con otros términos</p>
                                <button
                                  onClick={() => {
                                    setSearchFilter('');
                                    setClientFilter('');
                                    setSortConfig({ key: null, direction: 'asc' });
                                  }}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Limpiar filtros
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        getSortedAndFilteredProjects().map((project, index) => (
                          <tr key={project.project_id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} ${selectedProjects.has(project.project_id) ? 'bg-purple-50 border-l-4 border-purple-500' : ''}`}>
                            {/* Checkbox de selección - Solo para super_user */}
                            {isSuperUser && isSelectionMode && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedProjects.has(project.project_id)}
                                  onChange={() => toggleProjectSelection(project.project_id)}
                                  className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                                />
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="text-sm font-medium text-gray-900">{project.name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                                {getStatusLabel(project.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300" 
                                    style={{ width: `${Math.min(project.progress_percentage, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700 min-w-[35px]">{project.progress_percentage}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {project.total_hours}h <span className="text-gray-400">/</span> <span className="text-gray-600">{project.estimated_hours || 'N/A'}h</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {project.hours_remaining > 0 ? `${project.hours_remaining}h restantes` : 'Completado'}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`text-sm font-semibold ${getEfficiencyColor(project.efficiency)}`}>
                                {project.efficiency}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                                    <span className="text-sm font-medium text-gray-900">{project.unique_users}</span>
                                    <span className="text-xs text-gray-500">usuarios</span>
                          </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-900">{project.total_entries}</span>
                                    <span className="text-xs text-gray-500">entradas</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Edit button clicked for project card:', project);
                                    handleEditProject(project);
                                  }}
                                  className="group p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Editar proyecto"
                                >
                                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Delete button clicked for project card:', project);
                                    handleDeleteProject(project);
                                  }}
                                  className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                                  title="Eliminar proyecto"
                                >
                                  <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Pestaña Lista de Proyectos */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              {/* 🚀 FILTROS ÉPICOS - NIVEL BILL GATES */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                      </svg>
                        </div>
                        <div>
                      <h3 className="text-lg font-bold text-gray-800">Filtros de Proyectos</h3>
                      <p className="text-sm text-gray-600">Explora todos los proyectos de la organización</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                      </svg>
                      {getFilteredProjectsList().length} proyectos
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Búsqueda general */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔍 Búsqueda General
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar por nombre, estado, código..."
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      {searchFilter && (
                        <button
                          onClick={() => setSearchFilter('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Filtro por cliente */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏢 Filtrar por Cliente
                    </label>
                    <select
                      value={clientFilter}
                      onChange={(e) => setClientFilter(e.target.value)}
                      className="w-full py-3 px-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="">Todos los clientes</option>
                      {clients.map(client => (
                        <option key={client.client_id} value={client.name}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Botón de limpiar filtros */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSearchFilter('');
                        setClientFilter('');
                        setSortConfig({ key: null, direction: 'asc' });
                      }}
                      className="w-full py-3 px-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
                    >
                      🧹 Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredProjectsList().length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <div className="relative inline-block">
                      <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <svg className="w-10 h-10 text-gray-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">🔍 No se encontraron proyectos</h3>
                    <p className="text-gray-500 mb-4">No hay proyectos que coincidan con los filtros aplicados. Intenta con otros filtros o crea un nuevo proyecto.</p>
                    <button
                      onClick={() => {
                        setSearchFilter('');
                        setClientFilter('');
                        setSortConfig({ key: null, direction: 'asc' });
                      }}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-300 transform hover:scale-105 font-medium shadow-lg"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Limpiar filtros
                    </button>
                  </div>
                ) : (
                  getFilteredProjectsList().map((project, index) => (
                    <div 
                      key={project.project_id} 
                      className={`group relative overflow-hidden bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 ${selectedProjects.has(project.project_id) ? 'ring-2 ring-purple-500 bg-purple-50' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {/* Checkbox de selección - Solo para super_user */}
                      {isSuperUser && isSelectionMode && (
                        <div className="absolute top-4 left-4 z-10">
                          <input
                            type="checkbox"
                            checked={selectedProjects.has(project.project_id)}
                            onChange={() => toggleProjectSelection(project.project_id)}
                            className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 shadow-lg"
                          />
                        </div>
                      )}
                      
                      {/* Elementos flotantes animados */}
                      <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-50 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-300"></div>
                      <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 animate-pulse transition-opacity duration-500" style={{ animationDelay: '0.2s' }}></div>
                      
                      <div className={`flex justify-between items-start mb-4 ${isSuperUser && isSelectionMode ? 'ml-8' : ''}`}>
                        <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors duration-300">{project.name}</h3>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Edit button clicked for project card:', project);
                              handleEditProject(project);
                            }}
                            className="group p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Editar proyecto"
                          >
                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Delete button clicked for project card:', project);
                              handleDeleteProject(project);
                            }}
                            className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Eliminar proyecto"
                          >
                            <svg className="w-4 h-4 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center group-hover:scale-105 transition-transform duration-300">
                          <span className="text-sm text-gray-600">Estado:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full transition-all duration-300 group-hover:scale-110 ${getStatusColor(project.status)}`}>
                            {getStatusLabel(project.status)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center group-hover:scale-105 transition-transform duration-300">
                          <span className="text-sm text-gray-600">Cliente:</span>
                          <span className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                            {clients.find(c => c.client_id === project.client_id)?.name || 'N/A'}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center group-hover:scale-105 transition-transform duration-300">
                          <span className="text-sm text-gray-600">Código:</span>
                          <span className="text-sm font-mono text-gray-900 group-hover:text-blue-700 transition-colors duration-300">{project.code || 'N/A'}</span>
                        </div>
                        
                        {project.start_date && (
                          <div className="flex justify-between items-center group-hover:scale-105 transition-transform duration-300">
                            <span className="text-sm text-gray-600">Inicio:</span>
                            <span className="text-sm text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                              {new Date(project.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        
                        {project.end_date && (
                          <div className="flex justify-between items-center group-hover:scale-105 transition-transform duration-300">
                            <span className="text-sm text-gray-600">Fin:</span>
                            <span className="text-sm text-gray-900 group-hover:text-blue-700 transition-colors duration-300">
                              {new Date(project.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Efecto de brillo en hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de proyecto */}
      {showModal && (
        <ProjectModal
          project={selectedProject}
          clients={clients}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProject}
        />
      )}

      {/* Error message */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-red-500 to-red-600 border border-red-400 text-white px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <svg className="w-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-green-600 border border-green-400 text-white px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <svg className="w-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}