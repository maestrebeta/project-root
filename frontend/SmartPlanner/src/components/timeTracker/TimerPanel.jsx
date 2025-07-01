import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiTag, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { useProjectsAndTags } from './useProjectsAndTags';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import debounce from 'lodash.debounce';

const MinimunTime = 5; // segundos mínimos para guardar la entrada

// Mapa completo de colores de Tailwind
const TAILWIND_COLORS = {
  blue: {
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8'
  },
  indigo: {
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca'
  },
  red: {
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c'
  },
  green: {
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d'
  },
  yellow: {
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207'
  },
  orange: {
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c'
  },
  pink: {
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d'
  },
  purple: {
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce'
  },
  gray: {
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151'
  },
  cyan: {
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490'
  },
  teal: {
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e'
  },
  lime: {
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f'
  },
  stone: {
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c'
  },
  zinc: {
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46'
  },
  neutral: {
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040'
  }
};

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
      setSelectedTag(suggestedActivity);
    } else if (!selectedTag) {
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

      // Convertir nombre de categoría a ID
      let activityTypeId = 1; // Fallback a ID 1
      if (activityTypes.length > 0) {
        const category = activityTypes.find(cat => cat.name === selectedTag);
        activityTypeId = category ? category.id : 1;
      }

      // Convertir estado a ID (siempre completado = ID 3)
      const statusId = 3; // ID del estado "Completada"

      // Función para formatear fecha y hora a UTC (igual que FormularioEntrada)
      const formatDateTimeToUTC = (date, timeStr) => {
        if (!date || !timeStr) return null;
        
        // Crear fecha con la hora local especificada
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Crear fecha en hora local
        const localDate = new Date(year, month - 1, day, hours, minutes, 0);
        
        // Convertir a UTC manteniendo la misma hora local
        return localDate.toISOString();
      };

      // Formatear la fecha actual como YYYY-MM-DD
      const formatDateForInput = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Obtener la fecha actual en formato YYYY-MM-DD
      const currentDate = formatDateForInput(now);
      const startTimeStr = startTime.toTimeString().slice(0, 8);
      const endTimeStr = now.toTimeString().slice(0, 8);

      const entryData = {
        user_id: Number(session.user.user_id),
        project_id: Number(selectedProject),
        entry_date: formatDateTimeToUTC(now, startTimeStr), // Usar la fecha del start_time como entry_date
        start_time: formatDateTimeToUTC(now, startTimeStr),
        end_time: formatDateTimeToUTC(now, endTimeStr),
        description: desc.trim() || null,
        activity_type: activityTypeId,
        status: statusId,
        billable: Boolean(billableState),
        organization_id: Number(session.user.organization_id),
        ticket_id: null
      };

      const response = await fetch('http://localhost:8001/time-entries/', {
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
                  setSelectedTag(e.target.value);
                }}
              >
                {activityTypes.map((type) => (
                  <option key={type.id || type.value} value={type.name || type.value}>
                    {type.name || type.label}
                  </option>
                ))}
              </select>
              <FiChevronDown
                className="absolute text-gray-400 pointer-events-none"
                style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

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

          {/* Selector de cliente - Solo lectura */}
          <div className="relative min-w-[120px] flex flex-col">
            <label htmlFor="timer-client" className="sr-only">
              Cliente
            </label>
            <div className="relative">
              <select
                id="timer-client"
                className={`${selectStyles()} bg-gray-50 cursor-not-allowed`}
                value={selectedClient || ''}
                disabled={true}
                aria-label="Cliente (determinado por el proyecto)"
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
              <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none opacity-50" />
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
          className={`flex items-center justify-center w-full py-2 px-4 rounded-md transition text-white font-medium ${
            saving ? 'opacity-70 cursor-not-allowed' : ''
          }`}
          style={{
            background: saving 
              ? `linear-gradient(to right, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[400] || TAILWIND_COLORS.blue[400]}, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[300] || TAILWIND_COLORS.blue[300]})`
              : `linear-gradient(to right, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[600] || TAILWIND_COLORS.blue[600]}, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[500] || TAILWIND_COLORS.blue[500]})`
          }}
          onMouseEnter={(e) => {
            if (!saving && !running) {
              e.target.style.background = `linear-gradient(to right, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[700] || TAILWIND_COLORS.blue[700]}, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[600] || TAILWIND_COLORS.blue[600]})`;
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.target.style.background = `linear-gradient(to right, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[600] || TAILWIND_COLORS.blue[600]}, ${TAILWIND_COLORS[theme.PRIMARY_COLOR]?.[500] || TAILWIND_COLORS.blue[500]})`;
            }
          }}
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