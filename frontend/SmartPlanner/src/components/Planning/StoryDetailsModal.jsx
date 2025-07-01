import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiSave, FiTrash2, FiCopy, FiUser, FiCalendar, FiClock, FiTarget, 
  FiFlag, FiTag, FiMessageSquare, FiPaperclip, FiEdit3, FiCheck, FiPlus,
  FiUsers, FiActivity, FiZap, FiStar, FiArrowRight, FiUpload, FiAlertCircle,
  FiChevronDown, FiChevronUp, FiInfo, FiTrendingUp
} from 'react-icons/fi';
import { userStoryService } from '../../services/planningService';

// Colores de prioridad épicos
const PRIORITY_COLORS = {
  low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🟢', gradient: 'from-green-400 to-green-600' },
  medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡', gradient: 'from-yellow-400 to-yellow-600' },
  high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴', gradient: 'from-red-400 to-red-600' },
  critical: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '🟣', gradient: 'from-purple-400 to-purple-600' }
};

// Estados épicos
const STATUS_COLORS = {
  backlog: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '📋', gradient: 'from-gray-400 to-gray-600' },
  todo: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📝', gradient: 'from-blue-400 to-blue-600' },
  in_progress: { bg: 'bg-orange-50', text: 'text-orange-700', icon: '⚡', gradient: 'from-orange-400 to-orange-600' },
  review: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '👀', gradient: 'from-purple-400 to-purple-600' },
  testing: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🧪', gradient: 'from-indigo-400 to-indigo-600' },
  done: { bg: 'bg-green-50', text: 'text-green-700', icon: '✅', gradient: 'from-green-400 to-green-600' },
  blocked: { bg: 'bg-red-50', text: 'text-red-700', icon: '🚫', gradient: 'from-red-400 to-red-600' }
};

// Configuraciones de estimación por tallas
const ESTIMATION_SIZES = {
  'XS': { 
    label: 'XS', 
    hours: 2, 
    description: '2 horas - Tarea muy pequeña',
    color: 'from-green-400 to-green-500',
    icon: '🟢'
  },
  'S': { 
    label: 'S', 
    hours: 4, 
    description: '4 horas - Tarea pequeña',
    color: 'from-blue-400 to-blue-500',
    icon: '🔵'
  },
  'M': { 
    label: 'M', 
    hours: 8, 
    description: '8 horas - Tarea mediana',
    color: 'from-yellow-400 to-yellow-500',
    icon: '🟡'
  },
  'L': { 
    label: 'L', 
    hours: 16, 
    description: '16 horas - Tarea grande',
    color: 'from-orange-400 to-orange-500',
    icon: '🟠'
  },
  'XL': { 
    label: 'XL', 
    hours: 32, 
    description: '32 horas - Tarea muy grande',
    color: 'from-red-400 to-red-500',
    icon: '🔴'
  }
};

