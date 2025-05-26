import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiTag, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { useProjectsAndTags } from './useProjectsAndTags';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import debounce from 'lodash.debounce';
import activityTypes from '../../config/activityTypes';  // Importar el módulo de tipos de actividad

const MinimunTime = 5; // segundos mínimos para guardar la entrada

const TimerPanel = ({
  userId = 1, // Debería venir de auth context
  onNuevaEntrada,
  isRunning = false,
  description = '',
  onDescriptionChange = () => {},
  onPlay = () => {},
  onPause = () => {},
  onStop = () => {},
  billable = true,
  onBillableChange = () => {},
  loading = false
}) => {
  const inputRef = useRef();
  const {
    projects: projectOptions,
    clients: clientOptions,
    tagOptions,
    suggestedProject,
    suggestedActivity,
    error: projectsError,
  } = useProjectsAndTags();

  // Estados
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [desc, setDesc] = useState(description);
  const [time, setTime] = useState(0); // en segundos
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const theme = useAppTheme();
  const [saveStatus, setSaveStatus] = useState({ message: '', error: false });
  const [validationErrors, setValidationErrors] = useState({
    project: false,
    description: false
  });
  const [billableState, setBillable] = useState(billable);

  // Preselección automática de proyecto y categoría
  useEffect(() => {
    if (!selectedProject && suggestedProject && projectOptions.length) {
      const project = projectOptions.find(p => String(p.project_id) === String(suggestedProject));
      if (project) {
        setSelectedProject(project.project_id);
        setSelectedClient(project.client_id || '');
      }
    }
  }, [suggestedProject, projectOptions, selectedProject]);

  useEffect(() => {
    if (!selectedTag && suggestedActivity) {
      setSelectedTag(suggestedActivity);
    }
  }, [suggestedActivity, selectedTag]);

  // Formatea el tiempo a HH:MM:SS
  const formatTime = useCallback((secs) => {
    const h = String(Math.floor(secs / 3600)).padStart(2, '0');
    const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, []);

  // Convertir timestamp a formato time HH:mm:ss
  const formatTimeFromTimestamp = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toTimeString().split(' ')[0]; // Formato HH:mm:ss
  };

  // Construye los datos para la entrada de tiempo
  const buildEntryData = useCallback(() => {
    const now = new Date();
    const endTime = new Date(now.getTime() + time * 1000);

    return {
      user_id: userId,
      project_id: Number(selectedProject),
      client_id: selectedClient ? Number(selectedClient) : null,
      entry_date: now.toISOString().slice(0, 10),
      activity_type: activityTypes.normalizeActivityType(selectedTag || 'trabajo'),
      start_time: now.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration: time,
      description: desc.trim(),
      status: 'completed',
      billable: billable,
      organization_id: session.user.organization_id
    };
  }, [selectedProject, selectedClient, selectedTag, desc, billable, time, userId]);

  // Guarda la entrada de tiempo
  const handleSaveEntry = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token || !session?.user) {
        throw new Error('No hay sesión activa');
      }

      // Validaciones previas
      if (!selectedProject) {
        throw new Error('Debe seleccionar un proyecto');
      }

      if (time < MinimunTime) {
        throw new Error('El tiempo debe ser mayor a 5 segundos');
      }

      // Calcular tiempos de inicio y fin basados en el tiempo transcurrido
      const now = new Date();
      const startTime = new Date(now.getTime() - time * 1000);
      const endTime = now;

      // Formatear horas como HH:mm:ss
      const formatTime = (date) => {
        return date.toTimeString().slice(0, 8);
      };

      const formattedStartTime = formatTime(startTime);
      const formattedEndTime = formatTime(endTime);

      const entryData = {
        user_id: Number(session.user.user_id),
        project_id: Number(selectedProject),
        entry_date: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
        start_time: formattedStartTime,
        end_time: formattedEndTime,
        description: desc.trim() || null,
        activity_type: activityTypes.normalizeActivityType(selectedTag || 'trabajo'),
        status: 'completado', // Estado por defecto
        billable: Boolean(billableState),
        organization_id: Number(session.user.organization_id),
        ...(selectedTag ? { ticket_id: null } : {}) // Opcional, ajustar según necesidad
      };

      // Logging detallado para depuración
      console.group('Datos de entrada de tiempo');
      console.log('Datos completos:', JSON.stringify(entryData, null, 2));
      console.log('Tipos de datos:', {
        user_id: typeof entryData.user_id,
        project_id: typeof entryData.project_id,
        entry_date: typeof entryData.entry_date,
        start_time: typeof entryData.start_time,
        end_time: typeof entryData.end_time,
        description: typeof entryData.description,
        activity_type: typeof entryData.activity_type,
        status: typeof entryData.status,
        billable: typeof entryData.billable,
        organization_id: typeof entryData.organization_id,
      });
      console.groupEnd();

      const response = await fetch('http://localhost:8000/time-entries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
        body: JSON.stringify(entryData),
        credentials: 'include'
      });

      // Log de la respuesta del servidor
      console.group('Respuesta del servidor');
      console.log('Código de estado:', response.status);
      
      if (!response.ok) {
        // Intentar obtener detalles del error
        let errorDetail = 'Error desconocido al guardar la entrada de tiempo';
        let errorBody = null;
        try {
          errorBody = await response.json();
          console.group('Error de validación');
          console.log('Código de estado:', response.status);
          console.log('Datos de error (JSON):', errorBody);
          console.log('Datos enviados:', JSON.stringify(entryData, null, 2));
          console.groupEnd();

          // Extraer mensaje de error más detallado
          if (errorBody.detail && Array.isArray(errorBody.detail)) {
            errorDetail = errorBody.detail.map(err => 
              `${err.loc ? err.loc.join('.') : 'Campo desconocido'}: ${err.msg}`
            ).join('; ');
          } else {
            errorDetail = errorBody.detail || JSON.stringify(errorBody);
          }
        } catch {
          try {
            const errorText = await response.text();
            console.log('Datos de error (texto):', errorText);
            errorDetail = errorText;
          } catch {
            console.log('No se pudo leer el cuerpo del error');
          }
        }

        // Log adicional para depuración
        console.error('Detalles completos del error:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorBody,
          errorDetail: errorDetail
        });

        throw new Error(errorDetail);
      }

      const savedEntry = await response.json();
      console.log('Entrada guardada:', savedEntry);
      console.groupEnd();
      
      // Llamar a la función de callback si está definida
      if (onNuevaEntrada) {
        onNuevaEntrada(savedEntry);
      }

      // Resetear estado
      resetTimer();
      setDesc('');
      setSelectedTag(null);
      setSelectedProject(null);
      setBillable(true);

    } catch (error) {
      console.error('Error al guardar entrada de tiempo:', error);
      
      // Mostrar mensaje de error al usuario
      const errorMessage = error.message || 'Error desconocido al guardar la entrada de tiempo';
      
      // Usar contexto de notificaciones si está disponible
      if (window.dispatchEvent) {
        const event = new CustomEvent('showNotification', {
          detail: {
            type: 'error',
            title: 'Error al guardar entrada de tiempo',
            message: errorMessage
          }
        });
        window.dispatchEvent(event);
      } else {
        alert(errorMessage);
      }

      // Lanzar el error para que pueda ser capturado por manejadores de errores superiores
      throw error;
    }
  };

  // Handler para guardar con validación
  const handleSave = useCallback(async () => {
    const errors = {
      project: !selectedProject,
      description: !desc.trim()
    };

    setValidationErrors(errors);

    if (errors.project || errors.description) {
      setSaveStatus({ message: 'Completa los campos requeridos', error: true });
      return;
    }

    if (time < MinimunTime) {
      setSaveStatus({ message: 'El tiempo debe ser mayor a 5 segundos', error: true });
      return;
    }

    setSaving(true);
    try {
      await handleSaveEntry();

      setSaveStatus({ message: 'Entrada guardada con éxito', error: false });
      resetForm();

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveStatus({ message: '', error: false }), 3000);
      if (onNuevaEntrada) onNuevaEntrada();
    } catch (err) {
      setSaveStatus({ message: err.message || 'Error al guardar la entrada', error: true });
    } finally {
      setSaving(false);
    }
  }, [selectedProject, desc, handleSaveEntry, onNuevaEntrada, time]);

  // Reinicia el formulario
  const resetForm = useCallback(() => {
    setTime(0);
    setDesc('');
    setSelectedProject(suggestedProject || null);
    setSelectedClient(
      projectOptions.find(p => String(p.value) === String(suggestedProject))?.client_id || ''
    );
    setSelectedTag(suggestedActivity || '');
    setRunning(false);
  }, [suggestedProject, suggestedActivity, projectOptions]);

  // Obtener cliente de un proyecto específico
  const getClientForProject = (projectId) => {
    const project = projectOptions.find(p => String(p.project_id) === String(projectId));
    return project ? project.client_id : null;
  };

  // Handler para cambio de proyecto
  const handleProjectChange = (e) => {
    const selectedProjectId = e.target.value;
    setSelectedProject(selectedProjectId);
    
    // Actualizar cliente automáticamente
    const clientId = getClientForProject(selectedProjectId);
    setSelectedClient(clientId || '');
  };

  // Manejo del temporizador
  useEffect(() => {
    let intervalId;

    if (running) {
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [running]);

  // Auto-enfoque en el input de descripción
  useEffect(() => {
    if (!running && inputRef.current) {
      inputRef.current.focus();
    }
  }, [running]);

  // Handlers optimizados con debounce para mejor rendimiento
  const debouncedDescriptionChange = debounce((value) => {
    onDescriptionChange(value);
  }, 300);

  const handleDescChange = (e) => {
    const newDesc = e.target.value;
    setDesc(newDesc);
    debouncedDescriptionChange(newDesc);
    setValidationErrors(prev => ({ ...prev, description: !newDesc.trim() }));
  };

  // Obtener cliente del proyecto seleccionado
  const selectedProjectDetails = (projectOptions || []).find(p => p.project_id === selectedProject);
  const selectedClientName = selectedProjectDetails?.client_name || 'Sin cliente';

  // Controladores de botones del temporizador
  const handlePlay = () => {
    setRunning(true);
    onPlay();
  };

  const handlePause = () => {
    setRunning(false);
    onPause();
  };

  const handleStop = () => {
    setRunning(false);
    setTime(0);
    onStop();
  };

  // Estilos reutilizables
  const inputStyles = `w-full text-2xl md:text-3xl font-bold border-b-2 focus:outline-none py-2 px-1 bg-transparent transition ${
    validationErrors.description ? 'border-red-500' : `border-gray-200 focus:border-${theme.PRIMARY_COLOR}-500`
  }`;

  const selectStyles = (hasError = false) =>
    `appearance-none bg-gray-100 border rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 transition text-sm ${
      hasError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;

  // Función para reiniciar el temporizador
  const resetTimer = useCallback(() => {
    setTime(0);
    setRunning(false);
  }, []);

  return (
    <section
      aria-label="Panel de temporizador"
      className={`bg-white shadow-lg rounded-2xl p-6 mb-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}
    >
      {/* Sección principal */}
      <div className="flex-1 min-w-0">
        {/* Manejo de errores de proyectos */}
        {projectsError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="flex items-center gap-2">
              <span className="material-icons-outlined text-xl">error_outline</span>
              {projectsError}
            </p>
          </div>
        )}

        {/* Input de descripción */}
        <label htmlFor="timer-desc" className="sr-only">
          ¿En qué estás trabajando?
        </label>
        <input
          ref={inputRef}
          id="timer-desc"
          type="text"
          className={inputStyles}
          placeholder="¿En qué estás trabajando?"
          value={desc}
          onChange={handleDescChange}
          disabled={running}
          aria-label="Descripción de la tarea"
          autoComplete="off"
          aria-invalid={validationErrors.description}
        />
        {validationErrors.description && (
          <p className="text-red-500 text-xs mt-1">La descripción es requerida</p>
        )}

        {/* Controles de proyecto, cliente y etiquetas */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          {/* Selector de proyecto */}
          <div className="relative min-w-[150px] flex flex-col">
            <label htmlFor="timer-project" className="sr-only">
              Proyecto
            </label>
            <select
              id="timer-project"
              className={selectStyles(validationErrors.project)}
              value={selectedProject || ''}
              onChange={handleProjectChange}
              disabled={running || loading}
              aria-label="Proyecto"
              aria-invalid={validationErrors.project}
            >
              <option value="" disabled>
                {loading ? 'Cargando proyectos...' : 'Selecciona un proyecto'}
              </option>
              {projectOptions.map(project => (
                <option 
                  key={project.project_id} 
                  value={project.project_id}
                >
                  {project.name} - {project.client_name || 'Sin cliente'}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
            {validationErrors.project && (
              <p className="text-red-500 text-xs mt-1 absolute -bottom-5 left-0">Selecciona un proyecto</p>
            )}
          </div>

          {/* Selector de cliente */}
          <div className="relative min-w-[120px] flex flex-col">
            <label htmlFor="timer-client" className="sr-only">
              Cliente
            </label>
            <select
              id="timer-client"
              className={selectStyles()}
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={running || loading}
              aria-label="Cliente"
            >
              <option value="">Sin cliente</option>
              {clientOptions.map(client => (
                <option 
                  key={client.client_id} 
                  value={client.client_id}
                >
                  {client.name}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Selector de etiquetas */}
          <div className="relative min-w-[120px] flex flex-col">
            <label htmlFor="timer-tag" className="sr-only">
              Categoría
            </label>
            <div className="relative flex items-center">
              <FiTag
                className="absolute text-gray-400 pointer-events-none"
                style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <select
                id="timer-tag"
                className={selectStyles()}
                value={selectedTag || ''}
                onChange={(e) => setSelectedTag(e.target.value)}
                disabled={running || loading}
                aria-label="Categoría"
              >
                <option value="">Sin categoría</option>
                {[
                  ...activityTypes.DEFAULT_ACTIVITY_TYPES,
                  // Tipos personalizados adicionales
                  'development', 
                  'support', 
                  'meeting'
                ].map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="absolute text-gray-400 pointer-events-none"
                style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          {/* Toggle Facturable */}
          <label className="flex items-center cursor-pointer select-none relative">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={billableState}
              onChange={(e) => onBillableChange(e.target.checked)}
              disabled={running}
              aria-checked={billableState}
              aria-label="Facturable"
            />
            <span
              className={`
                w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200
                ${billableState ? theme.PRIMARY_BG_MEDIUM : 'bg-gray-300'}
                ${running ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                peer-focus:ring-2 peer-focus:ring-blue-400
              `}
            >
              <span
                className={`
                  h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200
                  ${billableState ? 'translate-x-4' : ''}
                `}
              ></span>
            </span>
            <span className={`ml-3 font-medium text-sm select-none ${billableState ? theme.PRIMARY_COLOR_CLASS : 'text-gray-700'}`}>
              Facturable
            </span>
          </label>
        </div>

        {/* Información adicional del proyecto */}
        {selectedProjectDetails && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm">
            <p>
              <span className="font-semibold">Cliente:</span> {selectedClientName}
            </p>
            <p>
              <span className="font-semibold">Tipo:</span> {selectedProjectDetails.project_type}
            </p>
          </div>
        )}
      </div>

      {/* Panel de temporizador y controles */}
      <div className="flex flex-col items-center min-w-[180px]">
        {/* Temporizador */}
        <div
          className={`text-4xl font-extrabold mb-2 tracking-tight ${
            running ? `${theme.PRIMARY_COLOR_CLASS} animate-pulse` : 'text-gray-800'
          }`}
          aria-live="polite"
        >
          {formatTime(time)}
        </div>

        {/* Controles del temporizador */}
        <div className="flex space-x-3 mb-4">
          <button
            onClick={handlePlay}
            className="bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-400 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md transition disabled:opacity-50"
            aria-label="Iniciar"
            disabled={running}
          >
            <FiPlay className="w-6 h-6" />
          </button>
          <button
            onClick={handlePause}
            className="bg-yellow-500 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md transition disabled:opacity-50"
            aria-label="Pausar"
            disabled={!running}
          >
            <FiPause className="w-6 h-6" />
          </button>
          <button
            onClick={handleStop}
            className="bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-400 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md transition disabled:opacity-50"
            aria-label="Detener"
            disabled={!running && time === 0}
          >
            <FiSquare className="w-6 h-6" />
          </button>
        </div>

        {/* Botón de guardar */}
        <button
          onClick={handleSave}
          className={`flex items-center justify-center w-full py-2 px-4 rounded-md transition ${
            saving
              ? `${theme.PRIMARY_BG_MEDIUM} opacity-70 cursor-not-allowed`
              : `${theme.PRIMARY_GRADIENT_CLASS} ${theme.PRIMARY_GRADIENT_HOVER_CLASS}`
          } text-white font-medium`}
          disabled={saving || running}
          aria-label="Guardar entrada"
        >
          {saving ? (
            'Guardando...'
          ) : (
            <>
              <FiCheck className="mr-2" />
              Guardar entrada
            </>
          )}
        </button>

        {/* Mensaje de estado */}
        {saveStatus.message && (
          <div
            className={`mt-2 text-sm flex items-center ${
              saveStatus.error ? 'text-red-600' : 'text-green-600'
            }`}
            role="alert"
          >
            {saveStatus.error ? <FiX className="mr-1" /> : <FiCheck className="mr-1" />}
            {saveStatus.message}
          </div>
        )}
      </div>
    </section>
  );
};

export default TimerPanel;