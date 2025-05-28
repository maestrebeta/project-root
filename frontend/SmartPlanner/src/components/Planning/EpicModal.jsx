import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSave, FiZap, FiTarget, FiCalendar, FiFlag, FiTag, FiEdit3, 
  FiCheck, FiAlertCircle, FiStar, FiTrendingUp, FiUsers, FiClock,
  FiArrowRight, FiPlus, FiMinus, FiChevronDown, FiChevronUp, FiInfo
} from 'react-icons/fi';

// Configuración de prioridades épicas
const PRIORITY_CONFIG = {
  low: { 
    label: 'Baja', 
    color: 'from-green-400 to-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    icon: '🟢',
    description: 'No urgente, puede esperar'
  },
  medium: { 
    label: 'Media', 
    color: 'from-yellow-400 to-yellow-600', 
    bg: 'bg-yellow-50', 
    border: 'border-yellow-200',
    icon: '🟡',
    description: 'Importante, planificar pronto'
  },
  high: { 
    label: 'Alta', 
    color: 'from-red-400 to-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    icon: '🔴',
    description: 'Urgente, máxima prioridad'
  },
  critical: { 
    label: 'Crítica', 
    color: 'from-purple-400 to-purple-600', 
    bg: 'bg-purple-50', 
    border: 'border-purple-200',
    icon: '🟣',
    description: 'Crítico para el negocio'
  }
};

// Estados épicos
const STATUS_CONFIG = {
  planning: { 
    label: 'Planificación', 
    color: 'from-blue-400 to-blue-600', 
    bg: 'bg-blue-50',
    icon: '📋',
    description: 'Definiendo alcance y objetivos'
  },
  in_progress: { 
    label: 'En Progreso', 
    color: 'from-orange-400 to-orange-600', 
    bg: 'bg-orange-50',
    icon: '⚡',
    description: 'Desarrollo activo'
  },
  review: { 
    label: 'Revisión', 
    color: 'from-purple-400 to-purple-600', 
    bg: 'bg-purple-50',
    icon: '👀',
    description: 'En proceso de revisión'
  },
  done: { 
    label: 'Completada', 
    color: 'from-green-400 to-green-600', 
    bg: 'bg-green-50',
    icon: '✅',
    description: 'Épica finalizada exitosamente'
  },
  blocked: { 
    label: 'Bloqueada', 
    color: 'from-red-400 to-red-600', 
    bg: 'bg-red-50',
    icon: '🚫',
    description: 'Impedimentos que resolver'
  }
};



