import { useState, useCallback } from 'react';
import { closestCorners } from '@dnd-kit/core';

export function useKanbanDnD(stories, setStories) {
  const [activeStory, setActiveStory] = useState(null);
  const [targetColumn, setTargetColumn] = useState(null);

  // Función mejorada para encontrar la columna objetivo
  const findTargetColumn = useCallback((x, y) => {
    const elements = document.elementsFromPoint(x, y);
    for (const element of elements) {
      if (element.hasAttribute('data-col-key')) {
        return element.getAttribute('data-col-key');
      }
      // Buscar también en los padres por si el punto está sobre un elemento hijo
      const columnParent = element.closest('[data-col-key]');
      if (columnParent) {
        return columnParent.getAttribute('data-col-key');
      }
    }
    return null;
  }, []);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    if (!active?.data?.current?.story) return;
    
    setActiveStory(active.data.current.story);
    // Limpiar la columna objetivo al inicio del arrastre
    setTargetColumn(null);
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!active || !event.activatorEvent) return;

    const currentColumn = findTargetColumn(
      event.activatorEvent.clientX,
      event.activatorEvent.clientY
    );

    // Solo actualizar si la columna objetivo es diferente a la actual
    if (currentColumn !== targetColumn) {
      setTargetColumn(currentColumn);
    }
  }, [findTargetColumn, targetColumn]);

  const handleDragEnd = useCallback((event) => {
    const { active } = event;
    if (!active || !event.activatorEvent) {
      setActiveStory(null);
      setTargetColumn(null);
      return;
    }

    const finalColumn = findTargetColumn(
      event.activatorEvent.clientX,
      event.activatorEvent.clientY
    );

    if (finalColumn && active.data.current?.story) {
      const storyId = active.data.current.story.id;
      const originalColumn = active.data.current.story.estado;

      // Solo actualizar si la columna destino es diferente a la original
      if (finalColumn !== originalColumn) {
        setStories(prev => prev.map(story => 
          story.id === storyId 
            ? { ...story, estado: finalColumn }
            : story
        ));
      }
    }

    // Limpiar estados
    setActiveStory(null);
    setTargetColumn(null);
  }, [findTargetColumn, setStories]);

  const handleDragCancel = useCallback(() => {
    setActiveStory(null);
    setTargetColumn(null);
  }, []);

  return {
    activeStory,
    targetColumn,
    collisionDetection: closestCorners,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragCancel: handleDragCancel
  };
}