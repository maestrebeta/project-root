import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX, FiStar, FiMessageSquare, FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi';
import { useExternalAuth } from '../../context/ExternalAuthContext';

export default function OrganizationRatingModal({ isOpen, onClose, organizationId, clientId, organizationName }) {
  const { externalUser } = useExternalAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingRating, setExistingRating] = useState(null);

  // Cargar calificación existente cuando se abre el modal
  useEffect(() => {
    if (isOpen && externalUser?.external_user_id && organizationId && clientId) {
      loadExistingRating();
    }
  }, [isOpen, externalUser, organizationId, clientId]);

  const loadExistingRating = async () => {
    if (!externalUser?.external_user_id || !organizationId || !clientId) return;

    setLoading(true);
    try {
      console.log('🔍 Cargando calificación existente para:', {
        organizationId,
        external_user_id: externalUser.external_user_id,
        clientId
      });

      const response = await fetch(
        `http://localhost:8001/organizations/${organizationId}/ratings/external/user/${externalUser.external_user_id}/client/${clientId}`
      );

      if (response.ok) {
        const existingRatingData = await response.json();
        console.log('✅ Calificación existente encontrada:', existingRatingData);
        setExistingRating(existingRatingData);
        setRating(existingRatingData.rating);
        setComment(existingRatingData.comment || '');
      } else if (response.status === 404) {
        console.log('ℹ️ No hay calificación existente');
        setExistingRating(null);
        setRating(0);
        setComment('');
      } else {
        console.error('❌ Error al cargar calificación existente:', response.status);
      }
    } catch (error) {
      console.error('❌ Error de conexión al cargar calificación:', error);
    } finally {
      setLoading(false);
    }
  };

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setIsSubmitting(false);
      // No resetear rating y comment aquí, se hará en loadExistingRating
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    if (!externalUser?.external_user_id) {
      setError('Debes estar autenticado para calificar');
      return;
    }

    if (!clientId) {
      setError('Cliente no válido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      console.log('🔍 Enviando calificación:', {
        organization_id: organizationId,
        client_id: clientId,
        external_user_id: externalUser.external_user_id,
        rating: rating,
        comment: comment.trim() || null
      });

      const response = await fetch(`http://localhost:8001/organizations/${organizationId}/ratings/external`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: organizationId,
          client_id: clientId,
          external_user_id: externalUser.external_user_id,
          rating: rating,
          comment: comment.trim() || null
        })
      });

      console.log('📥 Respuesta del servidor:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Calificación guardada exitosamente:', result);
        setSuccess(true);
        
        // Cerrar modal después de 2 segundos
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.text();
        console.error('❌ Error del servidor:', errorData);
        setError(errorData || 'Error al enviar la calificación');
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-green-500 to-blue-600 px-6 py-4 text-white rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                <FiStar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {existingRating ? 'Editar Calificación' : 'Calificar Servicio'}
                </h2>
                <p className="text-sm text-blue-100">
                  {organizationName || 'Organización'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiLoader className="w-5 h-5 text-blue-600 animate-spin" />
                <p className="text-sm text-blue-600">Cargando calificación anterior...</p>
              </div>
            </div>
          )}

          {existingRating && !loading && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiMessageSquare className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-600">
                  Ya tienes una calificación. Puedes editarla a continuación.
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-600 font-medium">
                  ¡Calificación {existingRating ? 'actualizada' : 'enviada'} exitosamente!
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                ¿Cómo calificarías nuestro servicio? *
              </label>
              <div className="flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-4xl transition-all duration-200 hover:scale-110 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
                    }`}
                    disabled={isSubmitting || loading}
                  >
                    <FiStar className={`${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <div className="text-center mt-2">
                <p className="text-sm text-gray-600">
                  {rating === 0 && 'Selecciona una calificación'}
                  {rating === 1 && 'Muy malo'}
                  {rating === 2 && 'Malo'}
                  {rating === 3 && 'Regular'}
                  {rating === 4 && 'Bueno'}
                  {rating === 5 && 'Excelente'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentario (opcional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Comparte tu experiencia con nuestro servicio..."
                disabled={isSubmitting || loading}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-300 font-medium"
                disabled={isSubmitting || loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0 || loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    {existingRating ? 'Actualizando...' : 'Enviando...'}
                  </>
                ) : (
                  existingRating ? 'Actualizar Calificación' : 'Enviar Calificación'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
} 