export default function EpicModal({ 
  epic, 
  projects = [], 
  onClose, 
  onSave, 
  isOpen = false,
  selectedProject = null // Proyecto activo predeterminado
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    end_date: '',
    acceptance_criteria: '',
    business_value: '',
    tags: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  
  const nameInputRef = useRef(null);
  const isEditing = Boolean(epic);

  // Inicializar formulario
  useEffect(() => {
    if (epic) {
      setFormData({
        name: epic.name || '',
        description: epic.description || '',
        project_id: epic.project_id || '',
        status: epic.status || 'planning',
        priority: epic.priority || 'medium',
        start_date: epic.start_date ? epic.start_date.split('T')[0] : '',
        end_date: epic.end_date ? epic.end_date.split('T')[0] : '',
        acceptance_criteria: epic.acceptance_criteria || '',
        business_value: epic.business_value || '',
        tags: epic.tags || []
      });
    } else {
      // Valores por defecto inteligentes
      const today = new Date().toISOString().split('T')[0];
      const defaultProjectId = selectedProject?.project_id || 
                              (projects.length === 1 ? projects[0].project_id : '') ||
                              (projects.length > 0 ? projects[0].project_id : '');
      
      setFormData({
        name: '',
        description: '',
        project_id: defaultProjectId,
        status: 'planning',
        priority: 'medium',
        start_date: today, // Fecha de hoy como predeterminada
        end_date: '', // Fecha fin no obligatoria
        acceptance_criteria: '',
        business_value: '',
        tags: []
      });
    }
    setErrors({});
    setValidationStatus({});
  }, [epic, projects, selectedProject]);

  // Auto-focus en el nombre cuando se abre
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Validación en tiempo real
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newStatus = { ...validationStatus };

    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'El nombre es requerido';
          newStatus.name = 'error';
        } else if (value.length < 3) {
          newErrors.name = 'Mínimo 3 caracteres';
          newStatus.name = 'warning';
        } else if (value.length > 200) {
          newErrors.name = 'Máximo 200 caracteres';
          newStatus.name = 'error';
        } else {
          delete newErrors.name;
          newStatus.name = 'success';
        }
        break;
      


      case 'end_date':
        if (value && formData.start_date && new Date(value) <= new Date(formData.start_date)) {
          newErrors.end_date = 'Debe ser posterior a la fecha de inicio';
          newStatus.end_date = 'error';
        } else {
          delete newErrors.end_date;
          newStatus.end_date = value ? 'success' : 'neutral';
        }
        break;
    }

    setErrors(newErrors);
    setValidationStatus(newStatus);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  // Manejar tags
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validar formulario completo
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'El nombre es requerido';
    if (formData.end_date && formData.start_date && 
        new Date(formData.end_date) <= new Date(formData.start_date)) {
      newErrors.end_date = 'La fecha de fin debe ser posterior a la de inicio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Hacer scroll al primer error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    
    try {
      // Convertir tags array a formato diccionario para el backend
      const tagsDict = formData.tags.length > 0 
        ? formData.tags.reduce((acc, tag, index) => {
            acc[tag] = { order: index, color: '#3B82F6' };
            return acc;
          }, {})
        : null;

      const epicData = {
        ...formData,
        epic_id: isEditing ? epic.epic_id : undefined, // Incluir epic_id para edición
        project_id: selectedProject?.project_id || formData.project_id,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        tags: tagsDict // Enviar como diccionario
      };

      console.log('💾 Guardando épica con datos:', epicData);
      await onSave(epicData);
      onClose();
    } catch (error) {
      console.error('Error al guardar épica:', error);
      setErrors({ submit: 'Error al guardar la épica. Inténtalo de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // Obtener icono de validación
  const getValidationIcon = (fieldName) => {
    const status = validationStatus[fieldName];
    switch (status) {
      case 'success': return <FiCheck className="w-4 h-4 text-green-500" />;
      case 'error': return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <FiAlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return null;
    }
  };

  // Obtener clase de borde según validación
  const getBorderClass = (fieldName) => {
    const status = validationStatus[fieldName];
    const baseClass = "border-2 transition-all duration-200";
    
    if (focusedField === fieldName) {
      switch (status) {
        case 'success': return `${baseClass} border-green-400 ring-2 ring-green-100`;
        case 'error': return `${baseClass} border-red-400 ring-2 ring-red-100`;
        case 'warning': return `${baseClass} border-yellow-400 ring-2 ring-yellow-100`;
        default: return `${baseClass} border-blue-400 ring-2 ring-blue-100`;
      }
    }
    
    switch (status) {
      case 'success': return `${baseClass} border-green-300`;
      case 'error': return `${baseClass} border-red-300`;
      case 'warning': return `${baseClass} border-yellow-300`;
      default: return `${baseClass} border-gray-300 hover:border-gray-400`;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header Épico */}
          <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  <FiZap className="w-6 h-6" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isEditing ? 'Editar Épica' : 'Nueva Épica'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {isEditing ? 'Modifica los detalles de tu épica' : 'Crea una nueva épica épica para tu proyecto'}
                  </p>
                </div>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Error de envío */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3"
              >
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                {errors.submit}
              </motion.div>
            )}

            <div className="space-y-8">
              {/* Información Básica */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <FiEdit3 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Nombre de la Épica */}
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Épica *
                    </label>
                    <div className="relative">
                      <input
                        ref={nameInputRef}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 rounded-xl ${getBorderClass('name')} focus:outline-none text-lg font-medium`}
                        placeholder="Ej: Sistema de Autenticación de Usuarios"
                        maxLength={200}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {getValidationIcon('name')}
                        <span className="text-xs text-gray-400">
                          {formData.name.length}/200
                        </span>
                      </div>
                    </div>
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center gap-1"
                      >
                        <FiAlertCircle className="w-3 h-3" />
                        {errors.name}
                      </motion.p>
                    )}
                  </div>


                </div>
              </div>

              {/* Estado y Prioridad */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <FiFlag className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Estado y Prioridad</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Estado
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <motion.button
                          key={key}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, status: key }))}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.status === key
                              ? `bg-gradient-to-r ${config.color} text-white border-transparent`
                              : `${config.bg} border-gray-200 hover:border-gray-300`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{config.icon}</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">{config.label}</div>
                              <div className={`text-xs ${formData.status === key ? 'text-white/80' : 'text-gray-500'}`}>
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Prioridad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Prioridad
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                        <motion.button
                          key={key}
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            formData.priority === key
                              ? `bg-gradient-to-r ${config.color} text-white border-transparent`
                              : `${config.bg} ${config.border} hover:border-opacity-60`
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{config.icon}</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">{config.label}</div>
                              <div className={`text-xs ${formData.priority === key ? 'text-white/80' : 'text-gray-500'}`}>
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FiCalendar className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Planificación Temporal</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                      />
                      <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Se establece automáticamente la fecha de hoy
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Fin <span className="text-gray-400">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('end_date')}
                        onBlur={() => setFocusedField(null)}
                        className={`w-full px-4 py-3 rounded-xl ${getBorderClass('end_date')} focus:outline-none`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {getValidationIcon('end_date')}
                        <FiCalendar className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    {errors.end_date && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1 text-sm text-red-600 flex items-center gap-1"
                      >
                        <FiAlertCircle className="w-3 h-3" />
                        {errors.end_date}
                      </motion.p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      📅 Puedes definirla más adelante según el progreso
                    </p>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                  placeholder="Describe el objetivo y alcance de esta épica..."
                />
              </div>

              {/* Sección Avanzada */}
              <div className="lg:col-span-2">
                <motion.button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
                  Opciones Avanzadas
                </motion.button>
              </div>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="lg:col-span-2 space-y-6"
                  >
                    {/* Criterios de Aceptación */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Criterios de Aceptación
                      </label>
                      <textarea
                        name="acceptance_criteria"
                        value={formData.acceptance_criteria}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                        placeholder="- El usuario puede autenticarse con email y contraseña&#10;- Se muestra mensaje de error para credenciales inválidas&#10;- Se redirige al dashboard después del login exitoso"
                      />
                    </div>

                    {/* Valor de Negocio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Valor de Negocio
                      </label>
                      <textarea
                        name="business_value"
                        value={formData.business_value}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                        placeholder="Explica el valor que esta épica aporta al negocio..."
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Etiquetas
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {formData.tags.map((tag, index) => (
                          <motion.span
                            key={`epic-tag-${index}-${tag}`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            <FiTag className="w-3 h-3" />
                            {tag}
                            <button
                              type="button"
                              onClick={() => handleRemoveTag(tag)}
                              className="ml-1 hover:text-blue-600"
                            >
                              <FiX className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                          placeholder="Agregar etiqueta..."
                        />
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <FiPlus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botones de Acción ÉPICOS */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </motion.button>
              
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || Object.keys(errors).length > 0}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-3 shadow-lg"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <FiSave className="w-5 h-5" />
                )}
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar Épica' : 'Crear Épica')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 