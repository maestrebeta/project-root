import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUser, FiCalendar, FiClock, FiTag, FiMessageSquare, 
  FiTarget, FiStar, FiPlus, FiTrash2, FiCheck, FiArrowRight,
  FiAlertCircle, FiInfo, FiZap
} from 'react-icons/fi';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  task, 
  users, 
  onSave, 
  taskStatuses, 
  taskPriorities 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    estimated_hours: '',
    tags: [],
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [newTag, setNewTag] = useState('');

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setFormData({
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          assigned_to: task.assigned_to || '',
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          estimated_hours: task.estimated_hours || '',
          tags: task.tags || [],
          notes: task.notes || ''
        });
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'pending',
          priority: 'medium',
          assigned_to: '',
          due_date: '',
          estimated_hours: '',
          tags: [],
          notes: ''
        });
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, task]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!formData.assigned_to) {
      newErrors.assigned_to = 'Debe asignar la tarea a un usuario';
    }

    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours <= 0)) {
      newErrors.estimated_hours = 'Las horas estimadas deben ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        stepErrors.title = 'El título es obligatorio';
      }
      if (!formData.description.trim()) {
        stepErrors.description = 'La descripción es obligatoria';
      }
      if (!formData.assigned_to || formData.assigned_to === '') {
        stepErrors.assigned_to = 'Debe asignar la tarea a un usuario';
      }
    }

    if (step === 2) {
      if (formData.estimated_hours && (isNaN(formData.estimated_hours) || formData.estimated_hours <= 0)) {
        stepErrors.estimated_hours = 'Las horas estimadas deben ser un número positivo';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        ...formData,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        actual_hours: task ? task.actual_hours : 0
      };

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Error al guardar la tarea:', error);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    handleChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Manejar el envío del formulario
  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Si estamos en el primer paso, ir al siguiente en lugar de guardar
    if (currentStep === 1) {
      handleNext();
      return;
    }
    
    // Si estamos en el segundo paso, guardar la tarea
    handleSubmit(e);
  };

  // Manejar clic en botón Siguiente
  const handleNextClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleNext();
  };

  // Manejar clic en el backdrop
  const handleBackdropClick = (e) => {
    onClose();
  };

  // Manejar clic en el botón X
  const handleCloseClick = () => {
    onClose();
  };

  // Manejar clic en el botón Cancelar
  const handleCancelClick = () => {
    onClose();
  };

  // Manejar clic en el botón Anterior
  const handlePreviousClick = () => {
    handlePrevious();
  };

  // Manejar clic en el botón Crear/Actualizar
  const handleSaveClick = (e) => {
    handleSubmit(e);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiTarget className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {task ? 'Editar Tarea' : 'Nueva Tarea'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {task ? 'Modifica los detalles de la tarea' : 'Crea una nueva tarea para el equipo'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseClick}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Indicador de progreso */}
            <div className="mt-4">
              <div className="flex items-center gap-2">
                {[1, 2].map((step) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-2 ${
                      currentStep >= step ? 'text-white' : 'text-blue-200'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        currentStep >= step 
                          ? 'bg-white text-blue-600' 
                          : 'bg-white/20 text-blue-200'
                      }`}>
                        {step}
                      </div>
                      <span className="text-sm font-medium">
                        {step === 1 ? 'Información básica' : 'Configuración avanzada'}
                      </span>
                    </div>
                    {step < 2 && (
                      <FiArrowRight className="w-4 h-4 text-blue-200" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={(e) => {
              handleFormSubmit(e);
            }} className="space-y-6">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Título */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Título de la tarea *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.title ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Ej: Implementar autenticación JWT"
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.title}
                        </p>
                      )}
                    </div>

                    {/* Descripción */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Descripción *
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none ${
                          errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="Describe detalladamente la tarea a realizar..."
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.description}
                        </p>
                      )}
                    </div>

                    {/* Estado y Prioridad */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Estado
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleChange('status', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                        >
                          {taskStatuses.map(status => (
                            <option key={status.id} value={status.id}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Prioridad
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => handleChange('priority', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                        >
                          {taskPriorities.map(priority => (
                            <option key={priority.id} value={priority.id}>
                              {priority.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Usuario asignado */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Asignar a *
                      </label>
                      <select
                        value={formData.assigned_to}
                        onChange={(e) => handleChange('assigned_to', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.assigned_to ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <option value="">Seleccionar usuario</option>
                        {users.map(user => (
                          <option key={user.user_id} value={user.user_id}>
                            {user.full_name} ({user.role})
                          </option>
                        ))}
                      </select>
                      {errors.assigned_to && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <FiAlertCircle className="w-4 h-4" />
                          {errors.assigned_to}
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Fecha de vencimiento y horas estimadas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha de vencimiento
                        </label>
                        <input
                          type="date"
                          value={formData.due_date}
                          onChange={(e) => handleChange('due_date', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                            errors.due_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                        {errors.due_date && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <FiAlertCircle className="w-4 h-4" />
                            {errors.due_date}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Horas estimadas
                        </label>
                        <input
                          type="number"
                          value={formData.estimated_hours}
                          onChange={(e) => handleChange('estimated_hours', e.target.value)}
                          min="0"
                          step="0.5"
                          className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                            errors.estimated_hours ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          placeholder="Ej: 8"
                        />
                        {errors.estimated_hours && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <FiAlertCircle className="w-4 h-4" />
                            {errors.estimated_hours}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tags
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={handleTagKeyPress}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                            placeholder="Agregar tag..."
                          />
                          <button
                            type="button"
                            onClick={addTag}
                            className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 flex items-center gap-2"
                          >
                            <FiPlus className="w-4 h-4" />
                            Agregar
                          </button>
                        </div>
                        
                        {formData.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium"
                              >
                                <FiTag className="w-3 h-3" />
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => removeTag(tag)}
                                  className="text-blue-500 hover:text-blue-700 transition-colors duration-200"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Notas adicionales
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none hover:border-gray-300"
                        placeholder="Información adicional, contexto, o comentarios..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botones de navegación */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePreviousClick}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                    >
                      Anterior
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  
                  {currentStep < 2 ? (
                    <button
                      type="button"
                      onClick={handleNextClick}
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all duration-200 font-medium flex items-center gap-2"
                    >
                      Siguiente
                      <FiArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      onClick={(e) => {
                        handleSaveClick(e);
                      }}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg"
                    >
                      <FiCheck className="w-4 h-4" />
                      {task ? 'Actualizar Tarea' : 'Crear Tarea'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
} 