import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { planningService, projectService } from '../../services/planningService';

// Componente de integración entre Proyectos y SmartPlanner
export default function ProjectPlanningIntegration({ project, onClose }) {
  const [planningData, setPlanningData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (project) {
      loadProjectPlanningData();
    }
  }, [project]);

  const loadProjectPlanningData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await planningService.loadProjectPlanningData(project.project_id);
      
      if (data.success) {
        setPlanningData(data);
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSmartPlanner = () => {
    // Navegar al SmartPlanner con el proyecto seleccionado
    navigate(`/manager/planning?project=${project.project_id}`);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'backlog':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'planning':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'review':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'done':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'blocked':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  🎯 Planificación del Proyecto
                </h2>
                <p className="text-blue-100 mb-3">
                  Gestión inteligente de épicas e historias de usuario
                </p>
                <div className="bg-white bg-opacity-20 px-4 py-2 rounded-lg">
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-blue-100 text-sm">{project.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-blue-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg"
              >
                <span className="material-icons-outlined text-2xl">close</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
                <span className="ml-3 text-gray-600">Cargando datos de planificación...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-500 text-4xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={loadProjectPlanningData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reintentar
                </button>
              </div>
            ) : planningData ? (
              <div className="space-y-6">
                {/* Estadísticas del proyecto */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {planningData.epics?.length || 0}
                    </div>
                    <div className="text-sm text-blue-700">Épicas</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-600">
                      {planningData.userStories?.length || 0}
                    </div>
                    <div className="text-sm text-green-700">Historias de Usuario</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-600">
                      {planningData.userStories?.filter(s => s.status === 'in_progress').length || 0}
                    </div>
                    <div className="text-sm text-yellow-700">En Progreso</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {planningData.userStories?.filter(s => s.status === 'done').length || 0}
                    </div>
                    <div className="text-sm text-purple-700">Completadas</div>
                  </div>
                </div>

                {/* Épicas del proyecto */}
                {planningData.epics && planningData.epics.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="text-xl">🎯</span>
                      Épicas del Proyecto
                    </h3>
                    <div className="space-y-3">
                      {planningData.epics.map(epic => {
                        const epicStories = planningData.userStories?.filter(s => s.epic_id === epic.epic_id) || [];
                        const completedStories = epicStories.filter(s => s.status === 'done').length;
                        const progress = epicStories.length > 0 ? Math.round((completedStories / epicStories.length) * 100) : 0;

                        return (
                          <motion.div
                            key={epic.epic_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-50 rounded-xl p-4 border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <div
                                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                                  style={{ backgroundColor: epic.color || '#3B82F6' }}
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{epic.name}</h4>
                                  {epic.description && (
                                    <p className="text-sm text-gray-600 mt-1">{epic.description}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {epic.priority && (
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(epic.priority)}`}>
                                    {epic.priority === 'high' ? 'Alta' : 
                                     epic.priority === 'medium' ? 'Media' : 'Baja'}
                                  </span>
                                )}
                                {epic.status && (
                                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(epic.status)}`}>
                                    {epic.status === 'backlog' ? 'Backlog' :
                                     epic.status === 'planning' ? 'Planeación' :
                                     epic.status === 'in_progress' ? 'En Progreso' :
                                     epic.status === 'review' ? 'En Revisión' :
                                     epic.status === 'done' ? 'Completada' :
                                     epic.status === 'blocked' ? 'Bloqueada' : epic.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4 text-xs text-gray-600">
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {completedStories} completadas
                                </span>
                                <span className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  {epicStories.length - completedStories} pendientes
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-700">{progress}%</span>
                            </div>

                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-gray-400 text-4xl mb-3">🎯</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay épicas definidas</h3>
                    <p className="text-gray-600 mb-4">
                      Las épicas te ayudan a organizar y gestionar historias de usuario relacionadas
                    </p>
                  </div>
                )}

                {/* Resumen de horas estimadas */}
                {planningData.userStories && planningData.userStories.length > 0 && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">⏱️</span>
                      Estimación de Horas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {planningData.userStories.reduce((sum, s) => sum + (Number(s.ui_hours) || 0), 0)}h
                        </div>
                        <div className="text-blue-700">UI/UX</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {planningData.userStories.reduce((sum, s) => sum + (Number(s.development_hours) || 0), 0)}h
                        </div>
                        <div className="text-blue-700">Desarrollo</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {planningData.userStories.reduce((sum, s) => sum + (Number(s.testing_hours) || 0), 0)}h
                        </div>
                        <div className="text-blue-700">Testing</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {planningData.userStories.reduce((sum, s) => sum + (Number(s.documentation_hours) || 0), 0)}h
                        </div>
                        <div className="text-blue-700">Documentación</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-4xl mb-3">📋</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Sin datos de planificación</h3>
                <p className="text-gray-600">
                  Este proyecto aún no tiene épicas o historias de usuario definidas
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-6 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <p className="font-medium">💡 Consejo:</p>
                <p>Usa SmartPlanner para gestionar épicas, historias de usuario y seguimiento de progreso</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleOpenSmartPlanner}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2"
                >
                  <span className="text-lg">🚀</span>
                  Abrir SmartPlanner
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 