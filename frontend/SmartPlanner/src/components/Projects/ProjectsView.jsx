import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ProjectsView({
  projects,
  clients,
  timeAnalytics,
  searchFilter,
  setSearchFilter,
  clientFilter,
  setClientFilter,
  sortConfig,
  setSortConfig,
  projectViewMode,
  setProjectViewMode,
  isSelectionMode,
  setIsSelectionMode,
  selectedProjects,
  setSelectedProjects,
  selectedProject,
  setSelectedProject,
  showModal,
  setShowModal,
  getSortedAndFilteredProjects,
  handleSort,
  getSortIcon,
  getStatusColor,
  getStatusLabel,
  getEfficiencyColor,
  getProgressColors,
  toggleProjectSelection,
  selectAllProjects,
  clearSelection,
  handleEditProject,
  handleDeleteProject,
  handleUpdateProjectStatus,
  isSuperUser,
  projectProgress,
  getProjectProgress,
  updateProjectProgress
}) {
  const theme = useAppTheme();
  const { user } = useAuth();

  // Estado global para gestionar dropdowns abiertos
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Componente para selector de estado mejorado
  const StatusSelector = ({ project, currentStatus }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [buttonRef, setButtonRef] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    
    // ID único para este dropdown
    const dropdownId = `status-dropdown-${project.project_id}`;
    const isOpen = openDropdownId === dropdownId;

    const statusOptions = [
      { value: 'registered_initiative', label: 'Iniciativa Registrada', color: 'bg-gray-100 text-gray-800', icon: '📝' },
      { value: 'in_quotation', label: 'En Cotización', color: 'bg-blue-100 text-blue-800', icon: '💰' },
      { value: 'proposal_approved', label: 'Propuesta Aprobada', color: 'bg-indigo-100 text-indigo-800', icon: '✅' },
      { value: 'in_planning', label: 'En Planeación', color: 'bg-purple-100 text-purple-800', icon: '📋' },
      { value: 'in_progress', label: 'En Progreso', color: 'bg-emerald-100 text-emerald-800', icon: '🚀' },
      { value: 'at_risk', label: 'En Riesgo', color: 'bg-amber-100 text-amber-800', icon: '⚠️' },
      { value: 'suspended', label: 'Suspendido', color: 'bg-orange-100 text-orange-800', icon: '⏸️' },
      { value: 'completed', label: 'Completado', color: 'bg-green-100 text-green-800', icon: '🎉' },
      { value: 'canceled', label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: '❌' },
      { value: 'post_delivery_support', label: 'Soporte Post-Entrega', color: 'bg-teal-100 text-teal-800', icon: '🔧' }
    ];

    const currentStatusOption = statusOptions.find(option => option.value === currentStatus);

    // Calcular posición del dropdown con mejor lógica
    useEffect(() => {
      if (isOpen && buttonRef) {
        const rect = buttonRef.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        const dropdownHeight = 320; // Altura estimada del dropdown
        const dropdownWidth = Math.max(rect.width, 280);
        
        // Determinar posición vertical
        let top;
        let showAbove = false;
        
        if (rect.bottom + dropdownHeight > viewportHeight && rect.top > dropdownHeight) {
          // Mostrar arriba si hay espacio
          top = rect.top - dropdownHeight - 8;
          showAbove = true;
        } else {
          // Mostrar abajo
          top = rect.bottom + 8;
        }
        
        // Determinar posición horizontal
        let left = rect.left;
        
        // Asegurar que no se salga de la pantalla por la derecha
        if (left + dropdownWidth > viewportWidth) {
          left = viewportWidth - dropdownWidth - 16;
        }
        
        // Asegurar que no se salga de la pantalla por la izquierda
        if (left < 16) {
          left = 16;
        }
        
        setDropdownPosition({
          top,
          left,
          width: dropdownWidth,
          showAbove
        });
      }
    }, [isOpen, buttonRef]);

    const handleStatusChange = async (newStatus) => {
      if (newStatus === currentStatus) {
        setOpenDropdownId(null);
        return;
      }

      setIsUpdating(true);
      try {
        await handleUpdateProjectStatus(project.project_id, newStatus);
        setOpenDropdownId(null);
      } catch (error) {
        console.error('Error updating status:', error);
      } finally {
        setIsUpdating(false);
      }
    };

    const handleButtonClick = (e) => {
      e.stopPropagation();
      if (!isUpdating) {
        if (isOpen) {
          setOpenDropdownId(null);
        } else {
          setOpenDropdownId(dropdownId);
        }
      }
    };

    const handleOptionClick = (e, status) => {
      e.stopPropagation();
      handleStatusChange(status);
    };

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (isOpen && buttonRef && !buttonRef.contains(e.target)) {
          setOpenDropdownId(null);
        }
      };
      
      if (isOpen) {
        // Usar setTimeout para evitar que se cierre inmediatamente
        const timer = setTimeout(() => {
          document.addEventListener('click', handleClickOutside);
        }, 100);
        
        return () => {
          clearTimeout(timer);
          document.removeEventListener('click', handleClickOutside);
        };
      }
    }, [isOpen, buttonRef]);

    return (
      <>
        <button
          ref={setButtonRef}
          onClick={handleButtonClick}
          disabled={isUpdating}
          className={`group relative px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 hover:scale-105 cursor-pointer border-2 ${
            currentStatusOption?.color || 'bg-gray-100 text-gray-800'
          } ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300 hover:shadow-md'}`}
          title="Haz clic para cambiar el estado"
        >
          {/* Indicador de hover */}
          <div className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          
          {/* Contenido del botón */}
          <div className="relative flex items-center space-x-1">
            {isUpdating ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span>Actualizando...</span>
              </>
            ) : (
              <>
                <span className="text-sm">{currentStatusOption?.icon}</span>
                <span>{currentStatusOption?.label || currentStatus}</span>
                <svg className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </div>
        </button>

        {/* Dropdown usando React Portal */}
        {isOpen && createPortal(
          <div 
            className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              maxHeight: '320px'
            }}
          >
            {/* Header del dropdown */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">Cambiar Estado</h4>
                  <p className="text-xs text-gray-600">Proyecto: {project.name}</p>
                </div>
              </div>
            </div>

            {/* Lista de opciones */}
            <div className="max-h-64 overflow-y-auto">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={(e) => handleOptionClick(e, option.value)}
                  className={`w-full text-left px-4 py-3 transition-all duration-200 hover:bg-gray-50 group/option ${
                    option.value === currentStatus
                      ? 'bg-blue-50 border-l-4 border-blue-500'
                      : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{option.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${
                          option.value === currentStatus ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </span>
                        {option.value === currentStatus && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full mt-1 ${
                        option.color.replace('bg-', 'bg-').replace(' text-', '')
                      }`}></div>
                    </div>
                    {option.value === currentStatus && (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer con información */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💡 Haz clic en cualquier estado para actualizar el proyecto
              </p>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  };

  // Función para obtener el progreso de un proyecto
  const getProjectProgressDisplay = (project) => {
    const progress = getProjectProgress(project.project_id);
    return {
      percentage: progress.progress_percentage || 0,
      totalStories: progress.total_stories || 0,
      completedStories: progress.completed_stories || 0,
      totalHours: progress.total_estimated_hours || 0,
      completedHours: progress.total_actual_hours || 0
    };
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return null;
    }
  };

  // Función simple para mostrar la fecha límite sin colores
  const getDeadlineDisplay = (endDate) => {
    if (!endDate) return { icon: '📅', text: 'Sin fecha límite', color: 'text-gray-400' };
    return { icon: '📅', text: `Límite: ${formatDate(endDate)}`, color: 'text-gray-600' };
  };

  return (
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
              <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
              <p className="text-sm text-gray-600">Encuentra exactamente lo que buscas</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            
            {/* Botones de selección múltiple y nuevo proyecto */}
            <div className="flex items-center space-x-2">
              
              {/* Botón de nuevo proyecto */}
              <button
                onClick={() => {
                  setSelectedProject(null);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 font-medium shadow-lg"
                title="Crear nuevo proyecto"
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Nuevo Proyecto</span>
                </div>
              </button>
            </div>
            
            {/* Botones de alternancia de vista */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setProjectViewMode('table')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  projectViewMode === 'table'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de tabla"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setProjectViewMode('cards')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  projectViewMode === 'cards'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Vista de tarjetas"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda general */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔍 Búsqueda
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Escribe el nombre o estado del proyecto para buscar"
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

      {/* Vista condicional: Tabla o Tarjetas */}
      {projectViewMode === 'table' ? (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                {/* Columna de selección - Solo para super_user */}
                {isSuperUser && isSelectionMode && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedProjects.size === getSortedAndFilteredProjects().length && getSortedAndFilteredProjects().length > 0}
                      onChange={selectedProjects.size === getSortedAndFilteredProjects().length ? clearSelection : selectAllProjects}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                  </th>
                )}
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('name')}
                  data-sort="name"
                >
                  <div className="flex items-center space-x-1">
                    <span>Proyecto</span>
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('status')}
                  data-sort="status"
                >
                  <div className="flex items-center space-x-1">
                    <span>Estado</span>
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('end_date')}
                  data-sort="end_date"
                >
                  <div className="flex items-center space-x-1">
                    <span>Fecha Límite</span>
                    {getSortIcon('end_date')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('progress')}
                  data-sort="progress"
                >
                  <div className="flex items-center space-x-1">
                    <span>Progreso</span>
                    {getSortIcon('progress')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('total_hours')}
                  data-sort="total_hours"
                >
                  <div className="flex items-center space-x-1">
                    <span>Horas</span>
                    {getSortIcon('total_hours')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('efficiency')}
                  data-sort="efficiency"
                >
                  <div className="flex items-center space-x-1">
                    <span>Eficiencia</span>
                    {getSortIcon('efficiency')}
                  </div>
                </th>
                <th 
                  className="group px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/80 transition-colors"
                  onClick={() => handleSort('unique_users')}
                  data-sort="unique_users"
                >
                  <div className="flex items-center space-x-1">
                    <span>Equipo</span>
                    {getSortIcon('unique_users')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getSortedAndFilteredProjects().length === 0 ? (
                <tr>
                  <td colSpan={isSuperUser && isSelectionMode ? "9" : "8"} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <div className="text-center">
                          <h3 className="text-lg font-semibold text-gray-900">No se encontraron proyectos</h3>
                          <p className="text-gray-600 mt-2">Intenta ajustar los filtros de búsqueda</p>
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
                getSortedAndFilteredProjects().map((project) => {
                  const progress = getProjectProgressDisplay(project);
                  const client = clients.find(c => c.client_id === project.client_id);
                  
                  return (
                    <tr key={project.project_id} className="hover:bg-gray-50/50 transition-colors">
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
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <span className="text-sm font-medium text-white">{project.name.charAt(0).toUpperCase()}</span>
                              </div>
                            </div>
                            <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                              <div className="text-sm text-gray-500">{client?.name || 'Sin cliente'}</div>
                            </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          <StatusSelector project={project} currentStatus={project.status} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {project.end_date ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm">{getDeadlineDisplay(project.end_date).icon}</span>
                            <span className={`text-sm font-medium ${getDeadlineDisplay(project.end_date).color}`}>
                              {getDeadlineDisplay(project.end_date).text}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin fecha límite</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-600">
                              {progress.completedStories}/{progress.totalStories} historias
                            </span>
                            <span className="font-medium">{Math.round(progress.percentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${getProgressColors(progress.percentage)}`}
                              style={{ width: `${progress.percentage}%` }}
                            />
                          </div>
                          {progress.totalHours > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {progress.completedHours}h / {progress.totalHours}h
                            </div>
                          )}
                        </div>
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {project.total_hours || 0}h
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-sm font-semibold ${getEfficiencyColor(project.efficiency)}`}>
                          {project.efficiency || '-'}
                        </span>
                      </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {project.unique_users || 0} usuarios
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project);
                            }}
                            className="group p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Editar proyecto"
                          >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                            {isSuperUser && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                            className="group p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                            title="Eliminar proyecto"
                          >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        /* Vista de tarjetas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getSortedAndFilteredProjects().length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center animate-pulse">
                  <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
    </div>
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-semibold text-gray-900">No se encontraron proyectos</h3>
                <p className="text-gray-600 mt-2">Intenta ajustar los filtros de búsqueda</p>
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
          ) : (
            getSortedAndFilteredProjects().map((project) => {
              const progress = getProjectProgressDisplay(project);
              const client = clients.find(c => c.client_id === project.client_id);
              
              return (
                <div key={project.project_id} className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    {/* Header de la tarjeta */}
                    <div className="flex items-start justify-between mb-4">
                  <div>
                          <h3 className="text-lg font-bold text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600">{client?.name || 'Sin cliente'}</p>
                          {/* Fecha límite */}
                          <div className="flex items-center space-x-1 mt-1">
                            <span className="text-sm">{getDeadlineDisplay(project.end_date).icon}</span>
                            <span className={`text-sm font-medium ${getDeadlineDisplay(project.end_date).color}`}>
                              {getDeadlineDisplay(project.end_date).text}
                            </span>
                          </div>
                </div>
                    <StatusSelector project={project} currentStatus={project.status} />
                </div>
                  
                    {/* Barra de progreso */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progreso</span>
                        <span>{progress.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${getProgressColors(progress.percentage)}`}
                          style={{ width: `${progress.percentage}%` }}
                        />
                    </div>
                  </div>
                  
                    {/* Métricas */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{project.total_hours || 0}h</div>
                        <div className="text-xs text-gray-600">Horas registradas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{project.unique_users || 0}</div>
                        <div className="text-xs text-gray-600">Usuarios involucrados</div>
                      </div>
                    </div>
                    
                    {/* Eficiencia */}
                    <div className="mb-4">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEfficiencyColor(project.efficiency)}`}>
                        {project.efficiency || '-'}
                      </span>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="text-blue-600 hover:text-blue-900 transition-colors p-2 rounded-lg hover:bg-blue-50"
                          title="Editar proyecto"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {isSuperUser && (
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600 hover:text-red-900 transition-colors p-2 rounded-lg hover:bg-red-50"
                            title="Eliminar proyecto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {isSuperUser && isSelectionMode && (
                <input
                          type="checkbox"
                          checked={selectedProjects.has(project.project_id)}
                          onChange={() => toggleProjectSelection(project.project_id)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}