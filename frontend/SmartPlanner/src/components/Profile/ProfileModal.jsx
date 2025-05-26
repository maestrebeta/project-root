import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiMail, FiEdit2, FiCamera, FiX, FiSave, FiTrash2, FiUpload } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useAppTheme } from '../../context/ThemeContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUserProfile, profileImage, updateProfileImage } = useAuth();
  const theme = useAppTheme();
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState('');
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    full_name: user?.full_name || '',
    role: user?.role || '',
    position: '',
    location: '',
    phone: '',
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        full_name: user.full_name || '',
        role: user.role || '',
        position: formData.position || '',
        location: formData.location || '',
        phone: formData.phone || '',
        department: formData.department || '',
        bio: formData.bio || ''
      });
    }
  }, [user]);

  const validateImage = (file) => {
    setImageError('');
    
    if (!file) {
      setImageError('No se ha seleccionado ningún archivo');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Formato de imagen no válido. Use JPG, PNG, GIF o WebP');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('La imagen no debe superar los 5MB');
      return false;
    }

    return true;
  };

  const handleImageUpload = (file) => {
    if (!validateImage(file)) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateProfileImage(reader.result);
      setImageError('');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemoveImage = () => {
    updateProfileImage(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!formData.email?.trim()) {
        throw new Error('El email es obligatorio');
      }

      if (!formData.full_name?.trim()) {
        throw new Error('El nombre completo es obligatorio');
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('El formato del email no es válido');
      }

      const updateData = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim()
      };

      const updatedUser = await updateUserProfile(updateData);

      // Actualizar el estado del formulario con los datos actualizados
      setFormData(prev => ({
        ...prev,
        ...updatedUser
      }));

      setIsEditing(false);
    } catch (error) {
      setError(error.message || 'No se pudo actualizar el perfil. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-visible relative"
              >
                {/* Header con gradiente */}
                <div className="relative h-44 overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 animate-gradient-x rounded-t-xl">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                {/* Profile Image */}
                <motion.div 
                  className="absolute top-28 left-8"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="relative">
                    <div
                      ref={dropZoneRef}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      className={`
                        w-32 h-32 rounded-full border-4 border-white overflow-hidden bg-gray-100 shadow-lg
                        transition-all duration-200
                        ${isDragging ? 'ring-4 ring-blue-500 scale-105' : ''}
                        ${isEditing ? 'cursor-pointer hover:opacity-90' : ''}
                      `}
                      onClick={() => isEditing && fileInputRef.current?.click()}
                    >
                      {profileImage ? (
                        <div className="relative group">
                          <img
                            src={profileImage}
                            alt={formData.username}
                            className="w-full h-full object-cover"
                          />
                          {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <FiUpload className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                          <FiUser className="w-16 h-16" />
                          {isEditing && (
                            <span className="text-xs mt-2 text-center px-2">
                              Arrastra o haz clic para subir
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute -bottom-2 right-0 flex gap-1">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => fileInputRef.current?.click()}
                          className="p-2 rounded-full bg-white shadow-lg text-gray-600 hover:text-blue-500 transition-colors"
                          title="Subir imagen"
                        >
                          <FiCamera className="w-4 h-4" />
                        </motion.button>
                        {profileImage && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleRemoveImage}
                            className="p-2 rounded-full bg-white shadow-lg text-gray-600 hover:text-red-500 transition-colors"
                            title="Eliminar imagen"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                    />
                  </div>
                </motion.div>

                {/* Content */}
                <div className="pt-24 px-8 pb-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {formData.full_name || 'Sin nombre'}
                      </h2>
                      <p className="text-sm text-gray-500">@{formData.username}</p>
                      <p className="text-sm text-gray-500">{formData.role}</p>
                    </div>
                    {!isEditing ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditing(true)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.PRIMARY_BUTTON_CLASS}`}
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Editar Perfil
                      </motion.button>
                    ) : (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            setIsEditing(false);
                            setFormData({
                              username: user?.username || '',
                              email: user?.email || '',
                              full_name: user?.full_name || '',
                              role: user?.role || '',
                              position: '',
                              location: '',
                              phone: '',
                              department: '',
                              bio: ''
                            });
                            setError('');
                            setImageError('');
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          <FiX className="w-4 h-4" />
                          Cancelar
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSubmit}
                          disabled={loading}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.PRIMARY_BUTTON_CLASS} ${loading ? 'opacity-75' : ''}`}
                        >
                          {loading ? (
                            <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin" />
                          ) : (
                            <FiSave className="w-4 h-4" />
                          )}
                          Guardar
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {(error || imageError) && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm"
                    >
                      {error || imageError}
                    </motion.div>
                  )}

                  {/* Campos de edición */}
                  {isEditing ? (
                    <div className="space-y-6">
                      {/* Información básica */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Información básica</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nombre completo
                            </label>
                            <input
                              type="text"
                              name="full_name"
                              value={formData.full_name}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tu nombre completo"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="tu@email.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Información profesional */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Información profesional</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cargo
                            </label>
                            <input
                              type="text"
                              name="position"
                              value={formData.position}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tu cargo actual"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Departamento
                            </label>
                            <input
                              type="text"
                              name="department"
                              value={formData.department}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tu departamento"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Información de contacto */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Información de contacto</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Teléfono
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tu número de teléfono"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ubicación
                            </label>
                            <input
                              type="text"
                              name="location"
                              value={formData.location}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Tu ubicación"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Biografía */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Biografía</h3>
                        <div>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Cuéntanos sobre ti..."
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Vista de información */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Email</h3>
                          <p className="mt-1 text-gray-900">{formData.email}</p>
                        </div>
                        {formData.position && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Cargo</h3>
                            <p className="mt-1 text-gray-900">{formData.position}</p>
                          </div>
                        )}
                        {formData.department && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Departamento</h3>
                            <p className="mt-1 text-gray-900">{formData.department}</p>
                          </div>
                        )}
                        {formData.location && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Ubicación</h3>
                            <p className="mt-1 text-gray-900">{formData.location}</p>
                          </div>
                        )}
                        {formData.phone && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Teléfono</h3>
                            <p className="mt-1 text-gray-900">{formData.phone}</p>
                          </div>
                        )}
                      </div>
                      {formData.bio && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Biografía</h3>
                          <p className="mt-1 text-gray-900 whitespace-pre-wrap">{formData.bio}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal; 