// Configuraciones de especialización
const SPECIALIZATIONS = {
  'development': {
    label: 'Desarrollo',
    icon: '💻',
    description: 'Programación y desarrollo de funcionalidades',
    color: 'blue',
    subSpecializations: [
      { key: 'backend', label: 'Backend', icon: '⚙️', description: 'Desarrollo de servidor y APIs' },
      { key: 'frontend', label: 'Frontend', icon: '🎨', description: 'Desarrollo de interfaces de usuario' },
      { key: 'automation', label: 'Automatización', icon: '🤖', description: 'Scripts y procesos automatizados' },
      { key: 'data_bi', label: 'Data & BI', icon: '📊', description: 'Análisis de datos e inteligencia de negocio' }
    ]
  },
  'ui_ux': {
    label: 'UI/UX',
    icon: '🎨',
    description: 'Diseño de interfaz y experiencia de usuario',
    color: 'purple',
    subSpecializations: [
      { key: 'ui_design', label: 'Diseño UI', icon: '🎨', description: 'Diseño de interfaces' },
      { key: 'ux_research', label: 'Investigación UX', icon: '🔍', description: 'Investigación de usuarios' },
      { key: 'prototyping', label: 'Prototipado', icon: '📱', description: 'Creación de prototipos' },
      { key: 'user_testing', label: 'Testing de Usuario', icon: '👥', description: 'Pruebas con usuarios' }
    ]
  },
  'testing': {
    label: 'Testing',
    icon: '🧪',
    description: 'Pruebas y control de calidad',
    color: 'green',
    subSpecializations: [
      { key: 'unit_testing', label: 'Pruebas Unitarias', icon: '🔬', description: 'Pruebas de componentes individuales' },
      { key: 'integration_testing', label: 'Pruebas de Integración', icon: '🔗', description: 'Pruebas de integración entre sistemas' },
      { key: 'e2e_testing', label: 'Pruebas E2E', icon: '🎯', description: 'Pruebas de extremo a extremo' },
      { key: 'performance_testing', label: 'Pruebas de Rendimiento', icon: '⚡', description: 'Pruebas de performance y carga' }
    ]
  },
  'documentation': {
    label: 'Documentación',
    icon: '📝',
    description: 'Documentación técnica y de usuario',
    color: 'gray',
    subSpecializations: [
      { key: 'technical_docs', label: 'Documentación Técnica', icon: '📋', description: 'Documentación para desarrolladores' },
      { key: 'user_docs', label: 'Documentación de Usuario', icon: '📖', description: 'Manuales y guías de usuario' },
      { key: 'api_docs', label: 'Documentación de API', icon: '🔌', description: 'Documentación de APIs' },
      { key: 'training_materials', label: 'Material de Capacitación', icon: '🎓', description: 'Material educativo y de entrenamiento' }
    ]
  }
};

