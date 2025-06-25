import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import KanbanBoard from './KanbanBoardNative';
import EpicsSidebar from './EpicsSidebar';
import StoryDetailsModal from './StoryDetailsModal';
import { useFocusMode } from '../../context/FocusModeContext';
import { 
  FiFilter, FiSearch, 
  FiPlus, FiZap, FiChevronLeft, FiChevronRight, FiLayers, FiFolder, FiTarget
} from 'react-icons/fi';

export default function PlanningBoard({
  epics,
  stories,
  users,
  projects,
  selectedProject,
  selectedEpic,
  setStories,
  onUpdateStory,
  onCreateStory,
  onEpicSelect,
  onEditEpic,
  onNewEpic,
  onProjectChange,
  kanbanStates,
  filters = {},
  onFilterChange,
  viewMode = 'kanban',
  sidebarCollapsed = false,
  onToggleSidebar
}) {
  const { isFocusMode } = useFocusMode();
  
  // Estados locales
  const [selectedStory, setSelectedStory] = useState(null);
  
  // Debug: Log cuando cambia selectedStory
  useEffect(() => {
    console.log('🔍 selectedStory cambió:', selectedStory);
  }, [selectedStory]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [quickCreateMode, setQuickCreateMode] = useState(false);

  // Filtrar historias basado en búsqueda y filtros
  const filteredStories = useMemo(() => {
    let filtered = stories;

    // Filtro por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(story =>
        story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtros adicionales
    if (filters.assignedTo) {
      filtered = filtered.filter(story => story.assigned_user_id === parseInt(filters.assignedTo));
    }

    if (filters.priority) {
      filtered = filtered.filter(story => story.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter(story => story.status === filters.status);
    }

    return filtered;
  }, [stories, searchTerm, filters]);

  // Calcular estadísticas dinámicas
  const stats = useMemo(() => {
    const totalStories = filteredStories.length;
    const totalHours = filteredStories.reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
    const completedStories = filteredStories.filter(s => s.status === 'done').length;
    const completedHours = filteredStories
      .filter(s => s.status === 'done')
      .reduce((sum, s) => sum + (Number(s.estimated_hours) || 0), 0);
    const inProgressStories = filteredStories.filter(s => s.status === 'in_progress').length;
    const blockedStories = filteredStories.filter(s => s.status === 'blocked').length;
    
    const velocity = totalStories > 0 ? (completedStories / totalStories) * 100 : 0;

    return {
      totalStories,
      completedStories,
      inProgressStories,
      blockedStories,
      totalHours,
      completedHours,
      velocity: Math.round(velocity)
    };
  }, [filteredStories]);

  // Manejar creación rápida
  const handleQuickCreate = async (status) => {
    console.log('🚀 handleQuickCreate llamado con status:', status);
    console.log('🚀 onCreateStory función:', typeof onCreateStory);
    
    // Encontrar la configuración del estado para obtener el label correcto
    const statusConfig = kanbanStates.find(s => 
      s.id === status || s.key === status || s.label === status
    );
    
    const newStory = {
      title: `Nueva historia en ${statusConfig?.label || status}`,
      description: `Historia creada rápidamente en la columna ${statusConfig?.label || status}`,
      status: status, // Usar el estado exacto de la columna
      priority: 'medium',
      estimated_hours: 1,
      specialization: 'development'
    };
    
    console.log('🚀 Creando historia con estado:', status, newStory);
    
    if (typeof onCreateStory === 'function') {
      try {
        await onCreateStory(newStory);
        console.log('✅ Historia creada exitosamente desde creación rápida');
      } catch (error) {
        console.error('❌ Error en creación rápida:', error);
        // El error ya se maneja en PlanningContainer, no necesitamos hacer nada más aquí
      }
    } else {
      console.error('❌ onCreateStory no es una función');
    }
  };

  // Manejar click en historia
  const handleStoryClick = (story) => {
    console.log('🔄 Historia seleccionada:', story);
    setSelectedStory(story);
  };

  // Manejar guardado de historia
  const handleSaveStory = (updatedStory) => {
    onUpdateStory(updatedStory);
    setSelectedStory(null);
  };

  // Función para renderizar el estado sin épica seleccionada
  const renderNoEpicState = () => {
    if (!selectedProject) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiFolder className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Selecciona un Proyecto
            </h3>
            <p className="text-gray-600 mb-6">
              Elige un proyecto para comenzar a gestionar épicas e historias de usuario
            </p>
          </div>
        </div>
      );
    }

    if (epics.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiTarget className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Crea tu Primera Épica
            </h3>
            <p className="text-gray-600 mb-6">
              Las épicas te ayudan a organizar y agrupar historias de usuario relacionadas. 
              Crea una épica para comenzar.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNewEpic}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <FiPlus className="w-5 h-5" />
              Crear Primera Épica
            </motion.button>
          </div>
        </div>
      );
    }

    if (!selectedEpic) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiLayers className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Selecciona una Épica
            </h3>
            <p className="text-gray-600 mb-6">
              Tienes {epics.length} épica{epics.length !== 1 ? 's' : ''} disponible{epics.length !== 1 ? 's' : ''}. 
              Selecciona una para ver y gestionar sus historias de usuario.
            </p>
            <div className="space-y-2">
              {epics.slice(0, 3).map((epic) => (
                <motion.button
                  key={epic.epic_id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onEpicSelect(epic)}
                  className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all text-left"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: epic.color || '#3B82F6' }}
                    />
                    <span className="font-medium text-gray-900">{epic.name}</span>
                  </div>
                </motion.button>
              ))}
              {epics.length > 3 && (
                <p className="text-sm text-gray-500 mt-2">
                  Y {epics.length - 3} épica{epics.length - 3 !== 1 ? 's' : ''} más...
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  // Si no hay épica seleccionada, mostrar el estado correspondiente
  if (!selectedEpic) {
    return renderNoEpicState();
  }

  return (
    <div className={`flex h-full transition-all duration-300 ${isFocusMode ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* SIDEBAR ÉPICO DE ÉPICAS - SE CONTRAE EN MODO ENFOQUE */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`bg-white/90 backdrop-blur-xl border-r border-gray-200/50 shadow-xl transition-all duration-300 ${
              sidebarCollapsed ? 'w-20' : 'w-80'
            }`}
          >
            <EpicsSidebar
              epics={epics}
              selectedEpic={selectedEpic}
              onSelectEpic={onEpicSelect}
              stories={filteredStories}
              onNewEpic={onNewEpic}
              onEditEpic={onEditEpic}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              projects={projects}
              selectedProject={selectedProject}
              isFocusMode={isFocusMode}
              onProjectChange={onProjectChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ÁREA PRINCIPAL */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* BARRA DE HERRAMIENTAS ÉPICA - SIEMPRE VISIBLE EN PLANIFICACIÓN */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-4"
        >
          <div className="flex items-center justify-between">
            {/* Lado izquierdo: Controles de vista */}
            <div className="flex items-center gap-4">
              {/* Toggle sidebar */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleSidebar}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                {sidebarCollapsed ? <FiChevronRight className="w-5 h-5" /> : <FiChevronLeft className="w-5 h-5" />}
              </motion.button>

              {/* Título dinámico */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <FiLayers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedEpic ? selectedEpic.name : 'Todas las Historias'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedProject?.name} • {stats.totalStories} historias
                  </p>
                </div>
              </div>

              {/* Indicador de épica seleccionada */}
              {selectedEpic && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-xl border border-blue-200"
                >
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedEpic.color || '#3B82F6' }}
                  />
                  <span className="text-sm font-medium text-blue-700">
                    {Math.round(selectedEpic.progress_percentage || 0)}% completado
                  </span>
                </motion.div>
              )}
            </div>

            {/* Lado derecho: Acciones y métricas */}
            <div className="flex items-center gap-4">
              {/* Métricas rápidas */}
              <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{stats.completedStories}</span>
                  <span className="text-gray-600">completadas</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">{stats.inProgressStories}</span>
                  <span className="text-gray-600">en progreso</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center gap-2 text-sm">
                  <FiZap className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">{stats.velocity}%</span>
                  <span className="text-gray-600">velocidad</span>
                </div>
              </div>

              {/* Barra de búsqueda épica */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar historias..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Filtros avanzados */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  showFilters || Object.keys(filters).length > 0
                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FiFilter className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Panel de filtros expandible */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200"
              >
                <div className="grid grid-cols-4 gap-4">
                  {/* Filtro por asignado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Asignado a
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      value={filters.assignedTo || ''}
                      onChange={(e) => onFilterChange({ ...filters, assignedTo: e.target.value || undefined })}
                    >
                      <option value="">Todos</option>
                      {users.map(user => (
                        <option key={user.user_id || user.id} value={user.user_id || user.id}>
                          {user.full_name || user.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Filtro por prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prioridad
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      value={filters.priority || ''}
                      onChange={(e) => onFilterChange({ ...filters, priority: e.target.value || undefined })}
                    >
                      <option value="">Todas</option>
                      <option value="low">Baja</option>
                      <option value="medium">Media</option>
                      <option value="high">Alta</option>
                    </select>
                  </div>

                  {/* Filtro por estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                      value={filters.status || ''}
                      onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
                    >
                      <option value="">Todos</option>
                      {kanbanStates.map(state => (
                        <option key={state.key || state.id || state.label} value={state.key || state.id}>
                          {state.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón limpiar filtros */}
                  <div className="flex items-end">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onFilterChange({})}
                      className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                    >
                      Limpiar Filtros
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ÁREA DE CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'kanban' ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full"
            >
              <KanbanBoard
                stories={filteredStories}
                users={users}
                onStoryClick={handleStoryClick}
                setStories={setStories}
                onQuickCreate={handleQuickCreate}
                kanbanStates={kanbanStates}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-full p-6"
            >
              {/* Vista de lista épica */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 h-full overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Vista de Lista</h3>
                  <p className="text-sm text-gray-500 mt-1">Gestiona tus historias en formato tabla</p>
                </div>
                <div className="overflow-auto h-full">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Historia</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignado</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prioridad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horas</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStories.map(story => (
                        <motion.tr
                          key={story.story_id}
                          whileHover={{ backgroundColor: '#f8fafc' }}
                          onClick={() => handleStoryClick(story)}
                          className="cursor-pointer"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{story.title}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{story.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              story.status === 'done' ? 'bg-green-100 text-green-800' :
                              story.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              story.status === 'in_review' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {kanbanStates.find(s => s.id === story.status)?.label || story.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {users.find(u => u.user_id === story.assigned_user_id)?.full_name?.charAt(0) || '?'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {users.find(u => u.user_id === story.assigned_user_id)?.full_name || 'Sin asignar'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              story.priority === 'high' ? 'bg-red-100 text-red-800' :
                              story.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {story.priority === 'high' ? 'Alta' : story.priority === 'medium' ? 'Media' : 'Baja'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {story.estimated_hours || 0}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Botones de acción flotantes - OCULTOS EN MODO ENFOQUE */}
        {!isFocusMode && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed bottom-6 right-6 flex flex-col gap-3 z-40"
          >
            {/* Creación rápida */}
            <AnimatePresence>
              {quickCreateMode && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="flex flex-col gap-2 mb-2"
                >
                  {kanbanStates.slice(0, 3).map(state => (
                    <motion.button
                      key={state.key || state.id || state.label}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleQuickCreate(state.key || state.id);
                        setQuickCreateMode(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-lg border border-gray-200 text-sm font-medium hover:shadow-xl transition-all duration-200"
                      style={{ color: state.color }}
                    >
                      <span>{state.icon}</span>
                      <span>+ {state.label}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setQuickCreateMode(!quickCreateMode)}
              className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
            >
              <FiPlus className={`w-6 h-6 transition-transform duration-200 ${quickCreateMode ? 'rotate-45' : ''}`} />
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Modal de detalles de historia ÉPICO */}
      {selectedStory && (
        <StoryDetailsModal
          task={selectedStory}
          users={users}
          projects={projects}
          epics={epics}
          onClose={() => setSelectedStory(null)}
          onSave={handleSaveStory}
          onDelete={(story) => {
            console.log('🗑️ Eliminando historia:', story);
            // Actualizar el estado local
            setStories(prev => prev.filter(s => (s.story_id || s.id) !== (story.story_id || story.id)));
            setSelectedStory(null);
          }}
        />
      )}
    </div>
  );
}