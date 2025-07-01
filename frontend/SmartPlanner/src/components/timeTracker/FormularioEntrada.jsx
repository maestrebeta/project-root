import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useProjectsAndTags } from "./useProjectsAndTags.jsx";
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { 
  FiX, FiClock, FiCalendar, FiTag, FiDollarSign, FiCheckCircle, 
  FiFolder, FiUser, FiAlertCircle, FiCheck, FiArrowRight, FiSave,
  FiInfo, FiZap, FiEdit3
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';

// Mapa completo de colores de Tailwind
const TAILWIND_COLORS = {
  blue: {
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  indigo: {
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca'
  },
  red: {
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },
  green: {
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  yellow: {
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207'
  },
  orange: {
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c'
  },
  pink: {
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d'
  },
  purple: {
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce'
  },
  gray: {
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151'
  },
  cyan: {
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490'
  },
  teal: {
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e'
  },
  lime: {
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f'
  },
  stone: {
    500: '#78716c',
    600: '#57534e',
    700: '#44403c'
  },
  zinc: {
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46'
  },
  neutral: {
    500: '#737373',
    600: '#525252',
    700: '#404040'
  }
};

// Categorías predeterminadas
const DEFAULT_CATEGORIES = [
  { value: 'desarrollo', label: 'Desarrollo' },
  { value: 'reunion', label: 'Reunión' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'otro', label: 'Otro' }
];

// Función para normalizar datos del formulario
const normalizeFormData = (data = {}) => {
  const session = JSON.parse(localStorage.getItem('session'));
  if (!session?.user) {
    throw new Error('No hay sesión activa');
  }

  // Convertir tiempos a formato ISO con timezone
  const entryDate = new Date(data.entry_date || new Date());
  let startTime = null;
  let endTime = null;

  if (data.start_time) {
    const [startHours, startMinutes] = data.start_time.split(':');
    startTime = new Date(entryDate);
    startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0);
  }

  if (data.end_time) {
    const [endHours, endMinutes] = data.end_time.split(':');
    endTime = new Date(entryDate);
    endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0);
  }

  return {
    user_id: Number(session.user.user_id),
    project_id: Number(data.project_id),
    entry_date: entryDate.toISOString().split('T')[0],
    start_time: startTime?.toISOString(),
    end_time: endTime?.toISOString(),
    description: (data.description || '').trim(),
    activity_type: data.activity_type || 'desarrollo',
    status: data.status || 'completado',
    billable: data.billable ?? true,
    organization_id: Number(session.user.organization_id)
  };
};

// Función para formatear fecha del backend (UTC) a formato local para input
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // Formato YYYY-MM-DD
  } catch (e) {
    console.error('Error formateando fecha:', e);
      return '';
    }
  };

// Función para formatear hora UTC del backend a hora local para input
const formatTimeForInput = (isoString) => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  } catch (e) {
    console.error('Error formateando hora:', e);
    return '';
  }
};

// Función para convertir fecha y hora local a UTC para el backend
const formatDateTimeToUTC = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  
  // Crear fecha con la hora local especificada
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Crear fecha en hora local
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  
  // Convertir a UTC manteniendo la misma hora local
  return localDate.toISOString();
};

// Función para formatear la fecha para el backend
const formatDateForBackend = (date) => {
  if (!date) return null;
  
  // Obtener la fecha en la zona horaria local
  const [year, month, day] = date.split('-').map(Number);
  
  // Crear la fecha en la zona horaria local a las 00:00
  const localDate = new Date(year, month - 1, day, 0, 0, 0);
  
  // Ajustar por la diferencia de zona horaria
  const offset = localDate.getTimezoneOffset();
  localDate.setMinutes(localDate.getMinutes() - offset);
  
  return localDate.toISOString();
};

