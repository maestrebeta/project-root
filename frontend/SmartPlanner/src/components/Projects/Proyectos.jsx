import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ProjectModal from './ProjectModal';
import QuotationModal from './QuotationModal';
import Quotations from './Quotations';
import ProjectsView from './ProjectsView';

export default function ProjectManagement() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  
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
  
  // Estados para cotizaciones
  // eslint-disable-next-line no-unused-vars
  const [quotations, setQuotations] = useState([]);
  const [quotationsSummary, setQuotationsSummary] = useState(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quotationViewMode, setQuotationViewMode] = useState('cards'); // 'cards' o 'table'
  const [projectQuotations, setProjectQuotations] = useState({}); // {projectId: [quotations]}
  
  // Nuevos estados para funcionalidades de cotizaciones
  const [showPaidInstallments, setShowPaidInstallments] = useState(false);
  const [quotationProjectFilter, setQuotationProjectFilter] = useState('');
  const [quotationStatusFilter, setQuotationStatusFilter] = useState('');
  const [quotationSearchFilter, setQuotationSearchFilter] = useState('');
  const [quotationLoading, setQuotationLoading] = useState(false);
  
  // Estados para sorting y filtrado - NIVEL BILL GATES
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [clientFilter, setClientFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Estados para selección múltiple y eliminación masiva (solo super_user)
  const [selectedProjects, setSelectedProjects] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Estados para vista de proyectos
  const [projectViewMode, setProjectViewMode] = useState('cards'); // 'cards' o 'table'

  // Verificar si el usuario es super_user
  const isSuperUser = user?.role === 'super_user';

  // Detectar parámetro openModal en la URL y abrir modal automáticamente
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('openModal') === 'true') {
      // Limpiar el parámetro de la URL sin recargar la página
      const newUrl = location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Abrir el modal de nuevo proyecto
      setSelectedProject(null);
      setShowModal(true);
    }
  }, [location.search]);

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
    const currentProjects = activeTab === 'projects' 
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

      const response = await fetch('http://localhost:8001/projects/bulk-delete', {
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
        setTimeout(() => setError(''), 8001);
      }

      // Limpiar selección y recargar datos
      clearSelection();
      await fetchAllData();

    } catch (err) {
      console.error('Error en eliminación masiva:', err);
      setError(`Error en eliminación masiva: ${err.message}`);
      setTimeout(() => setError(''), 8001);
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
      // Primero cargar proyectos, clientes y estadísticas
      await Promise.all([
        fetchStats(),
        fetchClients(),
        fetchTimeAnalytics(),
        fetchQuotationsSummary()
      ]);
      
      // Cargar proyectos por separado para poder usarlos inmediatamente
      console.log('📊 Loading projects...');
      const session = JSON.parse(localStorage.getItem('session'));
      const projectsResponse = await fetch('http://localhost:8001/projects/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('📊 Projects loaded:', projectsData);
        setProjects(projectsData);
        
        // Ahora cargar cotizaciones usando los proyectos recién obtenidos
        if (projectsData.length > 0) {
          await fetchAllProjectQuotations(projectsData);
        } else {
          console.log('⚠️ No projects available');
        }
      } else {
        console.error('❌ Error loading projects');
      }
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
      const response = await fetch('http://localhost:8001/projects/stats', {
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

  const fetchClients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/clients/', {
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
      const response = await fetch('http://localhost:8001/projects/time-analytics', {
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
      const response = await fetch(`http://localhost:8001/projects/${project.project_id}`, {
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

  // Función para actualizar solo el estado del proyecto
  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    try {
      setError('');
      
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      
      const response = await fetch(`http://localhost:8001/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Actualizar el estado local inmediatamente
        setProjects(prev => prev.map(p => 
          p.project_id === projectId ? { ...p, status: newStatus } : p
        ));
        
        // Recargar analytics para actualizar las métricas
        await fetchTimeAnalytics();
        
        setSuccessMessage(`Estado del proyecto actualizado a "${getStatusLabel(newStatus)}"`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el estado');
      }
    } catch (err) {
      console.error('Error updating project status:', err);
      setError(`Error al actualizar el estado: ${err.message}`);
      setTimeout(() => setError(''), 5000);
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
      
      const response = await fetch(`http://localhost:8001/projects/${projectId}`, {
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
    if (!efficiency || efficiency === 'N/A') return 'bg-gray-100 text-gray-800';
    const value = parseFloat(efficiency);
    if (value >= 90) return 'bg-green-100 text-green-800';
    if (value >= 75) return 'bg-blue-100 text-blue-800';
    if (value >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Función para obtener colores de progreso
  const getProgressColors = (progress) => {
    if (progress >= 90) return '#10b981'; // Verde intenso
    if (progress >= 75) return '#34d399'; // Verde
    if (progress >= 50) return '#fbbf24'; // Amarillo/Ámbar
    if (progress >= 25) return '#fb923c'; // Naranja
    return '#f87171'; // Rojo
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

  // Funciones para cotizaciones
  const fetchQuotationsSummary = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/projects/quotations/summary', {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setQuotationsSummary(data);
      }
    } catch (err) {
      console.error('Error fetching quotations summary:', err);
    }
  };

  // Función para calcular cotizaciones abiertas (con cuotas pendientes)
  const calculateOpenQuotations = () => {
    if (!quotationsSummary) return 0;
    
    // Contar cotizaciones que tienen cuotas pendientes
    let openQuotations = 0;
    Object.values(projectQuotations).forEach(quotations => {
      quotations.forEach(quotation => {
        if (quotation.total_pending > 0) {
          openQuotations++;
        }
      });
    });
    
    return openQuotations;
  };

  // Función para calcular total pendiente de todas las cotizaciones
  const calculateTotalPending = () => {
    if (!quotationsSummary) return 0;
    
    let totalPending = 0;
    Object.values(projectQuotations).forEach(quotations => {
      quotations.forEach(quotation => {
        totalPending += parseFloat(quotation.total_pending || 0);
      });
    });
    
    return totalPending;
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const fetchProjectQuotations = async (projectId) => {
    try {
      console.log('🌐 fetchProjectQuotations called for projectId:', projectId);
      
      const session = JSON.parse(localStorage.getItem('session'));
      const url = `http://localhost:8001/projects/${projectId}/quotations`;
      console.log('🌐 Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('🌐 Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🌐 Response data for project', projectId, ':', data);
        return data;
      } else {
        console.error('🌐 Error response:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('🌐 Error response body:', errorText);
        return [];
      }
    } catch (err) {
      console.error('❌ Error fetching project quotations:', err);
      return [];
    }
  };

  const createQuotation = async (quotationData) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/projects/quotations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quotationData)
      });
      
      if (response.ok) {
        const newQuotation = await response.json();
        
        // Actualizar la cotización en el estado general
        setQuotations(prev => [...prev, newQuotation]);
        
        // Actualizar las cotizaciones por proyecto
        setProjectQuotations(prev => {
          const newProjectQuotations = { ...prev };
          const projectId = newQuotation.project_id;
          
          if (newProjectQuotations[projectId]) {
            newProjectQuotations[projectId] = [...newProjectQuotations[projectId], newQuotation];
          } else {
            newProjectQuotations[projectId] = [newQuotation];
          }
          
          return newProjectQuotations;
        });
        
        setShowQuotationModal(false);
        setSelectedQuotation(null);
        await fetchQuotationsSummary();
        return newQuotation;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al crear la cotización');
      }
    } catch (err) {
      console.error('Error creating quotation:', err);
      throw err;
    }
  };

  const updateQuotation = async (quotationId, quotationData) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/projects/quotations/${quotationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quotationData)
      });
      
      if (response.ok) {
        const updatedQuotation = await response.json();
        
        // Actualizar la cotización en el estado general
        setQuotations(prev => prev.map(q => q.quotation_id === quotationId ? updatedQuotation : q));
        
        // Actualizar las cotizaciones por proyecto
        setProjectQuotations(prev => {
          const newProjectQuotations = { ...prev };
          const projectId = updatedQuotation.project_id;
          
          if (newProjectQuotations[projectId]) {
            newProjectQuotations[projectId] = newProjectQuotations[projectId].map(q => 
              q.quotation_id === quotationId ? updatedQuotation : q
            );
          }
          
          return newProjectQuotations;
        });
        
        setShowQuotationModal(false);
        setSelectedQuotation(null);
        await fetchQuotationsSummary();
        return updatedQuotation;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar la cotización');
      }
    } catch (err) {
      console.error('Error updating quotation:', err);
      throw err;
    }
  };

  const deleteQuotation = async (quotationId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/projects/quotations/${quotationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Encontrar la cotización antes de eliminarla para obtener el project_id
        const quotationToDelete = quotations.find(q => q.quotation_id === quotationId);
        
        // Actualizar la cotización en el estado general
        setQuotations(prev => prev.filter(q => q.quotation_id !== quotationId));
        
        // Actualizar las cotizaciones por proyecto
        if (quotationToDelete) {
          setProjectQuotations(prev => {
            const newProjectQuotations = { ...prev };
            const projectId = quotationToDelete.project_id;
            
            if (newProjectQuotations[projectId]) {
              newProjectQuotations[projectId] = newProjectQuotations[projectId].filter(q => q.quotation_id !== quotationId);
            }
            
            return newProjectQuotations;
          });
        }
        
        await fetchQuotationsSummary();
        return true;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la cotización');
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
      throw err;
    }
  };

  const fetchAllProjectQuotations = async (projectsToFetch = null) => {
    try {
      console.log('🚀 fetchAllProjectQuotations started');
      
      // Usar los proyectos pasados como parámetro o el estado actual
      const projectsToUse = projectsToFetch || projects;
      console.log('📊 Projects to fetch quotations for:', projectsToUse);
      
      setQuotationLoading(true);
      const quotationsMap = {};
      
      for (const project of projectsToUse) {
        console.log('🔍 Fetching quotations for project:', project.project_id, project.name);
        const projectQuotations = await fetchProjectQuotations(project.project_id);
        console.log('📋 Quotations received for project', project.project_id, ':', projectQuotations);
        quotationsMap[project.project_id] = projectQuotations;
      }
      
      console.log('📊 Final quotationsMap:', quotationsMap);
      setProjectQuotations(quotationsMap);
      console.log('✅ fetchAllProjectQuotations completed successfully');
    } catch (err) {
      console.error('❌ Error fetching all project quotations:', err);
      setError('Error al cargar las cotizaciones de los proyectos');
    } finally {
      setQuotationLoading(false);
    }
  };

  // Funciones de filtrado para cotizaciones
  const getQuotationsByProject = (projectId) => {
    console.log('🔍 getQuotationsByProject called for projectId:', projectId);
    console.log('📊 projectQuotations state:', projectQuotations);
    
    const quotations = projectQuotations[projectId] || [];
    console.log('📋 Raw quotations for project', projectId, ':', quotations);
    
    // Aplicar filtros
    let filteredQuotations = quotations;

    if (quotationStatusFilter) {
      console.log('🔍 Filtering by status:', quotationStatusFilter);
      filteredQuotations = filteredQuotations.filter(q => q.status === quotationStatusFilter);
      console.log('📋 After status filter:', filteredQuotations);
    }

    if (quotationSearchFilter) {
      console.log('🔍 Filtering by search:', quotationSearchFilter);
      filteredQuotations = filteredQuotations.filter(q => 
        q.description?.toLowerCase().includes(quotationSearchFilter.toLowerCase()) ||
        q.quotation_id.toString().includes(quotationSearchFilter) ||
        q.total_amount.toString().includes(quotationSearchFilter)
      );
      console.log('📋 After search filter:', filteredQuotations);
    }

    // Filtrar cuotas pagadas si no se quieren mostrar
    if (!showPaidInstallments) {
      console.log('🔍 Filtering out paid installments');
      filteredQuotations = filteredQuotations.filter(q => q.total_pending > 0);
      console.log('📋 After paid filter:', filteredQuotations);
    }

    console.log('✅ Final filtered quotations for project', projectId, ':', filteredQuotations);
    return filteredQuotations;
  };

  const clearQuotationFilters = () => {
    setQuotationProjectFilter('');
    setQuotationStatusFilter('');
    setQuotationSearchFilter('');
  };

  const getNextInstallment = (quotation) => {
    if (!quotation.installments || quotation.installments.length === 0) return null;
    return quotation.installments.find(inst => !inst.is_paid) || null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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
        {/* Los botones de selección múltiple y nuevo proyecto se moverán al header de filtros */}
      </div>

      {/* Estadísticas principales */}
      {/* Eliminados los stats coloridos principales */}
      {/* Eliminada la grid de stats */}

      {/* Navegación por pestañas */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-200 mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-purple-50/30"></div>
        <div className="relative z-10 border-b border-gray-200">
          <nav className="flex space-x-2 px-6 py-4">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'projects', label: 'Proyectos', icon: '📋' },
              { id: 'quotations', label: 'Cotizaciones', icon: '💰' }
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

                    {/* Cotizaciones abiertas y total pendiente */}
                    <div className="group relative overflow-hidden rounded-2xl bg-white/90 backdrop-blur-sm border border-gray-200/60 p-4 shadow-lg hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 hover:scale-[1.02]">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 to-indigo-50/20"></div>
                      <div className="absolute top-1 right-1 w-12 h-12 bg-blue-100/20 rounded-full"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-md group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-blue-700 text-sm font-medium mb-1 group-hover:text-blue-800 transition-colors duration-300">Cotizaciones Abiertas</p>
                          <p className="text-2xl font-bold text-gray-900 mb-1 transform-gpu group-hover:scale-105 transition-transform duration-300 origin-left">
                            {calculateOpenQuotations()}
                          </p>
                          <p className="text-blue-600 text-xs group-hover:text-blue-700 transition-colors duration-300">
                            {formatCurrency(calculateTotalPending())} pendiente
                          </p>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    </div>
                  </div>

                  {/* Sección de Top Proyectos y Progreso */}
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

                  {/* Sección de Distribución y Eficiencia */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

                          // Crear array con estados que tienen proyectos y ordenar por cantidad descendente
                          const statusWithCounts = statusOrder
                            .filter(status => statusCounts[status.key] > 0)
                            .map(status => ({
                              ...status,
                              count: statusCounts[status.key]
                            }))
                            .sort((a, b) => b.count - a.count); // Orden descendente por cantidad

                          return statusWithCounts.map((status) => {
                            const count = status.count;
                            const percentage = Math.round((count / timeAnalytics.projects.length) * 100);
                            const projectsInStatus = timeAnalytics.projects.filter(p => p.status === status.key);
                            
                            return (
                              <div key={status.key} className="group relative">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors cursor-pointer">
                                      {status.label}
                              </span>
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                                      {count} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-2 bg-gradient-to-r ${status.color} rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                                
                                {/* Tooltip con proyectos del estado */}
                                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                                  <div className="p-3">
                                    <h4 className="font-semibold text-gray-800 mb-2">{status.label} ({count})</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                      {projectsInStatus.map(project => (
                                        <div key={project.project_id} className="flex items-center justify-between text-sm">
                                          <span className="text-gray-700 truncate">{project.name}</span>
                                          <span className="text-gray-500 text-xs">{project.progress_percentage || 0}%</span>
                              </div>
                                      ))}
                              </div>
                          </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                                </div>
                                  </div>
                            );
                          });
                        })()}
                                </div>
                              </div>

                    {/* Sección de Eficiencia */}
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
                        {(() => {
                          // Definir las opciones de eficiencia con sus colores e iconos
                          const efficiencyOptions = [
                            { value: 'En tiempo', color: 'from-emerald-500 to-emerald-600', icon: '✅' },
                            { value: 'Ligeramente retrasado', color: 'from-amber-500 to-amber-600', icon: '⚠️' },
                            { value: 'Retrasado', color: 'from-rose-500 to-rose-600', icon: '🚨' }
                          ];

                          // Contar proyectos por eficiencia y ordenar por cantidad descendente
                          const efficiencyCounts = efficiencyOptions
                            .map(option => ({
                              ...option,
                              count: timeAnalytics.projects.filter(p => p.efficiency === option.value).length
                            }))
                            .filter(option => option.count > 0)
                            .sort((a, b) => b.count - a.count); // Orden descendente por cantidad

                          return efficiencyCounts.map((efficiency) => {
                            const count = efficiency.count;
                            const percentage = Math.round((count / timeAnalytics.projects.length) * 100);
                            const projectsInEfficiency = timeAnalytics.projects.filter(p => p.efficiency === efficiency.value);
                            
                            return (
                              <div key={efficiency.value} className="group relative">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                                      <span className="text-lg">{efficiency.icon}</span>
                                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors cursor-pointer">
                                        {efficiency.value}
                                      </span>
                    </div>
                                    <span className="text-sm font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                                      {count} ({percentage}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                      className={`h-3 bg-gradient-to-r ${efficiency.color} rounded-full transition-all duration-1000 ease-out`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                  </div>
                </div>
                
                                {/* Tooltip con proyectos de la eficiencia */}
                                <div className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto z-50">
                                  <div className="p-3">
                                    <h4 className="font-semibold text-gray-800 mb-2">{efficiency.value} ({count})</h4>
                                    <div className="max-h-40 overflow-y-auto space-y-1">
                                      {projectsInEfficiency.map(project => (
                                        <div key={project.project_id} className="flex items-center justify-between text-sm">
                                          <span className="text-gray-700 truncate">{project.name}</span>
                                          <span className="text-gray-500 text-xs">{project.progress_percentage || 0}%</span>
                      </div>
                                      ))}
                    </div>
                  </div>
                                  <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                  </div>
                            );
                          });
                        })()}
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
                        
          {/* Pestaña Proyectos */}
          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              clients={clients}
              timeAnalytics={timeAnalytics}
              searchFilter={searchFilter}
              setSearchFilter={setSearchFilter}
              clientFilter={clientFilter}
              setClientFilter={setClientFilter}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              projectViewMode={projectViewMode}
              setProjectViewMode={setProjectViewMode}
              isSelectionMode={isSelectionMode}
              setIsSelectionMode={setIsSelectionMode}
              selectedProjects={selectedProjects}
              setSelectedProjects={setSelectedProjects}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              showModal={showModal}
              setShowModal={setShowModal}
              getSortedAndFilteredProjects={getSortedAndFilteredProjects}
              handleSort={handleSort}
              getSortIcon={getSortIcon}
              getStatusColor={getStatusColor}
              getStatusLabel={getStatusLabel}
              getEfficiencyColor={getEfficiencyColor}
              getProgressColors={getProgressColors}
              toggleProjectSelection={toggleProjectSelection}
              selectAllProjects={selectAllProjects}
              clearSelection={clearSelection}
              handleEditProject={handleEditProject}
              handleDeleteProject={handleDeleteProject}
              handleUpdateProjectStatus={handleUpdateProjectStatus}
              isSuperUser={isSuperUser}
            />
          )}

          {/* Pestaña Cotizaciones */}
          {activeTab === 'quotations' && (
            <Quotations 
              projects={projects}
              clients={clients}
              quotations={quotations}
              quotationsSummary={quotationsSummary}
              projectQuotations={projectQuotations}
              quotationViewMode={quotationViewMode}
              setQuotationViewMode={setQuotationViewMode}
              showPaidInstallments={showPaidInstallments}
              setShowPaidInstallments={setShowPaidInstallments}
              quotationProjectFilter={quotationProjectFilter}
              setQuotationProjectFilter={setQuotationProjectFilter}
              quotationStatusFilter={quotationStatusFilter}
              setQuotationStatusFilter={setQuotationStatusFilter}
              quotationSearchFilter={quotationSearchFilter}
              setQuotationSearchFilter={setQuotationSearchFilter}
              quotationLoading={quotationLoading}
              setQuotationLoading={setQuotationLoading}
              showQuotationModal={showQuotationModal}
              setShowQuotationModal={setShowQuotationModal}
              selectedQuotation={selectedQuotation}
              setSelectedQuotation={setSelectedQuotation}
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              fetchQuotationsSummary={fetchQuotationsSummary}
              fetchAllProjectQuotations={fetchAllProjectQuotations}
              getQuotationsByProject={getQuotationsByProject}
              clearQuotationFilters={clearQuotationFilters}
              getNextInstallment={getNextInstallment}
              formatDate={formatDate}
              createQuotation={createQuotation}
              updateQuotation={updateQuotation}
              deleteQuotation={deleteQuotation}
              isSuperUser={isSuperUser}
            />
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

      {/* Modal de cotizaciones */}
      {showQuotationModal && (
        <QuotationModal
          isOpen={showQuotationModal}
          quotation={selectedQuotation}
          project={selectedProject}
          projects={projects}
          onClose={() => {
            setShowQuotationModal(false);
            setSelectedQuotation(null);
            setSelectedProject(null);
          }}
          onSave={async (quotationData) => {
            try {
              if (selectedQuotation) {
                await updateQuotation(selectedQuotation.quotation_id, quotationData);
              } else {
                await createQuotation(quotationData);
              }
              setShowQuotationModal(false);
              setSelectedQuotation(null);
              setSelectedProject(null);
            } catch (error) {
              console.error('Error saving quotation:', error);
            }
          }}
        />
      )}

      {/* Error message con React Portal */}
      {error && createPortal(
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
        </div>,
        document.body
      )}

      {/* Success message con React Portal */}
      {successMessage && createPortal(
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
        </div>,
        document.body
      )}
    </div>
  );
}
