import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SPECIALIZATIONS = {
  development: {
    label: 'Desarrollo',
    icon: '💻',
    color: 'blue',
    subSpecializations: {
      frontend: 'Frontend',
      backend: 'Backend',
      fullstack: 'Full Stack',
      mobile: 'Móvil',
      devops: 'DevOps'
    }
  },
  ui_ux: {
    label: 'UI/UX',
    icon: '🎨',
    color: 'purple',
    subSpecializations: {
      ui_design: 'Diseño UI',
      ux_research: 'Investigación UX',
      prototyping: 'Prototipado',
      user_testing: 'Testing de Usuario'
    }
  },
  testing: {
    label: 'Testing',
    icon: '🧪',
    color: 'green',
    subSpecializations: {
      manual_testing: 'Testing Manual',
      automation: 'Automatización',
      performance: 'Performance',
      security: 'Seguridad'
    }
  },
  documentation: {
    label: 'Documentación',
    icon: '📚',
    color: 'yellow',
    subSpecializations: {
      technical_writing: 'Escritura Técnica',
      api_docs: 'Documentación API',
      user_guides: 'Guías de Usuario',
      training: 'Material de Capacitación'
    }
  },
  management: {
    label: 'Gestión',
    icon: '👔',
    color: 'red',
    subSpecializations: {
      project_management: 'Gestión de Proyectos',
      team_lead: 'Liderazgo de Equipo',
      product_owner: 'Product Owner',
      scrum_master: 'Scrum Master'
    }
  },
  data_analysis: {
    label: 'Análisis de Datos',
    icon: '📊',
    color: 'indigo',
    subSpecializations: {
      business_intelligence: 'Business Intelligence',
      data_science: 'Ciencia de Datos',
      analytics: 'Analytics',
      reporting: 'Reportes'
    }
  }
};

const ROLES = [
  { value: 'dev', label: 'Desarrollador', icon: '👨‍💻' },
  { value: 'admin', label: 'Administrador', icon: '👨‍💼' },
  { value: 'infra', label: 'Infraestructura', icon: '🔧' },
  { value: 'super_user', label: 'Super Usuario', icon: '👑' }
];

