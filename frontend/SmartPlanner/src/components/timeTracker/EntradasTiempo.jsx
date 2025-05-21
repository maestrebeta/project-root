import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FiEdit2, FiTrash2, FiClock, FiTag, FiChevronDown,
  FiChevronUp, FiDollarSign, FiFilter, FiPlus, FiSearch
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tooltip } from 'react-tippy';
import 'react-tippy/dist/tippy.css';
import { useProjectsAndTags } from './useProjectsAndTags';

// Mapea status a color y emoji tipo semáforo
const STATUS_META = {
  pending:   { color: 'bg-yellow-100 text-yellow-800', emoji: '🟡', label: 'Pendiente' },
  in_progress: { color: 'bg-blue-100 text-blue-800 animate-pulse', emoji: '🔵', label: 'En progreso' },
  draft:     { color: 'bg-gray-100 text-gray-700', emoji: '⚪', label: 'Borrador' },
  completed: { color: 'bg-green-100 text-green-800', emoji: '🟢', label: 'Completada' },
  // Otros estados pueden agregarse aquí
};

const STATUS_ORDER = ['pending', 'in_progress', 'draft', 'completed'];

const EntradasTiempo = ({
  entradas = [],
  onEditar = () => {},
  onEliminar = () => {},
  onExpand = () => {},
  expandedId = null,
  loading = false,
  onFilterChange = () => {},
  currentFilters = {},
  onNuevaEntrada = () => {}
}) => {
  const [sortConfig, setSortConfig] = useState({ key: 'entry_date', direction: 'desc' });
  const [hoveredId, setHoveredId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Trae datos del hook
  const { projectIdToName, tagOptions, statusOptions } = useProjectsAndTags();

  // Utilidad para obtener campos de la entrada
  const getEntryField = useCallback((entry, field) => {
    const fieldMap = {
      id: ['id', 'entry_id'],
      description: ['description', 'descripcion'],
      project: ['project_id'],
      date: ['entry_date', 'fecha'],
      duration: ['duration_hours', 'duration', 'duracion'],
      tags: ['tags', 'etiquetas'],
      billable: ['billable', 'facturable'],
      status: ['status'],
      activity_type: ['activity_type'],
    };
    const fields = fieldMap[field] || [field];
    for (const f of fields) {
      if (entry[f] !== undefined) return entry[f];
    }
    return null;
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
      // Filtro por proyecto (asegura tipo string y compara con project_id)
      if (
        currentFilters.project &&
        String(getEntryField(entry, 'project')) !== String(currentFilters.project)
      ) {
        return false;
      }
      // Filtro por etiqueta/activity_type (case-insensitive, soporta string y array)
      if (currentFilters.tag) {
        // Puede ser que los tags vengan como array o como string (activity_type)
        const tags = getEntryField(entry, 'tags') || [];
        const activityType = getEntryField(entry, 'activity_type');
        const tagFilter = currentFilters.tag.trim().toLowerCase();

        // Si hay tags, busca en el array
        if (tags.length > 0) {
          const tagsNormalized = tags.map(t =>
            typeof t === 'string'
              ? t.trim().toLowerCase()
              : (t.name || '').trim().toLowerCase()
          );
          if (!tagsNormalized.includes(tagFilter)) {
            return false;
          }
        } else if (activityType) {
          // Si no hay tags pero sí activity_type, compara con activity_type
          if (String(activityType).trim().toLowerCase() !== tagFilter) {
            return false;
          }
        } else {
          // Si no hay ni tags ni activity_type, no pasa el filtro
          return false;
        }
      }
      // Filtro por búsqueda (si hay texto, debe coincidir alguno)
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matches =
          String(getEntryField(entry, 'description')).toLowerCase().includes(searchLower) ||
          String(projectIdToName[String(getEntryField(entry, 'project'))] || '').toLowerCase().includes(searchLower) ||
          (getEntryField(entry, 'tags') || [])
            .map(t => (typeof t === 'string' ? t : t.name || ''))
            .some(tag => tag.toLowerCase().includes(searchLower)) ||
          String(getEntryField(entry, 'activity_type') || '').toLowerCase().includes(searchLower);
        if (!matches) return false;
      }
      return true;
    });
  }, [entradas, searchQuery, getEntryField, projectIdToName, currentFilters]);

  // Agrupar por status dinámicamente según statusOptions
  const groupedEntries = useMemo(() => {
    const groups = {};
    if (Array.isArray(statusOptions) && statusOptions.length > 0) {
      statusOptions.forEach(status => {
        groups[status] = [];
      });
    }
    filteredEntries.forEach((entry) => {
      const status = getEntryField(entry, 'status') || 'Sin estado';
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

  // Ordena los status: pending primero, luego in_progress, draft, completed, luego los demás
  const sortedStatusKeys = useMemo(() => {
    const keys = Object.keys(sortedGroupedEntries);
    return [
      ...STATUS_ORDER.filter(status => keys.includes(status)),
      ...keys.filter(status => !STATUS_ORDER.includes(status))
    ];
  }, [sortedGroupedEntries]);

  // Contrae 'completed' por defecto
  useEffect(() => {
    setCollapsed(prev => {
      const next = { ...prev };
      if ('completed' in sortedGroupedEntries && next.completed === undefined) {
        next.completed = true;
      }
      return next;
    });
  }, [sortedGroupedEntries]);

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
          key={i}
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
            value={currentFilters.project || ''}
            onChange={(e) => {
              onFilterChange({ project: e.target.value || undefined });
            }}
          >
            <option value="">Todos los proyectos</option>
            {Object.entries(projectIdToName).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 shadow-sm h-9"
            value={currentFilters.tag || ''}
            onChange={(e) => {
              onFilterChange({ tag: e.target.value || undefined });
            }}
          >
            <option value="">Todas las categorías</option>
            {tagOptions.map((tag) => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agrupación por status con color y emoji */}
      <div className="overflow-x-auto px-4 py-2">
        {loading ? (
          <LoadingSkeleton />
        ) : sortedStatusKeys.length === 0 ? (
          <EmptyState />
        ) : (
          sortedStatusKeys.map((status) => {
            const meta = STATUS_META[status] || {
              color: 'bg-gray-100 text-gray-500',
              emoji: '⚫',
              label: status.charAt(0).toUpperCase() + status.slice(1)
            };
            return (
              <div key={status} className="mb-6">
                <button
                  className={`w-full flex items-center justify-between px-4 py-2 ${meta.color} rounded-t transition font-semibold`}
                  onClick={() => toggleCollapse(status)}
                  type="button"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xl animate-pulse">{meta.emoji}</span>
                    <span>{meta.label}</span>
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({sortedGroupedEntries[status]?.length || 0})
                    </span>
                  </span>
                  {collapsed[status] ? <FiChevronDown /> : <FiChevronUp />}
                </button>
                {!collapsed[status] && sortedGroupedEntries[status]?.map((entry) => {
                  const entryId = getEntryField(entry, 'id');
                  const isExpanded = expandedId === entryId;
                  const isHovered = hoveredId === entryId;
                  const isDeleting = deletingId === entryId;
                  return (
                    <motion.div
                      key={entryId}
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
                                  {projectIdToName[String(getEntryField(entry, 'project'))] || 'Sin proyecto'}
                                </span>
                                {/* Mostrar etiquetas si existen, si no, mostrar activity_type */}
                                {getEntryField(entry, 'tags')?.length > 0
                                  ? getEntryField(entry, 'tags').map((tag) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                      >
                                        <FiTag className="mr-1" size={10} />
                                        {typeof tag === 'string' ? tag : tag.name}
                                      </span>
                                    ))
                                  : getEntryField(entry, 'activity_type') && (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
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
                                        onEliminar(entry);
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