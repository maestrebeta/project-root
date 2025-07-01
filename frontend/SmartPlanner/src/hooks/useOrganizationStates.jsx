import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Estados predeterminados del sistema
const DEFAULT_TASK_STATES = {
  states: [
    {
      id: 1,
      label: 'Pendiente',
      icon: '🔴',
      color: 'red',
      isDefault: true,
      isProtected: true
    },
    {
      id: 2,
      label: 'En progreso',
      icon: '🔵',
      color: 'blue',
      isDefault: false,
      isProtected: false
    },
    {
      id: 3,
      label: 'Completada',
      icon: '🟢',
      color: 'green',
      isDefault: false,
      isProtected: true
    }
  ],
  default_state: 1,
  final_states: [3]
};

// Estados predeterminados de Kanban
const DEFAULT_KANBAN_STATES = {
  states: [
    {
      key: 'backlog',
      label: 'Backlog',
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      isDefault: true,
      isProtected: true
    },
    {
      key: 'nuevo',
      label: 'Nuevo',
      color: 'bg-blue-50',
      textColor: 'text-blue-700',
      isDefault: true
    },
    {
      key: 'en_progreso',
      label: 'En Progreso',
      color: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      isDefault: true
    },
    {
      key: 'listo_pruebas',
      label: 'Listo para Pruebas',
      color: 'bg-orange-50',
      textColor: 'text-orange-700',
      isDefault: true
    },
    {
      key: 'done',
      label: 'Completado',
      color: 'bg-green-50',
      textColor: 'text-green-700',
      isDefault: true,
      isProtected: true
    }
  ],
  default_state: 'nuevo',
  final_states: ['done']
};

