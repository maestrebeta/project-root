import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiCheck, FiAlertCircle, FiInfo, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useActivityCategories } from './useProjectsAndTags';
import { useNotifications } from '../../context/NotificationsContext';

// Componente interno para el contenido del modal
const ActivityCategoriesContent = ({ 
  categories, 
  showEditForm, 
  editingCategory, 
  errors, 
  loading,
  categoriesError,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onSaveCategory,
  onCancelEdit,
  onSave,
  onClose,
  onEditingCategoryChange
}) => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Categorías de Actividad</h2>
            <p className="text-gray-600 font-medium">Gestiona las categorías para el registro de tiempo</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddCategory}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 font-medium flex items-center gap-2 shadow-lg"
          >
            <FiPlus className="w-5 h-5" />
            Agregar Categoría
          </motion.button>
        </div>
      </div>

      {/* Categorías existentes */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 mb-6 tracking-tight">Categorías Configuradas</h3>
        <div className="space-y-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 transition-all duration-300 hover:shadow-md hover:border-gray-300"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                    <FiSettings className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-gray-800">{category.name}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Botones de edición */}
                  <button
                    onClick={() => onEditCategory(category)}
                    className="p-2 rounded-lg hover:bg-white/20 transition-colors"
                    title="Editar categoría"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => onDeleteCategory(category.id)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-600 transition-colors"
                    title="Eliminar categoría"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Formulario de agregar/editar categoría - Modal emergente */}
      <AnimatePresence>
        {showEditForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                onCancelEdit();
              }
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ 
                type: 'spring', 
                stiffness: 300, 
                damping: 30,
                duration: 0.4
              }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              {/* Header del modal */}
              <div className="px-8 py-6 border-b border-gray-200/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
                    <FiSettings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">
                      {editingCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
                    </h3>
                    <p className="text-gray-600 font-medium">
                      {editingCategory.id ? 'Modifica los datos de la categoría' : 'Crea una nueva categoría de actividad'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancelEdit}
                  className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 group"
                >
                  <FiX className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </button>
              </div>

              {/* Contenido del modal */}
              <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) => onEditingCategoryChange({ ...editingCategory, name: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Ej: Desarrollo"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Descripción *
                    </label>
                    <textarea
                      value={editingCategory.description}
                      onChange={(e) => onEditingCategoryChange({ ...editingCategory, description: e.target.value })}
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 ${
                        errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Descripción de la categoría de actividad"
                      rows={3}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <FiAlertCircle className="w-4 h-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Vista previa */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Vista Previa
                    </label>
                    <div className="p-4 rounded-xl border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                          <FiSettings className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{editingCategory.name || 'Nombre de la categoría'}</h4>
                          <p className="text-sm text-gray-600">{editingCategory.description || 'Descripción de la categoría'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer del modal */}
              <div className="px-8 py-6 border-t border-gray-200/50 flex items-center justify-end gap-3 bg-white/80 backdrop-blur-sm">
                <button
                  onClick={onCancelEdit}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={onSaveCategory}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg"
                >
                  <FiSave className="w-4 h-4" />
                  {editingCategory.id ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error general */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
        >
          <p className="text-red-600 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            {errors.general}
          </p>
        </motion.div>
      )}

      {/* Error de categorías */}
      {categoriesError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6"
        >
          <p className="text-red-600 flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4" />
            Error al cargar categorías: {categoriesError}
          </p>
        </motion.div>
      )}

      {/* Información adicional */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
        <div className="flex items-start gap-3">
          <FiInfo className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">Información Importante</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Los cambios se aplicarán a todos los formularios de entrada de tiempo</li>
              <li>• Las categorías se mostrarán en orden de creación</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onClose?.()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <FiCheck className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ActivityCategoriesManagerContent = ({ onClose, isEmbedded = false }) => {
  const { user } = useAuth();
  const { categories, loading: categoriesLoading, error: categoriesError, refresh: refreshCategories } = useActivityCategories();
  const { showNotification } = useNotifications();
  const [localCategories, setLocalCategories] = useState([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState({
    id: null,
    name: '',
    description: '',
    isDefault: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Sincronizar categorías locales con las del hook
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  // Log cuando cambien las categorías locales
  useEffect(() => {
  }, [localCategories]);

  const handleSave = async () => {
    setLoading(true);
    setErrors({});

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch(`http://localhost:8001/organizations/${user.organization_id}/activity-categories`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categories: localCategories })
      });

      if (response.ok) {
        // Refrescar las categorías del hook
        refreshCategories();
        
        // Mostrar notificación de éxito
        showNotification('Categorías de actividad actualizadas correctamente', 'success');
        
        onClose?.();
      } else {
        const errorData = await response.json();
        setErrors({ general: errorData.detail || 'Error al guardar las categorías' });
        // Mostrar notificación de error
        showNotification('Error al guardar las categorías de actividad', 'error');
      }
    } catch (error) {
      setErrors({ general: 'Error de conexión' });
      // Mostrar notificación de error
      showNotification('Error de conexión al guardar las categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory({
      id: null,
      name: '',
      description: ''
    });
    setShowEditForm(true);
    setErrors({});
  };

  const handleEditCategory = (category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      description: category.description
    });
    setShowEditForm(true);
    setErrors({});
  };

  const handleDeleteCategory = (categoryId) => {
    setLocalCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  const validateCategory = (category) => {
    const errors = {};
    
    if (!category.name || category.name.trim() === '') {
      errors.name = 'El nombre es obligatorio';
    } else if (category.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (category.name.trim().length > 50) {
      errors.name = 'El nombre no puede exceder 50 caracteres';
    }
    
    if (!category.description || category.description.trim() === '') {
      errors.description = 'La descripción es obligatoria';
    } else if (category.description.trim().length < 5) {
      errors.description = 'La descripción debe tener al menos 5 caracteres';
    } else if (category.description.trim().length > 200) {
      errors.description = 'La descripción no puede exceder 200 caracteres';
    }
    
    return errors;
  };

  const handleSaveCategory = () => {
    const validationErrors = validateCategory(editingCategory);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (editingCategory.id) {
      // Actualizar categoría existente
      setLocalCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? editingCategory : cat
      ));
    } else {
      // Agregar nueva categoría
      const newCategory = {
        ...editingCategory,
        id: Math.max(...localCategories.map(c => c.id), 0) + 1
      };
      setLocalCategories(prev => [...prev, newCategory]);
    }

    setShowEditForm(false);
    setEditingCategory({ id: null, name: '', description: '', isDefault: false });
    setErrors({});
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
    setEditingCategory({ id: null, name: '', description: '', isDefault: false });
    setErrors({});
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleCloseClick = () => {
    onClose?.();
  };

  // Si está embebido, renderizar solo el contenido
  if (isEmbedded) {
    return (
      <ActivityCategoriesContent
        categories={localCategories}
        showEditForm={showEditForm}
        editingCategory={editingCategory}
        errors={errors}
        loading={loading || categoriesLoading}
        categoriesError={categoriesError}
        onAddCategory={handleAddCategory}
        onEditCategory={handleEditCategory}
        onDeleteCategory={handleDeleteCategory}
        onSaveCategory={handleSaveCategory}
        onCancelEdit={handleCancelEdit}
        onSave={handleSave}
        onClose={onClose}
        onEditingCategoryChange={setEditingCategory}
      />
    );
  }

  // Renderizado completo del modal
  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ 
            type: 'spring', 
            stiffness: 300, 
            damping: 30,
            duration: 0.4
          }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200/50 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg">
                <FiSettings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Categorías de Actividad</h2>
                <p className="text-gray-600 font-medium">Gestiona las categorías para el registro de tiempo</p>
              </div>
            </div>
            <button
              onClick={handleCloseClick}
              className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 group"
            >
              <FiX className="w-6 h-6 text-gray-500 group-hover:text-gray-700 transition-colors" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-8">
            <ActivityCategoriesContent
              categories={localCategories}
              showEditForm={showEditForm}
              editingCategory={editingCategory}
              errors={errors}
              loading={loading || categoriesLoading}
              categoriesError={categoriesError}
              onAddCategory={handleAddCategory}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
              onSaveCategory={handleSaveCategory}
              onCancelEdit={handleCancelEdit}
              onSave={handleSave}
              onClose={onClose}
              onEditingCategoryChange={setEditingCategory}
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Componente principal que mantiene la compatibilidad
const ActivityCategoriesManager = ({ onClose }) => {
  return <ActivityCategoriesManagerContent onClose={onClose} isEmbedded={false} />;
};

export default ActivityCategoriesManager; 