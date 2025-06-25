import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiExternalLink, FiCopy, FiTrash2, FiEdit2, FiPlus, FiEye, 
  FiLink, FiX, FiCheckCircle, FiAlertCircle, FiSettings,
  FiUsers, FiMessageSquare, FiGlobe, FiShield, FiZap
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

export default function ExternalFormManager() {
  const { user, isAuthenticated } = useAuth();
  const [externalForm, setExternalForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    title: 'Portal de Soporte',
    description: 'Portal público para que nuestros clientes puedan crear tickets de soporte técnico de forma rápida y sencilla.',
    welcome_message: 'Bienvenido a nuestro portal de soporte. Por favor, completa el formulario con los detalles de tu consulta o problema y nos pondremos en contacto contigo lo antes posible.',
    contact_email: '',
    contact_phone: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cargar formulario externo de la organización
  useEffect(() => {
    if (isAuthenticated && user?.organization_id) {
      fetchExternalForm();
    }
  }, [isAuthenticated, user]);

  const fetchExternalForm = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/external-forms/organization', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const form = await response.json();
        setExternalForm(form);
      } else if (response.status === 404) {
        setExternalForm(null);
      } else {
        console.error('Error fetching external form:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching external form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/external-forms/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          organization_id: user.organization_id
        })
      });

      if (response.ok) {
        const newForm = await response.json();
        setExternalForm(newForm);
        setShowCreateModal(false);
        resetFormData();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Error al crear el formulario' });
      }
    } catch (error) {
      console.error('Error creating external form:', error);
      setErrors({ submit: 'Error al crear el formulario' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateForm = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/external-forms/${externalForm.form_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedForm = await response.json();
        setExternalForm(updatedForm);
        setShowEditModal(false);
        resetFormData();
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Error al actualizar el formulario' });
      }
    } catch (error) {
      console.error('Error updating external form:', error);
      setErrors({ submit: 'Error al actualizar el formulario' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteForm = async () => {
    setIsSubmitting(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/external-forms/${externalForm.form_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });

      if (response.ok) {
        setExternalForm(null);
        setShowDeleteModal(false);
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.detail || 'Error al eliminar el formulario' });
      }
    } catch (error) {
      console.error('Error deleting external form:', error);
      setErrors({ submit: 'Error al eliminar el formulario' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    }

    if (formData.contact_email && formData.contact_email.trim() && !/\S+@\S+\.\S+/.test(formData.contact_email)) {
      newErrors.contact_email = 'El email no es válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetFormData = () => {
    setFormData({
      title: 'Portal de Soporte',
      description: 'Portal público para que nuestros clientes puedan crear tickets de soporte técnico de forma rápida y sencilla.',
      welcome_message: 'Bienvenido a nuestro portal de soporte. Por favor, completa el formulario con los detalles de tu consulta o problema y nos pondremos en contacto contigo lo antes posible.',
      contact_email: '',
      contact_phone: ''
    });
    setErrors({});
  };

  const handleEditClick = () => {
    setFormData({
      title: externalForm.title,
      description: externalForm.description || '',
      welcome_message: externalForm.welcome_message || '',
      contact_email: externalForm.contact_email || '',
      contact_phone: externalForm.contact_phone || ''
    });
    setShowEditModal(true);
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const getFormUrl = (token) => {
    return `${window.location.origin}/external/form/${token}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-16 h-16 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiGlobe className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Cargando portal externo</h3>
          <p className="text-gray-600">Preparando gestión de formularios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
      <div className="w-full p-6">
        {/* Contenido principal */}
        <div className="w-full">
          {externalForm ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
            >
              {/* Header del formulario */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white bg-opacity-20 rounded-xl">
                      <FiGlobe className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{externalForm.title}</h2>
                      <p className="text-blue-100">
                        Portal activo para {user?.organization?.name || 'tu organización'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">
                      Activo
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del formulario */}
              <div className="p-6">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
                  <div className="xl:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiSettings className="w-5 h-5 text-blue-600" />
                      Configuración
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <p className="text-gray-900 font-medium">{externalForm.title}</p>
                      </div>
                      {externalForm.description && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Descripción</label>
                          <p className="text-gray-900">{externalForm.description}</p>
                        </div>
                      )}
                      {externalForm.welcome_message && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Mensaje de bienvenida</label>
                          <p className="text-gray-900">{externalForm.welcome_message}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FiUsers className="w-5 h-5 text-green-600" />
                      Información de contacto
                    </h3>
                    <div className="space-y-4">
                      {externalForm.contact_email && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email de contacto</label>
                          <p className="text-gray-900">{externalForm.contact_email}</p>
                        </div>
                      )}
                      {externalForm.contact_phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Teléfono de contacto</label>
                          <p className="text-gray-900">{externalForm.contact_phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Creado por</label>
                        <p className="text-gray-900">{externalForm.created_by_user?.full_name || 'Usuario'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* URL del formulario */}
                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FiLink className="w-5 h-5 text-purple-600" />
                    Enlace del Portal
                  </h3>
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <code className="text-sm text-gray-700 break-all">
                        {getFormUrl(externalForm.form_token)}
                      </code>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyToClipboard(getFormUrl(externalForm.form_token))}
                        className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
                      >
                        {copied ? (
                          <>
                            <FiCheckCircle className="w-4 h-4" />
                            Copiado
                          </>
                        ) : (
                          <>
                            <FiCopy className="w-4 h-4" />
                            Copiar
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => window.open(getFormUrl(externalForm.form_token), '_blank')}
                        className="flex items-center gap-2 px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200"
                      >
                        <FiExternalLink className="w-4 h-4" />
                        Abrir
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">
                    Comparte este enlace con tus clientes para que puedan crear tickets sin necesidad de credenciales.
                  </p>
                </div>

                {/* Acciones */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pt-6 border-t border-gray-200 gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handleEditClick}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200 font-medium"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Editar Portal
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors duration-200 font-medium"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Eliminar Portal
                    </button>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <FiSettings className="w-4 h-4" />
                    Creado el {new Date(externalForm.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 max-w-2xl mx-auto"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <FiGlobe className="w-16 h-16 text-blue-500" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">No hay portal externo configurado</h3>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Crea un portal de tickets externos para que tus clientes puedan generar tickets sin necesidad de credenciales.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl mx-auto"
                >
                  <FiPlus className="w-5 h-5" />
                  Crear Portal Externo
                </button>
                <p className="text-sm text-gray-500">
                  El portal permitirá a tus clientes crear tickets de soporte de forma independiente
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modal de creación */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FiPlus className="w-6 h-6 text-blue-600" />
                  Crear Portal Externo
                </h2>
                
                <form onSubmit={(e) => { e.preventDefault(); handleCreateForm(); }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título del portal *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Portal de Soporte"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Descripción del portal de soporte..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje de bienvenida
                    </label>
                    <textarea
                      value={formData.welcome_message}
                      onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Mensaje de bienvenida para los usuarios..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de contacto (opcional)
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.contact_email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="soporte@empresa.com (opcional)"
                      />
                      {errors.contact_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono de contacto (opcional)
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="+34 123 456 789 (opcional)"
                      />
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Creando...' : 'Crear Portal'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de edición */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <FiEdit2 className="w-6 h-6 text-blue-600" />
                  Editar Portal Externo
                </h2>
                
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateForm(); }} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título del portal *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        errors.title ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Portal de Soporte"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Descripción del portal de soporte..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mensaje de bienvenida
                    </label>
                    <textarea
                      value={formData.welcome_message}
                      onChange={(e) => setFormData(prev => ({ ...prev, welcome_message: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="Mensaje de bienvenida para los usuarios..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email de contacto (opcional)
                      </label>
                      <input
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                          errors.contact_email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="soporte@empresa.com (opcional)"
                      />
                      {errors.contact_email && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono de contacto (opcional)
                      </label>
                      <input
                        type="tel"
                        value={formData.contact_phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                        placeholder="+34 123 456 789 (opcional)"
                      />
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.submit}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Actualizando...' : 'Actualizar Portal'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de eliminación */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <FiAlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Eliminar Portal</h2>
                </div>
                
                <p className="text-gray-600 mb-6">
                  ¿Estás seguro de que quieres eliminar el portal externo? Esta acción no se puede deshacer y los clientes ya no podrán acceder al formulario.
                </p>

                {errors.submit && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteForm}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Eliminando...' : 'Eliminar Portal'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 