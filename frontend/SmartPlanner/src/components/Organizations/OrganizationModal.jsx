import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiGlobe, FiUsers, FiMail, FiPhone, FiMapPin, FiCalendar, FiStar, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';

export default function OrganizationModal({ 
  isOpen, 
  onClose, 
  organization, 
  countries, 
  onSave 
}) {
  const theme = useAppTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    country_code: '',
    timezone: 'UTC',
    subscription_plan: 'free',
    max_users: 5,
    primary_contact_email: '',
    primary_contact_name: '',
    primary_contact_phone: '',
    is_active: true
  });

  // Obtener token de la sesión
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

  // Cargar datos de la organización si se está editando
  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || '',
        description: organization.description || '',
        country_code: organization.country_code || '',
        timezone: organization.timezone || 'UTC',
        subscription_plan: organization.subscription_plan || 'free',
        max_users: organization.max_users || 5,
        primary_contact_email: organization.primary_contact_email || '',
        primary_contact_name: organization.primary_contact_name || '',
        primary_contact_phone: organization.primary_contact_phone || '',
        is_active: organization.is_active !== undefined ? organization.is_active : true
      });
    } else {
      setForm({
        name: '',
        description: '',
        country_code: '',
        timezone: 'UTC',
        subscription_plan: 'free',
        max_users: 5,
        primary_contact_email: '',
        primary_contact_name: '',
        primary_contact_phone: '',
        is_active: true
      });
    }
    setError('');
  }, [organization]);

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Validar formulario
  const validateForm = () => {
    if (!form.name.trim()) {
      setError('El nombre de la organización es obligatorio');
      return false;
    }
    if (form.max_users < 1) {
      setError('El número máximo de usuarios debe ser al menos 1');
      return false;
    }
    if (form.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primary_contact_email)) {
      setError('El email de contacto no es válido');
      return false;
    }
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = organization
        ? `http://localhost:8001/organizations/${organization.organization_id}`
        : 'http://localhost:8001/organizations/';
      const method = organization ? 'PUT' : 'POST';

      // Preparar el cuerpo de la petición
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        country_code: form.country_code || undefined,
        timezone: form.timezone,
        subscription_plan: form.subscription_plan,
        max_users: parseInt(form.max_users, 10),
        primary_contact_email: form.primary_contact_email.trim() || undefined,
        primary_contact_name: form.primary_contact_name.trim() || undefined,
        primary_contact_phone: form.primary_contact_phone.trim() || undefined,
        is_active: form.is_active
      };

      // Eliminar campos undefined
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) {
          delete body[key];
        }
      });

      const headers = getAuthHeaders();
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al procesar la solicitud');
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Obtener información del plan
  const getPlanInfo = (plan) => {
    switch (plan) {
      case 'free':
        return {
          label: 'Prueba gratuita',
          description: 'Acceso básico con limitaciones',
          color: 'gray',
          maxUsers: 5,
          features: ['Hasta 5 usuarios', 'Funcionalidades básicas', 'Soporte por email']
        };
      case 'premium':
        return {
          label: 'Premium',
          description: 'Funcionalidades avanzadas',
          color: 'purple',
          maxUsers: 25,
          features: ['Hasta 25 usuarios', 'Funcionalidades avanzadas', 'Soporte prioritario', 'Reportes detallados']
        };
      case 'corporate':
        return {
          label: 'Corporate',
          description: 'Solución empresarial completa',
          color: 'indigo',
          maxUsers: 100,
          features: ['Hasta 100 usuarios', 'Todas las funcionalidades', 'Soporte 24/7', 'API personalizada', 'Integraciones avanzadas']
        };
      default:
        return {
          label: plan,
          description: 'Plan personalizado',
          color: 'gray',
          maxUsers: 5,
          features: ['Funcionalidades básicas']
        };
    }
  };

  const planInfo = getPlanInfo(form.subscription_plan);

  // Renderizar modal usando Portal
  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiGlobe className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {organization ? 'Editar Organización' : 'Nueva Organización'}
                </h2>
                <p className="text-sm text-gray-600">
                  {organization ? 'Modifica los datos de la organización' : 'Crea una nueva organización en el sistema'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiX className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 flex-shrink-0"
            >
              <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700 text-sm">{error}</span>
            </motion.div>
          )}

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Información Básica */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <FiGlobe className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Organización *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Ingresa el nombre de la organización"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      País
                    </label>
                    <select
                      value={form.country_code}
                      onChange={(e) => handleChange('country_code', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Seleccionar país</option>
                      {countries.map((country) => (
                        <option key={country.country_code} value={country.country_code}>
                          {country.country_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Describe la organización y sus actividades principales"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración del Plan */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <FiStar className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Plan de Suscripción</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Plan
                    </label>
                    <select
                      value={form.subscription_plan}
                      onChange={(e) => handleChange('subscription_plan', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="free">Prueba gratuita</option>
                      <option value="premium">Premium</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Usuarios
                    </label>
                    <input
                      type="number"
                      value={form.max_users}
                      onChange={(e) => handleChange('max_users', parseInt(e.target.value) || 1)}
                      min="1"
                      max="1000"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {/* Información del Plan Seleccionado */}
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2 rounded-lg bg-${planInfo.color}-100`}>
                      <FiStar className={`w-5 h-5 text-${planInfo.color}-600`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{planInfo.label}</h4>
                      <p className="text-sm text-gray-600">{planInfo.description}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {planInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Información de Contacto */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <FiMail className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Contacto Principal
                    </label>
                    <input
                      type="text"
                      value={form.primary_contact_name}
                      onChange={(e) => handleChange('primary_contact_name', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Nombre completo del contacto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contacto
                    </label>
                    <input
                      type="email"
                      value={form.primary_contact_email}
                      onChange={(e) => handleChange('primary_contact_email', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="contacto@organizacion.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      value={form.primary_contact_phone}
                      onChange={(e) => handleChange('primary_contact_phone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="+34 123 456 789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria
                    </label>
                    <select
                      value={form.timezone}
                      onChange={(e) => handleChange('timezone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Europe/Madrid">Europe/Madrid</option>
                      <option value="America/Mexico_City">America/Mexico_City</option>
                      <option value="America/Bogota">America/Bogota</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Estado de la Organización */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200">
                  <FiUsers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Estado de la Organización</h3>
                </div>
                
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={form.is_active}
                    onChange={(e) => handleChange('is_active', e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Organización activa
                  </label>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  Las organizaciones inactivas no pueden acceder al sistema
                </p>
              </div>
            </form>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  {organization ? 'Actualizar' : 'Crear'} Organización
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
} 