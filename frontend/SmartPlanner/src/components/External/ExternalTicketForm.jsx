import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { 
  FiSend, FiUser, FiMail, FiPhone, FiMessageSquare, FiAlertCircle, 
  FiCheckCircle, FiX, FiCalendar, FiTag, FiMapPin, FiGlobe, FiUpload,
  FiFile, FiImage, FiPaperclip, FiTrash2, FiClock, FiStar, FiZap,
  FiShield, FiHeadphones, FiAward, FiHeart, FiSmile, FiUserPlus, FiLock,
  FiLogIn, FiLogOut, FiSettings, FiInfo
} from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import { useExternalAuth } from '../../context/ExternalAuthContext';
import ExternalLoginModal from './ExternalLoginModal';
import OrganizationRatingModal from './OrganizationRatingModal';

export default function ExternalTicketForm() {
  const { token } = useParams();
  const { externalUser, isAuthenticated, logout } = useExternalAuth();
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [filteredProjects, setFilteredProjects] = useState([]);
  
  // Estados para autenticación
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  
  // Estados para calificaciones
  const [showRatingModal, setShowRatingModal] = useState(false);
  
  // Estados para el modal de registro opcional
  const [registrationData, setRegistrationData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [registrationErrors, setRegistrationErrors] = useState({});
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'media',
    category_id: '',
    client_name: '',
    client_email: '',
    project_name: '',
    contact_name: '',
    contact_email: '',
    due_date: '',
    additional_info: ''
  });
  
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState([]);
  const [categories, setCategories] = useState([]);

  // Estados para prioridades con mejor UX
  const ticketPriorities = [
    { id: 'baja', label: 'Baja', color: 'green', icon: '🟢', description: 'Mejora o consulta general' },
    { id: 'media', label: 'Media', color: 'yellow', icon: '🟡', description: 'Problema que afecta el trabajo' },
    { id: 'alta', label: 'Alta', color: 'red', icon: '🔴', description: 'Problema crítico que bloquea' },
    { id: 'critica', label: 'Crítica', color: 'red', icon: '🚨', description: 'Sistema completamente inaccesible' }
  ];

  // Cargar configuración del formulario
  useEffect(() => {
    fetchFormConfig();
  }, [token]);

  // Efecto para mostrar el modal de registro cuando se completan los campos requeridos
  useEffect(() => {
    if (selectedClient && formData.contact_name && formData.contact_email && !showRegistrationModal) {
      // Verificar si el usuario ya existe
      checkIfUserExists();
    }
  }, [selectedClient, formData.contact_name, formData.contact_email]);

  // Efecto para prellenar campos cuando el usuario externo inicia sesión
  useEffect(() => {
    console.log('🔍 Debug prellenado:', {
      isAuthenticated: isAuthenticated(),
      externalUser: externalUser,
      clientsLength: clients.length,
      externalUserClientId: externalUser?.client_id,
      currentSelectedClient: selectedClient,
      currentContactName: formData.contact_name,
      currentContactEmail: formData.contact_email
    });
    
    if (isAuthenticated() && externalUser && clients.length > 0) {
      // Buscar el cliente asociado al usuario externo
      const userClient = clients.find(client => client.client_id === externalUser.client_id);
      
      console.log('🔍 Cliente encontrado:', userClient);
      console.log('🔍 Todos los clientes disponibles:', clients.map(c => ({ id: c.client_id, name: c.name })));
      
      if (userClient) {
        // Prellenar cliente solo si no está ya seleccionado
        if (!selectedClient || selectedClient !== String(userClient.client_id)) {
          setSelectedClient(String(userClient.client_id));
          console.log('✅ Cliente prellenado:', userClient.client_id);
        }
        
        // Prellenar información de contacto solo si no está ya prellenada
        const shouldUpdateContact = !formData.contact_name || !formData.contact_email;
        if (shouldUpdateContact) {
          setFormData(prev => ({
            ...prev,
            contact_name: externalUser.full_name || '',
            contact_email: externalUser.email || '',
            client_name: userClient.name
          }));
          
          console.log('✅ Campos de contacto prellenados:', {
            contact_name: externalUser.full_name,
            contact_email: externalUser.email,
            client_name: userClient.name
          });
        } else {
          console.log('ℹ️ Campos de contacto ya estaban prellenados');
        }
      } else {
        console.log('❌ No se encontró cliente para el usuario:', {
          userClientId: externalUser.client_id,
          availableClients: clients.map(c => c.client_id)
        });
      }
    } else {
      console.log('ℹ️ Condiciones no cumplidas para prellenado:', {
        isAuthenticated: isAuthenticated(),
        hasExternalUser: !!externalUser,
        clientsLoaded: clients.length > 0
      });
    }
  }, [isAuthenticated(), externalUser, clients, selectedClient, formData.contact_name, formData.contact_email]);

  const checkIfUserExists = async () => {
    try {
      const response = await fetch(`http://localhost:8001/external-users/check-email?email=${formData.contact_email}`);
      if (response.ok) {
        const { exists } = await response.json();
        if (!exists) {
          // Solo mostrar el modal si el usuario no existe
          setShowRegistrationModal(true);
        }
      }
    } catch (error) {
      console.error('Error checking user existence:', error);
    }
  };

  const fetchFormConfig = async () => {
    try {
      const response = await fetch(`http://localhost:8001/external-forms/token/${token}`);
      
      if (response.ok) {
        const config = await response.json();
        setFormConfig(config);
        
        // Cargar clientes, proyectos y categorías de la organización
        await fetchClientsAndProjects(config.organization_id);
        await fetchCategories(config.organization_id);
      } else if (response.status === 404) {
        setError('El portal de soporte no existe o ha sido desactivado.');
      } else {
        setError('Error al cargar el portal de soporte.');
      }
    } catch (error) {
      console.error('Error fetching form config:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientsAndProjects = async (organizationId) => {
      try {
        // Cargar clientes
      const clientsResponse = await fetch(`http://localhost:8001/clients/organization/${organizationId}`);
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json();
          setClients(clientsData);
        }

        // Cargar proyectos
      const projectsResponse = await fetch(`http://localhost:8001/projects/organization/${organizationId}`);
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData);
        }
      } catch (error) {
      console.error('Error fetching clients and projects:', error);
    }
  };

  const fetchCategories = async (organizationId) => {
    try {
      const response = await fetch(`http://localhost:8001/tickets/categories/public/${organizationId}`);
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
    const category = categories.find(cat => cat.category_id === parseInt(categoryId));
    
    if (category) {
      // Prellenar campos con valores por defecto de la categoría
      setFormData(prev => ({
        ...prev,
        category_id: categoryId,
        priority: category.default_priority || prev.priority,
        title: category.default_title_template || prev.title,
        description: category.default_description_template || prev.description
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category_id: categoryId
      }));
    }
  };

  // Filtrar proyectos cuando se selecciona un cliente
  useEffect(() => {
    if (selectedClient) {
      const client = clients.find(c => c.client_id === parseInt(selectedClient));
      if (client) {
        const clientProjects = projects.filter(p => p.client_id === client.client_id);
        setFilteredProjects(clientProjects);
        setFormData(prev => ({ ...prev, client_name: client.name }));
      }
    } else {
      setFilteredProjects([]);
      setFormData(prev => ({ ...prev, client_name: '', project_name: '' }));
    }
  }, [selectedClient, clients, projects]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Funciones para el modal de registro
  const handleRegistrationInputChange = (e) => {
    const { name, value } = e.target;
    setRegistrationData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo
    if (registrationErrors[name]) {
      setRegistrationErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateRegistration = () => {
    const newErrors = {};

    if (!registrationData.username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
    } else if (registrationData.username.length < 3) {
      newErrors.username = 'El nombre de usuario debe tener al menos 3 caracteres';
    }

    if (!registrationData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (registrationData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (registrationData.password !== registrationData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setRegistrationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterUser = async () => {
    if (!validateRegistration()) {
      return;
    }

    try {
      const response = await fetch('http://localhost:8001/external-users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: registrationData.username,
          password: registrationData.password,
          full_name: formData.contact_name,
          email: formData.contact_email,
          phone: registrationData.phone,
          organization_id: formConfig?.organization_id || 1
        })
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ Usuario externo registrado exitosamente:', userData);
        setShowRegistrationModal(false);
        // Limpiar datos de registro
        setRegistrationData({
          username: '',
          password: '',
          confirmPassword: '',
          phone: ''
        });
        setRegistrationErrors({});
      } else {
        const errorData = await response.json();
        setRegistrationErrors({ submit: errorData.detail || 'Error al registrar el usuario' });
      }
    } catch (error) {
      console.error('Error registering user:', error);
      setRegistrationErrors({ submit: 'Error de conexión. Por favor, intenta nuevamente.' });
    }
  };

  const handleSkipRegistration = () => {
    setShowRegistrationModal(false);
    // Limpiar datos de registro
    setRegistrationData({
      username: '',
      password: '',
      confirmPassword: '',
      phone: ''
    });
    setRegistrationErrors({});
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
      newErrors.title = 'El título es requerido';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    // Solo validar cliente si el usuario no está autenticado
    if (!isAuthenticated() && !selectedClient) {
      newErrors.client = 'Debe seleccionar un cliente';
    }

    // Solo validar información de contacto si el usuario no está autenticado
    if (!isAuthenticated()) {
      if (!formData.contact_name.trim()) {
        newErrors.contact_name = 'El nombre de contacto es requerido';
      }

      if (!formData.contact_email.trim()) {
        newErrors.contact_email = 'El email de contacto es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.contact_email)) {
        newErrors.contact_email = 'El email de contacto no es válido';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      
      // Agregar datos del formulario
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Agregar el cliente seleccionado
      if (selectedClient) {
        const client = clients.find(c => c.client_id === parseInt(selectedClient));
        if (client) {
          formDataToSend.append('client_name', client.name);
          formDataToSend.append('client_email', client.email || '');
        }
      }

      // Agregar archivos adjuntos
      attachments.forEach(attachment => {
        formDataToSend.append('attachments', attachment.file);
      });

      // Agregar token del formulario
      formDataToSend.append('form_token', token);

      const response = await fetch('http://localhost:8001/tickets/external', {
        method: 'POST',
        body: formDataToSend
      });

      if (response.ok) {
        setSuccess(true);
        // Limpiar formulario
        setFormData({
          title: '',
          description: '',
          priority: 'media',
          category_id: '',
          client_name: '',
          client_email: '',
          project_name: '',
          contact_name: '',
          contact_email: '',
          due_date: '',
          additional_info: ''
        });
        setSelectedClient('');
        setFilteredProjects([]);
        setAttachments([]);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Error al enviar el ticket. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error submitting ticket:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-6">
              <div className="w-20 h-20 bg-white rounded-full m-2"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <FiGlobe className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Cargando portal de soporte</h3>
          <p className="text-gray-600">Preparando formulario...</p>
        </div>
      </div>
    );
  }

  if (error && !formConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiAlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Portal no disponible</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  if (success) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">¡Ticket enviado exitosamente!</h3>
          <p className="text-gray-600 mb-6">
            Gracias por contactarnos. Hemos recibido tu solicitud y nos pondremos en contacto contigo pronto.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSuccess(false);
                setError(null);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enviar otro ticket
            </button>
            <button
              onClick={() => window.close()}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header mejorado */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <FiGlobe className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{formConfig?.title || 'Portal de Soporte'}</h1>
            </div>
            
            {/* Barra de usuario autenticado simplificada */}
            <div className="flex items-center justify-center gap-4 mb-4">
              {isAuthenticated() ? (
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full flex items-center justify-center">
                        <FiUser className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">{externalUser?.full_name}</span>
                    </div>
                    
                    <div className="h-6 w-px bg-emerald-300"></div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowRatingModal(true)}
                        className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-300 text-sm font-medium"
                      >
                        <FiStar className="w-3 h-3 inline mr-1" />
                        Calificar
                      </button>
                      <button
                        onClick={logout}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
                      >
                        Salir
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium"
                  >
                    Iniciar Sesión
                  </button>
                  <span className="text-sm text-gray-500">o</span>
                  <button
                    onClick={() => setShowRegistrationModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-medium"
                  >
                    Registrarse
                  </button>
                </div>
              )}
            </div>
            
            {formConfig?.description && (
              <p className="text-gray-600 mb-4">{formConfig.description}</p>
            )}
            {formConfig?.welcome_message && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800">{formConfig.welcome_message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario mejorado */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5" />
                Crear Nuevo Ticket
              </h2>
              <div className="flex items-center gap-2 text-blue-100">
                <FiShield className="w-4 h-4" />
                <span className="text-sm">Portal Seguro</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Información básica - PRIMERA SECCIÓN */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiStar className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Información Básica</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente *
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      setSelectedClient(e.target.value);
                      setFormData(prev => ({ ...prev, project_name: '' }));
                    }}
                    disabled={isAuthenticated()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.client ? 'border-red-300' : 'border-gray-300'
                    } ${isAuthenticated() ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">Seleccionar cliente</option>
                    {clients.map(client => (
                      <option key={client.client_id} value={client.client_id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                  {errors.client && (
                    <p className="mt-1 text-sm text-red-600">{errors.client}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyecto
                  </label>
                  <select
                    value={formData.project_name}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        project_name: e.target.value 
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    disabled={!selectedClient}
                  >
                    <option value="">
                      {selectedClient ? 'Seleccionar proyecto' : 'Primero seleccione un cliente'}
                    </option>
                    {filteredProjects.map(project => (
                      <option key={project.project_id} value={project.name}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Información del ticket */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiFile className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Información del Ticket</h3>
              </div>
                  
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  name="category_id"
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
                  Título del ticket *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    errors.title ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Describe brevemente el problema o solicitud"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción detallada *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Proporciona todos los detalles relevantes sobre el problema o solicitud..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                >
                  {ticketPriorities.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.icon} {priority.label} - {priority.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información de contacto */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiUser className="w-5 h-5 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Información de Contacto</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    disabled={isAuthenticated()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.contact_name ? 'border-red-300' : 'border-gray-300'
                    } ${isAuthenticated() ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.contact_name && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="contact_email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                    disabled={isAuthenticated()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                      errors.contact_email ? 'border-red-300' : 'border-gray-300'
                    } ${isAuthenticated() ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="tu@email.com"
                  />
                  {errors.contact_email && (
                    <p className="mt-1 text-sm text-red-600">{errors.contact_email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Archivos adjuntos */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiPaperclip className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Archivos Adjuntos</h3>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-dashed border-orange-300 rounded-xl p-8 text-center hover:border-orange-400 transition-all duration-300 hover:shadow-md">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip,.rar"
                />
                <label htmlFor="file-upload" className="cursor-pointer block">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <FiUpload className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">
                    Agregar archivos de soporte
                  </h4>
                  <p className="text-gray-600 mb-3">
                    Haz clic para seleccionar archivos o arrastra y suelta aquí
                  </p>
                  <div className="bg-white rounded-lg p-3 inline-block">
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Formatos soportados:</span> Imágenes, PDF, documentos, archivos comprimidos
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Máximo 10MB por archivo
                    </p>
                  </div>
                </label>
              </div>

              {attachments.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FiFile className="w-5 h-5 text-orange-600" />
                    <h4 className="font-semibold text-gray-900">
                      Archivos seleccionados ({attachments.length})
                    </h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="relative bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md">
                        {attachment.preview ? (
                          <img
                            src={attachment.preview}
                            alt="Preview"
                            className="w-full h-24 object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <div className="w-full h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-3 flex items-center justify-center">
                            <FiFile className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {attachment.file.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(attachment.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                          title="Eliminar archivo"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Botón de envío mejorado */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-xl hover:from-emerald-600 hover:to-blue-700 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {submitting ? (
                  <>
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    Enviando ticket...
                  </>
                ) : (
                  <>
                    <FiSend className="w-6 h-6" />
                    Enviar Ticket
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Información de contacto del portal mejorada */}
        {(formConfig?.contact_email || formConfig?.contact_phone) && (
          <div className="mt-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                <FiHeadphones className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¿Necesitas ayuda adicional?</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formConfig.contact_email && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FiMail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Email de soporte</p>
                    <a
                      href={`mailto:${formConfig.contact_email}?subject=Soporte%20Técnico`}
                      className="text-blue-600 hover:text-blue-700 transition-colors font-medium"
                    >
                      {formConfig.contact_email}
                    </a>
                  </div>
                </div>
              )}
              {formConfig.contact_phone && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FiPhone className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">Teléfono de soporte</p>
                    <a
                      href={`tel:${formConfig.contact_phone}`}
                      className="text-green-600 hover:text-green-700 transition-colors font-medium"
                    >
                      {formConfig.contact_phone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer mejorado */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-16">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FiGlobe className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">SmartPlanner</span>
            </div>
            
            <p className="text-gray-300 mb-6 max-w-md mx-auto leading-relaxed">
              Portal de soporte técnico profesional - Sistema de gestión de tickets avanzado
            </p>
            
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400 mb-6">
              <span className="flex items-center gap-2">
                <FiShield className="w-4 h-4" />
                Portal Seguro
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <FiHeadphones className="w-4 h-4" />
                Soporte 24/7
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" />
                Respuesta Rápida
              </span>
            </div>
            
            <div className="border-t border-gray-700 pt-6">
              <p className="text-xs text-gray-500">
                © 2024 SmartPlanner - Todos los derechos reservados
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal de registro opcional */}
      {showRegistrationModal && createPortal(
        <AnimatePresence>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={handleSkipRegistration}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del modal */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                      <FiUserPlus className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">¿Crear cuenta de usuario?</h2>
                      <p className="text-sm text-blue-100">
                        Beneficios de tener una cuenta
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleSkipRegistration}
                    className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Contenido del modal */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <FiStar className="w-4 h-4" />
                      Ventajas de registrarte:
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Seguimiento de tus tickets en tiempo real</li>
                      <li>• Historial completo de solicitudes</li>
                      <li>• Notificaciones automáticas de actualizaciones</li>
                      <li>• Acceso rápido a formularios futuros</li>
                    </ul>
                  </div>
                  
                  <p className="text-gray-600 text-sm">
                    Los datos de contacto ya están prellenados. Solo necesitas crear un nombre de usuario y contraseña.
                  </p>
                </div>

                {registrationErrors.submit && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{registrationErrors.submit}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de usuario *
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={registrationData.username}
                      onChange={handleRegistrationInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        registrationErrors.username ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="usuario123"
                    />
                    {registrationErrors.username && (
                      <p className="mt-1 text-sm text-red-600">{registrationErrors.username}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={registrationData.password}
                      onChange={handleRegistrationInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        registrationErrors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Mínimo 6 caracteres"
                    />
                    {registrationErrors.password && (
                      <p className="mt-1 text-sm text-red-600">{registrationErrors.password}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar contraseña *
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={registrationData.confirmPassword}
                      onChange={handleRegistrationInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 ${
                        registrationErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Repite tu contraseña"
                    />
                    {registrationErrors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{registrationErrors.confirmPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono (opcional)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={registrationData.phone}
                      onChange={handleRegistrationInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={handleSkipRegistration}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                  >
                    Continuar sin cuenta
                  </button>
                  <button
                    onClick={handleRegisterUser}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium shadow-lg"
                  >
                    Crear cuenta
                  </button>
                </div>
              </div>
            </div>
          </div>
        </AnimatePresence>,
        document.body
      )}

      {/* Modal de login */}
      <ExternalLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegistrationModal(true);
        }}
      />

      {/* Modal de calificación */}
      <OrganizationRatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        organizationId={formConfig?.organization_id || 1}
        clientId={selectedClient ? parseInt(selectedClient) : null}
        organizationName={formConfig?.title || 'Organización'}
      />
    </div>
  );
} 