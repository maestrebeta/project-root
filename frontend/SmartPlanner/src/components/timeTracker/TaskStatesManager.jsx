import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiPlus, FiTrash2, FiEdit3, FiSave, FiMove, 
  FiAlertCircle, FiCheck, FiArrowRight, FiSettings, FiZap,
  FiEye, FiEyeOff, FiDroplet, FiTag, FiInfo, FiChevronUp, FiChevronDown
} from 'react-icons/fi';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

// Estados predeterminados del sistema
const DEFAULT_STATES = {
  states: [
    {
      id: 1,
      label: 'Pendiente',
      icon: '🔴',
      color: 'red',
      isDefault: true
    },
    {
      id: 2,
      label: 'En progreso',
      icon: '🔵',
      color: 'blue',
      isDefault: true
    },
    {
      id: 3,
      label: 'Completada',
      icon: '🟢',
      color: 'green',
      isDefault: true
    }
  ],
  default_state: 1,
  final_states: [3]
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

// Componente de contenido que puede ser usado dentro de otros modales
export const TaskStatesManagerContent = ({ onClose, isEmbedded = false, onUpdate }) => {
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const { taskStates, updateTaskStates, refetchStates } = useOrganizationStates();
  const [states, setStates] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingState, setEditingState] = useState(null);
  const [newState, setNewState] = useState({
    id: '',
    label: '',
    icon: '🔵',
    color: 'blue'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Cargar estados iniciales desde useOrganizationStates
  useEffect(() => {
    if (taskStates?.states) {
      setStates([...taskStates.states]);
    }
  }, [taskStates]);

  const handleSave = async () => {
    setLoading(true);
    setErrors({});

    try {
      const taskStatesData = {
        states: states,
        default_state: 1,
        final_states: [3]
      };

      // Usar la función onUpdate si está disponible, sino usar updateTaskStates del hook
      if (onUpdate) {
        await onUpdate(taskStatesData);
      } else {
        await updateTaskStates(taskStatesData);
      }

      // Refrescar los estados del hook para asegurar sincronización
      await refetchStates();

      // Mostrar notificación de éxito
      showNotification('Estados de tareas actualizados correctamente', 'success');
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error completo:', error);
      setErrors({ general: error.message });
      // Mostrar notificación de error
      showNotification('Error al guardar los estados de tareas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(states);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setStates(items);
  };

  const moveStateUp = (index) => {
    if (index === 0) return;
    const newStates = [...states];
    [newStates[index], newStates[index - 1]] = [newStates[index - 1], newStates[index]];
    setStates(newStates);
  };

  const moveStateDown = (index) => {
    if (index === states.length - 1) return;
    const newStates = [...states];
    [newStates[index], newStates[index + 1]] = [newStates[index + 1], newStates[index]];
    setStates(newStates);
  };

  const handleAddState = () => {
    // Generar ID automático (máximo ID existente + 1)
    const maxId = Math.max(...states.map(s => s.id), 0);
    const newId = maxId + 1;
    
    setEditingState({
      id: newId,
      label: '',
      icon: '🔴',
      color: 'red',
      isDefault: false
    });
    setShowAddForm(true);
  };

  const handleEditState = (state) => {
    setNewState({ ...state });
    setEditingState(state);
    setShowAddForm(true);
    setErrors({});
  };

  const handleUpdateState = (updatedState) => {
    if (editingState) {
      setStates(prev => prev.map(state => 
        state.id === editingState.id ? updatedState : state
      ));
    } else {
      setStates(prev => [...prev, updatedState]);
    }
    setShowAddForm(false);
    setEditingState(null);
    setNewState({
      id: '',
      label: '',
      icon: '🔵',
      color: 'blue'
    });
  };

  const handleDeleteState = (stateId) => {
    const stateToDelete = states.find(s => s.id === stateId);
    if (!stateToDelete) return;
    
    if (stateToDelete.isProtected) {
      showNotification('No se puede eliminar un estado protegido', 'error');
      return;
    }
    
    if (window.confirm(`¿Estás seguro de que quieres eliminar el estado "${stateToDelete.label}"?`)) {
      setStates(prev => prev.filter(state => state.id !== stateId));
      showNotification('Estado eliminado correctamente', 'success');
    }
  };

  const validateState = (state) => {
    const newErrors = {};
    
    if (!state.label || state.label.trim() === '') {
      newErrors.label = 'La etiqueta es requerida';
    }
    
    if (!state.icon) {
      newErrors.icon = 'El icono es requerido';
    }
    
    if (!state.color) {
      newErrors.color = 'El color es requerido';
    }
    
    return newErrors;
  };

  const handleSaveState = () => {
    const validationErrors = validateState(editingState);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    // Verificar si es un estado existente o nuevo
    const existingState = states.find(s => s.id === editingState.id);
    
    if (existingState) {
      // Actualizar estado existente
      const updatedStates = states.map(s => 
        s.id === editingState.id ? editingState : s
      );
      setStates(updatedStates);
    } else {
      // Agregar nuevo estado
      setStates(prev => {
        const newStates = [...prev, editingState];
        return newStates;
      });
      showNotification('Estado agregado correctamente', 'success');
    }
    
    setEditingState(null);
    setShowAddForm(false);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingState(null);
    setNewState({
      id: '',
      label: '',
      icon: '🔵',
      color: 'blue'
    });
    setErrors({});
  };

  function getBgColorClass(color) {
    const colorMap = {
      'red': 'bg-red-50 border-red-200 text-red-800',
      'blue': 'bg-blue-50 border-blue-200 text-blue-800',
      'green': 'bg-green-50 border-green-200 text-green-800',
      'yellow': 'bg-yellow-50 border-yellow-200 text-yellow-800',
      'purple': 'bg-purple-50 border-purple-200 text-purple-800',
      'gray': 'bg-gray-50 border-gray-200 text-gray-800',
      'orange': 'bg-orange-50 border-orange-200 text-orange-800',
      'indigo': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'pink': 'bg-pink-50 border-pink-200 text-pink-800'
    };
    return colorMap[color] || colorMap.gray;
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleCloseClick = () => {
    onClose?.();
  };

  const handleCancelClick = () => {
    onClose?.();
  };

  // Si está embebido, no renderizar el modal completo
  if (isEmbedded) {
    return (
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Estados de Tareas</h2>
              <p className="text-gray-600 font-medium">Gestiona los estados para el registro de tiempo</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddState}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium flex items-center gap-2 shadow-lg"
            >
              <FiPlus className="w-5 h-5" />
              Agregar Estado
            </motion.button>
          </div>
        </div>

        {/* Estados existentes */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">Estados Configurados</h3>
          <div className="space-y-3">
            {states.map((state, index) => (
              <motion.div
                  key={state.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                  getBgColorClass(state.color)
                }`}
                >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{state.icon}</div>
                    <div>
                      <h4 className="font-semibold text-lg">{state.label}</h4>
                      <p className="text-sm opacity-75">ID: {state.id}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-2">
                    {/* Botones de reordenamiento */}
                      <button
                      onClick={() => moveStateUp(index)}
                      disabled={index === 0}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                      title="Mover hacia arriba"
                      >
                      <FiChevronUp className="w-4 h-4" />
                      </button>
                      <button
                      onClick={() => moveStateDown(index)}
                      disabled={index === states.length - 1}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                      title="Mover hacia abajo"
                    >
                      <FiChevronDown className="w-4 h-4" />
                    </button>
                    
                    {/* Botones de edición */}
                    <button
                      onClick={() => handleEditState(state)}
                      disabled={state.isProtected}
                      className="p-2 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50"
                      title="Editar estado"
                      >
                      <FiEdit3 className="w-4 h-4" />
                      </button>
                    </div>
                </div>
              </motion.div>
              ))}
          </div>
        </div>

        {/* Formulario de agregar/editar estado */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {editingState ? 'Editar Estado' : 'Nuevo Estado'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Etiqueta *
                  </label>
                  <input
                    type="text"
                    value={editingState.label}
                    onChange={(e) => setEditingState(prev => ({ ...prev, label: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                      errors.label ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="Ej: En Revisión"
                  />
                  {errors.label && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.label}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Estado por Defecto
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editingState.isDefault}
                        onChange={(e) => setEditingState(prev => ({ ...prev, isDefault: e.target.checked }))}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Marcar como estado por defecto</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Icono
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVAILABLE_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setEditingState(prev => ({ ...prev, icon }))}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-xl ${
                          editingState.icon === icon
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {AVAILABLE_COLORS.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => setEditingState(prev => ({ ...prev, color: color.name }))}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                          editingState.color === color.name
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        } ${getBgColorClass(color.name)}`}
                      >
                        {color.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vista previa */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vista Previa
                </label>
                <div className={`p-4 rounded-xl border-2 ${getBgColorClass(editingState.color)}`}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{editingState.icon}</div>
                    <div>
                      <h4 className="font-semibold">{editingState.label || 'Etiqueta del estado'}</h4>
                      <p className="text-sm opacity-75">ID: {editingState.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3">
                  <button
                  onClick={handleCancelEdit}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                  onClick={handleSaveState}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg"
                  >
                  <FiSave className="w-4 h-4" />
                  {editingState ? 'Actualizar' : 'Crear'}
                  </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error general */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
          >
            <p className="text-red-600 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              {errors.general}
            </p>
          </motion.div>
        )}

        {/* Información adicional */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Los estados predeterminados no se pueden eliminar</li>
                <li>• Los cambios se aplicarán a todas las tareas existentes</li>
                <li>• El orden de los estados afecta la visualización en las tablas</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botones de navegación */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div></div>
          <div className="flex items-center gap-3">
              <button
              onClick={handleCancelClick}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FiCheck className="w-4 h-4" />
                Guardar Cambios
                </>
              )}
              </button>
            </div>
        </div>
      </div>
    );
  }

  // Renderizado completo del modal (comportamiento original)
  return createPortal(
        <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
            >
              <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
                <FiSettings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Estados de Tareas</h2>
                <p className="text-gray-600 font-medium">Gestiona los estados para el registro de tiempo</p>
                  </div>
                </div>
                  <button
              onClick={handleCloseClick}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 group"
            >
              <FiX className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
                  </button>
                </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <TaskStatesManagerContent onClose={onClose} isEmbedded={true} onUpdate={onUpdate} />
          </div>
            </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Componente principal que mantiene la compatibilidad
const TaskStatesManager = ({ onClose, onUpdate }) => {
  return <TaskStatesManagerContent onClose={onClose} isEmbedded={false} onUpdate={onUpdate} />;
};

export default TaskStatesManager; 