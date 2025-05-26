import React, { useState, useMemo, useCallback, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppTheme } from "../../context/ThemeContext";
import { useNavigate } from "react-router-dom";

// Carga dinámica con React.lazy
const EpicsSidebar = lazy(() => import('./EpicsSidebar'));
const KanbanBoard = lazy(() => import('./KanbanBoard'));
const StoryDetailsModal = lazy(() => import('./StoryDetailsModal'));


export default function PlanningBoard({
  epics,
  sprints,
  stories,
  users,
  projects,
  setStories,
  onUpdateStory,
  onCreateStory,
  kanbanStates,
  onEditKanbanStates,
  filters = {},
  onFilterChange
}) {
  const theme = useAppTheme();
  const navigate = useNavigate();
  const [selectedEpic, setSelectedEpic] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [activeSprint, setActiveSprint] = useState(sprints.find(s => s.estado === 'Activo') || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);

  // Memoized filtered stories
  const filteredStories = useMemo(() => {
    let result = [...stories];
    
    // Filtro por épica
    if (selectedEpic && selectedEpic.id) {
      result = result.filter(st => st.epica_id === selectedEpic.id);
    }

    // Filtro por proyecto
  if (selectedProject) {
    result = result.filter(st => st.proyecto_id === selectedProject);
  }
    
    // Filtro por sprint activo
    if (activeSprint && activeSprint.id) {
      result = result.filter(st => st.sprint_id === activeSprint.id);
    }
    
    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(st => 
        (st.titulo || "").toLowerCase().includes(term) || 
        (st.descripcion || "").toLowerCase().includes(term) ||
        ((st.etiquetas || []).some(tag => (tag || "").toLowerCase().includes(term)))
      );
    }
    
    // Filtros adicionales
    if (filters.priority) {
      result = result.filter(st => st.prioridad === filters.priority);
    }
    if (filters.status) {
      result = result.filter(st => st.estado === filters.status);
    }
    if (filters.assignedTo) {
      result = result.filter(st => st.usuario_asignado === filters.assignedTo);
    }
    
    return result;
  }, [stories, selectedEpic, selectedProject, activeSprint, searchTerm, filters]);

  // Estadísticas clave para el dashboard
  const stats = useMemo(() => {
    const totalStories = filteredStories.length;
    const completedStories = filteredStories.filter(st => st.estado === 'cerrado').length;
    const inProgressStories = filteredStories.filter(st => st.estado === 'en_progreso').length;
    const blockedStories = filteredStories.filter(st => st.estado === 'bloqueado').length;

    const totalHours = filteredStories.reduce(
      (sum, st) => sum + Object.values(st.estimaciones || {}).reduce((a, b) => a + Number(b || 0), 0),
      0
    );
    
    return {
      totalStories,
      completedStories,
      completionRate: totalStories ? Math.round((completedStories / totalStories) * 100) : 0,
      inProgressStories,
      blockedStories,
      totalHours
    };
  }, [filteredStories]);

  // Handlers memoizados
  const handleSaveStory = useCallback((story) => {
    if (selectedStory) {
      onUpdateStory(story);
    } else {
      onCreateStory(story);
    }
    setSelectedStory(null);
    setShowNew(false);
  }, [selectedStory, onUpdateStory, onCreateStory]);

  const handleQuickCreate = useCallback((status) => {
    const newStory = {
      titulo: 'Nueva historia',
      descripcion: '',
      estado: status,
      prioridad: 'Media',
      epica_id: selectedEpic?.id || null,
      sprint_id: activeSprint?.id || null,
      estimaciones: { UI: 0, Desarrollo: 0, Documentación: 0 },
      etiquetas: [],
      checklist: []
    };
    setSelectedStory(newStory);
    setShowNew(true);
  }, [selectedEpic, activeSprint]);

  return (
    <div className={`flex h-[calc(100vh-64px)] bg-gray-50 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Sidebar de Épicas */}
      <Suspense fallback={<div className="w-64 bg-gray-100" />}>
        <EpicsSidebar 
          epics={epics} 
          selectedEpic={selectedEpic} 
          onSelectEpic={setSelectedEpic} 
          stories={stories}
          projects={projects}
        />
      </Suspense>
      
      {/* Área principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header con controles */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedEpic ? selectedEpic.nombre : 'Todos los Proyectos'}
              </h1>
              
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Buscar historias..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg 
                  className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/manager/planning/kanban-states')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg 
                  bg-gray-100 hover:bg-gray-200 text-gray-700
                  transition-colors duration-200 text-sm font-medium`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gestionar Estados
              </button>
              
              <button
                className={`flex items-center gap-2 bg-${theme.PRIMARY_COLOR}-600 text-white px-4 py-2 rounded-lg hover:bg-${theme.PRIMARY_COLOR}-700 transition-colors text-sm font-medium`}
                onClick={() => setShowNew(true)}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Historia
              </button>
            </div>
          </div>
          
          {/* Filtros rápidos */}
          
          <div className="flex items-center gap-4 mt-4 overflow-x-auto pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Prioridad:</span>
              <select
                className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={filters.priority || ''}
                onChange={(e) => onFilterChange({ ...filters, priority: e.target.value || undefined })}
              >
                <option value="">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Asignado:</span>
              <select
                className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={filters.assignedTo || ''}
                onChange={(e) => onFilterChange({ ...filters, assignedTo: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.nombre}
                  </option>
                ))}
              </select>
            </div>
          
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sprint:</span>
              <select
                className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={activeSprint?.id || ''}
                onChange={(e) => setActiveSprint(sprints.find(s => s.id === e.target.value) || null)}
              >
                <option value="">Todos</option>
                {sprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.nombre} {sprint.estado === 'Activo' && '(Activo)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Estado:</span>
              <select
                className="border rounded-lg px-3 py-1 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                value={filters.status || ''}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value || undefined })}
              >
                <option value="">Todos</option>
                {kanbanStates.map(state => (
                  <option key={state.key} value={state.key}>{state.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Dashboard de métricas */}
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex gap-4">
            <div className="bg-blue-50 rounded-lg p-3 flex-1">
              <div className="text-sm text-blue-700 font-medium">Total Historias</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalStories}</div>
            </div>
            {kanbanStates.map(state => {
              const count = filteredStories.filter(st => st.estado === state.key).length;
              return (
                <div
                  key={state.key}
                  className={`${state.color} ${state.textColor} rounded-lg p-3 flex-1`}
                  style={{
                    minWidth: 0
                  }}
                >
                  <div className="text-sm font-medium">{state.label}</div>
                  <div className="text-2xl font-bold">
                    {count}
                    {state.key === 'cerrado' && stats.totalStories > 0 && (
                      <span className="text-sm ml-1">
                        ({Math.round((count / stats.totalStories) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="bg-purple-50 rounded-lg p-3 flex-1">
              <div className="text-sm text-purple-700 font-medium">Horas Estimadas</div>
              <div className="text-2xl font-bold text-purple-900">{stats.totalHours}h</div>
            </div>
          </div>
        </div>
        
        {/* Área de trabajo principal */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick actions */}
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500">Creación rápida:</span>
              {kanbanStates.map(state => (
                <button
                  key={state.key}
                  className={`${state.color} ${state.textColor} text-xs px-2 py-1 rounded`}
                  style={{
                    backgroundColor: state.color,
                    color: state.textColor,
                    fontWeight: 500,
                  }}
                  onClick={() => handleQuickCreate(state.key)}
                >
                  + {state.label}
                </button>
              ))}
            </div>
            
            <div className="text-sm text-gray-500">
              Mostrando {filteredStories.length} de {stories.length} historias
            </div>
          </div>
          
          {/* Tablero Kanban */}
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<div className="flex-1 bg-gray-50" />}>
              <KanbanBoard
                sprints={sprints}
                stories={filteredStories}
                users={users}
                onStoryClick={setSelectedStory}
                setStories={setStories}
                activeSprint={activeSprint}
                kanbanStates={kanbanStates}
              />
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Modal de detalles */}
      <AnimatePresence>
        {(selectedStory || showNew) && (
          <Suspense fallback={null}>
            <StoryDetailsModal
              story={selectedStory}
              users={users}
              epics={epics}
              sprints={sprints}
              onClose={() => {
                setSelectedStory(null);
                setShowNew(false);
              }}
              onSave={handleSaveStory}
              activeSprint={activeSprint}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
}