export default function StoryDetailsModal({
  task,
  users = [],
  projects = [],
  epics = [],
  onClose,
  onSave,
  onDelete
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    acceptance_criteria: '',
    status: 'backlog',
    priority: 'medium',
    specialization: 'development',
    sub_specializations: [],
    estimated_hours: 8, // Valor por defecto M (8 horas)
    assigned_user_id: '',
    epic_id: '',
    start_date: '',
    end_date: '',
    tags: [],
    color: '#10B981'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [newTag, setNewTag] = useState('');
  const [focusedField, setFocusedField] = useState(null);
  const [validationStatus, setValidationStatus] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSubSpecializationModal, setShowSubSpecializationModal] = useState(false);
  
  const titleInputRef = useRef(null);
  const isNew = !task || !task.story_id;

  // Estado para rastrear cambios en épica
  const [originalEpicId, setOriginalEpicId] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar formulario
  useEffect(() => {
    if (task) {
      // Función para formatear fecha ISO a YYYY-MM-DD
      const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        try {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.warn('Error formateando fecha:', dateString, error);
          return '';
        }
      };

      const initialData = {
        title: task.title || '',
        description: task.description || '',
        acceptance_criteria: task.acceptance_criteria || '',
        status: task.status || 'backlog',
        priority: task.priority || 'medium',
        specialization: task.specialization || task.type || 'development',
        sub_specializations: task.sub_specializations || [],
        estimated_hours: parseFloat(task.estimated_hours) || 8,
        assigned_user_id: task.assigned_user_id || null,
        epic_id: task.epic_id || null,
        start_date: formatDateForInput(task.start_date),
        end_date: formatDateForInput(task.end_date),
        tags: task.tags || [],
        color: task.color || '#10B981'
      };
      
      setFormData(initialData);
      setOriginalEpicId(task.epic_id || null);
      setHasChanges(false);
    } else {
      // Valores por defecto inteligentes
      const defaultProject = projects.length === 1 ? projects[0].project_id : null;
      setFormData({
        title: '',
        description: '',
        acceptance_criteria: '',
        status: 'backlog',
        priority: 'medium',
        specialization: 'development',
        sub_specializations: [],
        estimated_hours: 8,
        assigned_user_id: null,
        epic_id: null,
        start_date: '',
        end_date: '',
        tags: [],
        color: '#10B981'
      });
      setOriginalEpicId(null);
      setHasChanges(false);
    }
    setErrors({});
    setValidationStatus({});
  }, [task, projects]);

  // Auto-focus en el título cuando se abre
  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, []);

  // Validación de campos
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    const newStatus = { ...validationStatus };

    switch (name) {
      case 'title':
        if (!value || value.trim().length < 3) {
          newErrors.title = 'El título debe tener al menos 3 caracteres';
          newStatus.title = 'error';
        } else {
          delete newErrors.title;
          newStatus.title = 'success';
        }
        break;
      case 'description':
        if (!value || value.trim().length < 10) {
          newErrors.description = 'La descripción debe tener al menos 10 caracteres';
          newStatus.description = 'error';
        } else {
          delete newErrors.description;
          newStatus.description = 'success';
        }
        break;
      case 'estimated_hours':
        const hours = parseFloat(value);
        if (hours < 0) {
          setErrors(prev => ({ ...prev, estimated_hours: 'Las horas no pueden ser negativas' }));
        } else {
          delete newErrors.estimated_hours;
        }
        break;
      case 'tags':
        // Validación de tags
        if (value && value.length > 10) {
          setErrors(prev => ({ ...prev, tags: 'Máximo 10 etiquetas' }));
        } else {
          delete newErrors.tags;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    setValidationStatus(newStatus);
  };

  // Manejar cambio de especialización
  const handleSpecializationChange = (newSpecialization) => {
    // Cambiar la especialización inmediatamente
    setFormData(prev => ({ 
      ...prev, 
      specialization: newSpecialization,
      sub_specializations: newSpecialization === 'development' ? prev.sub_specializations : [] // Mantener sub-especializaciones si ya es desarrollo
    }));
    
    // Si se selecciona "Desarrollo", mostrar modal de sub-especializaciones
    if (newSpecialization === 'development') {
      setShowSubSpecializationModal(true);
    }
  };

  // Confirmar sub-especializaciones de desarrollo
  const handleConfirmSubSpecializations = (selectedSubSpecs) => {
    setFormData(prev => ({ 
      ...prev, 
      specialization: 'development',
      sub_specializations: selectedSubSpecs
    }));
    setShowSubSpecializationModal(false);
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar error del campo si existe
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
    
    // Validación especial para fecha de vencimiento
    if (name === 'due_date') {
      const dateValidation = validateDueDate(value);
      if (dateValidation !== true) {
        setErrors(prev => ({ ...prev, due_date: dateValidation }));
        return;
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.due_date;
          return newErrors;
        });
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Marcar que hay cambios
    setHasChanges(true);
    
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
    
    if (!formData.title.trim()) newErrors.title = 'El título es requerido';
    if (!formData.description.trim()) newErrors.description = 'La descripción es requerida';
    if (formData.estimated_hours && (isNaN(formData.estimated_hours) || parseFloat(formData.estimated_hours) <= 0)) {
      newErrors.estimated_hours = 'Debe ser un número positivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar guardado épico
  const handleSave = async () => {
    if (!validateForm()) {
      // Hacer scroll al primer error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Función para convertir fecha YYYY-MM-DD a ISO
      const convertDateToISO = (dateString) => {
        if (!dateString) return null;
        try {
          const date = new Date(dateString + 'T00:00:00');
          return date.toISOString();
        } catch (error) {
          console.warn('Error convirtiendo fecha:', dateString, error);
          return null;
        }
      };

      const storyData = {
        title: formData.title,
        description: formData.description,
        acceptance_criteria: formData.acceptance_criteria,
        status: formData.status,
        priority: formData.priority,
        specialization: formData.specialization,
        sub_specializations: formData.sub_specializations,
        estimated_hours: parseFloat(formData.estimated_hours) || 8,
        assigned_user_id: formData.assigned_user_id || null,
        epic_id: formData.epic_id || null,
        start_date: convertDateToISO(formData.start_date),
        end_date: convertDateToISO(formData.end_date),
        tags: formData.tags,
        color: formData.color
      };
      
      // Si se está asignando a un usuario, incluir assigned_by_user_id
      if (formData.assigned_user_id && formData.assigned_user_id !== (task?.assigned_user_id || null)) {
        // Obtener el usuario actual desde localStorage
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        if (session.user_id) {
          storyData.assigned_by_user_id = session.user_id;
        }
      }

      let savedStory;
      if (isNew) {
        savedStory = await userStoryService.createUserStory(storyData);
      } else {
        savedStory = await userStoryService.updateUserStory(task.story_id, storyData);
        
        // Si cambió la épica, actualizar la UI para reflejar el cambio
        if (formData.epic_id !== originalEpicId) {
          // El componente padre manejará la actualización de la lista
        }
      }

      onSave(savedStory);
      onClose();
    } catch (error) {
      console.error('❌ Error al guardar historia:', error);
      setErrors({ 
        submit: error.message || 'Error al guardar la historia. Inténtalo de nuevo.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar eliminación
  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta historia?')) {
      return;
    }

    try {
      setLoading(true);
      await userStoryService.deleteUserStory(task.story_id);
      onDelete(task);
      onClose();
    } catch (error) {
      console.error('❌ Error al eliminar historia:', error);
      setErrors({ submit: error.message });
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

  if (!task) return null;

  const selectedProject = projects.find(p => p.project_id === parseInt(formData.project_id));
  const selectedEpic = formData.epic_id ? epics.find(e => e.epic_id === parseInt(formData.epic_id)) : null;
  const assignedUser = formData.assigned_user_id ? users.find(u => u.user_id === parseInt(formData.assigned_user_id)) : null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-[1000] p-4 sm:p-6 md:p-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Épico */}
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center"
                >
                  {SPECIALIZATIONS[formData.specialization]?.icon || '📋'}
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {isNew ? 'Nueva Historia' : 'Editar Historia'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {isNew ? 'Crea una nueva historia de usuario épica' : 'Modifica los detalles de tu historia'}
                  </p>
                  
                  {/* Información contextual */}
                  <div className="flex items-center gap-3 mt-2">
                    {selectedProject && (
                      <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                        <span>📁</span>
                        <span>{selectedProject.name}</span>
                      </div>
                    )}
                    {selectedEpic && (
                      <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                        <span>🎯</span>
                        <span>{selectedEpic.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-full text-xs">
                      <span>{PRIORITY_COLORS[formData.priority]?.icon}</span>
                      <span>Prioridad {formData.priority}</span>
                    </div>
                  </div>
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

          {/* Navegación de tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="flex">
              {[
                { id: 'details', label: 'Detalles', icon: FiEdit3 },
                { id: 'planning', label: 'Planificación', icon: FiTarget },
                { id: 'activity', label: 'Actividad', icon: FiActivity }
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  whileHover={{ y: -1 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="flex-1 overflow-y-auto">
            {/* Error de envío */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-3"
              >
                <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                {errors.submit}
              </motion.div>
            )}

            <div className="p-6 pb-8">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Información Básica */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FiEdit3 className="w-4 h-4 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Título */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Título de la Historia *
                        </label>
                        <div className="relative">
                          <input
                            ref={titleInputRef}
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('title')}
                            onBlur={() => setFocusedField(null)}
                            className={`w-full px-4 py-3 rounded-xl ${getBorderClass('title')} focus:outline-none text-lg font-medium`}
                            placeholder="Como usuario, quiero..."
                            maxLength={200}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {getValidationIcon('title')}
                            <span className="text-xs text-gray-400">
                              {formData.title.length}/200
                            </span>
                          </div>
                        </div>
                        {errors.title && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          >
                            <FiAlertCircle className="w-3 h-3" />
                            {errors.title}
                          </motion.p>
                        )}
                      </div>

                      {/* Especialización */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Especialización
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(SPECIALIZATIONS).map(([key, config]) => (
                            <motion.button
                              key={key}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => handleSpecializationChange(key)}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                formData.specialization === key
                                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                              title={config.description}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{config.icon}</span>
                                <span className="text-sm font-medium">{config.label}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        
                        {/* Mostrar sub-especializaciones seleccionadas */}
                        {formData.sub_specializations && formData.sub_specializations.length > 0 && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Sub-especializaciones seleccionadas:
                            </label>
                            <div className="flex flex-wrap gap-1">
                              {formData.sub_specializations.map((subSpec) => {
                                const subSpecConfig = SPECIALIZATIONS[formData.specialization]?.subSpecializations?.find(s => s.key === subSpec);
                                return (
                                  <span key={subSpec} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    <span>{subSpecConfig?.icon}</span>
                                    <span>{subSpecConfig?.label}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Prioridad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Prioridad
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {Object.entries(PRIORITY_COLORS).map(([key, config]) => (
                            <motion.button
                              key={key}
                              type="button"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setFormData(prev => ({ ...prev, priority: key }))}
                              className={`p-3 rounded-xl border-2 transition-all ${
                                formData.priority === key
                                  ? `bg-gradient-to-r ${config.gradient} text-white border-transparent`
                                  : `${config.bg} ${config.border} hover:border-opacity-60`
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{config.icon}</span>
                                <span className="text-sm font-medium">{key.toUpperCase()}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Estimación por Tallas */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Estimación de Esfuerzo
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                          {Object.entries(ESTIMATION_SIZES).map(([key, config]) => (
                            <motion.button
                              key={key}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setFormData(prev => ({ 
                                  ...prev, 
                                  estimated_hours: config.hours 
                                }));
                                // Limpiar error si existe
                                setErrors(prev => {
                                  const newErrors = { ...prev };
                                  delete newErrors.estimated_hours;
                                  return newErrors;
                                });
                              }}
                              className={`p-4 rounded-xl border-2 transition-all ${
                                parseFloat(formData.estimated_hours) === config.hours
                                  ? `bg-gradient-to-r ${config.color} text-white border-transparent shadow-lg`
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                              }`}
                              title={config.description}
                            >
                              <div className="text-center">
                                <div className="text-2xl mb-1">{config.icon}</div>
                                <div className="font-bold text-lg">{config.label}</div>
                                <div className="text-xs opacity-80">{config.hours}h</div>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        
                        {/* Input manual para casos especiales */}
                        <div className="mt-4">
                          <label className="block text-xs font-medium text-gray-500 mb-2">
                            O especifica horas manualmente:
                          </label>
                          <div className="relative max-w-32">
                            <input
                              type="number"
                              name="estimated_hours"
                              value={formData.estimated_hours}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                setFormData(prev => ({ 
                                  ...prev, 
                                  estimated_hours: value 
                                }));
                                // Validar y limpiar errores
                                if (value < 0) {
                                  setErrors(prev => ({ ...prev, estimated_hours: 'Las horas no pueden ser negativas' }));
                                } else {
                                  setErrors(prev => {
                                    const newErrors = { ...prev };
                                    delete newErrors.estimated_hours;
                                    return newErrors;
                                  });
                                }
                              }}
                              min="0.5"
                              step="0.5"
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none text-center"
                              placeholder="8"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <FiClock className="w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          {errors.estimated_hours && (
                            <motion.p
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-1 text-sm text-red-600 flex items-center gap-1"
                            >
                              <FiAlertCircle className="w-3 h-3" />
                              {errors.estimated_hours}
                            </motion.p>
                          )}
                        </div>
                      </div>

                      {/* Descripción */}
                      <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Descripción *
                        </label>
                        <div className="relative">
                          <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            onFocus={() => setFocusedField('description')}
                            onBlur={() => setFocusedField(null)}
                            rows={4}
                            className={`w-full px-4 py-3 rounded-xl ${getBorderClass('description')} focus:outline-none resize-none`}
                            placeholder="Describe detalladamente qué debe hacer esta historia..."
                          />
                          <div className="absolute right-3 top-3 flex items-center gap-2">
                            {getValidationIcon('description')}
                          </div>
                        </div>
                        {errors.description && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          >
                            <FiAlertCircle className="w-3 h-3" />
                            {errors.description}
                          </motion.p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sección Avanzada */}
                  <div>
                    <motion.button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
                    >
                      {showAdvanced ? <FiChevronUp /> : <FiChevronDown />}
                      Opciones Avanzadas
                    </motion.button>

                    <AnimatePresence>
                      {showAdvanced && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-6"
                        >
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Épica */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Épica
                              </label>
                              <div className="relative">
                                <select
                                  name="epic_id"
                                  value={formData.epic_id}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none bg-white"
                                >
                                  <option value="">Sin épica</option>
                                  {epics.map(epic => (
                                    <option key={epic.epic_id} value={epic.epic_id}>
                                      {epic.name}
                                    </option>
                                  ))}
                                </select>
                                <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>

                            {/* Usuario Asignado - Listar todos los usuarios de la organización */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Asignado a
                              </label>
                              <div className="relative">
                                <select
                                  name="assigned_user_id"
                                  value={formData.assigned_user_id}
                                  onChange={handleChange}
                                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none appearance-none bg-white"
                                >
                                  <option value="">Sin asignar</option>
                                  {users.map(user => (
                                    <option key={user.user_id} value={user.user_id}>
                                      {user.full_name || user.username}
                                    </option>
                                  ))}
                                </select>
                                <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                              </div>
                            </div>

                            {/* Fecha de Inicio */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Inicio
                              </label>
                              <input
                                type="date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                              />
                            </div>

                            {/* Fecha Límite */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha Límite
                              </label>
                              <input
                                type="date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                              />
                            </div>

                            {/* Criterios de Aceptación */}
                            <div className="lg:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Criterios de Aceptación
                              </label>
                              <textarea
                                name="acceptance_criteria"
                                value={formData.acceptance_criteria}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                                placeholder="- Dado que... cuando... entonces...&#10;- El usuario puede...&#10;- Se muestra..."
                              />
                            </div>

                            {/* Etiquetas - Movido a la misma fila que fecha de vencimiento */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Etiquetas
                              </label>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {formData.tags.map((tag, index) => (
                                  <motion.span
                                    key={`tag-${index}-${tag}`}
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
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeTab === 'planning' && (
                <div className="text-center py-12">
                  <FiTarget className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Planificación</h3>
                  <p className="text-gray-500">Funcionalidad de planificación próximamente</p>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="text-center py-12">
                  <FiActivity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Actividad</h3>
                  <p className="text-gray-500">Historial de actividad próximamente</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer con botones épicos */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                {!isNew && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    disabled={loading}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Eliminar
                  </motion.button>
                )}
              </div>

              <div className="flex gap-3">
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
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={loading || Object.keys(errors).length > 0}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-3 shadow-lg"
                >
                  {loading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  {loading ? 'Guardando...' : (isNew ? 'Crear Historia' : 'Guardar Cambios')}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Modal de Sub-especializaciones */}
      {showSubSpecializationModal && (
        <SubSpecializationModal
          onConfirm={handleConfirmSubSpecializations}
          onCancel={() => setShowSubSpecializationModal(false)}
          currentSubSpecs={formData.sub_specializations}
        />
      )}
    </AnimatePresence>,
    document.getElementById('root')
  );
}

// Componente Modal de Sub-especializaciones
function SubSpecializationModal({ onConfirm, onCancel, currentSubSpecs = [] }) {
  const [selectedSubSpecs, setSelectedSubSpecs] = useState(currentSubSpecs);
  
  const developmentSubSpecs = SPECIALIZATIONS.development.subSpecializations;
  
  const toggleSubSpec = (subSpecKey) => {
    setSelectedSubSpecs(prev => 
      prev.includes(subSpecKey)
        ? prev.filter(s => s !== subSpecKey)
        : [...prev, subSpecKey]
    );
  };
  
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[2000] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Sub-especializaciones de Desarrollo</h3>
              <p className="text-sm text-gray-600 mt-1">
                Selecciona las áreas específicas de desarrollo para esta historia
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {developmentSubSpecs.map((subSpec) => (
              <motion.button
                key={subSpec.key}
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSubSpec(subSpec.key)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedSubSpecs.includes(subSpec.key)
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{subSpec.icon}</span>
                  <div>
                    <h4 className="font-medium">{subSpec.label}</h4>
                    <p className="text-sm opacity-75 mt-1">{subSpec.description}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(selectedSubSpecs)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Confirmar ({selectedSubSpecs.length} seleccionadas)
            </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}