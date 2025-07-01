import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiSave, FiArrowUp, FiArrowDown, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

const AVAILABLE_ICONS = ['🟡', '🔵', '🟢', '🔴', '⚪', '⚫', '🟣', '🟤', '🟠', '⭐', '💫', '🌟'];
const AVAILABLE_COLORS = [
  { name: 'yellow', label: 'Amarillo', bgClass: 'bg-yellow-50', textClass: 'text-yellow-700' },
  { name: 'blue', label: 'Azul', bgClass: 'bg-blue-50', textClass: 'text-blue-700' },
  { name: 'green', label: 'Verde', bgClass: 'bg-green-50', textClass: 'text-green-700' },
  { name: 'red', label: 'Rojo', bgClass: 'bg-red-50', textClass: 'text-red-700' },
  { name: 'gray', label: 'Gris', bgClass: 'bg-gray-50', textClass: 'text-gray-700' },
  { name: 'purple', label: 'Púrpura', bgClass: 'bg-purple-50', textClass: 'text-purple-700' },
  { name: 'orange', label: 'Naranja', bgClass: 'bg-orange-50', textClass: 'text-orange-700' },
  { name: 'indigo', label: 'Índigo', bgClass: 'bg-indigo-50', textClass: 'text-indigo-700' },
  { name: 'pink', label: 'Rosa', bgClass: 'bg-pink-50', textClass: 'text-pink-700' }
];

