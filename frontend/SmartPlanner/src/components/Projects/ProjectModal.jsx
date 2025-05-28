import React, { useState, useEffect } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ProjectModal({ project, clients, onClose, onSave }) {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    project_type: '',
    client_id: '',
    status: '',
    start_date: '',
    end_date: '',
    description: '',
    code: '',
    estimated_hours: '',
    priority: 'medium'
  });

  // Inicializar formulario cuando se abre el modal
  useEffect(() => {
    setError(''); // Limpiar errores al abrir el modal
    setLoading(false); // Asegurar que no esté en estado de carga
    
    if (project) {
      console.log('Editing project:', project); // Debug log
      
      // Modo edición - formatear fechas correctamente
      const formatDate = (dateString) => {
        if (!dateString) return '';
        // Si la fecha ya está en formato YYYY-MM-DD, devolverla tal como está
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
        // Si es un objeto Date o string de fecha, convertir a YYYY-MM-DD
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      const formData = {
        name: project.name || '',
        project_type: project.project_type || '',
        client_id: project.client_id || '',
        status: project.status || '',
        start_date: formatDate(project.start_date),
        end_date: formatDate(project.end_date),
        description: project.description || '',
        code: project.code || '',
        estimated_hours: project.estimated_hours ? project.estimated_hours.toString() : '',
        priority: project.priority || 'medium'
      };
      
      console.log('Setting form data:', formData); // Debug log
      setForm(formData);
    } else {
      // Modo creación
      setForm({
        name: '',
        project_type: '',
        client_id: '',
        status: 'registered_initiative',
        start_date: '',
        end_date: '',
        description: '',
        code: '',
        estimated_hours: '',
        priority: 'medium'
      });
    }
  }, [project]);

  // Debug: Log form state changes
  useEffect(() => {
    console.log('Form state updated:', form);
  }, [form]);

  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    } catch (error) {
      throw new Error('Error de autenticación');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'client_id' ? (value ? parseInt(value, 10) : null) : 
              name === 'estimated_hours' ? value : // Mantener como string en el form, convertir al enviar
              value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validación en el frontend
      if (!form.name.trim()) {
        throw new Error('El nombre del proyecto es requerido');
      }
      if (!form.project_type) {
        throw new Error('El tipo de proyecto es requerido');
      }
      if (!form.status) {
        throw new Error('El estado del proyecto es requerido');
      }

      const headers = getAuthHeaders();
      const url = project 
        ? `http://localhost:8000/projects/${project.project_id}`
        : 'http://localhost:8000/projects/';
      const method = project ? 'PUT' : 'POST';

      // Preparar datos
      const projectData = {
        name: form.name.trim(),
        project_type: form.project_type,
        client_id: form.client_id || null,
        status: form.status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        description: form.description ? form.description.trim() : null,
        code: form.code ? form.code.trim() : null,
        estimated_hours: form.estimated_hours ? parseInt(form.estimated_hours, 10) : null,
        priority: form.priority
      };

      // Solo eliminar campos que son explícitamente null o undefined
      // No eliminar strings vacíos ya que podrían ser válidos
      Object.keys(projectData).forEach(key => {
        if (projectData[key] === null || projectData[key] === undefined) {
          delete projectData[key];
        }
        // Validar formato de fechas solo si no están vacías
        if ((key === 'start_date' || key === 'end_date') && projectData[key]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(projectData[key])) {
            delete projectData[key]; // Eliminar fecha mal formateada
          }
        }
      });

      console.log('Sending project data:', projectData);
      console.log('URL:', url, 'Method:', method);

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(projectData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', response.status, errorData);
        
        // Mostrar error más específico
        if (response.status === 422) {
          const validationErrors = errorData.detail;
          if (Array.isArray(validationErrors)) {
            const errorMessages = validationErrors.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
            throw new Error(`Errores de validación: ${errorMessages}`);
          } else {
            throw new Error(`Error de validación: ${errorData.detail}`);
          }
        } else {
          throw new Error(errorData.detail || 'Error al procesar la solicitud');
        }
      }

      // Si llegamos aquí, la respuesta fue exitosa
      const savedProject = await response.json();
      console.log('Project saved successfully:', savedProject);
      onSave(); // Esto cerrará el modal y recargará los datos
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {project ? 'Modifica los detalles del proyecto' : 'Crea un nuevo proyecto para tu organización'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-icons-outlined text-2xl">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined text-xl">error_outline</span>
                {error}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Básica */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Proyecto *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ingresa el nombre del proyecto"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código del Proyecto
              </label>
              <input
                type="text"
                name="code"
                value={form.code}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="PRJ-001"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Proyecto *
              </label>
              <select
                name="project_type"
                value={form.project_type}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona un tipo</option>
                <option value="development">Desarrollo</option>
                <option value="support">Soporte</option>
                <option value="meeting">Reunión</option>
                <option value="training">Capacitación</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente
              </label>
              <select
                name="client_id"
                value={form.client_id || ''}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin cliente</option>
                {clients.map((client) => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado *
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="registered_initiative">Iniciativa registrada</option>
                <option value="in_quotation">En cotización</option>
                <option value="proposal_approved">Propuesta aprobada</option>
                <option value="in_planning">En planeación</option>
                <option value="in_progress">En curso</option>
                <option value="at_risk">En riesgo</option>
                <option value="suspended">Suspendido</option>
                <option value="completed">Completado</option>
                <option value="canceled">Cancelado</option>
                <option value="post_delivery_support">Soporte Post-Entrega</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prioridad
              </label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>

            {/* Fechas y Estimaciones */}
            <div className="md:col-span-2 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas y Estimaciones</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Inicio
              </label>
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Fin
              </label>
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horas Estimadas (Calculadas automáticamente)
              </label>
              <input
                type="number"
                name="estimated_hours"
                value={form.estimated_hours}
                onChange={handleChange}
                min="0"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                placeholder="Se calculará automáticamente basado en las fechas"
                title="Las horas se calculan automáticamente basándose en las fechas de inicio y fin del proyecto"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Las horas se calculan automáticamente considerando días laborables y tipo de proyecto
              </p>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe los objetivos y alcance del proyecto..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`${theme.PRIMARY_BUTTON_CLASS} px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50`}
            >
              {loading && <span className="material-icons-outlined animate-spin text-lg">refresh</span>}
              {loading ? 'Guardando...' : (project ? 'Actualizar' : 'Crear Proyecto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 