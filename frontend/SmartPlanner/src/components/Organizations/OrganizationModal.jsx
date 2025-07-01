import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiSave, FiGlobe, FiUsers, FiMail, FiPhone, FiMapPin, FiCalendar, FiStar, FiCheck, FiAlertCircle, FiShield, FiTrendingUp, FiAward, FiUser, FiUserCheck, FiUserX, FiCopy, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAppTheme } from '../../context/ThemeContext';

export default function OrganizationModal({ 
  isOpen, 
  onClose, 
  organization, 
  countries, 
  onSave 
}) {
  const theme = useAppTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdUsers, setCreatedUsers] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
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
    is_active: true,
    subscription_duration_months: 1,
    subscription_start_date: new Date().toISOString().split('T')[0],
    subscription_end_date: null,
    trial_start_date: null,
    trial_end_date: null,
    subscription_status: 'trial'
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
    if (isOpen) {
      setError('');
      setLoading(false);
      setCurrentStep(1);
      setSuccess(false);
      setCreatedUsers(null);
      setShowPasswords({});
      
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
          is_active: organization.is_active !== undefined ? organization.is_active : true,
          subscription_duration_months: organization.subscription_duration_months || 1,
          subscription_start_date: organization.subscription_start_date || new Date().toISOString().split('T')[0],
          subscription_end_date: organization.subscription_end_date || null,
          trial_start_date: organization.trial_start_date || null,
          trial_end_date: organization.trial_end_date || null,
          subscription_status: organization.subscription_status || 'trial'
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
          is_active: true,
          subscription_duration_months: 1,
          subscription_start_date: new Date().toISOString().split('T')[0],
          subscription_end_date: null,
          trial_start_date: null,
          trial_end_date: null,
          subscription_status: 'trial'
        });
      }
    }
  }, [organization, isOpen]);

  // Manejar cambios en el formulario
  const handleChange = (field, value) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      
      // Actualizar automáticamente el máximo de usuarios según el plan
      if (field === 'subscription_plan') {
        const planLimits = {
          'free': 5,
          'premium': 25,
          'corporate': 100
        };
        newForm.max_users = planLimits[value] || 5;
        
        // Si cambia a plan gratuito, establecer duración por defecto
        if (value === 'free') {
          newForm.subscription_duration_months = 1; // No se usa para free, pero mantener consistencia
        }
      }
      
      // Recalcular fecha de fin cuando cambien plan, duración o fecha de inicio
      if (field === 'subscription_plan' || field === 'subscription_duration_months' || field === 'subscription_start_date') {
        const endDate = calculateEndDate(
          newForm.subscription_start_date,
          newForm.subscription_duration_months,
          newForm.subscription_plan
        );
        newForm.subscription_end_date = endDate;
        
        // Para plan gratuito, también calcular fechas de prueba
        if (newForm.subscription_plan === 'free') {
          if (newForm.subscription_start_date) {
            const startDate = new Date(newForm.subscription_start_date);
            const trialEnd = new Date(startDate);
            trialEnd.setDate(startDate.getDate() + 14);
            
            newForm.trial_start_date = newForm.subscription_start_date;
            newForm.trial_end_date = trialEnd.toISOString().split('T')[0];
            newForm.subscription_status = 'trial';
          }
        } else {
          // Para planes pagos, limpiar fechas de prueba
          newForm.trial_start_date = null;
          newForm.trial_end_date = null;
          newForm.subscription_status = 'active';
        }
      }
      
      return newForm;
    });
  };

  // Validar formulario por paso
  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!form.name.trim()) {
        newErrors.name = 'El nombre de la organización es obligatorio';
      }
      if (form.max_users < 1) {
        newErrors.max_users = 'El número máximo de usuarios debe ser al menos 1';
      }
    }
    
    if (step === 2) {
      if (form.primary_contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.primary_contact_email)) {
        newErrors.primary_contact_email = 'El email de contacto no es válido';
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

  // Manejar envío del formulario
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
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
        is_active: form.is_active,
        subscription_duration_months: parseInt(form.subscription_duration_months, 10),
        subscription_start_date: form.subscription_start_date,
        subscription_end_date: form.subscription_end_date,
        trial_start_date: form.trial_start_date,
        trial_end_date: form.trial_end_date,
        subscription_status: form.subscription_status
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

      const result = await response.json();
      
      // Si es una nueva organización, mostrar información de usuarios creados
      if (!organization && result.default_users) {
        setCreatedUsers(result.default_users);
        setSuccess(true);
        setCurrentStep(3); // Ir al paso de usuarios creados
      } else {
        await onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Copiar credenciales al portapapeles
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Mostrar notificación temporal
      const originalText = event.target.textContent;
      event.target.textContent = '¡Copiado!';
      setTimeout(() => {
        event.target.textContent = originalText;
      }, 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
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
          features: ['Hasta 5 usuarios', 'Funcionalidades básicas', 'Soporte por email'],
          icon: '🆓',
          bgColor: 'from-gray-100 to-gray-200',
          textColor: 'text-gray-700'
        };
      case 'premium':
        return {
          label: 'Premium',
          description: 'Funcionalidades avanzadas',
          color: 'purple',
          maxUsers: 25,
          features: ['Hasta 25 usuarios', 'Funcionalidades avanzadas', 'Soporte prioritario', 'Reportes detallados'],
          icon: '⭐',
          bgColor: 'from-purple-100 to-purple-200',
          textColor: 'text-purple-700'
        };
      case 'corporate':
        return {
          label: 'Corporate',
          description: 'Solución empresarial completa',
          color: 'indigo',
          maxUsers: 100,
          features: ['Hasta 100 usuarios', 'Todas las funcionalidades', 'Soporte 24/7', 'API personalizada', 'Integraciones avanzadas'],
          icon: '🏢',
          bgColor: 'from-indigo-100 to-indigo-200',
          textColor: 'text-indigo-700'
        };
      default:
        return {
          label: plan,
          description: 'Plan personalizado',
          color: 'gray',
          maxUsers: 5,
          features: ['Funcionalidades básicas'],
          icon: '❓',
          bgColor: 'from-gray-100 to-gray-200',
          textColor: 'text-gray-700'
        };
    }
  };

  const planInfo = getPlanInfo(form.subscription_plan);

  // Función para calcular la fecha de fin basada en la duración
  const calculateEndDate = (startDate, durationMonths, plan) => {
    if (!startDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(start);
    
    if (plan === 'free') {
      // Para prueba gratuita: 14 días
      end.setDate(start.getDate() + 14);
    } else {
      // Para planes pagos: sumar meses
      end.setMonth(start.getMonth() + durationMonths);
    }
    
    return end.toISOString().split('T')[0];
  };

  // Función para formatear fecha en formato legible
  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener la duración en texto
  const getDurationText = (months) => {
    switch (months) {
      case 1: return '1 mes';
      case 3: return '3 meses';
      case 6: return '6 meses';
      case 12: return '1 año';
      default: return `${months} meses`;
    }
  };

  // Renderizar paso 1: Información básica
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiGlobe className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Información Básica de la Organización</h3>
        <p className="text-gray-600">Define los detalles fundamentales de tu organización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiGlobe className="w-4 h-4" />
            Nombre de la Organización *
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Ingresa el nombre de la organización"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiMapPin className="w-4 h-4" />
            País
          </label>
          <select
            value={form.country_code}
            onChange={(e) => handleChange('country_code', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="">Seleccionar país</option>
            {countries.map((country) => (
              <option key={country.country_code} value={country.country_code}>
                {country.country_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiCalendar className="w-4 h-4" />
            Zona Horaria
          </label>
          <select
            value={form.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="UTC">UTC</option>
            <option value="Europe/Madrid">Europe/Madrid</option>
            <option value="America/Mexico_City">America/Mexico_City</option>
            <option value="America/Bogota">America/Bogota</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiStar className="w-4 h-4" />
            Plan de Suscripción
          </label>
          <select
            value={form.subscription_plan}
            onChange={(e) => handleChange('subscription_plan', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option value="free">Prueba gratuita</option>
            <option value="premium">Premium</option>
            <option value="corporate">Corporate</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Máximo de Usuarios
          </label>
          <input
            type="number"
            value={form.max_users}
            onChange={(e) => handleChange('max_users', parseInt(e.target.value) || 1)}
            min="1"
            max="1000"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" />
            Se ajusta automáticamente según el plan seleccionado
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <FiGlobe className="w-4 h-4" />
          Descripción
        </label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          placeholder="Describe la organización y sus actividades principales"
        />
      </div>

      {/* Información del Plan Seleccionado */}
      <div className={`bg-gradient-to-r ${planInfo.bgColor} rounded-xl p-6 border border-gray-200`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">{planInfo.icon}</div>
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

      {/* Configuración del Plan */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiCalendar className="w-5 h-5 text-blue-600" />
          Configuración del Plan
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fecha de inicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Inicio del Plan *
            </label>
            <input
              type="date"
              value={form.subscription_start_date}
              onChange={(e) => handleChange('subscription_start_date', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-xs text-gray-500 mt-2">
              Fecha desde la cual comenzará a regir el plan
            </p>
          </div>

          {/* Duración del plan (solo para planes pagos) */}
          {form.subscription_plan !== 'free' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duración del Plan
              </label>
              <select
                value={form.subscription_duration_months}
                onChange={(e) => handleChange('subscription_duration_months', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value={1}>1 mes</option>
                <option value={3}>3 meses</option>
                <option value={6}>6 meses</option>
                <option value={12}>1 año</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Duración del plan de suscripción
              </p>
            </div>
          )}
        </div>

        {/* Información calculada */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h5 className="font-medium text-gray-800 mb-3">Información del Plan</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium text-gray-800 ml-2">{planInfo.label}</span>
            </div>
            <div>
              <span className="text-gray-600">Estado:</span>
              <span className={`font-medium ml-2 ${
                form.subscription_status === 'trial' ? 'text-orange-600' : 
                form.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {form.subscription_status === 'trial' ? 'Prueba gratuita' :
                 form.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha de inicio:</span>
              <span className="font-medium text-gray-800 ml-2">
                {formatDate(form.subscription_start_date)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha de finalización:</span>
              <span className="font-medium text-gray-800 ml-2">
                {formatDate(form.subscription_end_date)}
              </span>
            </div>
            {form.subscription_plan === 'free' && (
              <>
                <div>
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-medium text-gray-800 ml-2">14 días (prueba gratuita)</span>
                </div>
                <div>
                  <span className="text-gray-600">Fin de prueba:</span>
                  <span className="font-medium text-gray-800 ml-2">
                    {formatDate(form.trial_end_date)}
                  </span>
                </div>
              </>
            )}
            {form.subscription_plan !== 'free' && (
              <>
                <div>
                  <span className="text-gray-600">Duración:</span>
                  <span className="font-medium text-gray-800 ml-2">
                    {getDurationText(form.subscription_duration_months)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Usuarios máx:</span>
                  <span className="font-medium text-gray-800 ml-2">{form.max_users}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Advertencia para plan gratuito */}
        {form.subscription_plan === 'free' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h5 className="font-semibold text-amber-800 mb-2">Plan de Prueba Gratuita</h5>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Duración fija de 14 días desde la fecha de inicio</li>
                  <li>• Al finalizar la prueba, el plan cambiará automáticamente a Premium</li>
                  <li>• El plan quedará desactivado hasta que se confirme la activación</li>
                  <li>• Se enviarán notificaciones 3 días antes del fin de la prueba</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Renderizar paso 2: Información de contacto y estado
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiMail className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Información de Contacto y Estado</h3>
        <p className="text-gray-600">Define los datos de contacto y el estado de la organización</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiUsers className="w-4 h-4" />
            Nombre del Contacto Principal
          </label>
          <input
            type="text"
            value={form.primary_contact_name}
            onChange={(e) => handleChange('primary_contact_name', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="Nombre completo del contacto"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiMail className="w-4 h-4" />
            Email de Contacto
          </label>
          <input
            type="email"
            value={form.primary_contact_email}
            onChange={(e) => handleChange('primary_contact_email', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="contacto@organizacion.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiPhone className="w-4 h-4" />
            Teléfono de Contacto
          </label>
          <input
            type="tel"
            value={form.primary_contact_phone}
            onChange={(e) => handleChange('primary_contact_phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            placeholder="+34 123 456 789"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <FiShield className="w-4 h-4" />
            Estado de la Organización
          </label>
          <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-xl bg-gray-50">
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
          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <FiAlertCircle className="w-3 h-3" />
            Las organizaciones inactivas no pueden acceder al sistema
          </p>
        </div>
      </div>

      {/* Resumen de la organización */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiCheck className="w-5 h-5 text-blue-600" />
          Resumen de la Organización
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Nombre:</span>
            <span className="font-medium text-gray-800 ml-2">{form.name || 'No especificado'}</span>
          </div>
          <div>
            <span className="text-gray-600">Plan:</span>
            <span className="font-medium text-gray-800 ml-2">{planInfo.label}</span>
          </div>
          <div>
            <span className="text-gray-600">Usuarios máx:</span>
            <span className="font-medium text-gray-800 ml-2">{form.max_users}</span>
          </div>
          <div>
            <span className="text-gray-600">Estado:</span>
            <span className="font-medium text-gray-800 ml-2">
              {form.is_active ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">País:</span>
            <span className="font-medium text-gray-800 ml-2">
              {form.country_code || 'No especificado'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Zona horaria:</span>
            <span className="font-medium text-gray-800 ml-2">{form.timezone}</span>
          </div>
        </div>
        
        {/* Información adicional del plan */}
        <div className="mt-4 pt-4 border-t border-blue-200">
          <h5 className="font-medium text-gray-800 mb-3">Detalles del Plan de Suscripción</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Fecha de inicio:</span>
              <span className="font-medium text-gray-800 ml-2">
                {formatDate(form.subscription_start_date)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Fecha de finalización:</span>
              <span className="font-medium text-gray-800 ml-2">
                {formatDate(form.subscription_end_date)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Estado del plan:</span>
              <span className={`font-medium ml-2 ${
                form.subscription_status === 'trial' ? 'text-orange-600' : 
                form.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {form.subscription_status === 'trial' ? 'Prueba gratuita' :
                 form.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Duración:</span>
              <span className="font-medium text-gray-800 ml-2">
                {form.subscription_plan === 'free' ? '14 días' : getDurationText(form.subscription_duration_months)}
              </span>
            </div>
            {form.subscription_plan === 'free' && (
              <div className="md:col-span-2">
                <span className="text-gray-600">Fin de prueba:</span>
                <span className="font-medium text-gray-800 ml-2">
                  {formatDate(form.trial_end_date)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar paso 3: Usuarios creados (solo para nuevas organizaciones)
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiUserCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">¡Organización Creada Exitosamente!</h3>
        <p className="text-gray-600">Se han creado automáticamente 3 usuarios para tu organización</p>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FiCheck className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="font-semibold text-green-800">Organización: {form.name}</h4>
            <p className="text-sm text-green-600">Plan: {planInfo.label}</p>
          </div>
        </div>
        
        {/* Información del plan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Fecha de inicio:</span>
            <span className="font-medium text-gray-800 ml-2">
              {formatDate(form.subscription_start_date)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Fecha de finalización:</span>
            <span className="font-medium text-gray-800 ml-2">
              {formatDate(form.subscription_end_date)}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Estado:</span>
            <span className={`font-medium ml-2 ${
              form.subscription_status === 'trial' ? 'text-orange-600' : 
              form.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
            }`}>
              {form.subscription_status === 'trial' ? 'Prueba gratuita' :
               form.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Usuarios máx:</span>
            <span className="font-medium text-gray-800 ml-2">{form.max_users}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FiUsers className="w-5 h-5" />
          Usuarios Creados
        </h4>
        
        {createdUsers && Object.entries(createdUsers).map(([role, userInfo]) => (
          <div key={role} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  role === 'ceo' ? 'bg-red-100 text-red-600' :
                  role === 'admin' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {role === 'ceo' ? <FiUser className="w-4 h-4" /> :
                   role === 'admin' ? <FiUserCheck className="w-4 h-4" /> :
                   <FiUserX className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="font-semibold text-gray-900 capitalize">
                    {role === 'ceo' ? 'Super Usuario' : role === 'admin' ? 'Administrador' : 'Desarrollador'}
                  </h5>
                  <p className="text-sm text-gray-600">{userInfo.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPasswords(prev => ({ ...prev, [role]: !prev[role] }))}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPasswords[role] ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(userInfo.password)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Contraseña:</span>
                <span className="font-mono text-sm">
                  {showPasswords[role] ? userInfo.password : '••••••••••'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h5 className="font-semibold text-amber-800 mb-2">Información Importante</h5>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Guarda estas credenciales en un lugar seguro</li>
              <li>• El Super Usuario siempre usa la contraseña "8164"</li>
              <li>• Los otros usuarios tienen contraseñas generadas aleatoriamente</li>
              <li>• Puedes cambiar las contraseñas desde el panel de administración</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar modal usando Portal
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {organization ? 'Editar Organización' : 'Nueva Organización'}
              </h2>
              <p className="text-blue-100 mt-1">
                {organization ? 'Modifica los datos de la organización' : 'Crea una nueva organización en el sistema'}
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
              {!organization && (
                <>
                  <div className={`w-16 h-1 mx-2 ${currentStep >= 3 ? 'bg-white' : 'bg-white/30'}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    currentStep >= 3 ? 'bg-white text-blue-600' : 'bg-white/30 text-white'
                  }`}>
                    3
                  </div>
                </>
              )}
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
            {currentStep === 3 && !organization && (
              <div key="step3" className="transition-all duration-300">
                {renderStep3()}
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
            {currentStep > 1 && currentStep < 3 && (
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
            ) : currentStep === 2 ? (
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
                    {organization ? 'Actualizar Organización' : 'Crear Organización'}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => {
                  onSave();
                  onClose();
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
} 