// Componente de contenido que puede ser usado dentro de otros modales
export const KanbanStatesManagerContent = ({ onClose, isEmbedded = false }) => {
  const { kanbanStates, addKanbanState, updateKanbanState, deleteKanbanState, reorderKanbanStates } = useOrganizationStates();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const [states, setStates] = useState([]);
  const [editingState, setEditingState] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newState, setNewState] = useState({
    label: '',
    color: 'blue'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (kanbanStates?.states) {
      setStates([...kanbanStates.states]);
    }
  }, [kanbanStates]);

  const handleSave = async () => {
    setLoading(true);
    try {
      
      await reorderKanbanStates(states);
      showNotification('Estados kanban actualizados correctamente', 'success');
      onClose?.();
    } catch (error) {
      showNotification('Error al guardar los estados kanban', 'error');
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
    setShowAddForm(true);
    setEditingState(null);
    setNewState({ label: '', color: 'blue' });
    setErrors({});
  };

  const handleEditState = (state) => {
    setEditingState(state);
    setShowAddForm(true);
    setNewState({
      label: state.label,
      color: state.color || 'blue'
    });
    setErrors({});
  };

  const handleUpdateState = async (updatedState) => {
    setLoading(true);
    try {
      if (editingState) {
        await updateKanbanState(editingState.id, updatedState);
      } else {
        await addKanbanState(updatedState);
        showNotification('success', 'Estado agregado exitosamente');
      }
      setShowAddForm(false);
      setEditingState(null);
    } catch (error) {
      showNotification('error', error.message || 'Error al guardar el estado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteState = async (stateId) => {
    const stateToDelete = states.find(s => s.id === stateId);
    if (stateToDelete?.isProtected) {
      showNotification('warning', 'No se puede eliminar un estado protegido');
      return;
    }

    if (!confirm('¿Estás seguro de que quieres eliminar este estado?')) return;

    setLoading(true);
    try {
      await deleteKanbanState(stateId);
      showNotification('success', 'Estado eliminado exitosamente');
    } catch (error) {
      showNotification('error', error.message || 'Error al eliminar el estado');
    } finally {
      setLoading(false);
    }
  };

  const validateState = (state) => {
    const newErrors = {};
    
    if (!state.label.trim()) {
      newErrors.label = 'El nombre es requerido';
    } else if (state.label.length < 2) {
      newErrors.label = 'El nombre debe tener al menos 2 caracteres';
    } else if (state.label.length > 50) {
      newErrors.label = 'El nombre no puede exceder 50 caracteres';
    }

    if (!state.color) {
      newErrors.color = 'El color es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveState = () => {
    if (!validateState(newState)) return;
    
    // Obtener la clase CSS completa del color
    const colorConfig = AVAILABLE_COLORS.find(c => c.name === newState.color);
    const colorClass = colorConfig ? colorConfig.bgClass : 'bg-gray-50';
    
    const stateToSave = {
      label: newState.label.trim(),
      color: colorClass // Guardar la clase CSS completa
    };

    handleUpdateState(stateToSave);
  };

  const handleCancelEdit = () => {
    setShowAddForm(false);
    setEditingState(null);
    setNewState({ label: '', color: 'blue' });
    setErrors({});
  };

  function getBgColorClass(color) {
    // Si el color ya es una clase CSS completa (como 'bg-blue-50'), devolverlo directamente
    if (color && color.startsWith('bg-')) {
      return color;
    }
    
    // Si es un color simple (como 'blue'), buscar en AVAILABLE_COLORS
    const colorConfig = AVAILABLE_COLORS.find(c => c.name === color);
    return colorConfig ? colorConfig.bgClass : 'bg-gray-50';
  }

  function getTextColorClass(color) {
    // Si el color ya es una clase CSS completa (como 'text-blue-700'), devolverlo directamente
    if (color && color.startsWith('text-')) {
      return color;
    }
    
    // Si es un color simple (como 'blue'), buscar en AVAILABLE_COLORS
    const colorConfig = AVAILABLE_COLORS.find(c => c.name === color);
    return colorConfig ? colorConfig.textClass : 'text-gray-700';
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleCancelClick = () => {
    onClose();
  };

  // Contar estados protegidos para mostrar el aviso
  const protectedStates = states.filter(state => state.isProtected);
  const hasProtectedStates = protectedStates.length > 0;

  return (
    <>
      {/* Modal wrapper solo si no está embebido */}
      {!isEmbedded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={handleBackdropClick}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-gray-200">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                  Gestión de Estados Kanban
                </h2>
                <p className="text-gray-600 mt-2">
                  Configura los estados para tu tablero kanban
                </p>
              </div>
              <button
                onClick={handleCloseClick}
                className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <FiX className="w-6 h-6 text-gray-600" />
              </button>
      </div>

            {/* Contenido del modal */}
            <div className="flex flex-col h-full">
              {/* Aviso de estados protegidos */}
              {hasProtectedStates && (
                <div className="mx-8 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <FiShield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-800 mb-1">Estados Protegidos</h3>
                      <p className="text-blue-700 text-sm">
                        Los estados "{protectedStates.map((s, index) => (
                          <span key={`protected-${index}`}>
                            {s.label}{index < protectedStates.length - 1 ? '" y "' : ''}
                          </span>
                        ))}" son obligatorios y no pueden eliminarse. 
                        Estos estados son fundamentales para el funcionamiento del sistema kanban.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Contenido principal */}
              <div className="p-8 overflow-y-auto flex-1">
                {/* Lista de estados */}
                <div className="space-y-4 mb-8">
                  {states.map((state, index) => (
      <motion.div
                      key={state.id || `state-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                        state.isProtected 
                          ? 'border-blue-200 bg-blue-50' 
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {/* Indicador de estado protegido */}
                      {state.isProtected && (
                        <div className="flex-shrink-0">
                          <FiShield className="w-5 h-5 text-blue-600" />
                        </div>
                      )}

                      {/* Color preview */}
                      <div className={`w-12 h-12 rounded-lg ${getBgColorClass(state.color)} flex items-center justify-center flex-shrink-0`}>
                        <span className={`text-lg font-bold ${getTextColorClass(state.color)}`}>
                          {state.label.charAt(0).toUpperCase()}
                        </span>
                      </div>

                      {/* Información del estado */}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-semibold text-lg ${getTextColorClass(state.color)} truncate`}>
                          {state.label}
                        </h3>
                        <p className="text-gray-500 text-sm">
                          ID: {state.id}
                          {state.isProtected && ' • Protegido'}
                        </p>
        </div>

                      {/* Controles */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Botones de reordenamiento */}
                        <button
                          onClick={() => moveStateUp(index)}
                          disabled={index === 0}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiArrowUp className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => moveStateDown(index)}
                          disabled={index === states.length - 1}
                          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FiArrowDown className="w-4 h-4 text-gray-600" />
                        </button>

                        {/* Botón de editar */}
                        {!state.isProtected && state.key !== 'backlog' && state.key !== 'done' && (
                          <button
                            onClick={() => handleEditState(state)}
                            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                          >
                            <FiEdit2 className="w-4 h-4 text-blue-600" />
                          </button>
                        )}

                        {/* Botón de eliminar (solo para estados no protegidos) */}
                        {!state.isProtected && (
                          <button
                            onClick={() => handleDeleteState(state.id)}
                            className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                          >
                            <FiTrash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Botón para agregar nuevo estado */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddState}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="flex items-center justify-center gap-3">
                    <FiPlus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                    <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                      Agregar Nuevo Estado
                    </span>
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-8 border-t border-gray-200 bg-gray-50">
                <div className="text-sm text-gray-600">
                  {states.length} estado{states.length !== 1 ? 's' : ''} configurado{states.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCancelClick}
                    className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiSave className="w-4 h-4" />
                        Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Contenido embebido (sin modal wrapper) */}
      {isEmbedded && (
        <div className="w-full">
          {/* Aviso de estados protegidos */}
          {hasProtectedStates && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <FiShield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Estados Protegidos</h3>
                  <p className="text-blue-700 text-sm">
                    Los estados "{protectedStates.map((s, index) => (
                      <span key={`protected-${index}`}>
                        {s.label}{index < protectedStates.length - 1 ? '" y "' : ''}
                      </span>
                    ))}" son obligatorios y no pueden eliminarse. 
                    Estos estados son fundamentales para el funcionamiento del sistema kanban.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Lista de estados */}
          <div className="space-y-4 mb-8">
            {states.map((state, index) => (
              <motion.div
                key={state.id || `state-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                  state.isProtected 
                    ? 'border-blue-200 bg-blue-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Indicador de estado protegido */}
                {state.isProtected && (
                  <div className="flex-shrink-0">
                    <FiShield className="w-5 h-5 text-blue-600" />
                  </div>
                )}

                {/* Color preview */}
                <div className={`w-12 h-12 rounded-lg ${getBgColorClass(state.color)} flex items-center justify-center flex-shrink-0`}>
                  <span className={`text-lg font-bold ${getTextColorClass(state.color)}`}>
                    {state.label.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Información del estado */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-lg ${getTextColorClass(state.color)} truncate`}>
                    {state.label}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    ID: {state.id}
                    {state.isProtected && ' • Protegido'}
                  </p>
                </div>

                {/* Controles */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Botones de reordenamiento */}
                  <button
                    onClick={() => moveStateUp(index)}
                    disabled={index === 0}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiArrowUp className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => moveStateDown(index)}
                    disabled={index === states.length - 1}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <FiArrowDown className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Botón de editar */}
                  {!state.isProtected && state.key !== 'backlog' && state.key !== 'done' && (
                    <button
                      onClick={() => handleEditState(state)}
                      className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
                    >
                      <FiEdit2 className="w-4 h-4 text-blue-600" />
                    </button>
                  )}

                  {/* Botón de eliminar (solo para estados no protegidos) */}
                  {!state.isProtected && (
                    <button
                      onClick={() => handleDeleteState(state.id)}
                      className="p-2 rounded-lg bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4 text-red-600" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Botón para agregar nuevo estado */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddState}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
          >
            <div className="flex items-center justify-center gap-3">
              <FiPlus className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
              <span className="text-gray-600 group-hover:text-blue-600 font-medium">
                Agregar Nuevo Estado
              </span>
            </div>
          </motion.button>

          {/* Botón de guardar para modo embebido */}
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal para agregar/editar estado */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-10"
            onClick={handleBackdropClick}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingState ? 'Editar Estado' : 'Nuevo Estado'}
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Formulario */}
              <div className="p-6 space-y-6">
                {/* Nombre del estado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Estado
                  </label>
                  <input
                    type="text"
                    value={newState.label}
                    onChange={(e) => setNewState({ ...newState, label: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      errors.label ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                    }`}
                    placeholder="Ej: En Revisión"
                  />
                  {errors.label && (
                    <p className="mt-1 text-sm text-red-600">{errors.label}</p>
                  )}
                </div>

                {/* Selector de color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Color del Estado
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {AVAILABLE_COLORS.map((color) => (
              <button
                        key={color.name}
                        onClick={() => setNewState({ ...newState, color: color.name })}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          newState.color === color.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-lg ${color.bgClass} flex items-center justify-center`}>
                          <span className={`text-sm font-bold ${color.textClass}`}>
                            Aa
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2 text-center">{color.label}</p>
              </button>
                    ))}
                  </div>
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                  )}
                </div>

                {/* Vista previa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vista Previa
                  </label>
                  <div className={`p-4 rounded-xl ${getBgColorClass(newState.color)} border-2 border-gray-200`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${getBgColorClass(newState.color)} flex items-center justify-center`}>
                        <span className={`text-lg font-bold ${getTextColorClass(newState.color)}`}>
                          {newState.label.charAt(0).toUpperCase() || 'E'}
                        </span>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${getTextColorClass(newState.color)}`}>
                          {newState.label || 'Nombre del Estado'}
                        </h4>
                        <p className={`text-sm ${getTextColorClass(newState.color)} opacity-70`}>
                          Clave: {newState.label ? newState.label.toLowerCase().replace(/\s+/g, '_') : 'nombre_del_estado'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              <button
                  onClick={handleSaveState}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      {editingState ? 'Actualizar' : 'Crear'}
                    </>
                  )}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Componente wrapper para uso independiente
const KanbanStatesManager = ({ onClose }) => {
  return <KanbanStatesManagerContent onClose={onClose} />;
};

export default KanbanStatesManager;