export const useOrganizationStates = () => {
  const { user } = useAuth();
  const [taskStates, setTaskStates] = useState(DEFAULT_TASK_STATES);
  const [kanbanStates, setKanbanStates] = useState(DEFAULT_KANBAN_STATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Definir fetchStates fuera del useEffect para poder exponerlo
  const fetchStates = async () => {
    if (!user?.organization_id) {
      setLoading(false);
      return;
    }
    try {
      const session = localStorage.getItem('session');
      if (!session) throw new Error('No hay sesión activa');
      const { token } = JSON.parse(session);
      
      // Cargar estados de tareas
      const taskResponse = await fetch(
        `http://localhost:8001/organizations/${user.organization_id}/task-states`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Cargar estados kanban
      const kanbanResponse = await fetch(
        `http://localhost:8001/organizations/${user.organization_id}/kanban-states`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!taskResponse.ok) throw new Error('Error al cargar los estados de tareas');
      if (!kanbanResponse.ok) throw new Error('Error al cargar los estados kanban');
      
      const taskData = await taskResponse.json();
      const kanbanData = await kanbanResponse.json();
      
      if (!taskData || !Array.isArray(taskData.states)) throw new Error('Estructura de estados de tareas inválida');
      if (!kanbanData || !Array.isArray(kanbanData.states)) throw new Error('Estructura de estados kanban inválida');
      
      // Normalizar estados de tareas
      const normalizedTaskData = {
        states: taskData.states.map(state => ({
          id: parseInt(state.id) || 1,
          label: state.label || 'Pendiente',
          icon: state.icon || '🔴',
          color: state.color || 'red',
          isDefault: state.isDefault || false,
          isProtected: state.isProtected || false
        })),
        default_state: taskData.default_state || 1,
        final_states: taskData.final_states || [3]
      };
      
      // Normalizar estados kanban
      const normalizedKanbanData = {
        states: kanbanData.states.map((state, index) => {
          const normalizedState = {
            id: parseInt(state.id) || index + 1, // Asegurar que sea entero
            key: state.key || `state_${parseInt(state.id) || index + 1}`, // Preservar la clave del backend si existe
            label: state.label || 'Backlog',
            color: state.color || 'bg-gray-100',
            textColor: state.textColor || 'text-gray-700',
            isDefault: state.isDefault || false,
            isProtected: state.isProtected || false
          };
          
          return normalizedState;
        }),
        default_state: kanbanData.default_state || 2, // Usar ID en lugar de clave
        final_states: kanbanData.final_states || [5] // Usar IDs en lugar de claves
      };
      
      setTaskStates(normalizedTaskData);
      setKanbanStates(normalizedKanbanData);
      setError(null);
    } catch (err) {
      console.error('useOrganizationStates - Error en fetchStates:', err);
      setError(err.message);
      setTaskStates(DEFAULT_TASK_STATES);
      setKanbanStates(DEFAULT_KANBAN_STATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, [user?.organization_id]);

  const updateStates = async (newStates) => {
    if (!user?.organization_id) {
      throw new Error('No hay organización activa');
    }

    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { token } = JSON.parse(session);

      // Validar y normalizar los nuevos estados antes de enviarlos
      const normalizedStates = {
        states: newStates.states.map(state => ({
          id: parseInt(state.id) || 1,
          label: state.label || 'Pendiente',
          icon: state.icon || '🔴',
          color: state.color || 'red',
          isDefault: state.isDefault || false,
          isProtected: state.isProtected || false
        })),
        default_state: newStates.default_state || 1,
        final_states: newStates.final_states || [3]
      };

      const response = await fetch(
        `http://localhost:8001/organizations/${user.organization_id}/task-states`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(normalizedStates)
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('useOrganizationStates - Error en la respuesta:', errorData);
        throw new Error('Error al actualizar los estados de tareas');
      }

      const data = await response.json();
      setTaskStates(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error al actualizar estados de tareas:', err);
      setError(err.message);
      throw err;
    }
  };

  // Función para generar el siguiente ID disponible
  const getNextAvailableId = (states) => {
    if (!states || states.length === 0) return 1;
    const maxId = Math.max(...states.map(state => {
      const id = state.id;
      return typeof id === 'number' ? id : parseInt(id) || 0;
    }));
    return maxId + 1;
  };

  // Función para actualizar estados kanban
  const updateKanbanStates = async (newStates) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      if (!user?.organization_id) {
        throw new Error('No hay organización activa');
      }

      // Asegurar que los estados tengan la estructura correcta que espera el backend
      const statesToSend = {
        kanban_states: {
          states: newStates.states.map((state, index) => {
            const stateId = parseInt(state.id) || index + 1;
            return {
              id: stateId, // Asegurar que sea entero
              key: state.key || `state_${stateId}`, // PRESERVAR LA CLAVE ORIGINAL
              label: state.label || 'Estado',
              color: state.color || 'bg-gray-100',
              textColor: state.textColor || 'text-gray-700',
              isDefault: state.isDefault || false,
              isProtected: state.isProtected || stateId === 1 || stateId === 5 // Proteger estados obligatorios
            };
          })
        }
      };

      const response = await fetch(`http://localhost:8001/organizations/${user.organization_id}/kanban-states`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(statesToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Error del backend:', errorData);
        console.error('❌ Datos enviados que causaron el error:', statesToSend);
        throw new Error(errorData.detail || 'Error al actualizar estados kanban');
      }

      const result = await response.json();
      
      // Refrescar los estados después de la actualización
      await fetchStates();
      
      return result;
    } catch (error) {
      console.error('Error actualizando estados kanban:', error);
      throw error;
    }
  };

  // Función para agregar un nuevo estado kanban
  const addKanbanState = async (newState) => {
    try {
      const currentStates = kanbanStates?.states || [];
      const nextId = getNextAvailableId(currentStates);
      
      const stateToAdd = {
        id: nextId,
        key: `state_${nextId}`,
        label: newState.label || 'Nuevo Estado',
        color: newState.color || 'bg-gray-100',
        textColor: newState.textColor || 'text-gray-700',
        isDefault: false,
        isProtected: false
      };

      const updatedStates = {
        ...kanbanStates,
        states: [...currentStates, stateToAdd]
      };

      await updateKanbanStates(updatedStates);
      return true;
    } catch (error) {
      console.error('Error agregando estado kanban:', error);
      throw error;
    }
  };

  // Función para actualizar un estado kanban específico
  const updateKanbanState = async (stateId, updatedState) => {
    try {
      const currentStates = kanbanStates?.states || [];
      
      // Verificar que el estado existe
      const existingState = currentStates.find(state => state.id === stateId);
      if (!existingState) {
        throw new Error('Estado no encontrado');
      }
      
      // Crear el estado actualizado, preservando la clave original
      const updatedStateData = {
        ...existingState,
        ...updatedState,
        id: parseInt(stateId), // Asegurar que sea entero
        key: existingState.key, // PRESERVAR LA CLAVE ORIGINAL
        isProtected: existingState.isProtected // Mantener el estado protegido
      };
      
      // Actualizar solo el estado específico en la lista, preservando todos los demás
      const updatedStates = {
        ...kanbanStates,
        states: currentStates.map(state => 
          state.id === stateId ? updatedStateData : state
        )
      };

      await updateKanbanStates(updatedStates);
      return true;
    } catch (error) {
      console.error('Error actualizando estado kanban:', error);
      throw error;
    }
  };

  // Función para eliminar un estado kanban
  const deleteKanbanState = async (stateId) => {
    try {
      const currentStates = kanbanStates?.states || [];
      const stateToDelete = currentStates.find(state => state.id === stateId);
      
      if (stateToDelete?.isProtected) {
        throw new Error('No se puede eliminar un estado protegido');
      }

      const updatedStates = {
        ...kanbanStates,
        states: currentStates.filter(state => state.id !== stateId)
      };

      await updateKanbanStates(updatedStates);
      return true;
    } catch (error) {
      console.error('Error eliminando estado kanban:', error);
      throw error;
    }
  };

  // Función para reordenar estados kanban
  const reorderKanbanStates = async (newStates) => {
    try {
      
      // Si newStates es un array de IDs (compatibilidad hacia atrás)
      if (newStates.length > 0 && typeof newStates[0] === 'number') {
        const currentStates = kanbanStates?.states || [];
        const reorderedStates = newStates.map((stateId, index) => {
          const state = currentStates.find(s => s.id === stateId);
          return { ...state, order: index };
        });
        
        const updatedStates = {
          ...kanbanStates,
          states: reorderedStates
        };
        
        await updateKanbanStates(updatedStates);
        return true;
      }
      
      // Si newStates es un array de estados completos
      const updatedStates = {
        ...kanbanStates,
        states: newStates.map((state, index) => ({
          ...state,
          order: index
        }))
      };

      await updateKanbanStates(updatedStates);
      return true;
    } catch (error) {
      console.error('Error reordenando estados kanban:', error);
      throw error;
    }
  };

  const getStateDetails = (stateId) => {
    const state = taskStates.states.find(s => s.id === stateId);
    if (!state) {
      console.warn(`Estado no encontrado: ${stateId}, usando estado por defecto`);
      return taskStates.states[0];
    }
    return state;
  };

  const getKanbanStateDetails = (stateKey) => {
    const state = kanbanStates.states.find(s => s.key === stateKey);
    if (!state) {
      console.warn(`Estado kanban no encontrado: ${stateKey}, usando estado por defecto`);
      return kanbanStates.states[0];
    }
    return state;
  };

  const isValidTransition = (fromState, toState) => {
    return !taskStates.final_states.includes(fromState);
  };

  const isValidKanbanTransition = (fromState, toState) => {
    return !kanbanStates.final_states.includes(fromState);
  };

  return {
    // Estados de tareas
    taskStates,
    updateTaskStates: updateStates,
    addTaskState: getNextAvailableId,
    updateTaskState: getStateDetails,
    deleteTaskState: getStateDetails,
    reorderTaskStates: reorderKanbanStates,
    
    // Estados kanban
    kanbanStates,
    updateKanbanStates,
    addKanbanState,
    updateKanbanState,
    deleteKanbanState,
    reorderKanbanStates,
    
    // Estados generales
    loading,
    error,
    refetchStates: fetchStates
  };
}; 