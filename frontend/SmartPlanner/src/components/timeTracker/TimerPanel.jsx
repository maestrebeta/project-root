import React, { useRef, useEffect, useState, useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiTag, FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { useProjectsAndTags } from './useProjectsAndTags';
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
}) => {
  const inputRef = useRef();
  const {
    projectOptions,
    tagOptions,
    clientOptions,
    loading,
    suggestedProject,
    suggestedActivity,
  } = useProjectsAndTags();

  // Estados
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [desc, setDesc] = useState(description);
  const [time, setTime] = useState(0); // en segundos
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', error: false });
  const [validationErrors, setValidationErrors] = useState({
    project: false,
    description: false
  });

  // Preselección automática de proyecto y categoría
  useEffect(() => {
    if (!selectedProject && suggestedProject && projectOptions.length) {
      setSelectedProject(suggestedProject);
      const project = projectOptions.find(p => String(p.value) === String(suggestedProject));
      setSelectedClient(project ? project.client_id : '');
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

  // Construye los datos para la entrada de tiempo
  const buildEntryData = useCallback(() => {
    const now = new Date();
    const endTime = new Date(now.getTime() + time * 1000);

    return {
      user_id: userId,
      project_id: Number(selectedProject),
      client_id: selectedClient ? Number(selectedClient) : null,
      entry_date: now.toISOString().slice(0, 10),
      activity_type: selectedTag || 'general',
      start_time: now.toTimeString().slice(0, 8),
      end_time: endTime.toTimeString().slice(0, 8),
      duration: time,
      description: desc.trim(),
      status: 'completed',
      billable: billable,
    };
  }, [selectedProject, selectedClient, selectedTag, desc, billable, time, userId]);

  // Guarda la entrada de tiempo
  const createTimeEntry = useCallback(async (entryData) => {
    try {
      const response = await fetch('http://localhost:8000/time-entries/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Error al guardar la entrada');
      }

      return await response.json();
    } catch (err) {
      console.error('Error saving time entry:', err);
      throw err;
    }
  }, []);

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
      const entryData = buildEntryData();
      await createTimeEntry(entryData);

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
  }, [selectedProject, desc, buildEntryData, createTimeEntry, onNuevaEntrada, time]);

  // Reinicia el formulario
  const resetForm = useCallback(() => {
    setTime(0);
    setDesc('');
    setSelectedProject(suggestedProject || '');
    setSelectedClient(
      projectOptions.find(p => String(p.value) === String(suggestedProject))?.client_id || ''
    );
    setSelectedTag(suggestedActivity || '');
    setRunning(false);
  }, [suggestedProject, suggestedActivity, projectOptions]);

  // Actualiza el cliente cuando cambia el proyecto
  useEffect(() => {
    if (selectedProject && projectOptions.length) {
      const project = projectOptions.find(p => String(p.value) === String(selectedProject));
      setSelectedClient(project ? project.client_id : '');
    } else {
      setSelectedClient('');
    }
  }, [selectedProject, projectOptions]);

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
    const value = e.target.value;
    setDesc(value);
    debouncedDescriptionChange(value);
    setValidationErrors(prev => ({ ...prev, description: !value.trim() }));
  };

  const handleProjectChange = (e) => {
    const value = e.target.value;
    setSelectedProject(value);
    setValidationErrors(prev => ({ ...prev, project: !value }));
  };

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
    validationErrors.description ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
  }`;

  const selectStyles = (hasError = false) =>
    `appearance-none bg-gray-100 border rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 transition text-sm ${
      hasError ? 'border-red-500 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
    }`;

  return (
    <section
      aria-label="Panel de temporizador"
      className="bg-white shadow-lg rounded-2xl p-6 mb-8 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-8 transition-all"
    >
      {/* Sección principal */}
      <div className="flex-1 min-w-0">
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
              value={selectedProject}
              onChange={handleProjectChange}
              disabled={running || loading}
              aria-label="Proyecto"
              aria-invalid={validationErrors.project}
            >
              <option value="">{loading ? 'Cargando...' : 'Selecciona proyecto'}</option>
              {projectOptions.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
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
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={running || loading}
              aria-label="Cliente"
            >
              <option value="">{loading ? 'Cargando...' : 'Cliente'}</option>
              {clientOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
          </div>

          {/* Selector de etiquetas */}
          <div className="relative min-w-[120px] flex flex-col">
            <label htmlFor="timer-category" className="sr-only">
              Categoría
            </label>
            <div className="relative flex items-center">
              <FiTag
                className="absolute text-gray-400 pointer-events-none"
                style={{ left: 12, top: '50%', transform: 'translateY(-50%)' }}
              />
              <select
                id="timer-category"
                className={`${selectStyles()} pl-12`} // pl-10 para más espacio a la izquierda
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                disabled={running || loading}
                aria-label="Categoría"
                style={{ minHeight: '40px' }}
              >
                <option value="">Categoría</option>
                {tagOptions.map((tag) => (
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
              checked={billable}
              onChange={(e) => onBillableChange(e.target.checked)}
              disabled={running}
              aria-checked={billable}
              aria-label="Facturable"
            />
            <span
              className={`
                w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200
                ${billable ? 'bg-blue-600' : 'bg-gray-300'}
                ${running ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                peer-focus:ring-2 peer-focus:ring-blue-400
              `}
            >
              <span
                className={`
                  h-4 w-4 bg-white rounded-full shadow transform transition-transform duration-200
                  ${billable ? 'translate-x-4' : ''}
                `}
              ></span>
            </span>
            <span className={`ml-3 font-medium text-sm select-none ${billable ? 'text-blue-700' : 'text-gray-700'}`}>
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
            running ? 'text-blue-700 animate-pulse' : 'text-gray-800'
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
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500'
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