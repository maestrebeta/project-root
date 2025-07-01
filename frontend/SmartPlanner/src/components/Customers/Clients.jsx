import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useProjectProgress } from '../../hooks/useProjectProgress';
import projectProgressService from '../../services/projectProgressService';
import { 
  FiPlus, FiFilter, FiSearch, FiEye, FiEyeOff, FiCheckCircle, 
  FiClock, FiAlertCircle, FiUser, FiCalendar, FiTag, FiMessageSquare,
  FiEdit2, FiTrash2, FiMoreVertical, FiArrowRight, FiUsers, FiTarget,
  FiTrendingUp, FiTrendingDown, FiActivity, FiStar, FiZap, FiRefreshCw, 
  FiGrid, FiList, FiX, FiAlertTriangle, FiDollarSign
} from 'react-icons/fi';
import ClientModal from './ClientModal';
import ClientCard from './ClientCard';
import ClientTable from './ClientTable';

export default function Clients() {
  const { user, isAuthenticated } = useAuth();
  const { getClientProjectsProgress, calculateClientProjectsProgress } = useProjectProgress();
  const [clients, setClients] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(new Set()); // Para rastrear qué clientes están siendo actualizados
  const [savingClient, setSavingClient] = useState(false); // Para rastrear si se está guardando un cliente
  
  // Estados para el modal
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  // Estados para filtros y búsqueda
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' o 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [showInactive, setShowInactive] = useState(true);
  
  // Estados para ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Estados para caché de datos y manejo de estado de carga
  const [dataCache, setDataCache] = useState({
    quotations: {},
    tickets: {},
    projects: {},
    projectsInfo: {},
    projectsProgress: {}, // Nuevo caché para progreso de proyectos
    lastUpdate: null
  });
  
  // Determinar si el usuario puede gestionar clientes
  const canManageClients = user?.role === 'super_user' || user?.role === 'admin';
  
  // Cargar datos iniciales
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchInitialData();
    }
  }, [isAuthenticated, user]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClients(),
        fetchCountries()
      ]);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const clientsResponse = await fetch('http://localhost:8001/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!clientsResponse.ok) {
        console.error('Error response:', clientsResponse.status, clientsResponse.statusText);
        const errorText = await clientsResponse.text();
        console.error('Error details:', errorText);
        throw new Error(`Error al cargar los clientes: ${clientsResponse.status}`);
      }

      const clientsData = await clientsResponse.json();
      
      // Mostrar progreso de enriquecimiento de datos
      setLoading(true);
      
      // Enriquecer los datos con información real del backend
      const enrichedClients = await Promise.all(clientsData.map(async (client, index) => {
        try {
          
          // Obtener datos reales de cotizaciones, tickets y proyectos para este cliente
          const [quotationsData, ticketsData, projectsData] = await Promise.all([
            fetchClientQuotations(client.client_id),
            fetchClientTickets(client.client_id),
            fetchClientProjects(client.client_id)
          ]);

          // Calcular métricas reales
          const pendingQuotesAmount = quotationsData.reduce((total, quotation) => {
            // Usar total_pending del backend si está disponible, sino calcular manualmente
            if (quotation.total_pending !== undefined) {
              return total + (quotation.total_pending || 0);
            }
            // Fallback: calcular manualmente si no hay total_pending del backend
            const pendingAmount = quotation.installments?.reduce((sum, installment) => {
              return installment.is_paid ? sum : sum + (installment.amount || 0);
            }, 0) || 0;
            return total + pendingAmount;
          }, 0);

          // Depurar tickets para este cliente
          const openTicketsCount = ticketsData.filter(ticket => {
            const isOpen = ticket.status !== 'cerrado' && 
                          ticket.status !== 'resuelto' && 
                          ticket.status !== 'canceled' &&
                          ticket.status !== 'closed';
            return isOpen;
          }).length;

          // Obtener información de proyectos desde el backend
          const [projectsDataInfo, projectsInfo] = await Promise.all([
            fetchClientProjects(client.client_id),
            fetchClientProjectsInfo(client.client_id)
          ]);

          // Usar la información calculada en el backend para mayor consistencia
          const delayedProjectsCount = projectsInfo?.overdue_projects || 0;
          const riskProjectsCount = projectsInfo?.at_risk_projects || 0;

          // Calcular progreso promedio de proyectos del cliente
          let projectsProgressAverage = 0;
          let totalHoursRegistered = 0;
          
          if (projectsData.length > 0) {
            try {
              // Intentar obtener progreso desde el backend
              const clientProgress = await getClientProjectsProgress(client.client_id);
              if (clientProgress && !clientProgress.error) {
                projectsProgressAverage = clientProgress.average_progress || 0;
                totalHoursRegistered = clientProgress.total_actual_hours || 0;
              } else {
                // Fallback: calcular localmente si hay error en el backend
                const projectIds = projectsData.map(p => p.project_id);
                if (projectIds.length > 0) {
                  const projectProgressData = await projectProgressService.getMultipleProjectsProgress(projectIds);
                  const calculatedProgress = calculateClientProjectsProgress(projectsData);
                  projectsProgressAverage = calculatedProgress.average_progress || 0;
                  totalHoursRegistered = calculatedProgress.total_actual_hours || 0;
                }
              }
            } catch (error) {
              console.error(`Error calculando progreso de proyectos para cliente ${client.client_id}:`, error);
              // En caso de error, usar valores por defecto
              projectsProgressAverage = 0;
              totalHoursRegistered = 0;
            }
          }

          const enrichedClient = {
            ...client,
            pending_quotes_amount: Math.round(pendingQuotesAmount),
            rating_average: client.rating_average, // Mantener el valor original del backend (puede ser null)
            open_tickets_count: openTicketsCount,
            delayed_projects_count: delayedProjectsCount,
            risk_projects_count: riskProjectsCount,
            projects_count: projectsDataInfo.length,
            total_quotes_amount: Math.round(quotationsData.reduce((total, q) => total + (q.total_amount || 0), 0)),
            projects_progress_average: projectsProgressAverage, // Nuevo campo para progreso promedio
            total_hours_registered: totalHoursRegistered // Nuevo campo para horas registradas
          };

          return enrichedClient;
        } catch (error) {
          console.error(`Error enriching client ${client.client_id} (${client.name}):`, error);
          // En caso de error, devolver datos por defecto
          return {
            ...client,
            pending_quotes_amount: 0,
            rating_average: client.rating_average, // Mantener el rating original del cliente
            open_tickets_count: 0,
            delayed_projects_count: 0,
            risk_projects_count: 0,
            projects_count: 0,
            total_quotes_amount: 0,
            projects_progress_average: 0,
            total_hours_registered: 0
          };
        }
      }));
      
      setClients(enrichedClients);
      
      // Calcular y actualizar estadísticas del dashboard basándose en datos reales
      const dashboardStats = calculateDashboardStats(enrichedClients);
      // Aquí podrías llamar a una función para actualizar las estadísticas globales si es necesario
      
    } catch (err) {
      console.error('Error fetching clients:', err);
      // Si hay error, establecer una lista vacía pero no fallar completamente
      setClients([]);
    }
  };

  const fetchCountries = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:8001/countries/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const countriesData = await response.json();
        setCountries(countriesData);
      } else {
        console.error('Error fetching countries:', response.status, response.statusText);
        // Continuar sin países si hay error
        setCountries([]);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      setCountries([]);
    }
  };

  // Funciones auxiliares para obtener datos específicos por cliente
  const fetchClientQuotations = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) return [];

      // Verificar si los datos están en caché y son recientes
      const cachedData = dataCache.quotations[clientId];
      const isCacheValid = cachedData && (Date.now() - cachedData.timestamp < 5 * 60 * 1000); // 5 minutos

      if (isCacheValid) {
        return cachedData.data;
      }

      // Usar el endpoint directo para obtener cotizaciones por cliente
      const response = await fetch(`http://localhost:8001/projects/quotations/by-client/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const quotations = await response.json();
        
        // Actualizar caché
        setDataCache(prev => ({
          ...prev,
          quotations: {
            ...prev.quotations,
            [clientId]: {
              data: Array.isArray(quotations) ? quotations : [],
              timestamp: Date.now()
            }
          }
        }));

        return Array.isArray(quotations) ? quotations : [];
      } else {
        console.error(`Error fetching quotations for client ${clientId}:`, response.status, response.statusText);
        return [];
      }

    } catch (error) {
      console.error(`Error fetching quotations for client ${clientId}:`, error);
      return [];
    }
  };

  const fetchClientTickets = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) return [];

      // Verificar si los datos están en caché y son recientes
      const cachedData = dataCache.tickets[clientId];
      const isCacheValid = cachedData && (Date.now() - cachedData.timestamp < 5 * 60 * 1000); // 5 minutos

      if (isCacheValid) {
        return cachedData.data;
      }

      const response = await fetch(`http://localhost:8001/tickets/?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });


      if (response.ok) {
        const data = await response.json();
        
        // Actualizar caché
        setDataCache(prev => ({
          ...prev,
          tickets: {
            ...prev.tickets,
            [clientId]: {
              data: Array.isArray(data) ? data : [],
              timestamp: Date.now()
            }
          }
        }));
        
        return Array.isArray(data) ? data : [];
      } else {
        console.error(`Error fetching tickets for client ${clientId}:`, response.status, response.statusText);
        return [];
      }
    } catch (error) {
      console.error(`Error fetching tickets for client ${clientId}:`, error);
      return [];
    }
  };

  const fetchClientProjects = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) return [];

      // Verificar si los datos están en caché y son recientes
      const cachedData = dataCache.projects[clientId];
      const isCacheValid = cachedData && (Date.now() - cachedData.timestamp < 5 * 60 * 1000); // 5 minutos

      if (isCacheValid) {
        return cachedData.data;
      }

      const response = await fetch(`http://localhost:8001/projects/?client_id=${clientId}`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar caché
        setDataCache(prev => ({
          ...prev,
          projects: {
            ...prev.projects,
            [clientId]: {
              data: Array.isArray(data) ? data : [],
              timestamp: Date.now()
            }
          }
        }));
        return Array.isArray(data) ? data : [];
      }
      return [];
    } catch (error) {
      console.error(`Error fetching projects for client ${clientId}:`, error);
      return [];
    }
  };

  const fetchClientProjectsInfo = async (clientId) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) return { total_projects: 0, overdue_projects: 0, at_risk_projects: 0 };

      // Verificar si los datos están en caché y son recientes
      const cachedData = dataCache.projectsInfo?.[clientId];
      const isCacheValid = cachedData && (Date.now() - cachedData.timestamp < 5 * 60 * 1000); // 5 minutos

      if (isCacheValid) {
        return cachedData.data;
      }

      const response = await fetch(`http://localhost:8001/projects/by-client/${clientId}/info`, {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Actualizar caché
        setDataCache(prev => ({
          ...prev,
          projectsInfo: {
            ...prev.projectsInfo,
            [clientId]: {
              data: data,
              timestamp: Date.now()
            }
          }
        }));
        return data;
      }
      return { total_projects: 0, overdue_projects: 0, at_risk_projects: 0 };
    } catch (error) {
      console.error(`Error fetching projects info for client ${clientId}:`, error);
      return { total_projects: 0, overdue_projects: 0, at_risk_projects: 0 };
    }
  };

  // Función para limpiar el caché cuando sea necesario
  const clearDataCache = () => {
    setDataCache({
      quotations: {},
      tickets: {},
      projects: {},
      projectsInfo: {},
      projectsProgress: {}, // Incluir el nuevo caché
      lastUpdate: null
    });
  };

  // Función para actualizar el progreso de proyectos de un cliente específico
  const updateClientProjectsProgress = async (clientId) => {
    try {
      const clientProgress = await getClientProjectsProgress(clientId);
      if (clientProgress && !clientProgress.error) {
        // Actualizar el cliente en el estado local
        setClients(prevClients => 
          prevClients.map(client => 
            client.client_id === clientId 
              ? { 
                  ...client, 
                  projects_progress_average: clientProgress.average_progress || 0,
                  total_hours_registered: clientProgress.total_actual_hours || 0
                }
              : client
          )
        );
        
        // Actualizar caché
        setDataCache(prev => ({
          ...prev,
          projectsProgress: {
            ...prev.projectsProgress,
            [clientId]: {
              data: clientProgress,
              timestamp: Date.now()
            }
          }
        }));
      }
    } catch (error) {
      console.error(`Error actualizando progreso de proyectos para cliente ${clientId}:`, error);
    }
  };

  // Limpiar caché cuando se actualiza un cliente
  const handleRefresh = async () => {
    setRefreshing(true);
    clearDataCache();
    await fetchClients();
    setRefreshing(false);
  };

  // Filtrar clientes según los filtros aplicados
  const getFilteredClients = () => {
    let filtered = clients;
    
    // Filtrar por búsqueda
    if (searchFilter) {
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        client.code?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        client.contact_email?.toLowerCase().includes(searchFilter.toLowerCase()) ||
        client.tax_id?.toLowerCase().includes(searchFilter.toLowerCase())
      );
    }
    
    // Filtrar por estado
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(client => client.is_active === isActive);
    }
    
    // Filtrar por país
    if (countryFilter !== 'all') {
      filtered = filtered.filter(client => client.country_code === countryFilter);
    }
    
    // Filtrar clientes inactivos según el toggle
    if (!showInactive) {
      filtered = filtered.filter(client => client.is_active);
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      // Si no hay configuración de ordenamiento específica, ordenar por severidad
      if (sortConfig.key === 'name' && sortConfig.direction === 'asc') {
        // Calcular score de severidad (tickets abiertos * 2 + proyectos en riesgo * 1.5)
        const aSeverity = (a.open_tickets_count || 0) * 2 + 
                         ((a.delayed_projects_count || 0) + (a.risk_projects_count || 0)) * 1.5;
        const bSeverity = (b.open_tickets_count || 0) * 2 + 
                         ((b.delayed_projects_count || 0) + (b.risk_projects_count || 0)) * 1.5;
        
        // Ordenar por severidad descendente (más crítico primero)
        if (aSeverity !== bSeverity) {
          return bSeverity - aSeverity;
        }
        
        // Si tienen la misma severidad, ordenar por nombre alfabéticamente
        return a.name.localeCompare(b.name);
      }
      
      // Ordenamiento normal por la columna seleccionada
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc' 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });
    
    return filtered;
  };

  // Obtener estadísticas
  const getStats = () => {
    const total = clients.length;
    const active = clients.filter(c => c.is_active).length;
    const inactive = total - active;
    const withProjects = clients.filter(c => (c.projects_count || 0) > 0).length;
    const totalProjects = clients.reduce((sum, c) => sum + (c.projects_count || 0), 0);
    const totalHours = clients.reduce((sum, c) => sum + (c.total_hours_registered || 0), 0);
    
    // Nuevas estadísticas solicitadas
    const pendingQuotes = clients.reduce((sum, c) => sum + (c.pending_quotes_amount || 0), 0);
    
    // Calcular promedio real de calificaciones
    const clientsWithRatings = clients.filter(c => c.rating_average !== undefined && c.rating_average !== null);
    const averageRating = clientsWithRatings.length > 0 
      ? clientsWithRatings.reduce((sum, c) => sum + (c.rating_average || 0), 0) / clientsWithRatings.length
      : 0;
    
    const openTickets = clients.reduce((sum, c) => sum + (c.open_tickets_count || 0), 0);
    const delayedProjects = clients.reduce((sum, c) => sum + (c.delayed_projects_count || 0), 0);
    const riskProjects = clients.reduce((sum, c) => sum + (c.risk_projects_count || 0), 0);
    
    return { 
      total, 
      active, 
      inactive, 
      withProjects, 
      totalProjects, 
      totalHours,
      pendingQuotes,
      averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
      openTickets,
      delayedProjects,
      riskProjects
    };
  };

  // Función para calcular estadísticas del dashboard basándose en datos reales
  const calculateDashboardStats = (clientsData) => {
    if (!clientsData || clientsData.length === 0) {
      return {
        totalPendingQuotations: 0,
        overallRating: 0,
        openTickets: 0,
        delayedProjects: 0
      };
    }

    const totalPendingQuotations = clientsData.reduce((total, client) => 
      total + (client.pending_quotes_amount || 0), 0
    );

    const openTickets = clientsData.reduce((total, client) => 
      total + (client.open_tickets_count || 0), 0
    );

    const delayedProjects = clientsData.reduce((total, client) => 
      total + (client.delayed_projects_count || 0) + (client.risk_projects_count || 0), 0
    );

    // Calcular promedio real de calificaciones
    const clientsWithRatings = clientsData.filter(client => client.rating_average !== undefined && client.rating_average !== null);
    const overallRating = clientsWithRatings.length > 0 
      ? clientsWithRatings.reduce((sum, client) => sum + (client.rating_average || 0), 0) / clientsWithRatings.length
      : 0;

    return {
      totalPendingQuotations: Math.round(totalPendingQuotations),
      overallRating: Math.round(overallRating * 10) / 10, // Redondear a 1 decimal
      openTickets,
      delayedProjects
    };
  };

  // Manejar creación/edición de clientes
  const handleSaveClient = async (clientData) => {
    setSavingClient(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const url = selectedClient 
        ? `http://localhost:8001/clients/${selectedClient.client_id}`
        : 'http://localhost:8001/clients/';
      
      const method = selectedClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clientData)
      });

      if (response.ok) {
        const updatedClient = await response.json();
        
        if (selectedClient) {
          // Actualizar cliente existente en el estado local
          setClients(prevClients => 
            prevClients.map(client => 
              client.client_id === selectedClient.client_id 
                ? { ...client, ...updatedClient }
                : client
            )
          );
          setSuccessMessage('Cliente actualizado correctamente');
        } else {
          // Agregar nuevo cliente al estado local
          setClients(prevClients => [...prevClients, updatedClient]);
          setSuccessMessage('Cliente creado correctamente');
        }
        
        // Limpiar caché para forzar actualización en la próxima carga
        clearDataCache();
        
        // Si se actualizó un cliente existente, actualizar su progreso de proyectos
        if (selectedClient) {
          await updateClientProjectsProgress(selectedClient.client_id);
        }
        
        // Cerrar el modal
        setShowClientModal(false);
        setSelectedClient(null);
        
        // Auto-ocultar mensaje de éxito
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar el cliente');
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setError(err.message || 'Error al guardar el cliente');
      setTimeout(() => setError(''), 5000);
      throw err; // Re-lanzar el error para que el modal lo maneje
    } finally {
      setSavingClient(false);
    }
  };

  // Manejar eliminación de clientes
  const handleDeleteClient = async (clientId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) return;
    
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        // Remover cliente del estado local
        setClients(prevClients => 
          prevClients.filter(client => client.client_id !== clientId)
        );
        
        // Limpiar caché
        clearDataCache();
        
        setSuccessMessage('Cliente eliminado correctamente');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el cliente');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
      setError(err.message || 'Error al eliminar el cliente');
      setTimeout(() => setError(''), 5000);
    }
  };

  // Manejar cambio de estado de cliente
  const handleStatusChange = async (clientId, newStatus) => {
    
    // Agregar el cliente al set de clientes siendo actualizados
    setUpdatingStatus(prev => new Set([...prev, clientId]));
    
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      
      // Enviar solo el campo que necesita cambiar
      const updatedClientData = {
        is_active: newStatus
      };
      
      const response = await fetch(`http://localhost:8001/clients/${clientId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedClientData)
      });

      if (response.ok) {
        // Actualizar solo el cliente específico en el estado local
        setClients(prevClients => 
          prevClients.map(client => 
            client.client_id === clientId 
              ? { ...client, is_active: newStatus }
              : client
          )
        );
        
        // Limpiar caché para forzar actualización en la próxima carga
        clearDataCache();
        
        setSuccessMessage(`Cliente ${newStatus ? 'activado' : 'desactivado'} correctamente`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al actualizar el estado del cliente');
      }
    } catch (err) {
      console.error('Error updating client status:', err);
      setError(err.message || 'Error al actualizar el estado del cliente');
      setTimeout(() => setError(''), 5000);
    } finally {
      // Remover el cliente del set de clientes siendo actualizados
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(clientId);
        return newSet;
      });
    }
  };

  // Obtener nombre del país
  const getCountryName = (countryCode) => {
    const country = countries.find(c => c.country_code === countryCode);
    return country ? country.country_name : countryCode;
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setSearchFilter('');
    setStatusFilter('all');
    setCountryFilter('all');
    setShowInactive(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const stats = getStats();
  const filteredClients = getFilteredClients();
  const hasActiveFilters = searchFilter || statusFilter !== 'all' || countryFilter !== 'all';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiUsers className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando clientes</h3>
          <p className="text-gray-600">Preparando tu cartera de clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="w-full p-6">
        {/* Header mejorado */}
        <div className="mb-8">
          {/* Estadísticas con diseño mejorado */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Clientes</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-xs text-gray-500 mt-1">En cartera</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                  <FiUsers className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Cotizaciones Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">${stats.pendingQuotes.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">Por facturar</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <FiDollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Calificación General</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.averageRating.toFixed(1)}</p>
                  <p className="text-xs text-gray-500 mt-1">Puntuación media</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl">
                  <FiStar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Tickets Abiertos</p>
                  <p className="text-3xl font-bold text-red-600">{stats.openTickets}</p>
                  <p className="text-xs text-gray-500 mt-1">Pendientes</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiMessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Proyectos Retrasados</p>
                  <p className="text-3xl font-bold text-red-600">{stats.delayedProjects}</p>
                  <p className="text-xs text-gray-500 mt-1">Con retrasos</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl">
                  <FiAlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Proyectos en Riesgo</p>
                  <p className="text-3xl font-bold text-amber-600">{stats.riskProjects}</p>
                  <p className="text-xs text-gray-500 mt-1">Necesitan atención</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl">
                  <FiZap className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles y filtros mejorados */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            {/* Búsqueda mejorada */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar clientes por nombre, código, email..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                />
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-3">
              {/* Botón de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  hasActiveFilters 
                    ? 'bg-orange-100 text-orange-700 border border-orange-200 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FiFilter className="w-4 h-4" />
                Filtros
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                )}
              </button>

              {/* Toggle de vista mejorado */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    viewMode === 'cards'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiGrid className="w-4 h-4" />
                  Tarjetas
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    viewMode === 'table'
                      ? 'bg-white text-gray-900 shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <FiList className="w-4 h-4" />
                  Tabla
                </button>
              </div>

              {/* Toggle para mostrar clientes inactivos */}
              <div className="flex items-center space-x-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="w-4 h-4 text-red-600 border-red-300 rounded focus:ring-red-500 focus:ring-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Mostrar inactivos</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FiAlertCircle className={`w-4 h-4 ${showInactive ? 'text-red-600' : 'text-gray-400'}`} />
                  <span className="text-xs text-gray-500">({filteredClients.filter(c => !c.is_active).length} inactivos)</span>
                </div>
              </div>

              {/* Botón de nuevo cliente mejorado */}
              {canManageClients && (
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setShowClientModal(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  <FiPlus className="w-5 h-5" />
                  Nuevo Cliente
                </button>
              )}
            </div>
          </div>

          {/* Filtros expandibles */}
          <AnimatePresence>
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">Activos</option>
                      <option value="inactive">Inactivos</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                    <select
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    >
                      <option value="all">Todos los países</option>
                      {countries.map(country => (
                        <option key={country.country_code} value={country.country_code}>
                          {country.country_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex items-end">
                    <button
                      onClick={clearAllFilters}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                    >
                      Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Contenido principal */}
        <div>
          {filteredClients.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FiUsers className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No se encontraron clientes</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Intenta ajustar los filtros de búsqueda para encontrar más clientes'
                  : canManageClients 
                    ? 'Crea el primer cliente para comenzar a gestionar tu cartera'
                    : 'No hay clientes disponibles actualmente.'
                }
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-300 font-medium shadow-lg"
                >
                  <FiZap className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClients.map((client) => (
                    <div
                      key={client.client_id}
                      className="mt-4"
                    >
                      <ClientCard
                        client={client}
                        countries={countries}
                        canManage={canManageClients}
                        onEdit={() => {
                          setSelectedClient(client);
                          setShowClientModal(true);
                        }}
                        onDelete={() => handleDeleteClient(client.client_id)}
                        onStatusChange={handleStatusChange}
                        getCountryName={getCountryName}
                        isUpdatingStatus={updatingStatus.has(client.client_id)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <ClientTable
                  clients={filteredClients}
                  countries={countries}
                  canManage={canManageClients}
                  onEdit={(client) => {
                    setSelectedClient(client);
                    setShowClientModal(true);
                  }}
                  onDelete={handleDeleteClient}
                  onStatusChange={handleStatusChange}
                  getCountryName={getCountryName}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  getSortIcon={getSortIcon}
                  updatingStatus={updatingStatus}
                />
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Modal de cliente */}
      <ClientModal
        isOpen={showClientModal}
        onClose={() => {
          setShowClientModal(false);
          setSelectedClient(null);
        }}
        client={selectedClient}
        countries={countries}
        onSave={handleSaveClient}
        isLoading={savingClient}
      />

      {/* Notificaciones */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3"
          >
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-red-500 text-white px-6 py-4 rounded-xl shadow-lg z-50 flex items-center gap-3"
          >
            <FiAlertCircle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
            <button
              onClick={() => setError('')}
              className="ml-2 p-1 hover:bg-red-600 rounded-full transition-colors"
            >
              <FiX className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}