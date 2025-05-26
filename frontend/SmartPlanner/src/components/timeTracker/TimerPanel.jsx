import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiTag, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { useProjectsAndTags } from './useProjectsAndTags';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import debounce from 'lodash.debounce';

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
    activityTypes,
    defaultClient,
    userHasEntries
  } = useProjectsAndTags();

  const {
    states: organizationStates,
    defaultState,
    loading: statesLoading,
    error: statesError
  } = useOrganizationStates();

  // Estados
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedState, setSelectedState] = useState('');
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

  console.log('TimerPanel - Valores recibidos:', {
    suggestedProject,
    suggestedActivity,
    defaultClient,
    userHasEntries
  });

  // Efecto para establecer valores predeterminados
  useEffect(() => {
    if (!selectedProject && projectOptions.length) {
      // Si hay un proyecto sugerido, usarlo
      if (suggestedProject) {
        const project = projectOptions.find(p => String(p.project_id) === String(suggestedProject));
        if (project) {
          setSelectedProject(String(project.project_id));
          setSelectedClient(String(project.client_id || ''));
        }
      }
      // Si no hay registros previos, usar el primer proyecto
      else if (!userHasEntries) {
        const firstProject = projectOptions[0];
        setSelectedProject(String(firstProject.project_id));
        setSelectedClient(String(firstProject.client_id || ''));
      }
    }
  }, [projectOptions, suggestedProject, selectedProject, userHasEntries]);

  // Efecto separado para establecer la actividad predeterminada
  useEffect(() => {
    if (suggestedActivity) {
      console.log('TimerPanel - Actualizando actividad sugerida:', suggestedActivity);
      setSelectedTag(suggestedActivity);
    } else if (!selectedTag) {
      console.log('TimerPanel - Estableciendo actividad por defecto: desarrollo');
      setSelectedTag('desarrollo');
    }
  }, [suggestedActivity]);

  // Establecer estado por defecto cuando se cargan los estados de la organización
  useEffect(() => {
    if (defaultState && !selectedState) {
      setSelectedState(defaultState);
    }
  }, [defaultState, selectedState]);

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
      activity_type: selectedTag,
      start_time: now.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration: time,
      description: desc.trim(),
      status: selectedState || defaultState,
      billable: billable,
      organization_id: session.user.organization_id
    };
  }, [selectedProject, selectedClient, selectedTag, desc, billable, time, userId, selectedState, defaultState]);

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

      const entryData = {
        user_id: Number(session.user.user_id),
        project_id: Number(selectedProject),
        entry_date: now.toISOString().split('T')[0],
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
        description: desc.trim() || null,
        activity_type: selectedTag,
        status: 'completado', // Estado por defecto siempre completado
        billable: Boolean(billableState),
        organization_id: Number(session.user.organization_id),
        ticket_id: null
      };

      console.log('Datos a enviar:', entryData);

      const response = await fetch('http://localhost:8000/time-entries/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(entryData)
      });

      if (response.status === 401) {
        throw new Error('Sesión expirada');
      }

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al guardar la entrada de tiempo');
      }

      const savedEntry = await response.json();
      console.log('Respuesta del servidor:', savedEntry); // Debug log
      
      // Llamar a la función de callback si está definida
      if (onNuevaEntrada) {
        onNuevaEntrada(savedEntry);
      }

      // Resetear estado
      setTime(0);
      setDesc('');
      setSelectedTag(suggestedActivity || 'desarrollo');
      setSelectedProject(null);
      setBillable(true);
      setRunning(false);
      setSaveStatus({ message: 'Entrada guardada con éxito', error: false });

    } catch (error) {
      console.error('Error completo:', error); // Debug log
      if (error.message.includes('Sesión expirada')) {
        setSaveStatus({ message: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.', error: true });
        // Aquí podrías redirigir al login si tienes un sistema de navegación
        // navigate('/login');
        return;
      }
      setSaveStatus({ message: error.message || 'Error al guardar la entrada', error: true });
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
      setTimeout(() => setSaveStatus({ message: '', error: false }), 3000);
    } catch (err) {
      setSaveStatus({ message: err.message || 'Error al guardar la entrada', error: true });
    } finally {
      setSaving(false);
    }
  }, [selectedProject, desc, time, handleSaveEntry]);

  // Reinicia el formulario
  const resetForm = useCallback(() => {
    setTime(0);
    setDesc('');
    setSelectedProject(suggestedProject || null);
    setSelectedClient(
      projectOptions.find(p => String(p.value) === String(suggestedProject))?.client_id || ''
    );
    setSelectedTag(suggestedActivity || 'desarrollo');
    setRunning(false);
  }, [suggestedProject, suggestedActivity, projectOptions]);

  // Obtener cliente de un proyecto específico
  const getClientForProject = (projectId) => {
    const project = projectOptions.find(p => String(p.project_id) === String(projectId));
    return project ? project.client_id : null;
  };

  // Handler para cambio de proyecto
  const handleProjectChange = useCallback((e) => {
    const projectId = e.target.value;
    setSelectedProject(projectId);
    const project = projectOptions.find(p => String(p.project_id) === String(projectId));
    setSelectedClient(project?.client_id || '');
  }, [projectOptions]);

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

  const handleDescChange = useCallback((e) => {
    const newDesc = e.target.value;
    setDesc(newDesc);
    debouncedDescriptionChange(newDesc);
    setValidationErrors(prev => ({ ...prev, description: !newDesc.trim() }));
  }, [onDescriptionChange]);

  // Obtener cliente del proyecto seleccionado
  const selectedProjectDetails = (projectOptions || []).find(p => p.project_id === selectedProject);
  const selectedClientName = selectedProjectDetails?.client_name || 'Sin cliente';

  // Controladores de botones del temporizador
  const handlePlay = useCallback(() => {
    setRunning(true);
    onPlay();
  }, [onPlay]);

  const handlePause = useCallback(() => {
    setRunning(false);
    onPause();
  }, [onPause]);

  const handleStop = useCallback(() => {
    setRunning(false);
    setTime(0);
    onStop();
  }, [onStop]);

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
              className={selectStyles(validationErrors.project)}
              value={selectedProject || ''}
              onChange={(e) => {
                setSelectedProject(e.target.value);
                const project = projectOptions.find(p => p.project_id === e.target.value);
                setSelectedClient(project?.client_id || '');
              }}
              required
            >
              <option value="" disabled>Selecciona un proyecto</option>
              {projectOptions.map((project) => (
                <option key={project.project_id} value={project.project_id}>
                  {project.name}
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
                className="appearance-none bg-gray-100 border rounded-md pl-8 pr-8 py-2 focus:outline-none focus:ring-2 transition text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                value={selectedTag}
                onChange={(e) => {
                  console.log('Categoría seleccionada:', e.target.value); // Debug log
                  setSelectedTag(e.target.value);
                }}
              >
                {activityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
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
              onChange={(e) => {
                setBillable(e.target.checked);
                onBillableChange(e.target.checked);
              }}
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