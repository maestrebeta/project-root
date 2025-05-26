import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useAuth } from "../../context/AuthContext.jsx";
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { FiPlus, FiEdit2, FiTrash2, FiMove, FiSave, FiX } from 'react-icons/fi';
import { useTaskStates } from './useProjectsAndTags';

// Estados predeterminados del sistema
const DEFAULT_TASK_STATES = {
  states: [
    {
      id: 'pendiente',
      label: 'Pendiente',
      icon: '🟡',
      color: 'yellow',
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

const AVAILABLE_ICONS = ['🟡', '🔵', '🟢', '🔴', '⚪', '⚫', '🟣', '🟤', '🟠', '⭐', '💫', '🌟'];
const AVAILABLE_COLORS = [
  { name: 'yellow', label: 'Amarillo' },
  { name: 'blue', label: 'Azul' },
  { name: 'green', label: 'Verde' },
  { name: 'red', label: 'Rojo' },
  { name: 'gray', label: 'Gris' },
  { name: 'purple', label: 'Púrpura' },
  { name: 'orange', label: 'Naranja' },
  { name: 'indigo', label: 'Índigo' },
  { name: 'pink', label: 'Rosa' }
];

const TaskStatesManager = ({ onClose }) => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { taskStates, updateTaskStates } = useTaskStates();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingState, setEditingState] = useState(null);
  const [newState, setNewState] = useState({
    label: '',
    icon: '🟡',
    color: 'gray'
  });
  const [showNewStateForm, setShowNewStateForm] = useState(false);

  // Guardar estados en el backend
  const handleSave = async () => {
    try {
      setLoading(true);
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch(`http://localhost:8000/organizations/${user.organization_id}/task-states`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(taskStates)
      });

      if (!response.ok) {
        throw new Error('Error al guardar los estados');
      }

      // Actualizar estados globalmente
      updateTaskStates(taskStates);
      onClose();
      
      // Recargar la página después de guardar
      window.location.reload();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (newOrder) => {
    updateTaskStates({
      ...taskStates,
      states: newOrder
    });
  };

  const handleAddState = () => {
    if (!newState.label) return;

    // Generar un ID único basado en el timestamp y un número aleatorio
    const uniqueId = `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    updateTaskStates({
      ...taskStates,
      states: [...taskStates.states, { 
        ...newState, 
        id: uniqueId,
        isDefault: false 
      }]
    });
    
    setNewState({
      label: '',
      icon: '🟡',
      color: 'gray'
    });
    setShowNewStateForm(false);
  };

  const handleEditState = (state) => {
    if (state.isDefault) return;
    setEditingState({
      ...state,
      originalId: state.id // Guardamos el ID original para referencia
    });
  };

  const handleUpdateState = (updatedState) => {
    updateTaskStates({
      ...taskStates,
      states: taskStates.states.map(s => 
        s.id === updatedState.originalId ? {
          ...updatedState,
          id: updatedState.originalId // Mantenemos el ID original
        } : s
      )
    });
    setEditingState(null);
  };

  const handleDeleteState = (stateId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este estado? Las tareas que lo usen pasarán al estado "pendiente".')) {
      updateTaskStates({
        ...taskStates,
        states: taskStates.states.filter(s => s.id !== stateId)
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Gestionar Estados de Tareas</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Organiza y personaliza los estados de las tareas para tu organización.
                Los estados predeterminados no pueden ser modificados.
              </p>
            </div>

            <Reorder.Group
              axis="y"
              values={taskStates.states}
              onReorder={handleReorder}
              className="space-y-3"
            >
              {taskStates.states.map((state) => (
                <Reorder.Item
                  key={state.id}
                  value={state}
                  className={`flex items-center p-4 ${
                    state.isDefault ? 'bg-gray-50' : 'bg-white'
                  } border rounded-lg shadow-sm hover:shadow-md transition-shadow`}
                  dragListener={!state.isDefault}
                >
                  <div className="flex-1 flex items-center gap-4">
                    {!state.isDefault && (
                      <FiMove className="text-gray-400 cursor-move" />
                    )}
                    <span className="text-2xl">{state.icon}</span>
                    <div>
                      <h3 className="font-medium text-gray-900">{state.label}</h3>
                      <p className="text-sm text-gray-500">ID: {state.id}</p>
                    </div>
                  </div>
                  
                  {!state.isDefault && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditState(state)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteState(state.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  )}
                </Reorder.Item>
              ))}
            </Reorder.Group>

            {!showNewStateForm ? (
              <button
                onClick={() => setShowNewStateForm(true)}
                className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <FiPlus /> Agregar nuevo estado
              </button>
            ) : (
              <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Nuevo Estado</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nombre del estado"
                    value={newState.label}
                    onChange={(e) => setNewState({ ...newState, label: e.target.value })}
                    className="border rounded-lg px-3 py-2"
                  />
                  <select
                    value={newState.icon}
                    onChange={(e) => setNewState({ ...newState, icon: e.target.value })}
                    className="border rounded-lg px-3 py-2"
                  >
                    {AVAILABLE_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <select
                    value={newState.color}
                    onChange={(e) => setNewState({ ...newState, color: e.target.value })}
                    className="border rounded-lg px-3 py-2"
                  >
                    {AVAILABLE_COLORS.map(color => (
                      <option key={color.name} value={color.name}>{color.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowNewStateForm(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddState}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={!newState.label}
                  >
                    Agregar Estado
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${theme.PRIMARY_GRADIENT_CLASS} ${theme.PRIMARY_GRADIENT_HOVER_CLASS}`}
                disabled={loading}
              >
                <FiSave />
                Guardar Cambios
              </button>
            </div>
          </>
        )}

        {/* Modal de edición */}
        <AnimatePresence>
          {editingState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-lg font-semibold mb-4">Editar Estado</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Estado
                    </label>
                    <input
                      type="text"
                      value={editingState.label}
                      onChange={(e) => setEditingState({
                        ...editingState,
                        label: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icono
                    </label>
                    <select
                      value={editingState.icon}
                      onChange={(e) => setEditingState({
                        ...editingState,
                        icon: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {AVAILABLE_ICONS.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <select
                      value={editingState.color}
                      onChange={(e) => setEditingState({
                        ...editingState,
                        color: e.target.value
                      })}
                      className="w-full border rounded-lg px-3 py-2"
                    >
                      {AVAILABLE_COLORS.map(color => (
                        <option key={color.name} value={color.name}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => setEditingState(null)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleUpdateState(editingState)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default TaskStatesManager; 