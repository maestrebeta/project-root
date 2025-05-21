import React, { useState, useEffect } from 'react';
import { useProjectsAndTags } from './useProjectsAndTags';

// Normaliza los datos para el formulario (soporta edición y creación)
function normalizeFormData(data) {
  // Maneja fechas y horas en distintos formatos
  const toDateString = (d) => {
    if (!d) return new Date().toISOString().slice(0, 10);
    if (typeof d === 'string') return d.slice(0, 10);
    try {
      return new Date(d).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  };
  const toTimeString = (t) => {
    if (!t) return '';
    if (typeof t === 'string') return t.slice(0, 5);
    if (typeof t === 'object' && t instanceof Date) {
      return t.toTimeString().slice(0, 5);
    }
    return String(t).slice(0, 5);
  };

  return {
    entry_date: toDateString(data.entry_date),
    activity_type: data.activity_type || '',
    project_id: data.project_id ? String(data.project_id) : '',
    client_id: data.client_id ? String(data.client_id) : '',
    start_time: toTimeString(data.start_time) || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    end_time: toTimeString(data.end_time),
    description: data.description || '',
    status: data.status || (data.end_time ? 'completed' : 'pending'),
    user_id: data.user_id ? String(data.user_id) : '',
    etiquetas: Array.isArray(data.etiquetas) ? data.etiquetas : [],
    billable: typeof data.billable === 'boolean' ? data.billable : true,
  };
}

const FormularioEntrada = ({
  editId,
  onClose,
  initialData = {},
  onSubmit = () => {},
}) => {
  const {
    projectOptions,
    clientOptions,
    tagOptions,
    loading,
    suggestedProject,
    suggestedActivity,
  } = useProjectsAndTags();

  // Estado del formulario (siempre normalizado)
  const [form, setForm] = useState(() =>
    normalizeFormData(initialData)
  );
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: '', error: false });

  // Sincroniza el formulario al cambiar initialData (edición)
  useEffect(() => {
    setForm(normalizeFormData(initialData));
  }, [initialData]);

  // Sugerencias solo para nueva entrada
  useEffect(() => {
    if (!editId && !initialData.project_id && suggestedProject && projectOptions.length) {
      setForm((prev) => ({
        ...prev,
        project_id: suggestedProject,
        client_id:
          projectOptions.find((p) => String(p.value) === String(suggestedProject))?.client_id || '',
      }));
    }
  }, [editId, initialData.project_id, suggestedProject, projectOptions]);

  useEffect(() => {
    if (!editId && !initialData.activity_type && suggestedActivity) {
      setForm((prev) => ({
        ...prev,
        activity_type: suggestedActivity,
      }));
    }
  }, [editId, initialData.activity_type, suggestedActivity]);

  // Actualiza cliente automáticamente al seleccionar proyecto
  useEffect(() => {
    if (form.project_id && projectOptions.length) {
      const project = projectOptions.find(
        (p) => String(p.value) === String(form.project_id)
      );
      setForm((f) => ({
        ...f,
        client_id: project ? String(project.client_id) : '',
      }));
    }
    // eslint-disable-next-line
  }, [form.project_id, projectOptions]);

  // Manejo de cambios en inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Etiquetas toggle
  const handleTagToggle = (tag) => {
    setForm((prev) => ({
      ...prev,
      etiquetas: prev.etiquetas.includes(tag)
        ? prev.etiquetas.filter((t) => t !== tag)
        : [...prev.etiquetas, tag],
    }));
  };

  // Construye el objeto para enviar (ajusta tipos para backend)
  const buildEntryData = () => {
    const data = {
        user_id: Number(form.user_id) || 1,
        project_id: Number(form.project_id),
        client_id: form.client_id ? Number(form.client_id) : null,
        entry_date: form.entry_date,
        activity_type: form.activity_type,
        start_time: form.start_time,
        end_time: form.end_time || null,
        description: form.description.trim(),
        status: form.end_time ? 'completed' : 'pending',
        etiquetas: form.etiquetas,
        billable: form.billable,
    };
    if (editId) {
        data.entry_id = editId; // <-- Asegura que el id se envía al padre
    }
    return data;
  };

  // Enviar formulario a la API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveStatus({ message: '', error: false });

    try {
        const entryData = buildEntryData();
        await onSubmit(entryData);
        onClose();
    } catch (err) {
        setSaveStatus({ message: err.message || 'Error al guardar', error: true });
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            {editId ? 'Editar entrada de tiempo' : 'Nueva entrada de tiempo'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>
        <form className="p-4 space-y-4" onSubmit={handleSubmit} autoComplete="off">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              id="description"
              name="description"
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={handleChange}
              required
              maxLength={120}
              placeholder="¿Qué hiciste?"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="entry_date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                id="entry_date"
                name="entry_date"
                type="date"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.entry_date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="activity_type" className="block text-sm font-medium text-gray-700 mb-1">
                Categoría
              </label>
              <select
                id="activity_type"
                name="activity_type"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.activity_type}
                onChange={handleChange}
                required
              >
                <option value="" disabled hidden>
                  Selecciona
                </option>
                {tagOptions.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
                <option value="other">Otra</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                Proyecto
              </label>
              <select
                id="project_id"
                name="project_id"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.project_id}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="" disabled hidden>
                  {loading ? 'Cargando...' : 'Selecciona un proyecto'}
                </option>
                {projectOptions.map((project) => (
                  <option key={project.value} value={project.value}>
                    {project.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="client_id" className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                id="client_id"
                name="client_id"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.client_id}
                onChange={handleChange}
                required
                disabled
              >
                <option value="">
                  {loading ? 'Cargando...' : 'Selecciona un proyecto'}
                </option>
                {clientOptions.map((client) => (
                  <option key={client.value} value={client.value}>
                    {client.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                Hora inicio
              </label>
              <input
                id="start_time"
                name="start_time"
                type="time"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.start_time}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                Hora fin
              </label>
              <input
                id="end_time"
                name="end_time"
                type="time"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.end_time}
                onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
            <div className="flex flex-wrap gap-2">
              {tagOptions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    form.etiquetas.includes(tag)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                  aria-pressed={form.etiquetas.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="billable"
              name="billable"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={form.billable}
              onChange={handleChange}
            />
            <label htmlFor="billable" className="ml-2 block text-sm text-gray-700">
              Facturable
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
            </button>
          </div>
          {saveStatus.message && (
            <div
              className={`mt-2 text-sm flex items-center ${
                saveStatus.error ? 'text-red-600' : 'text-green-600'
              }`}
              role="alert"
            >
              {saveStatus.message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default FormularioEntrada;