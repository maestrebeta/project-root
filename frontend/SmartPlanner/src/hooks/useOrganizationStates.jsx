import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Estados predeterminados del sistema
const DEFAULT_TASK_STATES = {
  states: [
    {
      id: 'pendiente',
      label: 'Pendiente',
      icon: '🔴',
      color: 'red',
      isDefault: true
    },
    {
      id: 'en_progreso',
      label: 'En progreso',
      icon: '🔵',
      color: 'blue',
      isDefault: true
    },
    {
      id: 'completada',
      label: 'Completada',
      icon: '🟢',
      color: 'green',
      isDefault: true
    }
  ],
  default_state: 'pendiente',
  final_states: ['completada']
};

export const useOrganizationStates = () => {
  const { user } = useAuth();
  const [taskStates, setTaskStates] = useState(DEFAULT_TASK_STATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStates = async () => {
      if (!user?.organization_id) {
        console.log('No hay organización activa, usando estados por defecto');
        setLoading(false);
        return;
      }

      try {
        const session = localStorage.getItem('session');
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        const { token } = JSON.parse(session);
        console.log('Obteniendo estados para organización:', user.organization_id);

        const response = await fetch(
          `http://localhost:8001/organizations/${user.organization_id}/task-states`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Error en la respuesta:', errorData);
          throw new Error('Error al cargar los estados');
        }

        const data = await response.json();
        console.log('Estados recibidos del backend:', data);
        
        // Validar y normalizar la estructura de datos
        if (!data || !Array.isArray(data.states)) {
          console.error('Estructura de datos inválida:', data);
          throw new Error('Estructura de estados inválida');
        }

        const normalizedData = {
          states: data.states.map(state => ({
            id: state.id || 'pendiente',
            label: state.label || 'Pendiente',
            icon: state.icon || '🔴',
            color: state.color || 'red',
            isDefault: state.isDefault || false
          })),
          default_state: data.default_state || 'pendiente',
          final_states: data.final_states || ['completada']
        };

        console.log('Estados normalizados:', normalizedData);
        setTaskStates(normalizedData);
        setError(null);
      } catch (err) {
        console.error('Error al cargar estados:', err);
        setError(err.message);
        // En caso de error, usar los estados predeterminados
        console.log('Usando estados predeterminados debido al error');
        setTaskStates(DEFAULT_TASK_STATES);
      } finally {
        setLoading(false);
      }
    };

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
      console.log('Actualizando estados:', newStates);

      // Validar y normalizar los nuevos estados antes de enviarlos
      const normalizedStates = {
        states: newStates.states.map(state => ({
          id: state.id || 'pendiente',
          label: state.label || 'Pendiente',
          icon: state.icon || '🔴',
          color: state.color || 'red',
          isDefault: state.isDefault || false
        })),
        default_state: newStates.default_state || 'pendiente',
        final_states: newStates.final_states || ['completada']
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
        console.error('Error en la respuesta:', errorData);
        throw new Error('Error al actualizar los estados');
      }

      const data = await response.json();
      console.log('Estados actualizados exitosamente:', data);
      setTaskStates(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error al actualizar estados:', err);
      setError(err.message);
      throw err;
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

  const isValidTransition = (fromState, toState) => {
    return !taskStates.final_states.includes(fromState);
  };

  return {
    states: taskStates,
    loading,
    error,
    updateStates,
    getStateDetails,
    isValidTransition
  };
}; 