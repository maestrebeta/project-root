import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "../../context/ThemeContext";
import { 
  FiChevronDown, FiChevronRight, FiFilter, FiPlus, FiEdit2, FiTarget, FiSearch, FiTrendingUp, FiUsers, FiClock, 
  FiZap, FiActivity, FiStar, FiFlag, FiEdit3, FiMoreVertical, FiLayers, FiBarChart2, FiCheckCircle
} from "react-icons/fi";

// Componente principal del sidebar de épicas
export default function EpicsSidebar({
  epics,
  selectedEpic,
  onSelectEpic,
  stories = [],
  onNewEpic,
  onEditEpic,
  searchTerm,
  onSearchChange,
  projects = [],
  selectedProject,
  onProjectChange,
  isFocusMode = false
}) {
  const theme = useAppTheme();
  const [showCompleted, setShowCompleted] = useState(true);
  const [collapsedEpics, setCollapsedEpics] = useState({});
  const [collapsedProjects, setCollapsedProjects] = useState({});
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overview: isFocusMode,
    epics: true,
    analytics: false
  });
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Calcular estadísticas de épicas con historias
  const epicsWithStats = useMemo(() => {
    return epics.map(epic => {
      // Filtrar historias que pertenecen a esta épica
      const epicStories = stories.filter(story => 
        story.epic_id === epic.epic_id || story.epica_id === epic.epic_id
      );
      
      const totalStories = epicStories.length;
      const doneStories = epicStories.filter(story => 
        story.status === 'done' || story.estado === 'done' || story.estado === 'cerrado'
      ).length;
      
      const progress = totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
      
      return {
        ...epic,
        totalStories,
        doneStories,
        progress,
        hasCompleted: doneStories > 0,
        hasActive: totalStories - doneStories > 0,
      };
    });
  }, [epics, stories]);

  // Filtrado de épicas
  const filteredEpics = useMemo(() => {
    let result = epicsWithStats;
    
    // Filtrar por proyecto seleccionado
    if (selectedProject) {
      result = result.filter(epic => epic.project_id === selectedProject.project_id);
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(epic =>
        (epic.name || epic.nombre || '').toLowerCase().includes(term) ||
        (epic.description || epic.descripcion || '').toLowerCase().includes(term)
      );
    }
    
    // Filtrar épicas completadas
    if (!showCompleted) {
      result = result.filter(epic => epic.hasActive);
    }
    
    if (filterPriority) {
      result = result.filter(epic => epic.priority === filterPriority);
    }

    if (filterStatus) {
      result = result.filter(epic => epic.status === filterStatus);
    }
    
    return result;
  }, [epicsWithStats, searchTerm, showCompleted, selectedProject, filterPriority, filterStatus]);

  // Agrupar épicas por proyecto
  const epicsByProject = useMemo(() => {
    const map = {};
    filteredEpics.forEach(epic => {
      const pid = epic.project_id || "Sin proyecto";
      if (!map[pid]) map[pid] = [];
      map[pid].push(epic);
    });
    return map;
  }, [filteredEpics]);

  // Calcular progreso global por proyecto
  const projectProgress = useMemo(() => {
    const progressMap = {};
    projects.forEach(project => {
      const projectEpics = epicsByProject[project.project_id] || [];
      let totalStories = 0;
      let doneStories = 0;
      projectEpics.forEach(epic => {
        totalStories += epic.totalStories;
        doneStories += epic.doneStories;
      });
      progressMap[project.project_id] = {
        totalStories,
        doneStories,
        percent: totalStories ? (doneStories / totalStories) * 100 : 0,
      };
    });
    
    // Para épicas sin proyecto
    if (epicsByProject["Sin proyecto"]) {
      let totalStories = 0;
      let doneStories = 0;
      epicsByProject["Sin proyecto"].forEach(epic => {
        totalStories += epic.totalStories;
        doneStories += epic.doneStories;
      });
      progressMap["Sin proyecto"] = {
        totalStories,
        doneStories,
        percent: totalStories ? (doneStories / totalStories) * 100 : 0,
      };
    }
    return progressMap;
  }, [projects, epicsByProject]);

  const toggleEpicCollapse = epicId => {
    setCollapsedEpics(prev => ({
      ...prev,
      [epicId]: !prev[epicId]
    }));
  };

  const toggleProjectCollapse = projectId => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Ordenar proyectos por porcentaje de avance ascendente
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const pa = projectProgress[a.project_id]?.percent ?? 0;
      const pb = projectProgress[b.project_id]?.percent ?? 0;
      return pa - pb;
    });
  }, [projects, projectProgress]);

  // Función para obtener el color de prioridad
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Función para obtener el color de estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'backlog':
        return 'bg-gray-100 text-gray-700';
      case 'planning':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'review':
        return 'bg-purple-100 text-purple-700';
      case 'done':
        return 'bg-green-100 text-green-700';
      case 'blocked':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calcular estadísticas del proyecto
  const projectStats = useMemo(() => {
    const projectStories = stories.filter(story => 
      !selectedProject || story.project_id === selectedProject.project_id
    );
    
    const totalStories = projectStories.length;
    const completedStories = projectStories.filter(s => s.status === 'done').length;
    const inProgressStories = projectStories.filter(s => s.status === 'in_progress').length;
    const totalHours = projectStories.reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
    const completedHours = projectStories
      .filter(s => s.status === 'done')
      .reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
    
    const velocity = totalStories > 0 ? (completedStories / totalStories) * 100 : 0;
    const pointsVelocity = totalHours > 0 ? (completedHours / totalHours) * 100 : 0;

    return {
      totalStories,
      completedStories,
      inProgressStories,
      totalHours,
      completedHours,
      velocity,
      pointsVelocity,
      totalEpics: epics.length,
      activeEpics: epics.filter(e => e.status === 'in_progress' || e.status === 'planned').length
    };
  }, [stories, epics, selectedProject]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-white to-gray-50/50 overflow-hidden">
      {/* Header épico - Simplificado en modo enfoque */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden ${
          isFocusMode ? 'p-3' : 'p-6'
        }`}
      >
        {/* Efectos de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
        
        <div className="relative z-10">
          {isFocusMode ? (
            // Versión intermedia para modo enfoque con más detalles
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <FiLayers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Épicas</h2>
                  <button
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                    className="text-xs opacity-80 hover:opacity-100 hover:underline transition-all duration-200 flex items-center gap-1"
                  >
                    {selectedProject?.name || 'Todos los proyectos'}
                    <FiChevronDown className={`w-3 h-3 transition-transform duration-200 ${showProjectSelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Métricas rápidas compactas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FiTarget className="w-3 h-3" />
                    <span className="text-xs font-medium">Épicas</span>
                  </div>
                  <div className="text-lg font-bold">{projectStats.totalEpics}</div>
                  <div className="text-xs opacity-80">{projectStats.activeEpics} activas</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FiActivity className="w-3 h-3" />
                    <span className="text-xs font-medium">Historias</span>
                  </div>
                  <div className="text-lg font-bold">{projectStats.totalStories}</div>
                  <div className="text-xs opacity-80">{projectStats.completedStories} completadas</div>
                </div>
              </div>

              {/* Progreso general compacto */}
              <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold">Progreso General</h4>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="opacity-80">Completadas</span>
                    <span className="font-medium">{projectStats.completedStories}/{projectStats.totalStories}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="opacity-80">Horas</span>
                    <span className="font-medium">{projectStats.completedHours}/{projectStats.totalHours}</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-1.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${projectStats.pointsVelocity}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-1.5 bg-white rounded-full"
                    />
                  </div>
                </div>
              </div>

              {/* Métricas clave */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FiZap className="w-3 h-3" />
                    <span className="text-xs font-medium">Velocidad</span>
                  </div>
                  <div className="text-lg font-bold">{Math.round(projectStats.velocity)}%</div>
                </div>
                
                <div className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className="flex items-center gap-1 mb-1">
                    <FiActivity className="w-3 h-3" />
                    <span className="text-xs font-medium">En Progreso</span>
                  </div>
                  <div className="text-lg font-bold">{projectStats.inProgressStories}</div>
                </div>
              </div>
            </div>
          ) : (
            // Versión completa
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <FiLayers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Épicas</h2>
                  <button
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                    className="text-sm opacity-90 hover:opacity-100 hover:underline transition-all duration-200 flex items-center gap-1"
                  >
                    {selectedProject?.name || 'Todos los proyectos'}
                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${showProjectSelector ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <FiTarget className="w-4 h-4" />
                    <span className="text-sm font-medium">Épicas</span>
                  </div>
                  <div className="text-2xl font-bold">{projectStats.totalEpics}</div>
                  <div className="text-xs opacity-80">{projectStats.activeEpics} activas</div>
                </div>
                
                <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <FiActivity className="w-4 h-4" />
                    <span className="text-sm font-medium">Historias</span>
                  </div>
                  <div className="text-2xl font-bold">{projectStats.totalStories}</div>
                  <div className="text-xs opacity-80">{projectStats.completedStories} completadas</div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Dropdown del selector de proyectos */}
      <AnimatePresence>
        {showProjectSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-gray-200 overflow-hidden"
          >
            <div className="p-3 bg-gray-50">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projects.map(project => (
                  <button
                    key={project.project_id}
                    onClick={() => {
                      onProjectChange && onProjectChange(project);
                      setShowProjectSelector(false);
                    }}
                    className={`w-full p-2 rounded-lg text-left transition-all duration-200 ${
                      selectedProject?.project_id === project.project_id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{project.name}</div>
                        <div className="text-xs opacity-70 truncate">{project.description}</div>
                      </div>
                      {selectedProject?.project_id === project.project_id && (
                        <FiCheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de búsqueda y filtros - Ocultos en modo enfoque */}
      {!isFocusMode && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative mb-3">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar épicas..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>

          {/* Filtros rápidos */}
          <div className="flex gap-2">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las prioridades</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="backlog">Backlog</option>
              <option value="planning">Planeación</option>
              <option value="in_progress">En progreso</option>
              <option value="review">En revisión</option>
              <option value="done">Completada</option>
              <option value="blocked">Bloqueada</option>
            </select>
          </div>
        </div>
      )}

      {/* Contenido principal - Simplificado en modo enfoque */}
      <div className="flex-1 overflow-y-auto">
        {isFocusMode ? (
          // Versión intermedia para modo enfoque con más detalles
          <div className="p-3">
            <div className="space-y-3">
              {filteredEpics.slice(0, 6).map((epic) => {
                const epicStories = stories.filter(s => s.epic_id === epic.epic_id);
                const completedEpicStories = epicStories.filter(s => s.status === 'done');
                const epicProgress = epicStories.length > 0 ? (completedEpicStories.length / epicStories.length) * 100 : 0;
                const epicHours = epicStories.reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
                const completedHours = epicStories
                  .filter(s => s.status === 'done')
                  .reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
                const isSelected = selectedEpic?.epic_id === epic.epic_id;

                return (
                  <motion.button
                    key={epic.epic_id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectEpic(epic)}
                    className={`w-full p-3 rounded-lg transition-all duration-200 ${
                      isSelected
                        ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent hover:border-gray-300'
                    }`}
                  >
                    {/* Header de la épica */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div 
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: epic.color || '#3B82F6' }}
                        />
                        <div className="text-xs font-medium text-gray-700 text-left line-clamp-2 flex-1">
                          {epic.name}
                        </div>
                      </div>
                      <div className="text-xs font-bold text-gray-600 flex-shrink-0">
                        {Math.round(epicProgress)}%
                      </div>
                    </div>

                    {/* Progreso bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${epicProgress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-1.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                      />
                    </div>

                    {/* Métricas de la épica */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <FiActivity className="w-3 h-3" />
                          {epicStories.length} historias
                        </span>
                        <span className="flex items-center gap-1">
                          <FiCheckCircle className="w-3 h-3" />
                          {completedEpicStories.length} completadas
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FiClock className="w-3 h-3" />
                        {completedHours}/{epicHours}h
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              {filteredEpics.length > 6 && (
                <div className="text-center text-xs text-gray-500 py-2 bg-gray-50 rounded-lg">
                  +{filteredEpics.length - 6} épicas más
                </div>
              )}
            </div>
          </div>
        ) : (
          // Versión completa
          <>
            {/* Sección de resumen */}
            <div className="p-4">
              <motion.button
                onClick={() => toggleSection('overview')}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <FiBarChart2 className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Resumen del Proyecto</span>
                </div>
                <motion.div
                  animate={{ rotate: expandedSections.overview ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiChevronDown className="w-4 h-4 text-gray-500" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {expandedSections.overview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 space-y-3"
                  >
                    {/* Progreso general */}
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">Progreso General</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Historias completadas</span>
                          <span className="font-medium">{projectStats.completedStories}/{projectStats.totalStories}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Horas completadas</span>
                          <span className="font-medium">{projectStats.completedHours}/{projectStats.totalHours}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${projectStats.pointsVelocity}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Métricas clave */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FiZap className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium text-gray-700">Velocidad</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{Math.round(projectStats.velocity)}%</div>
                      </div>
                      
                      <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <FiActivity className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-gray-700">En Progreso</span>
                        </div>
                        <div className="text-xl font-bold text-gray-900">{projectStats.inProgressStories}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Lista de épicas */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FiTarget className="w-5 h-5 text-blue-600" />
                  Épicas ({filteredEpics.length})
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onNewEpic}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiPlus className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEpics.map((epic, index) => {
                    const epicStories = stories.filter(s => s.epic_id === epic.epic_id);
                    const completedEpicStories = epicStories.filter(s => s.status === 'done');
                    const epicProgress = epicStories.length > 0 ? (completedEpicStories.length / epicStories.length) * 100 : 0;
                    const isSelected = selectedEpic?.epic_id === epic.epic_id;

                    return (
                      <motion.div
                        key={epic.epic_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        onClick={() => onSelectEpic(epic)}
                        className={`
                          p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-lg' 
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
                          }
                        `}
                      >
                        {/* Header de la épica */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                              {epic.name}
                            </h4>
                            {epic.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {epic.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 ml-3">
                            {/* Indicador de prioridad */}
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getPriorityColor(epic.priority)}`} />
                            
                            {/* Botón de edición */}
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditEpic(epic);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <FiEdit3 className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Métricas de la épica */}
                        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <FiActivity className="w-3 h-3" />
                            <span>{epicStories.length} historias</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiTarget className="w-3 h-3" />
                            <span>{epicStories.reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0)} horas</span>
                          </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="mb-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-medium text-gray-700">Progreso</span>
                            <span className="text-xs font-bold text-gray-900">{Math.round(epicProgress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${epicProgress}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                              className="h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                            />
                          </div>
                        </div>

                        {/* Estado y estadísticas */}
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(epic.status)}`}>
                            {epic.status === 'completed' ? 'Completada' :
                             epic.status === 'in_progress' ? 'En progreso' :
                             epic.status === 'planned' ? 'Planeada' :
                             epic.status === 'on_hold' ? 'En pausa' : epic.status}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            {epic.color && (
                              <div 
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                style={{ backgroundColor: epic.color }}
                              />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredEpics.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <div className="text-4xl mb-3">🎯</div>
                    <h4 className="font-semibold text-gray-900 mb-2">No hay épicas</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      {searchTerm || filterPriority || filterStatus 
                        ? 'No se encontraron épicas con los filtros aplicados'
                        : 'Crea tu primera épica para organizar las historias'
                      }
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onNewEpic}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <FiPlus className="w-4 h-4 inline mr-2" />
                      Crear Épica
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}