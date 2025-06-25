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
  FiAlertCircle
} from 'react-icons/fi';

// Componente de notificación
function NotificationToast({ notification, onClose }) {
  const icons = {
    success: FiCheckCircle,
    error: FiXCircle,
    warning: FiAlertCircle
  };

  const colors = {
    success: 'from-green-500 to-green-600',
    error: 'from-red-500 to-red-600',
    warning: 'from-yellow-500 to-yellow-600'
  };

  const Icon = icons[notification.type] || FiAlertCircle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      className={`fixed bottom-6 right-6 bg-gradient-to-r ${colors[notification.type]} text-white px-6 py-4 rounded-2xl shadow-lg z-[9999] max-w-md`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium">{notification.title}</p>
          {notification.message && (
            <p className="text-sm opacity-90 mt-1">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          ×
        </button>
      </div>
    </motion.div>
  );
}

// Función para actualizar historia en el backend
const updateStoryStatus = async (storyId, newStatus) => {
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      throw new Error('No hay sesión activa');
    }

    const response = await fetch(`http://localhost:8001/epics/stories/${storyId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Error al actualizar el estado');
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Error al actualizar estado en backend:', error);
    throw error;
  }
};

// Componente de tarjeta con HTML5 drag and drop
function DraggableStoryCard({ story, users, onClick, isCompact, columnKey, kanbanStates, onDragStart, onDragEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  
  const assignedUser = users.find(u => u.user_id === story.assigned_user_id);
  const priorityColors = {
    high: 'from-red-400 to-red-600',
    medium: 'from-yellow-400 to-orange-500',
    low: 'from-green-400 to-green-600'
  };

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

        {/* Tags y estado */}
        <div className="flex items-center gap-1">
          {story.tags && story.tags.length > 0 && (
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
          )}
        </div>
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
    if (hours === 0) return '0h';
    const formatted = parseFloat(hours).toFixed(1);
    return formatted.endsWith('.0') ? `${parseInt(hours)}h` : `${formatted}h`;
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
          ${column.headerBg || 'bg-white/80'}
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
    const result = kanbanStates.map(col => {
      const columnId = col.key || col.id || col.label;
      const columnStories = stories.filter(st => {
        const storyStatus = st.status || st.estado;
        return storyStatus === columnId || storyStatus === col.id || storyStatus === col.key;
      });
      
      console.log(`📊 Columna ${columnId}:`, columnStories.length, 'historias');
      
      return {
        ...col,
        stories: columnStories
      };
    });
    
    console.log('🎯 Columnas organizadas:', result.map(c => ({ id: c.key || c.id, count: c.stories.length })));
    return result;
  }, [stories, kanbanStates]);

  // Manejar inicio de arrastre
  const handleDragStart = (story) => {
    setIsDragging(true);
    console.log('🎯 Iniciando drag:', story?.title);
  };

  // Manejar fin de arrastre
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Manejar drop de historia
  const handleDrop = async (storyId, newColumnId, story) => {
    console.log('🎯 DROP:', { storyId, newColumnId, storyTitle: story?.title });
    
    const originalStatus = story.status || story.estado;
    
    if (newColumnId !== originalStatus) {
      // Encontrar el nombre de la columna de destino
      const targetColumn = kanbanStates.find(col => 
        col.key === newColumnId || col.id === newColumnId
      );
      
      // Actualizar el estado local inmediatamente para UX fluida
      const updatedStory = { 
        ...story, 
        status: newColumnId, 
        estado: newColumnId 
      };

      setStories(prev => {
        const updated = prev.map(st => {
          const currentId = st.story_id || st.id;
          if (currentId === storyId) {
            console.log('✅ Actualizando historia local:', st.title, 'de', st.status, 'a', newColumnId);
            return updatedStory;
          }
          return st;
        });
        console.log('📊 Historias actualizadas localmente:', updated.length);
        return updated;
      });

      // Intentar actualizar en el backend
      try {
        await updateStoryStatus(storyId, newColumnId);
        console.log('✅ Estado actualizado en backend exitosamente');
        showNotification(
          'success', 
          'Historia movida exitosamente',
          `"${story.title}" se movió a ${targetColumn?.label || newColumnId}`
        );
      } catch (error) {
        console.error('❌ Error al actualizar en backend, revirtiendo cambio local');
        // Revertir el cambio local si falla el backend
        setStories(prev => {
          return prev.map(st => {
            const currentId = st.story_id || st.id;
            if (currentId === storyId) {
              return { ...st, status: originalStatus, estado: originalStatus };
            }
            return st;
          });
        });
        
        showNotification(
          'error',
          'Error al mover historia',
          'No se pudo actualizar el estado. Se ha revertido el cambio.'
        );
      }
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 overflow-hidden">
      {/* Contenedor principal del kanban */}
      <div className="h-full overflow-x-auto overflow-y-hidden">
        <div className="flex gap-6 p-6 h-full min-w-max">
          {columns.map(col => (
            <DropZoneColumn
              key={col.key || col.id || col.label}
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