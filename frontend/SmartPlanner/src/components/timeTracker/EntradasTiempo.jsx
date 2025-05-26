import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FiEdit2, FiTrash2, FiClock, FiTag, FiChevronDown,
  FiChevronUp, FiDollarSign, FiFilter, FiPlus, FiSearch, FiRefreshCw, FiX
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import { useProjectsAndTags } from './useProjectsAndTags';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';

// Orden de los estados
const STATUS_ORDER = ['pendiente', 'en_progreso', 'completada'];

// Función para normalizar estados
const normalizeStatus = (status) => {
  if (!status) return 'pendiente';
  
  const normalized = status.toLowerCase().replace(/[^a-z_]/g, '');
  
  switch (normalized) {
    case 'pendiente':
    case 'pending':
      return 'pendiente';
    case 'enprogreso':
    case 'en_progreso':
    case 'inprogress':
    case 'progreso':
      return 'en_progreso';
    case 'completada':
    case 'completed':
    case 'completado':
      return 'completada';
    default:
      return 'pendiente';
  }
};

const EntradasTiempo = ({
  entradas = [],
  onEditar = () => {},
  onEliminar = () => {},
  onExpand = () => {},
  expandedId = null,
  loading = false,
  onFilterChange = () => {},
  currentFilters = {},
  onNuevaEntrada = () => {},
  onRefresh
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'entry_date', direction: 'desc' });
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [parent] = useAutoAnimate();
  const { states: organizationStates, loading: statesLoading } = useOrganizationStates();
  const theme = useAppTheme();
  const [projects, setProjects] = useState([]);
  const [projectIdToName, setProjectIdToName] = useState({});

  // Trae datos del hook
  const { tagOptions, statusOptions } = useProjectsAndTags();

  // Actualizar filtros locales cuando cambien los filtros externos
  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  // Cargar proyectos
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.token) {
          throw new Error('No hay sesión activa');
        }

        const response = await fetch('http://localhost:8000/projects/', {
          headers: {
            'Authorization': `Bearer ${session.token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Error al cargar los proyectos');
        }

        const data = await response.json();
        setProjects(data);
        
        // Crear mapeo de ID a nombre
        const mapping = {};
        data.forEach(project => {
          mapping[project.project_id] = project.name;
        });
        setProjectIdToName(mapping);
      } catch (error) {
        console.error('Error al cargar proyectos:', error);
      }
    };

    fetchProjects();
  }, []);

  // Función para obtener campos de la entrada
  const getEntryField = useCallback((entry, field) => {
    switch (field) {
      case 'duration':
        return entry.duration_hours || 0;
      case 'project':
        return entry.project_id;
      case 'date':
        return entry.entry_date;
      case 'description':
        return entry.description;
      case 'activity_type':
        return entry.activity_type;
      case 'billable':
        return entry.billable;
      case 'tags':
        return entry.tags || [];
      case 'status':
        return entry.status;
      default:
        return entry[field];
    }
  }, []);

  const formatDuration = useCallback((duration) => {
    if (!duration) return '0.00 h';
    return `${Number(duration).toFixed(2)} h`;
  }, []);

  const formatDate = useCallback((dateStr) => {
    if (!dateStr) return '';
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Hoy';
      if (isYesterday(date)) return 'Ayer';
      return format(date, 'PPP', { locale: es });
    } catch {
      return dateStr;
    }
  }, []);

  // FILTRO CORRECTO: Aplica todos los filtros juntos y soporta project_id y activity_type
  const filteredEntries = useMemo(() => {
    return entradas.filter(entry => {
      // Filtro por proyecto
      if (localFilters.project && 
          String(getEntryField(entry, 'project')) !== String(localFilters.project)) {
        return false;
      }
      
      // Filtro por etiqueta/activity_type
      if (localFilters.tag) {
        const activityType = getEntryField(entry, 'activity_type');
        if (!activityType || 
            !activityType.toLowerCase().includes(localFilters.tag.toLowerCase())) {
          return false;
        }
      }

      // Filtro por búsqueda
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matches =
          String(getEntryField(entry, 'description')).toLowerCase().includes(searchLower) ||
          String(projectIdToName[String(getEntryField(entry, 'project'))] || '').toLowerCase().includes(searchLower) ||
          String(getEntryField(entry, 'activity_type') || '').toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      return true;
    });
  }, [entradas, localFilters, searchQuery, getEntryField, projectIdToName]);

  // Agrupar por status dinámicamente según statusOptions
  const groupedEntries = useMemo(() => {
    const groups = {};
    if (Array.isArray(statusOptions) && statusOptions.length > 0) {
      statusOptions.forEach(status => {
        groups[status] = [];
      });
    }
    filteredEntries.forEach((entry) => {
      const status = normalizeStatus(getEntryField(entry, 'status')) || 'Sin estado';
      if (!groups[status]) groups[status] = [];
      groups[status].push(entry);
    });
    return groups;
  }, [filteredEntries, statusOptions, getEntryField]);

  // Ordenar dentro de cada grupo
  const sortedGroupedEntries = useMemo(() => {
    const sorted = {};
    Object.entries(groupedEntries).forEach(([status, entries]) => {
      sorted[status] = [...entries].sort((a, b) => {
        const aValue = getEntryField(a, sortConfig.key);
        const bValue = getEntryField(b, sortConfig.key);
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    });
    return sorted;
  }, [groupedEntries, sortConfig, getEntryField]);

  // Ordena los status: pendiente primero, luego en_progreso, completada, luego los demás
  const sortedStatusKeys = useMemo(() => {
    const keys = Object.keys(sortedGroupedEntries);
    return [
      ...STATUS_ORDER.filter(status => keys.includes(status)),
      ...keys.filter(status => !STATUS_ORDER.includes(status))
    ];
  }, [sortedGroupedEntries]);

  // Contrae 'completada' por defecto
  useEffect(() => {
    if (!sortedGroupedEntries.completada) return;
    
    setCollapsed(prev => ({
      ...prev,
      completada: prev.completada === undefined ? true : prev.completada
    }));
  }, [sortedGroupedEntries.completada]);

  const handleDelete = useCallback(async (id) => {
    setDeletingId(id);
    try {
      await onEliminar(id);
    } finally {
      setDeletingId(null);
    }
  }, [onEliminar]);

  const toggleCollapse = useCallback((status) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      <FiClock className="mx-auto h-16 w-16 text-indigo-200" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No hay entradas registradas</h3>
      <p className="mt-2 text-sm text-gray-500">
        Comienza registrando tu primer entrada de tiempo
      </p>
    </motion.div>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`skeleton-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
          className="animate-pulse p-4 border rounded-lg"
        >
          <div className="flex space-x-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="flex space-x-2">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  // Handler para cambios en filtros
  const handleFilterChange = useCallback((type, value) => {
    const newFilters = {
      ...localFilters,
      [type]: value === '' ? undefined : value
    };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  }, [localFilters, onFilterChange]);

  // Limpiar filtros
  const clearFilters = useCallback(() => {
    setLocalFilters({});
    if (onFilterChange) {
      onFilterChange({});
    }
  }, [onFilterChange]);

  // Memoizar estadísticas
  const stats = useMemo(() => {
    const total = filteredEntries.length;
    const totalHours = filteredEntries.reduce((sum, entry) => {
      const duration = getEntryField(entry, 'duration');
      return sum + (Number(duration) || 0);
    }, 0);

    return {
      total,
      totalHours: totalHours.toFixed(2)
    };
  }, [filteredEntries, getEntryField]);

  // Mostrar estado de carga
  if (loading || statesLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si ocurre
  if (error || !organizationStates?.states) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <div className="text-red-600">
            {error || "Error al cargar los estados de la organización"}
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 mb-8 transition-all"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Registro de Tiempo</h2>
            <p className="text-indigo-100">Gestiona tus horas trabajadas</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-md transition-colors ${
                Object.keys(localFilters).length > 0
                  ? `${theme.PRIMARY_BG_LIGHT} ${theme.PRIMARY_COLOR_CLASS}`
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
              title="Filtros"
            >
              <FiFilter />
            </button>
            <button
              onClick={onRefresh}
              className={`p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors ${
                loading ? 'animate-spin' : ''
              }`}
              disabled={loading}
              title="Actualizar"
            >
              <FiRefreshCw />
            </button>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar entradas..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select
            className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm h-9"
            value={localFilters.project || ''}
            onChange={(e) => {
              handleFilterChange('project', e.target.value || undefined);
            }}
          >
            <option value="">Todos los proyectos</option>
            {Object.entries(projectIdToName).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm h-9"
            value={localFilters.tag || ''}
            onChange={(e) => {
              handleFilterChange('tag', e.target.value || undefined);
            }}
          >
            <option value="">Todas las categorías</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-4">
            {Object.keys(localFilters).map((filterKey) => (
              <div key={filterKey} className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{filterKey}:</span>
                <span className="text-sm font-medium">{localFilters[filterKey]}</span>
                <button
                  onClick={() => handleFilterChange(filterKey, undefined)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={clearFilters}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <FiX className="mr-1" />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Agrupación por status con color y emoji */}
      <div className="overflow-x-auto px-4 py-2">
        {loading ? (
          <LoadingSkeleton />
        ) : sortedStatusKeys.length === 0 ? (
          <EmptyState />
        ) : (
          sortedStatusKeys.map((status) => {
            const state = organizationStates.states.find(s => s.id === status) || 
                         organizationStates.states.find(s => s.id === organizationStates.default_state);
            
            // Mapear colores a clases de Tailwind
            const colorMap = {
              'red': 'bg-red-100 text-red-700',
              'blue': 'bg-blue-100 text-blue-700',
              'green': 'bg-green-100 text-green-700',
              'yellow': 'bg-yellow-100 text-yellow-700',
              'gray': 'bg-gray-100 text-gray-700',
              'purple': 'bg-purple-100 text-purple-700',
              'orange': 'bg-orange-100 text-orange-700',
              'indigo': 'bg-indigo-100 text-indigo-700',
              'pink': 'bg-pink-100 text-pink-700'
            };

            const meta = {
              color: colorMap[state.color] || 'bg-gray-100 text-gray-500',
              emoji: state.icon,
              label: state.label
            };

            return (
              <div key={`status-group-${status}`} className="mb-6">
                <button
                  className={`w-full flex items-center justify-between px-4 py-2 ${meta.color} rounded-t transition font-semibold`}
                  onClick={() => toggleCollapse(status)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{meta.emoji}</span>
                    <span>{meta.label}</span>
                    <span className="ml-2 text-xs bg-white/50 rounded-full px-2 py-0.5 text-gray-700 font-normal">
                      ({sortedGroupedEntries[status]?.length || 0})
                    </span>
                  </span>
                  {collapsed[status] ? <FiChevronDown /> : <FiChevronUp />}
                </button>
                {!collapsed[status] && sortedGroupedEntries[status]?.map((entry) => {
                  const entryId = entry.entry_id || entry.id;
                  const isExpanded = expandedId === entryId;
                  const isHovered = hoveredId === entryId;
                  const isDeleting = deletingId === entryId;
                  return (
                    <motion.div
                      key={`entry-${entryId}`}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className="mb-3"
                    >
                      <motion.div
                        layout
                        className={`rounded-xl overflow-hidden border transition-all ${
                          isExpanded
                            ? 'border-indigo-300 shadow-lg'
                            : isHovered
                              ? 'border-gray-200 shadow-md'
                              : 'border-gray-100 shadow-sm'
                        }`}
                        whileHover={{ scale: 1.005 }}
                        onHoverStart={() => setHoveredId(entryId)}
                        onHoverEnd={() => setHoveredId(null)}
                      >
                        <div
                          className={`p-4 cursor-pointer transition-colors ${
                            isExpanded ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'
                          }`}
                          onClick={() => onExpand(isExpanded ? null : entryId)}
                        >
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 h-12 w-12 flex items-center justify-center rounded-xl mr-4 ${
                              getEntryField(entry, 'billable')
                                ? 'bg-green-100 text-green-600'
                                : 'bg-indigo-100 text-indigo-600'
                            }`}>
                              <FiClock size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                  {getEntryField(entry, 'description') || 'Sin descripción'}
                                </h3>
                                <span className="ml-2 text-sm font-semibold text-indigo-600">
                                  {formatDuration(getEntryField(entry, 'duration'))}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  {projectIdToName[getEntryField(entry, 'project')] || `Proyecto ${getEntryField(entry, 'project')}`}
                                </span>
                                {getEntryField(entry, 'tags')?.length > 0
                                  ? getEntryField(entry, 'tags').map((tag, index) => (
                                      <span
                                        key={`tag-${entryId}-${index}-${typeof tag === 'string' ? tag : tag.name}`}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                      >
                                        <FiTag className="mr-1" size={10} />
                                        {typeof tag === 'string' ? tag : tag.name}
                                      </span>
                                    ))
                                  : getEntryField(entry, 'activity_type') && (
                                      <span
                                        key={`activity-${entryId}-${getEntryField(entry, 'activity_type')}`}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                      >
                                        <FiTag className="mr-1" size={10} />
                                        {getEntryField(entry, 'activity_type')}
                                      </span>
                                    )}
                                {getEntryField(entry, 'billable') && (
                                  <Tooltip title="Facturable" position="top" trigger="mouseenter">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      <FiDollarSign className="mr-1" size={10} />
                                      $
                                    </span>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-sm text-gray-500">
                                  {formatDate(getEntryField(entry, 'date'))}
                                </span>
                                <div className="flex space-x-2">
                                  <Tooltip title="Editar" position="top" trigger="mouseenter">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditar(entry);
                                      }}
                                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100 transition-colors"
                                    >
                                      <FiEdit2 size={18} />
                                    </motion.button>
                                  </Tooltip>
                                  <Tooltip title="Eliminar" position="top" trigger="mouseenter">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(entryId);
                                      }}
                                      className={`text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100 transition-colors ${
                                        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      disabled={isDeleting}
                                    >
                                      <FiTrash2 size={18} />
                                    </motion.button>
                                  </Tooltip>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="bg-white border-t border-gray-200 overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Detalles</h4>
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm text-gray-500">Proyecto</p>
                                        <p className="text-sm font-medium text-gray-900">
                                          {projectIdToName[String(getEntryField(entry, 'project'))] || 'Sin proyecto'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Fecha</p>
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatDate(getEntryField(entry, 'date'))}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500">Duración</p>
                                        <p className="text-sm font-medium text-gray-900">
                                          {formatDuration(getEntryField(entry, 'duration'))}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-500 mb-2">Descripción</h4>
                                    <p className="text-sm text-gray-900 whitespace-pre-line">
                                      {getEntryField(entry, 'description') || 'Sin descripción'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </motion.section>
  );
};

export default EntradasTiempo;