// Función para formatear la fecha y hora para el backend
const formatDateTimeForBackend = (date, time) => {
  if (!date || !time) return null;
  
  // Obtener la fecha en la zona horaria local
  const [year, month, day] = date.split('-').map(Number);
  const [h, m] = time.split(':').map(Number);
  
  // Crear la fecha en la zona horaria local
  const localDate = new Date(year, month - 1, day, h, m, 0);
  
  // Ajustar por la diferencia de zona horaria
  const offset = localDate.getTimezoneOffset();
  localDate.setMinutes(localDate.getMinutes() - offset);
  
  return localDate.toISOString();
};

// Usar las categorías del hook useProjectsAndTags
const FormularioEntrada = ({
  editId,
  onClose,
  initialData = {},
  onSubmit = () => {},
  organizationStates
}) => {
  const theme = useAppTheme();
  const { user } = useAuth();
  const { showNotification } = useNotifications();
  const {
    projects: projectOptions,
    clients: clientOptions,
    loading,
    suggestedProject,
    suggestedActivity,
    defaultClient,
    userHasEntries,
    refresh,
    activityTypes
  } = useProjectsAndTags();

  // Estado inicial del formulario
  const [form, setForm] = useState({
    description: '',
    project_id: '',
    client_id: '',
    activity_type: 'desarrollo',
    entry_date: formatDateForInput(new Date()),
    start_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    end_time: '',
    status: organizationStates?.default_state || 'pendiente',
    billable: true
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Efecto para inicializar el formulario cuando se cargan los datos
  useEffect(() => {
    if (editId && initialData) {
      // Modo edición: usar datos del registro
      const projectId = initialData.project_id?.toString();
      const selectedProject = projectOptions.find(p => p.project_id === projectId);
      
      // Convertir ID de categoría a nombre si es necesario
      let activityType = initialData.activity_type || 'desarrollo';
      if (typeof activityType === 'number' && activityTypes.length > 0) {
        const category = activityTypes.find(cat => cat.id === activityType);
        activityType = category ? category.name : 'desarrollo';
      }
      
      // Manejar el estado correctamente: si es un ID numérico, mantenerlo; si es string, convertirlo
      let status = organizationStates?.default_state || 'pendiente';
      if (initialData.status !== undefined) {
        if (typeof initialData.status === 'number') {
          status = initialData.status; // Mantener el ID numérico
        } else if (typeof initialData.status === 'string') {
          status = initialData.status; // Mantener el string
        }
      }
      
      setForm({
        description: initialData.description || '',
        project_id: projectId || '',
        client_id: selectedProject?.client_id || '',
        activity_type: activityType,
        entry_date: formatDateForInput(initialData.entry_date) || formatDateForInput(new Date()),
        start_time: formatTimeForInput(initialData.start_time) || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        end_time: formatTimeForInput(initialData.end_time) || '',
        status: status,
        billable: initialData.billable ?? true
      });
    } else if (!loading && projectOptions.length > 0) {
      // Modo creación: usar valores sugeridos o datos del calendario
      const hasInitialData = initialData && Object.keys(initialData).length > 0;
      
      // Determinar el estado inicial: si hay hora de fin en los datos del calendario, es "Completada"
      let initialStatus = organizationStates?.default_state || 'pendiente';
      if (hasInitialData && initialData.end_time) {
        initialStatus = 3; // "Completada" (ID 3) cuando hay hora de fin
      }
      
      setForm(prev => ({
        ...prev,
        // Si hay datos del calendario, usarlos; sino usar valores sugeridos
        entry_date: hasInitialData && initialData.entry_date ? initialData.entry_date : formatDateForInput(new Date()),
        start_time: hasInitialData && initialData.start_time ? initialData.start_time : new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        end_time: hasInitialData && initialData.end_time ? initialData.end_time : '',
        project_id: hasInitialData && initialData.project_id ? initialData.project_id : (suggestedProject || projectOptions[0]?.project_id || ''),
        client_id: hasInitialData && initialData.client_id ? initialData.client_id : (defaultClient || projectOptions[0]?.client_id || ''),
        // Usar la categoría sugerida automáticamente (como en TimerPanel)
        activity_type: hasInitialData && initialData.activity_type ? initialData.activity_type : (suggestedActivity || 'desarrollo'),
        description: hasInitialData && initialData.description ? initialData.description : '',
        status: initialStatus,
        billable: hasInitialData && typeof initialData.billable === 'boolean' ? initialData.billable : true
      }));
    }
  }, [editId, initialData, loading, projectOptions, suggestedProject, suggestedActivity, defaultClient, organizationStates, activityTypes]);

  // Manejador de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    if (name === 'project_id') {
      const selectedProject = projectOptions.find(p => p.project_id === value);
      
      setForm(prev => ({
        ...prev,
        [name]: value,
        client_id: selectedProject ? selectedProject.client_id : prev.client_id
      }));
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!form.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!form.project_id) {
      newErrors.project_id = 'Debe seleccionar un proyecto';
    }

    if (!form.entry_date) {
      newErrors.entry_date = 'La fecha es obligatoria';
    }

    if (!form.start_time) {
      newErrors.start_time = 'La hora de inicio es obligatoria';
    }

    if (form.end_time && form.start_time) {
      const startTime = new Date(`2000-01-01T${form.start_time}`);
      const endTime = new Date(`2000-01-01T${form.end_time}`);
      if (endTime <= startTime) {
        newErrors.end_time = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Construir datos para enviar
  const buildEntryData = () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.user) {
      throw new Error('No hay sesión activa');
    }

    // Convertir tiempos a formato ISO con timezone
    const entryDate = new Date(form.entry_date);
    let startTime = null;
    let endTime = null;

    if (form.start_time) {
      const [startHours, startMinutes] = form.start_time.split(':');
      startTime = new Date(entryDate);
      startTime.setHours(parseInt(startHours, 10), parseInt(startMinutes, 10), 0);
    }

    if (form.end_time) {
      const [endHours, endMinutes] = form.end_time.split(':');
      endTime = new Date(entryDate);
      endTime.setHours(parseInt(endHours, 10), parseInt(endMinutes, 10), 0);
    }

    const entryData = {
      user_id: Number(session.user.user_id),
        project_id: Number(form.project_id),
        entry_date: form.entry_date,
      start_time: startTime?.toISOString(),
      end_time: endTime?.toISOString(),
      description: form.description.trim() || null,
        activity_type: form.activity_type,
      status: form.status,
        billable: form.billable,
      organization_id: Number(session.user.organization_id),
      ticket_id: null
    };

    if (editId) {
      entryData.entry_id = editId;
    }

    return entryData;
  };

  // Enviar formulario a la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token || !session?.user?.user_id) {
        throw new Error('No hay sesión activa');
      }

      // Convertir fechas y horas locales a UTC
      const startTimeUTC = formatDateTimeToUTC(form.entry_date, form.start_time);
      const endTimeUTC = form.end_time ? formatDateTimeToUTC(form.entry_date, form.end_time) : null;

      // Convertir nombre de categoría a ID
      let activityTypeId = form.activity_type;
      if (typeof form.activity_type === 'string' && activityTypes.length > 0) {
        const category = activityTypes.find(cat => cat.name === form.activity_type);
        activityTypeId = category ? category.id : 1; // Fallback a ID 1 si no se encuentra
      }

      // Determinar el estado: si hay hora de fin, es "Completada" (ID 3), sino usar el estado seleccionado
      let statusId = 1; // Por defecto "Pendiente" (ID 1)
      if (form.end_time) {
        statusId = 3; // "Completada" (ID 3) cuando hay hora de fin
      } else if (form.status) {
        // Si hay un estado seleccionado, convertirlo a ID
        if (typeof form.status === 'number') {
          statusId = form.status;
        } else if (typeof form.status === 'string') {
          // Convertir string a ID si es necesario
          const statusMap = {
            'pendiente': 1,
            'en_progreso': 2,
            'completada': 3,
            'completado': 3
          };
          statusId = statusMap[form.status.toLowerCase()] || 1;
        }
      }

      const payload = {
        description: form.description.trim(),
        entry_date: startTimeUTC, // Usar la fecha del start_time como entry_date
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        activity_type: activityTypeId,
        status: statusId, // Usar el ID numérico del estado
        billable: form.billable,
        project_id: parseInt(form.project_id),
        user_id: parseInt(session.user.user_id),
        organization_id: parseInt(session.user.organization_id)
      };

      const url = editId 
        ? `http://localhost:8001/time-entries/${editId}`
        : 'http://localhost:8001/time-entries/';

      const response = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar la entrada de tiempo');
      }

      const savedEntry = await response.json();
      
      if (onSubmit) {
        onSubmit(savedEntry);
      }

      // Mostrar notificación de éxito
      showNotification(
        editId ? 'Entrada actualizada con éxito' : 'Entrada creada con éxito', 
        'success'
      );

      onClose();

    } catch (error) {
      console.error('Error:', error);
      
      // Mostrar notificación de error
      showNotification(
        error.message || 'Error al guardar la entrada', 
        'error'
      );
      
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e) => {
    onClose();
  };

  const handleCloseClick = () => {
    onClose();
  };

  const handleCancelClick = () => {
    onClose();
  };

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
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <FiClock className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {editId ? 'Editar Entrada de Tiempo' : 'Nueva Entrada de Tiempo'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {editId ? 'Modifica los detalles de la entrada' : 'Registra el tiempo dedicado a una tarea'}
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
          </div>

          {/* Contenido del modal */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descripción de la tarea *
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="Describe detalladamente la tarea realizada..."
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="w-4 h-4" />
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Fecha y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiCalendar className="text-gray-400" />
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="entry_date"
                    value={form.entry_date}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.entry_date ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    required
                  />
                  {errors.entry_date && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.entry_date}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiTag className="text-gray-400" />
                    Categoría
                  </label>
                  <select
                    name="activity_type"
                    value={form.activity_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                    required
                  >
                    {loading ? (
                      <option value="" disabled>Cargando categorías...</option>
                    ) : (
                      activityTypes.map((type) => (
                        <option key={type.id || type.value} value={type.name || type.value}>
                          {type.name || type.label}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Hora inicio y fin */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiClock className="text-gray-400" />
                    Hora de inicio *
                  </label>
                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.start_time ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    required
                  />
                  {errors.start_time && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.start_time}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiClock className="text-gray-400" />
                    Hora de fin
                  </label>
                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.end_time ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  {errors.end_time && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.end_time}
                    </p>
                  )}
                </div>
              </div>

              {/* Proyecto y Cliente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiFolder className="text-gray-400" />
                    Proyecto *
                  </label>
                  <select
                    name="project_id"
                    value={form.project_id}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.project_id ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Selecciona un proyecto</option>
                    {projectOptions.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {errors.project_id && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <FiAlertCircle className="w-4 h-4" />
                      {errors.project_id}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiUser className="text-gray-400" />
                    Cliente
                  </label>
                  <select
                    name="client_id"
                    value={form.client_id}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                    disabled
                  >
                    <option value="">
                      {loading ? 'Cargando...' : form.client_id ? 
                        clientOptions.find(c => String(c.client_id) === form.client_id)?.name || 'Cliente no encontrado' 
                        : 'Sin cliente'}
                    </option>
                  </select>
                </div>
              </div>

              {/* Estado y Facturación */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiCheckCircle className="text-gray-400" />
                    Estado
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-300"
                    required
                  >
                    {organizationStates?.states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.icon} {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="billable"
                      checked={form.billable}
                      onChange={(e) => setForm(prev => ({ ...prev, billable: e.target.checked }))}
                      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <FiDollarSign className="text-gray-400" />
                      Facturable
                    </span>
                  </label>
                </div>
              </div>

              {/* Información adicional */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Si no especificas hora de fin, la entrada se marcará como "pendiente"</li>
                      <li>• Las entradas facturables se incluirán en los reportes de facturación</li>
                      <li>• Puedes editar esta entrada más tarde si necesitas hacer cambios</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Botones de navegación */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div></div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FiCheck className="w-4 h-4" />
                        {editId ? 'Actualizar Entrada' : 'Guardar Entrada'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default FormularioEntrada;