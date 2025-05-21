import React, { useMemo, useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import StoryCard from "./StoryCard";
import { FiPlus } from "react-icons/fi";
import { CSS } from "@dnd-kit/utilities";
import { useKanbanDnD } from "./useKanbanDnD"; // Asegúrate de tener este hook

function SortableStoryCard({ story, users, onClick, isCompact, columnKey }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({
    id: story.id,
    data: { 
      type: "story",
      story,
      columnKey 
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : "auto",
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      transition={{ duration: 0.15 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <StoryCard
        story={story}
        users={users}
        onClick={onClick}
        isCompact={isCompact}
        isDragging={isDragging}
      />
    </motion.div>
  );
}

export default function KanbanBoard({ 
  stories, 
  users, 
  onStoryClick, 
  setStories,
  onQuickCreate,
  kanbanStates
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const [expandedColumn, setExpandedColumn] = useState(null);
  
  // Usamos el hook personalizado
  const {
    activeStory,
    targetColumn,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragCancel,
    onDragMove
  } = useKanbanDnD(stories, setStories);

  const columns = useMemo(() => {
    return kanbanStates.map(col => ({
      ...col,
      stories: stories.filter(st => st.estado === col.key),
      isTarget: targetColumn === col.key
    }));
  }, [stories, targetColumn, kanbanStates]);

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragCancel={onDragCancel}
      onDragMove={onDragMove}
    >
      <div className="flex gap-4 overflow-x-auto p-4 h-full">
        <AnimatePresence>
          {columns.map(col => (
            <motion.div
              key={col.key}
              data-col-key={col.key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                borderColor: col.isTarget ? "#3b82f6" : "#e5e7eb",
                scale: col.isTarget ? 1.02 : 1
              }}
              exit={{ opacity: 0, x: -20 }}
              className={`w-80 flex-shrink-0 rounded-lg shadow-xs border-2 flex flex-col ${col.color} ${
                expandedColumn === col.key ? 'flex-grow' : ''
              } ${col.isTarget ? 'border-blue-500 scale-105' : 'border-transparent'}`}
            >
              <div 
                className={`p-3 border-b flex items-center justify-between ${col.textColor} ${
                  col.isTarget ? 'bg-blue-50' : ''
                }`}
                onClick={() => setExpandedColumn(expandedColumn === col.key ? null : col.key)}
              >
                <h4 className="font-semibold flex items-center gap-2">
                  {col.label}
                  <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded-full">
                    {col.stories.length}
                  </span>
                </h4>
                <button 
                  className="text-xs bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickCreate?.(col.key);
                  }}
                  title={`Crear historia en ${col.label}`}
                >
                  <FiPlus size={14} />
                </button>
              </div>
              
              <SortableContext
                id={col.key}
                items={col.stories.map(st => st.id)}
                strategy={verticalListSortingStrategy}
              >
                <motion.div
                  className={`p-2 space-y-2 ${expandedColumn === col.key ? 'h-[calc(100%-45px)]' : 'h-[calc(100vh-250px)]'} overflow-y-auto transition-colors ${
                    col.isTarget ? 'bg-blue-50 bg-opacity-30' : ''
                  }`}
                  data-col-key={col.key}
                  layout
                >
                  {col.stories.length > 0 ? (
                    col.stories.map(story => (
                      <SortableStoryCard
                        key={story.id}
                        story={story}
                        users={users}
                        onClick={() => onStoryClick(story)}
                        isCompact={expandedColumn !== col.key}
                        columnKey={col.key}
                      />
                    ))
                  ) : (
                    <motion.div 
                      className="flex-1 min-h-[120px] flex items-center justify-center text-center text-gray-400 py-8 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      data-col-key={col.key}
                    >
                      {col.isTarget ? (
                        <div className="text-blue-500 font-medium">Suelta aquí para mover</div>
                      ) : (
                        <div>
                          No hay historias en esta columna
                          <div className="mt-2 text-xs">
                            Arrastra historias aquí para moverlas
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              </SortableContext>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <DragOverlay adjustScale={false} dropAnimation={null}>
        {activeStory ? (
          <motion.div
            style={{
              position: 'fixed',
              pointerEvents: 'none',
              zIndex: 1000,
              left: `${window.event?.clientX - 140}px`,
              top: `${window.event?.clientY - 50}px`,
              transform: 'none !important',
              width: '280px'
            }}
            animate={{
              scale: 1.05,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <StoryCard 
              story={activeStory} 
              users={users} 
              isDragging 
            />
          </motion.div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}