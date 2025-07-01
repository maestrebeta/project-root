import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { FiFolder, FiUsers, FiCalendar, FiClock, FiTarget, FiFileText, FiCode, FiTrendingUp, FiCheck, FiAlertCircle, FiX } from 'react-icons/fi';

export default function ProjectModal({ project, clients, onClose, onSave }) {
  const [currentStep, setCurrentStep] = useState(1);
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
    setError('');
    setLoading(false);
    setCurrentStep(1);
    
    if (project) {
      
      const formatDate = (dateString) => {
        if (!dateString) return '';
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          return dateString;
        }
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
      
      setForm(formData);
    } else {
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
    } catch {
      throw new Error('Error de autenticación');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'client_id' ? (value ? parseInt(value, 10) : null) : 
              name === 'estimated_hours' ? value : 
              value
    }));
  };

  // Validación por paso
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!form.name.trim()) newErrors.name = 'El nombre del proyecto es requerido';
      if (!form.project_type) newErrors.project_type = 'El tipo de proyecto es requerido';
      if (!form.status) newErrors.status = 'El estado del proyecto es requerido';
    }
    
    if (step === 2) {
      // Validaciones adicionales para el paso 2 si es necesario
      if (form.start_date && form.end_date) {
        const startDate = new Date(form.start_date);
        const endDate = new Date(form.end_date);
        if (startDate > endDate) {
          newErrors.end_date = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
      }
    }
    
    setError(Object.values(newErrors).join(', '));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError('');

    try {
      const headers = getAuthHeaders();
      const url = project 
        ? `http://localhost:8001/projects/${project.project_id}`
        : 'http://localhost:8001/projects/';
      const method = project ? 'PUT' : 'POST';

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

      Object.keys(projectData).forEach(key => {
        if (projectData[key] === null || projectData[key] === undefined) {
          // Para fechas, mantener null explícitamente para que el backend las elimine
          if (key === 'start_date' || key === 'end_date') {
            // Mantener null para que el backend elimine la fecha
            console.log(`Manteniendo ${key} como null para eliminación`);
            return;
          }
          delete projectData[key];
        }
        if ((key === 'start_date' || key === 'end_date') && projectData[key]) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(projectData[key])) {
            delete projectData[key];
          }
        }
      });

      console.log('Datos del proyecto a enviar:', projectData);

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(projectData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', response.status, errorData);
        
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

      const savedProject = await response.json();
      onSave();
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  // Renderizar paso 1: Información básica
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiFolder className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Información Básica del Proyecto</h3>
        <p className="text-gray-600">Define los detalles fundamentales de tu proyecto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiFileText className="w-4 h-4" />
            Nombre del Proyecto *
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Ingresa el nombre del proyecto"
          />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiCode className="w-4 h-4" />
            Código del Proyecto
          </label>
          <input
            type="text"
            name="code"
            value={form.code}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="PRJ-001"
          />
        </div> */}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiTarget className="w-4 h-4" />
            Tipo de Proyecto *
          </label>
          <select
            name="project_type"
            value={form.project_type}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Selecciona un tipo</option>
            <option value="web_development">Desarrollo Web</option>
            <option value="mobile_development">Desarrollo Móvil</option>
            <option value="desktop_development">Desarrollo de Escritorio</option>
            <option value="api_development">Desarrollo de API</option>
            <option value="database_design">Diseño de Base de Datos</option>
            <option value="cloud_migration">Migración a la Nube</option>
            <option value="devops_infrastructure">DevOps e Infraestructura</option>
            <option value="security_audit">Auditoría de Seguridad</option>
            <option value="ui_ux_design">Diseño UI/UX</option>
            <option value="testing_qa">Testing y QA</option>
            <option value="maintenance_support">Mantenimiento y Soporte</option>
            <option value="consulting">Consultoría</option>
            <option value="training">Capacitación</option>
            <option value="research_development">Investigación y Desarrollo</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Cliente
          </label>
          <select
            name="client_id"
            value={form.client_id || ''}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Sin cliente</option>
            {clients.map((client) => (
              <option key={client.client_id} value={client.client_id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiTrendingUp className="w-4 h-4" />
            Estado *
          </label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
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
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiTarget className="w-4 h-4" />
            Prioridad
          </label>
          <select
            name="priority"
            value={form.priority}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Renderizar paso 2: Fechas, estimaciones y descripción
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCalendar className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Planificación y Detalles</h3>
        <p className="text-gray-600">Define las fechas, estimaciones y descripción del proyecto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiCalendar className="w-4 h-4" />
            Fecha de Inicio
          </label>
          <input
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiCalendar className="w-4 h-4" />
            Fecha de Fin
          </label>
          <input
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
        </div>

        {/* <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiClock className="w-4 h-4" />
            Horas Estimadas
          </label>
          <input
            type="number"
            name="estimated_hours"
            value={form.estimated_hours}
            onChange={handleChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50"
            placeholder="Se calculará automáticamente"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" />
            Las horas se calculan automáticamente considerando días laborables
          </p>
        </div> */}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FiFileText className="w-4 h-4" />
          Descripción del Proyecto
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Describe los objetivos, alcance y detalles importantes del proyecto..."
        />
      </div>

      {/* Resumen del proyecto */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiCheck className="w-5 h-5 text-blue-600" />
          Resumen del Proyecto
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Nombre:</span>
            <span className="font-medium text-gray-800 ml-2">{form.name || 'No especificado'}</span>
          </div>
          <div>
            <span className="text-gray-600">Tipo:</span>
            <span className="font-medium text-gray-800 ml-2">
              {form.project_type === 'development' ? 'Desarrollo' :
               form.project_type === 'support' ? 'Soporte' :
               form.project_type === 'meeting' ? 'Reunión' :
               form.project_type === 'training' ? 'Capacitación' :
               form.project_type === 'other' ? 'Otro' : 'No especificado'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Estado:</span>
            <span className="font-medium text-gray-800 ml-2">
              {form.status === 'registered_initiative' ? 'Iniciativa registrada' :
               form.status === 'in_quotation' ? 'En cotización' :
               form.status === 'proposal_approved' ? 'Propuesta aprobada' :
               form.status === 'in_planning' ? 'En planeación' :
               form.status === 'in_progress' ? 'En curso' :
               form.status === 'at_risk' ? 'En riesgo' :
               form.status === 'suspended' ? 'Suspendido' :
               form.status === 'completed' ? 'Completado' :
               form.status === 'canceled' ? 'Cancelado' :
               form.status === 'post_delivery_support' ? 'Soporte Post-Entrega' : 'No especificado'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Prioridad:</span>
            <span className="font-medium text-gray-800 ml-2">
              {form.priority === 'low' ? 'Baja' :
               form.priority === 'medium' ? 'Media' :
               form.priority === 'high' ? 'Alta' : 'No especificada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render principal del modal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {project ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h2>
              <p className="text-blue-100 mt-1">
                {project ? 'Modifica los detalles del proyecto' : 'Crea un nuevo proyecto para tu organización'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
          
          {/* Indicadores de pasos */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 1 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-2 ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 2 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5" />
                {error}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <div key="step1" className="transition-all duration-300">
                {renderStep1()}
              </div>
            )}
            {currentStep === 2 && (
              <div key="step2" className="transition-all duration-300">
                {renderStep2()}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer con botones */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          
          <div className="flex gap-3">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anterior
              </button>
            )}
            
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiCheck className="w-4 h-4" />
                    {project ? 'Actualizar Proyecto' : 'Crear Proyecto'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 