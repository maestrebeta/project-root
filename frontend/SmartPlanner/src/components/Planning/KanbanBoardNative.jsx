import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiUser, 
  FiTarget, 
  FiClock, 
  FiActivity, 
  FiPlus,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiAlertTriangle,
  FiInfo,
  FiLoader
} from 'react-icons/fi';
import { formatDateForDisplay, formatDateForTooltip, debugDate, createCompletedDate } from '../../utils/dateUtils';

// Componente de notificación toast
function NotificationToast({ notification, onClose }) {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'error':
        return <FiAlertCircle className="w-5 h-5" />;
      case 'warning':
        return <FiAlertTriangle className="w-5 h-5" />;
      default:
        return <FiInfo className="w-5 h-5" />;
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg ${getColors()}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div>
          <h4 className="font-semibold">{notification.title}</h4>
          {notification.message && (
            <p className="text-sm opacity-90">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

// Componente de tarjeta con HTML5 drag and drop
function DraggableStoryCard({ story, users, onClick, isCompact, columnKey, kanbanStates, onDragStart, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const assignedUser = users.find(u => u.user_id === story.assigned_user_id);
  const priorityColors = {
    high: 'from-red-400 to-red-600',
    medium: 'from-yellow-400 to-orange-500',
    low: 'from-green-400 to-green-600'
  };

  // Lógica para mostrar fecha de completado o etiquetas
  const shouldShowCompletedDate = story.status === "done" && story.completed_date;
  const hasTags = story.tags && story.tags.length > 0;

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({
      storyId: story.story_id || story.id,
      story: story
    }));
    e.dataTransfer.effectAllowed = 'move';
    onDragStart && onDragStart(story);
  };

  const handleDragEnd = (e) => {
    setIsDragging(false);
    onDragEnd && onDragEnd();
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        y: 0,
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 2 : 0
      }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -2 }}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => {
        if (!isDragging) {
          onClick(story);
        }
      }}
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 p-4 cursor-move
        transition-all duration-200 hover:shadow-lg hover:border-blue-300
        ${isDragging ? 'shadow-2xl ring-2 ring-blue-400 bg-blue-50' : ''}
        ${isCompact ? 'p-3' : 'p-4'}
        select-none
      `}
    >
      {/* Header de la tarjeta */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-gray-900 line-clamp-2 ${isCompact ? 'text-sm' : 'text-base'}`}>
            {story.title}
          </h4>
          {!isCompact && story.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {story.description}
            </p>
          )}
        </div>
        
        {/* Indicador de prioridad */}
        <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${priorityColors[story.priority] || priorityColors.medium} ml-2 flex-shrink-0`} />
      </div>

      {/* Métricas de la historia */}
      {!isCompact && (
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          {story.estimated_hours && (
            <div className="flex items-center gap-1">
              <FiClock className="w-3 h-3" />
              <span>{story.estimated_hours}h</span>
            </div>
          )}
        </div>
      )}

      {/* Fecha de completado o etiquetas */}
      {!isCompact && (
        <div className="flex items-center gap-2 mb-3">
          {shouldShowCompletedDate ? (
            (() => {
              // Debug de la fecha
              debugDate(story.completed_date, 'DraggableStoryCard - Fecha de completado');
              
              return (
                <span 
                  className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1"
                  title={`Completada el ${formatDateForTooltip(story.completed_date)}`}
                >
                  <span>✅</span>
                  <span>Completada {formatDateForDisplay(story.completed_date)}</span>
                </span>
              );
            })()
          ) : hasTags ? (
            <div className="flex gap-1">
              {story.tags.slice(0, 2).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {tag}
                </span>
              ))}
              {story.tags.length > 2 && (
                <span className="text-xs text-gray-400">+{story.tags.length - 2}</span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Footer de la tarjeta */}
      <div className="flex items-center justify-between">
        {/* Usuario asignado */}
        <div className="flex items-center gap-2">
          {assignedUser ? (
            <>
              <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {assignedUser.full_name?.charAt(0) || assignedUser.username?.charAt(0) || '?'}
              </div>
              {!isCompact && (
                <span className="text-xs text-gray-600 truncate max-w-20">
                  {assignedUser.full_name || assignedUser.username}
                </span>
              )}
            </>
          ) : (
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
              <FiUser className="w-3 h-3 text-gray-400" />
            </div>
          )}
        </div>

        {/* Tags (solo en modo compacto) */}
        {isCompact && hasTags && !shouldShowCompletedDate && (
          <div className="flex items-center gap-1">
            <div className="flex gap-1">
              {story.tags.slice(0, 1).map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                  {tag}
                </span>
              ))}
              {story.tags.length > 1 && (
                <span className="text-xs text-gray-400">+{story.tags.length - 1}</span>
              )}
            </div>
          </div>
        )}

        {/* Fecha de completado (solo en modo compacto) */}
        {isCompact && shouldShowCompletedDate && (
          <div className="flex items-center gap-1">
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              ✅
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Componente de columna con drop zone
function DropZoneColumn({
  column,
  users,
  onQuickCreate,
  onStoryClick,
  kanbanStates,
  onDrop,
  onDragStart,
  onDragEnd
}) {
  const [isOver, setIsOver] = useState(false);
  const columnId = column.key || column.id || column.label;
  const storyCount = column.stories?.length || 0;
  const totalHours = column.stories?.reduce((sum, story) => sum + (story.estimated_hours || 0), 0) || 0;
  
  // Formatear horas para mostrar máximo 1 decimal y sin ceros innecesarios
  const formatHours = (hours) => {
    if (!hours || hours === 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Función para obtener el color de fondo del estado
  const getStateBgColor = (state) => {
    if (!state || !state.color) return 'bg-gray-50';
    
    // Si el color ya es una clase de Tailwind, usarlo directamente
    if (state.color.startsWith('bg-')) {
      return state.color;
    }
    
    // Mapear colores simples a clases de Tailwind (compatible con KanbanStatesManager)
    const colorMap = {
      'blue': 'bg-blue-50',
      'green': 'bg-green-50',
      'yellow': 'bg-yellow-50',
      'orange': 'bg-orange-50',
      'red': 'bg-red-50',
      'purple': 'bg-purple-50',
      'indigo': 'bg-indigo-50',
      'pink': 'bg-pink-50',
      'gray': 'bg-gray-50',
      'slate': 'bg-slate-50',
      'emerald': 'bg-emerald-50',
      'teal': 'bg-teal-50',
      'cyan': 'bg-cyan-50',
      'sky': 'bg-sky-50',
      'violet': 'bg-violet-50',
      'fuchsia': 'bg-fuchsia-50',
      'rose': 'bg-rose-50',
      'amber': 'bg-amber-50',
      'lime': 'bg-lime-50'
    };
    
    return colorMap[state.color] || 'bg-gray-50';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsOver(true);
  };

  const handleDragLeave = (e) => {
    // Solo cambiar isOver si realmente salimos de la columna
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsOver(false);
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      onDrop(data.storyId, columnId, data.story);
    } catch (error) {
      console.error('Error al procesar drop:', error);
    }
  };

  return (
    <motion.div
      layout
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        flex flex-col h-full min-w-80 max-w-80 bg-gray-50/50 rounded-2xl border border-gray-200/50
        transition-all duration-300 backdrop-blur-sm
        ${isOver ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200' : ''}
      `}
    >
      {/* Header de la columna */}
      <motion.div 
        className={`
          p-4 border-b border-gray-200/50 
          ${getStateBgColor(column)}
          rounded-t-2xl relative overflow-hidden shadow-sm
        `}
        whileHover={{ scale: 1.01 }}
      >
        {/* Efecto de brillo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{column.icon || '📋'}</div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg drop-shadow-sm">{column.label}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="flex items-center gap-1">
                    <FiActivity className="w-3 h-3" />
                    {storyCount} historias
                  </span>
                  {totalHours > 0 && (
                    <span className="flex items-center gap-1">
                      <FiTarget className="w-3 h-3" />
                      {formatHours(totalHours)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones de columna */}
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onQuickCreate(columnId)}
                className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                title={`Crear historia en ${column.label}`}
              >
                <FiPlus className="w-4 h-4 text-gray-600" />
              </motion.button>
            </div>
          </div>

          {/* Indicador de drop zone cuando se está arrastrando */}
          {isOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-blue-400/20 rounded-2xl border-2 border-dashed border-blue-400 flex items-center justify-center"
            >
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Soltar aquí
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Contenido de la columna */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {column.stories?.map(story => (
            <DraggableStoryCard
              key={story.story_id || story.id}
              story={story}
              users={users}
              onClick={onStoryClick}
              isCompact={false}
              columnKey={columnId}
              kanbanStates={kanbanStates}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
          
          {/* Mensaje cuando no hay historias */}
          {storyCount === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-400"
            >
              <div className="text-4xl mb-2">📝</div>
              <p className="text-sm">No hay historias aquí</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onQuickCreate(columnId)}
                className="mt-3 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                Crear primera historia
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Componente principal del Kanban con HTML5 drag and drop
export default function KanbanBoardNative({
  stories,
  users,
  onStoryClick,
  setStories,
  onUpdateStory,
  onQuickCreate,
  kanbanStates
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [notification, setNotification] = useState(null);

  // Función para mostrar notificaciones
  const showNotification = (type, title, message = null) => {
    setNotification({ type, title, message, id: Date.now() });
    setTimeout(() => setNotification(null), 4000);
  };

  // Organizar historias por columnas
  const columns = useMemo(() => {
    // Verificar que kanbanStates sea un array
    if (!Array.isArray(kanbanStates)) {
      console.warn('⚠️ kanbanStates no es un array:', kanbanStates);
      return [];
    }
    
    const result = kanbanStates.map(col => {
      const columnId = col.id || col.label;
      const columnKey = col.key || col.id;
      const columnStories = stories.filter(st => {
        const storyStatus = st.status || st.estado;
        // Comparar con ID numérico, clave del estado, o label
        const matches = storyStatus === columnId || 
               storyStatus === columnKey || 
               storyStatus === col.id ||
               storyStatus === col.key ||
               storyStatus === col.label;
        
        return matches;
      });
      
      return {
        ...col,
        stories: columnStories
      };
    });
    
    return result;
  }, [stories, kanbanStates]);

  // Manejar inicio de arrastre
  const handleDragStart = (story) => {
    setIsDragging(true);
  };

  // Manejar fin de arrastre
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Manejar drop de historia
  const handleDrop = async (storyId, newColumnId, story) => {
    
    const originalStatus = story.status || story.estado;
    
    if (newColumnId !== originalStatus) {
      // Verificar que kanbanStates sea un array
      if (!Array.isArray(kanbanStates)) {
        console.warn('⚠️ kanbanStates no es un array en handleDrop:', kanbanStates);
        return;
      }
      
      // Encontrar el nombre de la columna de destino
      const targetColumn = kanbanStates.find(col => 
        col.id === newColumnId
      );
      
      // Crear una copia actualizada de la historia
      const updatedStory = {
        ...story,
        status: newColumnId,
        estado: newColumnId
      };
      
      // Manejar fecha de completado y horas reales en el estado local
      if (newColumnId === 'done') {
        const completedDate = createCompletedDate();
        updatedStory.completed_date = completedDate;
        
        // Si no hay horas reales registradas, establecer actual_hours igual a estimated_hours
        if (!updatedStory.actual_hours || Number(updatedStory.actual_hours) === 0) {
          updatedStory.actual_hours = Number(updatedStory.estimated_hours) || 0;
        }
      } else if (originalStatus === 'done') {
        // Si estaba en "done" y ahora no, eliminar la fecha de completado y resetear horas reales
        updatedStory.completed_date = null;
        // Resetear actual_hours a 0 ya que la historia ya no está completada
        updatedStory.actual_hours = 0;
      }

      // Actualizar estado local PRIMERO
      setStories(prevStories => 
        prevStories.map(story => 
          story.story_id === storyId ? updatedStory : story
        )
      );

      // Luego sincronizar con el backend
      if (onUpdateStory) {
        try {
          await onUpdateStory(updatedStory);
        } catch (error) {
          // Revertir el cambio local si falla el backend
          setStories(prev => 
            prev.map(story => 
              story.story_id === storyId ? { ...story, status: originalStatus } : story
            )
          );
        }
      }
    }
    
    // Importante: Limpiar el estado de arrastre al final
    setIsDragging(false);
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* Contenedor principal del kanban */}
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 p-6 h-full min-w-max">
          {columns.map(col => (
            <DropZoneColumn
              key={col.id || col.label}
              column={col}
              users={users}
              onQuickCreate={onQuickCreate}
              onStoryClick={onStoryClick}
              kanbanStates={kanbanStates}
              onDrop={handleDrop}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Indicador de estado de arrastre */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span className="font-medium">Arrastra a una columna para cambiar el estado</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sistema de notificaciones */}
      <AnimatePresence>
        {notification && (
          <NotificationToast
            notification={notification}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 