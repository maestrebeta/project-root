import React, { useState, useEffect } from 'react';
import { useProjectsAndTags } from './useProjectsAndTags';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { FiX, FiClock, FiCalendar, FiTag, FiDollarSign, FiCheckCircle, FiFolder, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
  organizationStates,
  activityTypes = []
}) => {
  const theme = useAppTheme();
  const {
    projects: projectOptions,
    clients: clientOptions,
    loading,
    suggestedProject,
    suggestedActivity,
    defaultClient,
    userHasEntries,
    refresh
  } = useProjectsAndTags();

  console.log('FormularioEntrada - Valores recibidos:', {
    suggestedProject,
    suggestedActivity,
    defaultClient,
    userHasEntries,
    loading,
    projectOptionsLength: projectOptions.length
  });

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

  // Efecto para inicializar el formulario cuando se cargan los datos
  useEffect(() => {
    if (editId && initialData) {
      // Modo edición: usar datos del registro
      const projectId = initialData.project_id?.toString();
      const selectedProject = projectOptions.find(p => p.project_id === projectId);
      
      console.log('Inicializando formulario en modo edición:', {
        projectId,
        selectedProject,
        initialData
      });
      
      setForm({
        description: initialData.description || '',
        project_id: projectId || '',
        client_id: selectedProject?.client_id || '',
        activity_type: initialData.activity_type || 'desarrollo',
        entry_date: formatDateForInput(initialData.entry_date) || formatDateForInput(new Date()),
        start_time: formatTimeForInput(initialData.start_time) || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        end_time: formatTimeForInput(initialData.end_time) || '',
        status: initialData.status || organizationStates?.default_state || 'pendiente',
        billable: initialData.billable ?? true
      });
    } else if (!loading && projectOptions.length > 0) {
      // Modo creación: usar valores sugeridos
      console.log('Inicializando formulario en modo creación con valores sugeridos:', {
        suggestedProject,
        suggestedActivity,
        defaultClient
      });
      
      setForm(prev => ({
        ...prev,
        project_id: suggestedProject || projectOptions[0]?.project_id || '',
        client_id: defaultClient || projectOptions[0]?.client_id || '',
        activity_type: suggestedActivity || 'desarrollo'
      }));
    }
  }, [editId, initialData, loading, projectOptions, suggestedProject, suggestedActivity, defaultClient, organizationStates]);

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', error: false });

  // Manejador de cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    console.log(`Cambio en formulario: ${name} = ${value}`);
    
    if (name === 'project_id') {
      const selectedProject = projectOptions.find(p => p.project_id === value);
      console.log('Proyecto seleccionado:', selectedProject);
      
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

    console.log('Data to be sent:', entryData); // Debug log
    return entryData;
  };

  // Enviar formulario a la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus({ message: '', error: false });

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token || !session?.user?.user_id) {
        throw new Error('No hay sesión activa');
      }

      // Validaciones
      if (!form.project_id) {
        throw new Error('Debe seleccionar un proyecto');
      }

      if (!form.description.trim()) {
        throw new Error('La descripción es requerida');
      }

      // Convertir fechas y horas locales a UTC
      const startTimeUTC = formatDateTimeToUTC(form.entry_date, form.start_time);
      const endTimeUTC = form.end_time ? formatDateTimeToUTC(form.entry_date, form.end_time) : null;

      const payload = {
        description: form.description.trim(),
        entry_date: startTimeUTC, // Usar la fecha del start_time como entry_date
        start_time: startTimeUTC,
        end_time: endTimeUTC,
        activity_type: form.activity_type,
        status: form.status || (form.end_time ? "completada" : "pendiente"),
        billable: form.billable,
        project_id: parseInt(form.project_id),
        user_id: parseInt(session.user.user_id),
        organization_id: parseInt(session.user.organization_id)
      };

      console.log('Datos a enviar:', payload);

      const url = editId 
        ? `http://localhost:8000/time-entries/${editId}`
        : 'http://localhost:8000/time-entries/';

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
      console.log('Respuesta del servidor:', savedEntry);
      
      if (onSubmit) {
        onSubmit(savedEntry);
      }

      onClose();
      setSaveStatus({ message: 'Entrada guardada con éxito', error: false });

    } catch (error) {
      console.error('Error:', error);
      setSaveStatus({ 
        message: error.message || 'Error al guardar la entrada', 
        error: true 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4 pt-4 pb-20 overflow-hidden sm:p-0"
    >
      <div className="fixed inset-0 transition-opacity bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative w-full max-w-2xl mx-auto bg-white rounded-xl shadow-xl"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editId ? 'Editar Entrada' : 'Nueva Entrada'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <input
                type="text"
                name="description"
                value={form.description}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                placeholder="Describe la tarea realizada"
                required
              />
            </div>

            {/* Proyecto y Cliente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiFolder className="text-gray-400" />
                  Proyecto
                </label>
                <select
                  name="project_id"
                  value={form.project_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                  required
                >
                  <option value="">Selecciona un proyecto</option>
                  {projectOptions.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiUser className="text-gray-400" />
                  Cliente
                </label>
                <select
                  name="client_id"
                  value={form.client_id}
                  className="w-full px-4 py-3 rounded-lg border bg-gray-50 text-gray-500 cursor-not-allowed"
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

            {/* Fecha y Categoría */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiCalendar className="text-gray-400" />
                  Fecha
                </label>
                <input
                  type="date"
                  name="entry_date"
                  value={form.entry_date}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiTag className="text-gray-400" />
                  Categoría
                </label>
                <select
                  name="activity_type"
                  value={form.activity_type}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                  required
                >
                  {DEFAULT_CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Hora inicio y fin */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  Hora inicio
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiClock className="text-gray-400" />
                  Hora fin
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
                />
              </div>
            </div>

            {/* Estado y Facturación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiCheckCircle className="text-gray-400" />
                  Estado
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 rounded-lg border ${theme.INPUT_BORDER_CLASS} focus:ring-2 ${theme.INPUT_FOCUS_RING_CLASS} transition-all`}
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
                    className={`h-5 w-5 rounded border-gray-300 text-${theme.PRIMARY_COLOR}-600 focus:ring-${theme.PRIMARY_COLOR}-500`}
                  />
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <FiDollarSign className="text-gray-400" />
                    Facturable
                  </span>
                </label>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${theme.PRIMARY_GRADIENT_CLASS} ${theme.PRIMARY_GRADIENT_HOVER_CLASS}`}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiCheckCircle />
                    {editId ? 'Actualizar' : 'Guardar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FormularioEntrada;