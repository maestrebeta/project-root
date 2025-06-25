import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUser, FiMail, FiPhone, FiMapPin, FiGlobe, FiHash, 
  FiCheck, FiArrowRight, FiArrowLeft, FiSave, FiEdit2, FiLoader
} from 'react-icons/fi';
import { getCurrentUser } from '../../utils/authUtils';

export default function ClientModal({ 
  isOpen, 
  onClose, 
  client, 
  countries, 
  onSave,
  isLoading = false
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    is_active: true,
    country_code: '',
    address: '',
    contact_email: '',
    contact_phone: '',
    tax_id: ''
  });
  const [errors, setErrors] = useState({});

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      
      if (client) {
        // Modo edición
        setFormData({
          name: client.name || '',
          code: client.code || '',
          is_active: client.is_active !== undefined ? client.is_active : true,
          country_code: client.country_code || '',
          address: client.address || '',
          contact_email: client.contact_email || '',
          contact_phone: client.contact_phone || '',
          tax_id: client.tax_id || ''
        });
      } else {
        // Modo creación
        setFormData({
          name: '',
          code: '',
          is_active: true,
          country_code: '',
          address: '',
          contact_email: '',
          contact_phone: '',
          tax_id: ''
        });
      }
    }
  }, [isOpen, client]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };  const validateForm = () => {
    const newErrors = {};
    
    // Validación del paso 1
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del cliente es obligatorio';
    }
    
    // Validar email solo si se ha ingresado algo
    if (formData.contact_email) {
      const emailTrimmed = formData.contact_email.trim();
      if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
        newErrors.contact_email = 'Formato de email inválido';
      }
    }
    
    // Validar teléfono solo si se ha ingresado algo
    if (formData.contact_phone) {
      const phoneTrimmed = formData.contact_phone.trim();
      if (phoneTrimmed && phoneTrimmed.length < 8) {
        newErrors.contact_phone = 'El teléfono debe tener al menos 8 caracteres';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step) => {
    const newErrors = { ...errors }; // Mantener errores existentes de otros pasos
    
    if (step === 1) {
      // Limpiar errores del paso 1
      delete newErrors.name;
      delete newErrors.contact_email;
      
      if (!formData.name.trim()) {
        newErrors.name = 'El nombre del cliente es obligatorio';
      }
        if (formData.contact_email) {
        const emailTrimmed = formData.contact_email.trim();
        if (emailTrimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
          newErrors.contact_email = 'Formato de email inválido';
        }
      }
    }
    
    if (step === 2) {
      // Limpiar errores del paso 2
      delete newErrors.contact_phone;
      
      if (formData.contact_phone && formData.contact_phone.length < 8) {
        newErrors.contact_phone = 'El teléfono debe tener al menos 8 caracteres';
      }
    }
    
    setErrors(newErrors);
    
    // Solo validar errores del paso actual
    const stepErrors = Object.entries(newErrors).filter(([key]) => {
      if (step === 1) return ['name', 'contact_email'].includes(key);
      if (step === 2) return ['contact_phone', 'address', 'tax_id'].includes(key);
      return false;
    });
    
    return stepErrors.length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };  const handleSubmit = async () => {
    if (!validateForm() || isLoading) {
      return;
    }

    try {
      // Obtener usuario actual de forma segura
      const currentUser = getCurrentUser();
      if (!currentUser) {
        throw new Error('No hay sesión activa');
      }
      
      if (!currentUser.organization_id) {
        throw new Error('El usuario no tiene una organización asignada');
      }
      
      // Limpiar datos antes de enviar
      const cleanedData = {
        ...formData,
        organization_id: currentUser.organization_id,
        // Limpiar email vacío
        contact_email: formData.contact_email?.trim() || null,
        // Limpiar otros campos opcionales vacíos
        contact_phone: formData.contact_phone?.trim() || null,
        address: formData.address?.trim() || null,
        tax_id: formData.tax_id?.trim() || null,
        code: formData.code?.trim() || null,
        country_code: formData.country_code || null
      };
      
      await onSave(cleanedData);
      // El modal se cerrará desde el componente padre después de una operación exitosa
    } catch (error) {
      console.error('Error saving client:', error);
      // Aquí podrías agregar una notificación de error al usuario
    }
  };

  if (!isOpen) return null;

  const steps = [
    {
      id: 1,
      title: 'Información Básica',
      description: 'Datos principales del cliente'
    },
    {
      id: 2,
      title: 'Detalles de Contacto',
      description: 'Información adicional y ubicación'
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  {client ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {steps[currentStep - 1]?.description}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Indicador de pasos */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    currentStep >= step.id
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <FiCheck className="w-4 h-4" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.id ? 'bg-blue-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>          {/* Contenido del formulario */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Paso 1: Información Básica */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiUser className="w-4 h-4" />
                        Nombre del Cliente *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="Ingrese el nombre del cliente"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiHash className="w-4 h-4" />
                        Código del Cliente
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => handleChange('code', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Código único (opcional)"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiMail className="w-4 h-4" />
                        Email de Contacto
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => handleChange('contact_email', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.contact_email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="email@ejemplo.com"
                      />
                      {errors.contact_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                      )}
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiPhone className="w-4 h-4" />
                        Teléfono de Contacto
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => handleChange('contact_phone', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.contact_phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                        }`}
                        placeholder="+34 123 456 789"
                      />
                      {errors.contact_phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                        <FiCheck className="w-4 h-4" />
                        Estado del Cliente
                      </label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="is_active"
                            checked={formData.is_active === true}
                            onChange={() => handleChange('is_active', true)}
                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                          <span className="text-sm text-gray-700">Activo</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="is_active"
                            checked={formData.is_active === false}
                            onChange={() => handleChange('is_active', false)}
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">Inactivo</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Paso 2: Detalles de Contacto */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiGlobe className="w-4 h-4" />
                        País
                      </label>
                      <select
                        value={formData.country_code}
                        onChange={(e) => handleChange('country_code', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      >
                        <option value="">Seleccionar país</option>
                        {countries.map(country => (
                          <option key={country.country_code} value={country.country_code}>
                            {country.country_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiHash className="w-4 h-4" />
                        ID Fiscal
                      </label>
                      <input
                        type="text"
                        value={formData.tax_id}
                        onChange={(e) => handleChange('tax_id', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="Número de identificación fiscal"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FiMapPin className="w-4 h-4" />
                        Dirección
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 resize-none"
                        placeholder="Dirección completa del cliente"
                      />
                    </div>
                  </div>
                </motion.div>
              )}            </div>

            {/* Footer con botones */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Anterior
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  {currentStep < steps.length ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Siguiente
                      <FiArrowRight className="w-4 h-4" />
                    </button>                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 shadow-lg ${
                        isLoading 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                      } text-white`}
                    >
                      {isLoading ? (
                        <FiLoader className="w-4 h-4 animate-spin" />
                      ) : (
                        client ? <FiEdit2 className="w-4 h-4" /> : <FiSave className="w-4 h-4" />
                      )}
                      {isLoading 
                        ? 'Guardando...' 
                        : client ? 'Actualizar Cliente' : 'Crear Cliente'
                      }
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