export default function UserModal({ user, onClose, onSave, isOpen }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    role: 'dev',
    specialization: 'development',
    sub_specializations: [],
    hourly_rate: '',
    weekly_capacity: 40,
    skills: {},
    is_active: true
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        full_name: user.full_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'dev',
        specialization: user.specialization || 'development',
        sub_specializations: user.sub_specializations || [],
        hourly_rate: user.hourly_rate || '',
        weekly_capacity: user.weekly_capacity || 40,
        skills: user.skills || {},
        is_active: user.is_active !== undefined ? user.is_active : true
      });
    } else {
      setFormData({
        username: '',
        full_name: '',
        email: '',
        password: '',
        role: 'dev',
        specialization: 'development',
        sub_specializations: [],
        hourly_rate: '',
        weekly_capacity: 40,
        skills: {},
        is_active: true
      });
    }
    setCurrentStep(1);
    setError('');
    setValidationErrors({});
  }, [user, isOpen]);

  const validateStep = (step) => {
    const errors = {};
    
    if (step === 1) {
      if (!formData.username.trim()) errors.username = 'El nombre de usuario es requerido';
      if (!formData.full_name.trim()) errors.full_name = 'El nombre completo es requerido';
      if (!formData.email.trim()) errors.email = 'El email es requerido';
      if (!user && !formData.password.trim()) errors.password = 'La contraseña es requerida';
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'El email no es válido';
      }
    }
    
    if (step === 2) {
      if (!formData.specialization) errors.specialization = 'La especialización es requerida';
      if (formData.sub_specializations.length === 0) {
        errors.sub_specializations = 'Selecciona al menos una sub-especialización';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error de validación cuando el usuario empiece a escribir
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSpecializationChange = (specialization) => {
    setFormData(prev => ({
      ...prev,
      specialization,
      sub_specializations: [] // Reset sub-especializations cuando cambia la especialización
    }));
  };

  const handleSubSpecializationToggle = (subSpec) => {
    setFormData(prev => ({
      ...prev,
      sub_specializations: prev.sub_specializations.includes(subSpec)
        ? prev.sub_specializations.filter(s => s !== subSpec)
        : [...prev.sub_specializations, subSpec]
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setLoading(true);
    setError('');

    try {
      const userData = {
        ...formData,
        hourly_rate: formData.hourly_rate ? parseInt(formData.hourly_rate) : null,
        weekly_capacity: parseInt(formData.weekly_capacity),
        is_active: true // Siempre activo por defecto
      };

      if (user) {
        delete userData.password; // No enviar password en updates si está vacío
      }

      await onSave(userData);
    } catch (error) {
      setError(error.message || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step) => {
    if (step < currentStep) return '✅';
    if (step === currentStep) return '🔄';
    return '⭕';
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-2xl font-bold text-gray-900">Información Personal</h3>
        <p className="text-gray-600">Datos básicos del usuario</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre de Usuario *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              validationErrors.username 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-100`}
            placeholder="usuario123"
          />
          {validationErrors.username && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre Completo *
          </label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              validationErrors.full_name 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-100`}
            placeholder="Juan Pérez"
          />
          {validationErrors.full_name && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.full_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              validationErrors.email 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-100`}
            placeholder="juan@empresa.com"
          />
          {validationErrors.email && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
              validationErrors.password 
                ? 'border-red-300 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-100`}
            placeholder="••••••••"
          />
          {validationErrors.password && (
            <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Rol del Usuario
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ROLES.map((role) => (
            <label
              key={role.value}
              className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                formData.role === role.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role.value}
                checked={formData.role === role.value}
                onChange={handleChange}
                className="sr-only"
              />
              <div className="text-2xl mb-2">{role.icon}</div>
              <div className="text-sm font-medium text-center">{role.label}</div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold text-gray-900">Especialización</h3>
        <p className="text-gray-600">Define las habilidades y área de expertise</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Especialización Principal *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(SPECIALIZATIONS).map(([key, spec]) => (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                formData.specialization === key
                  ? `border-${spec.color}-500 bg-${spec.color}-50`
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleSpecializationChange(key)}
            >
              <div className="text-center">
                <div className="text-4xl mb-3">{spec.icon}</div>
                <div className="font-semibold text-gray-900">{spec.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
        {validationErrors.specialization && (
          <p className="text-red-500 text-sm mt-2">{validationErrors.specialization}</p>
        )}
      </div>

      <AnimatePresence>
        {formData.specialization && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-gray-700">
              Sub-especializaciones *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(SPECIALIZATIONS[formData.specialization].subSpecializations).map(([key, label]) => (
                <label
                  key={key}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.sub_specializations.includes(key)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.sub_specializations.includes(key)}
                    onChange={() => handleSubSpecializationToggle(key)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                    formData.sub_specializations.includes(key)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {formData.sub_specializations.includes(key) && (
                      <span className="text-white text-xs">✓</span>
                    )}
                  </div>
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
            {validationErrors.sub_specializations && (
              <p className="text-red-500 text-sm mt-2">{validationErrors.sub_specializations}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {user ? 'Editar Usuario' : 'Nuevo Usuario'}
              </h2>
              <p className="text-blue-100 mt-1">
                {user ? 'Modifica la información del usuario' : 'Crea un nuevo miembro del equipo'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <span className="material-icons-outlined text-2xl">close</span>
            </button>
          </div>

          {/* Progress Steps - Solo 2 pasos */}
          <div className="flex items-center justify-center mt-6 space-x-8">
            {[1, 2].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  step <= currentStep 
                    ? 'bg-white text-blue-600' 
                    : 'bg-blue-500 text-white'
                }`}>
                  {getStepIcon(step)}
                </div>
                {step < 2 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-white' : 'bg-blue-500'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <span className="material-icons-outlined">error_outline</span>
                {error}
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 flex justify-between">
          <button
            onClick={currentStep === 1 ? onClose : handlePrevious}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </button>

          <div className="flex gap-3">
            {currentStep < 2 ? (
              <button
                onClick={handleNext}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Siguiente
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <span className="material-icons-outlined animate-spin">refresh</span>}
                {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear Usuario')}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>,
    document.getElementById('root')
  );
} 