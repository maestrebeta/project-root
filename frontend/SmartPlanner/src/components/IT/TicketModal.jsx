import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  FiX, FiUser, FiCalendar, FiClock, FiTag, FiMessageSquare, 
  FiTarget, FiStar, FiPlus, FiTrash2, FiCheck, FiArrowRight,
  FiAlertCircle, FiInfo, FiZap, FiSave, FiMapPin, FiMail, FiPhone,
  FiUpload, FiFile, FiImage, FiPaperclip
} from 'react-icons/fi';

export default function TicketModal({ 
  isOpen, 
  onClose, 
  ticket, 
  users, 
  clients,
  projects,
  onSave, 
  ticketStatuses, 
  ticketPriorities 
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    status: 'nuevo',
    client_id: '',
    project_id: '',
    assigned_to_user_id: '',
    category_id: '',
    contact_email: '',
    contact_name: '',
    resolution_description: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Cargar categorías al abrir el modal
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/tickets/categories/?organization_id=1', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const categoriesData = await response.json();
        setCategories(categoriesData);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Función para prellenar campos según la categoría seleccionada
  const handleCategoryChange = (categoryId) => {
      setFormData(prev => ({
        ...prev,
        category_id: categoryId
      }));
    
    // Solo aplicar valores por defecto si es un ticket nuevo (no existente)
    if (categoryId && !ticket) {
      const category = categories.find(c => c.category_id === parseInt(categoryId));
      if (category) {
        setFormData(prev => ({
          ...prev,
          title: category.default_title_template || prev.title,
          description: category.default_description_template || prev.description,
          priority: category.default_priority || prev.priority
        }));
      }
    }
  };

  // Inicializar datos del formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (ticket) {
        // Si el ticket no tiene client_id pero tiene project_id, obtener el client_id del proyecto
        let clientId = ticket.client_id;
        if (!clientId && ticket.project_id) {
          const project = projects.find(p => p.project_id === ticket.project_id);
          if (project) {
            clientId = project.client_id;
          }
        }
        
        setFormData({
          title: ticket.title || '',
          description: ticket.description || '',
          priority: ticket.priority || 'media',
          status: ticket.status || 'nuevo',
          client_id: ticket.client_id?.toString() || '',
          project_id: ticket.project_id?.toString() || '',
          assigned_to_user_id: ticket.assigned_to_user_id?.toString() || '',
          category_id: ticket.category_id?.toString() || '',
          contact_email: ticket.contact_email || '',
          contact_name: ticket.contact_name || '',
          resolution_description: ticket.resolution_description || ''
        });
        
        // Para tickets existentes, NO llamar handleCategoryChange para evitar sobrescribir datos
      } else {
        setFormData({
          title: '',
          description: '',
          priority: 'media',
          status: 'nuevo',
          client_id: '',
          project_id: '',
          assigned_to_user_id: '',
          category_id: '',
          contact_email: '',
          contact_name: '',
          resolution_description: ''
        });
      }
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen, ticket, clients, projects, categories]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (file.size > maxSize) {
        alert(`El archivo ${file.name} es demasiado grande. Máximo 10MB.`);
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        alert(`El archivo ${file.name} no es un tipo válido.`);
        return false;
      }
      
      return true;
    });

    const newAttachments = validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id);
      if (attachment && attachment.preview) {
        URL.revokeObjectURL(attachment.preview);
      }
      return prev.filter(a => a.id !== id);
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es obligatoria';
    }

    if (!formData.client_id) {
      newErrors.client_id = 'Debe seleccionar un cliente';
    }

    if (!formData.project_id) {
      newErrors.project_id = 'Debe seleccionar un proyecto';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep = (step) => {
    const stepErrors = {};

    if (step === 1) {
      if (!formData.title.trim()) {
        stepErrors.title = 'El título es obligatorio';
      }
      if (!formData.description.trim()) {
        stepErrors.description = 'La descripción es obligatoria';
      }
      if (!formData.client_id) {
        stepErrors.client_id = 'Debe seleccionar un cliente';
      }
      if (!formData.project_id) {
        stepErrors.project_id = 'Debe seleccionar un proyecto';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ticketData = {
        ...formData,
        assigned_to_user_id: formData.assigned_to_user_id ? parseInt(formData.assigned_to_user_id) : null,
        client_id: parseInt(formData.client_id),
        project_id: parseInt(formData.project_id),
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        estimated_hours: formData.estimated_hours,
        attachments: attachments.map(attachment => ({
          id: attachment.id,
          original_name: attachment.file.name,
          size: attachment.file.size,
          content_type: attachment.file.type,
          uploaded_at: new Date().toISOString()
        }))
      };

      await onSave(ticketData);
      onClose();
    } catch (error) {
      console.error('Error al guardar el ticket:', error);
      setErrors({ submit: 'Error al guardar el ticket. Inténtalo de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar proyectos por cliente seleccionado
  const filteredProjects = formData.client_id 
    ? projects.filter(p => p.client_id === parseInt(formData.client_id))
    : projects;

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiMessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {ticket ? 'Editar Ticket' : 'Nuevo Ticket'}
                  </h2>
                  <p className="text-sm text-blue-100">
                    {ticket ? `Editando ${ticket.ticket_number}` : 'Crear un nuevo ticket de soporte'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Indicador de pasos */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-center gap-4">
              <div className={`flex items-center gap-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <span className="text-sm font-medium">Información Básica</span>
              </div>
              <FiArrowRight className="w-4 h-4 text-gray-400" />
              <div className={`flex items-center gap-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <span className="text-sm font-medium">Detalles Adicionales</span>
              </div>
            </div>
          </div>

          {/* Contenido del formulario - SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col h-full">
              <div className="p-6 flex-1">
                {currentStep === 1 && (
                  <div className="space-y-6">
                    {/* Información básica */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiMessageSquare className="w-5 h-5 text-blue-600" />
                        Información Básica
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Categoría
                          </label>
                          <select
                            value={formData.category_id}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Seleccionar categoría</option>
                            {categories.map(category => (
                              <option key={category.category_id} value={category.category_id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Título *
                          </label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              errors.title ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Título del ticket"
                          />
                          {errors.title && (
                            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción *
                          </label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={4}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              errors.description ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Descripción detallada del problema o solicitud"
                          />
                          {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Estado
                            </label>
                            <select
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            >
                              {ticketStatuses.map(status => (
                                <option key={status.id} value={status.id}>
                                  {status.icon} {status.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Prioridad
                            </label>
                            <select
                              value={formData.priority}
                              onChange={(e) => handleChange('priority', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            >
                              {ticketPriorities.map(priority => (
                                <option key={priority.id} value={priority.id}>
                                  {priority.icon} {priority.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asignaciones */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiUser className="w-5 h-5 text-green-600" />
                        Asignaciones
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cliente *
                          </label>
                          <select
                            value={formData.client_id}
                            onChange={(e) => {
                              handleChange('client_id', e.target.value);
                              handleChange('project_id', ''); // Reset proyecto cuando cambia cliente
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              errors.client_id ? 'border-red-300' : 'border-gray-300'
                            }`}
                          >
                            <option value="">Seleccionar cliente</option>
                            {clients.map(client => (
                              <option key={client.client_id} value={String(client.client_id)}>
                                {client.name}
                              </option>
                            ))}
                          </select>
                          {errors.client_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.client_id}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Proyecto *
                          </label>
                          <select
                            value={formData.project_id}
                            onChange={(e) => {
                              handleChange('project_id', e.target.value);
                            }}
                            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                              errors.project_id ? 'border-red-300' : 'border-gray-300'
                            }`}
                            disabled={!formData.client_id}
                          >
                            <option value="">
                              {formData.client_id ? 'Seleccionar proyecto' : 'Primero seleccione un cliente'}
                            </option>
                            {filteredProjects.map(project => (
                              <option key={project.project_id} value={String(project.project_id)}>
                                {project.name}
                              </option>
                            ))}
                          </select>
                          {errors.project_id && (
                            <p className="mt-1 text-sm text-red-600">{errors.project_id}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Asignar a
                          </label>
                          <select
                            value={formData.assigned_to_user_id}
                            onChange={(e) => {
                              handleChange('assigned_to_user_id', e.target.value);
                            }}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                          >
                            <option value="">Sin asignar</option>
                            {users.map(user => (
                              <option key={user.user_id} value={String(user.user_id)}>
                                {user.full_name} ({user.username})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Detalles adicionales */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiCalendar className="w-5 h-5 text-purple-600" />
                        Información de Contacto
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                              Email de contacto
                            </label>
                            <input
                              type="email"
                              value={formData.contact_email}
                              onChange={(e) => handleChange('contact_email', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                              placeholder="contacto@cliente.com"
                            />
                          </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de contacto
                          </label>
                          <input
                            type="text"
                            value={formData.contact_name}
                            onChange={(e) => handleChange('contact_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                            placeholder="Nombre completo del contacto"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Archivos adjuntos */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FiPaperclip className="w-5 h-5 text-purple-600" />
                        Archivos Adjuntos
                      </h3>
                      
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <FiUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-600">
                            Haz clic para seleccionar archivos o arrastra y suelta aquí
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Máximo 10MB por archivo. Formatos: imágenes, PDF, documentos, archivos comprimidos
                          </p>
                        </label>
                      </div>

                      {attachments.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <h4 className="font-medium text-gray-700">Archivos seleccionados:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {attachments.map(attachment => (
                              <div key={attachment.id} className="relative bg-gray-50 rounded-lg p-3">
                                {attachment.preview ? (
                                  <img
                                    src={attachment.preview}
                                    alt="Preview"
                                    className="w-full h-20 object-cover rounded mb-2"
                                  />
                                ) : (
                                  <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                                    <FiFile className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                <p className="text-sm text-gray-700 truncate">{attachment.file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <button
                                  type="button"
                                  onClick={() => removeAttachment(attachment.id)}
                                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                  <FiX className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {errors.submit && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{errors.submit}</p>
                  </div>
                )}
              </div>

              {/* Footer con botones - FIXED */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentStep > 1 && (
                      <button
                        type="button"
                        onClick={handlePrevious}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <FiArrowRight className="w-4 h-4 rotate-180" />
                        Anterior
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>

                    {currentStep < 2 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Siguiente
                        <FiArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <FiSave className="w-4 h-4" />
                        {isSubmitting ? 'Guardando...' : (ticket ? 'Actualizar' : 'Crear')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
} 