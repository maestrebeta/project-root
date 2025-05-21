import { useState, useCallback, useRef } from 'react';
import { closestCorners } from '@dnd-kit/core';

export function useKanbanDnD(stories, setStories) {
  // 1. Uso de referencias para estado que no necesita renderizado
  const activeStoryRef = useRef(null);
  const pointerPosition = useRef({ x: 0, y: 0 });
  
  // 2. Estado mínimo necesario
  const [targetColumn, setTargetColumn] = useState(null);
  const [activeStory, _setActiveStory] = useState(null);

  // 3. Memoización de handlers con useCallback
  const setActiveStory = useCallback((story) => {
    activeStoryRef.current = story;
    _setActiveStory(story);
  }, []);

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    if (active.data.current?.type === "story") {
      setActiveStory(active.data.current.story);
    }
  }, [setActiveStory]);

  // 4. Detección de columnas optimizada
  const getColumnFromPosition = useCallback((x, y) => {
    const elements = document.elementsFromPoint(x, y);
    for (const el of elements) {
      if (el.getAttribute?.('data-col-key')) {
        return el.getAttribute('data-col-key');
      }
    }
    return null;
  }, []);

  const handleDragMove = useCallback((event) => {
    if (event.activatorEvent) {
      pointerPosition.current = {
        x: event.activatorEvent.clientX,
        y: event.activatorEvent.clientY
      };
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over) {
      setTargetColumn(null);
      return;
    }
    
    const overColumn = over.data.current?.columnKey || 
                     getColumnFromPosition(
                       pointerPosition.current.x, 
                       pointerPosition.current.y
                     );

    const activeColumn = active.data.current?.columnKey;

    // 5. Evitar updates innecesarios
    if (overColumn && overColumn !== activeColumn) {
      setTargetColumn(prev => prev !== overColumn ? overColumn : prev);
    } else {
      setTargetColumn(null);
    }
  }, [getColumnFromPosition]);

  // 6. Manejo de fin de arrastre con transición garantizada
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    const currentActiveStory = activeStoryRef.current;
    
    if (!over || !currentActiveStory) {
      setActiveStory(null);
      setTargetColumn(null);
      return;
    }

    const overColumn = over.data.current?.columnKey || 
                     getColumnFromPosition(
                       pointerPosition.current.x, 
                       pointerPosition.current.y
                     );

    const activeColumn = active.data.current?.columnKey;

    if (overColumn && overColumn !== activeColumn) {
      // 7. Actualización optimizada del estado
      setStories(prev => {
        const newStories = [...prev];
        const index = newStories.findIndex(s => s.id === currentActiveStory.id);
        if (index !== -1) {
          newStories[index] = { ...newStories[index], estado: overColumn };
        }
        return newStories;
      });
    }

    // 8. Limpieza con delay para mejor feedback visual
    setTimeout(() => {
      setActiveStory(null);
      setTargetColumn(null);
    }, 100);
  }, [setStories, getColumnFromPosition]);

  const handleDragCancel = useCallback(() => {
    setActiveStory(null);
    setTargetColumn(null);
  }, []);

  // 9. Retorno de propiedades memoizadas
  return {
    activeStory,
    targetColumn,
    collisionDetection: closestCorners, // Más preciso que closestCenter
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDragCancel: handleDragCancel,
    onDragMove: handleDragMove // Nuevo evento para tracking preciso
  };
}