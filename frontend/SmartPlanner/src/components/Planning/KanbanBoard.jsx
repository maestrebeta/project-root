import React, { useMemo, useState } from "react";
import { 
  DndContext,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  useDroppable,
  DragOverlay,
  defaultDropAnimation,
  pointerWithin
} from "@dnd-kit/core";
import { 
  SortableContext, 
  verticalListSortingStrategy,
  useSortable 
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import StoryCard from "./StoryCard";
import { FiPlus } from "react-icons/fi";

function SortableStoryCard({ story, users, onClick, isCompact, columnKey, kanbanStates }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging
  } = useSortable({
    id: story.id,
    data: {
      type: "story",
      story,
      columnKey
    }
  });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        opacity: isDragging ? 0.3 : 1,
        position: "relative",
        cursor: "grab",
        touchAction: "none"
      }}
      {...attributes}
      {...listeners}
      layout
      className="touch-none select-none"
    >
      <StoryCard
        story={story}
        users={users}
        onClick={onClick}
        isCompact={isCompact}
        isDragging={isDragging}
        kanbanStates={kanbanStates}
      />
    </motion.div>
  );
}

function DroppableColumn({
  column,
  isOver,
  users,
  onQuickCreate,
  onStoryClick,
  expandedColumn,
  kanbanStates,
  isDragging
}) {
  const { setNodeRef } = useDroppable({
    id: column.key,
    data: {
      type: "column",
      column
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        w-80 flex-shrink-0 rounded-lg border-2
        ${column.color}
        ${isOver ? 'border-blue-400 shadow-lg' : 'border-transparent shadow-sm'}
        transition-all duration-150 ease-in-out
        relative flex flex-col
      `}
    >
      {/* Header */}
      <div className={`
        p-3 border-b flex items-center justify-between 
        ${column.textColor} 
        transition-colors duration-150
        ${isOver ? 'bg-white bg-opacity-10' : ''}
      `}>
        <h4 className="font-semibold flex items-center gap-2">
          {column.label}
          <span className="text-xs bg-white bg-opacity-50 px-2 py-0.5 rounded-full">
            {column.stories.length}
          </span>
        </h4>
        <button
          className="text-xs bg-white bg-opacity-70 hover:bg-opacity-100 p-1 rounded transition-all duration-150"
          onClick={() => onQuickCreate?.(column.key)}
          title={`Crear historia en ${column.label}`}
        >
          <FiPlus size={14} />
        </button>
      </div>

      {/* Drop Indicator */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-blue-400 opacity-5 rounded-lg" />
          <div className="absolute inset-0 border-2 border-blue-400 border-dashed rounded-lg" />
        </div>
      )}

      {/* Stories Container */}
      <SortableContext
        id={column.key}
        items={column.stories.map(st => st.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={`
            p-2 space-y-2 h-[calc(100vh-250px)] 
            overflow-y-auto
            ${isDragging ? 'bg-gray-50 bg-opacity-50' : ''}
            ${isOver ? 'bg-blue-50 bg-opacity-30' : ''}
          `}
        >
          {column.stories.length > 0 ? (
            column.stories.map(story => (
              <SortableStoryCard
                key={story.id}
                story={story}
                users={users}
                onClick={() => onStoryClick(story)}
                isCompact={expandedColumn !== column.key}
                columnKey={column.key}
                kanbanStates={kanbanStates}
              />
            ))
          ) : (
            <div className={`
              flex-1 min-h-[120px] flex items-center justify-center text-center
              text-gray-400 py-8 text-sm rounded-lg border-2 border-dashed
              ${isOver ? 'border-blue-400 bg-blue-50 bg-opacity-30' : 'border-gray-200'}
              transition-all duration-150
            `}>
              {isOver ? (
                <div className="text-blue-500 font-medium">
                  Suelta aquí para mover la historia
                </div>
              ) : (
                <div>
                  No hay historias
                  <div className="mt-2 text-xs">
                    Arrastra historias aquí o crea una nueva
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </SortableContext>
    </div>
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
  const [activeStory, setActiveStory] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [expandedColumn, setExpandedColumn] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 3
    }
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 100,
      tolerance: 5
    }
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const columns = useMemo(() => {
    return kanbanStates.map(col => ({
      ...col,
      stories: stories.filter(st => st.estado === col.key)
    }));
  }, [stories, kanbanStates]);

  const handleDragStart = ({ active }) => {
    setActiveStory(active.data.current?.story || null);
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragOver = ({ over }) => {
    setActiveColumn(over?.data.current?.type === 'column' ? over.id : null);
  };

  const handleDragEnd = ({ active, over }) => {
    if (over?.data.current?.type === 'column') {
      const storyId = active.id;
      const newColumn = over.id;
      const originalColumn = active.data.current?.story?.estado;

      if (newColumn !== originalColumn) {
        setStories(prev => prev.map(st =>
          st.id === storyId ? { ...st, estado: newColumn } : st
        ));
      }
    }

    setActiveStory(null);
    setActiveColumn(null);
    setIsDragging(false);
    document.body.style.cursor = '';
  };

  const handleDragCancel = () => {
    setActiveStory(null);
    setActiveColumn(null);
    setIsDragging(false);
    document.body.style.cursor = '';
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto p-4 h-full min-h-0">
        {columns.map(col => (
          <DroppableColumn
            key={col.key}
            column={col}
            isOver={activeColumn === col.key}
            users={users}
            onQuickCreate={onQuickCreate}
            onStoryClick={onStoryClick}
            expandedColumn={expandedColumn}
            kanbanStates={kanbanStates}
            isDragging={isDragging}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={defaultDropAnimation}>
        {activeStory && (
          <div className="w-[320px] transform-none">
            <StoryCard
              story={activeStory}
              users={users}
              isDragging={true}
              kanbanStates={kanbanStates}
              isCompact={true}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}