import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import QuotationModal from './QuotationModal';
import { FiDollarSign, FiCheckCircle, FiClock, FiAlertCircle, FiEdit2, FiTrash2, FiEye, FiPlus, FiFilter, FiSearch, FiGrid, FiList, FiCalendar, FiPercent, FiCreditCard, FiX, FiChevronDown } from 'react-icons/fi';

// Componente para el modal de pago rápido
const QuickPaymentModal = ({ isOpen, onClose, installment, onPaymentUpdate }) => {
  const [paymentReference, setPaymentReference] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePaymentToggle = async () => {
    if (!installment) return;
    
    setLoading(true);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const requestBody = {
        is_paid: !installment.is_paid,
        payment_reference: paymentReference || null
      };
      
      console.log('Sending payment update request:', {
        installment_id: installment.installment_id,
        body: requestBody
      });
      
      const response = await fetch(`http://localhost:8001/projects/quotations/installments/${installment.installment_id}/payment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const updatedInstallment = await response.json();
        console.log('Payment update successful:', updatedInstallment);
        onPaymentUpdate(updatedInstallment);
        onClose();
      } else {
        const errorData = await response.text();
        console.error('Payment update failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`Error al actualizar el pago: ${response.status} ${response.statusText} - ${errorData}`);
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert(`Error al actualizar el pago: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar referencia cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPaymentReference('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Usar React Portal para renderizar el modal
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {installment?.is_paid ? 'Marcar como Pendiente' : 'Marcar como Pagado'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">Cuota #{installment?.installment_number}</span>
              <span className="text-lg font-bold text-blue-800">${Math.round(installment?.amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-blue-600">
              <span>{Math.round(installment?.percentage || 0)}% del total</span>
              <span>Vence: {installment?.due_date ? new Date(installment.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Referencia de Pago (Opcional)
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Ej: Transferencia #12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handlePaymentToggle}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                installment?.is_paid
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Procesando...
                </div>
              ) : (
                <>
                  <FiCheckCircle className="w-4 h-4 inline mr-2" />
                  {installment?.is_paid ? 'Marcar Pendiente' : 'Marcar Pagado'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

// Componente para mostrar las cuotas de una cotización
const InstallmentsList = ({ installments, onPaymentUpdate }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState(null);

  const handlePaymentClick = (installment) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  };

  const handlePaymentUpdate = (updatedInstallment) => {
    onPaymentUpdate(updatedInstallment);
    setShowPaymentModal(false);
  };

  return (
    <>
      <div className="space-y-2">
        {installments?.map((installment) => (
          <div
            key={installment.installment_id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer ${
              installment.is_paid
                ? 'bg-green-50 border-green-200'
                : 'bg-orange-50 border-orange-200'
            }`}
            onClick={() => handlePaymentClick(installment)}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                installment.is_paid
                  ? 'bg-green-500 text-white'
                  : 'bg-orange-500 text-white'
              }`}>
                {installment.is_paid ? (
                  <FiCheckCircle className="w-4 h-4" />
                ) : (
                  <FiClock className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-800">
                    Cuota #{installment.installment_number}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    installment.is_paid
                      ? 'bg-green-100 text-green-800'
                      : 'bg-orange-100 text-orange-800'
                  }`}>
                    {installment.is_paid ? 'Pagada' : 'Pendiente'}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {Math.round(installment.percentage)}% - ${Math.round(installment.amount).toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">
                ${Math.round(installment.amount).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">
                {installment.due_date ? new Date(installment.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <QuickPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        installment={selectedInstallment}
        onPaymentUpdate={handlePaymentUpdate}
      />
    </>
  );
};

export default function Quotations({
  projects,
  quotationsSummary,
  quotationViewMode,
  setQuotationViewMode,
  showPaidInstallments,
  setShowPaidInstallments,
  quotationProjectFilter,
  setQuotationProjectFilter,
  quotationStatusFilter,
  setQuotationStatusFilter,
  quotationSearchFilter,
  setQuotationSearchFilter,
  quotationLoading,
  showQuotationModal,
  setShowQuotationModal,
  selectedQuotation,
  setSelectedQuotation,
  selectedProject,
  setSelectedProject,
  fetchQuotationsSummary,
  fetchAllProjectQuotations,
  getQuotationsByProject,
  clearQuotationFilters,
  getNextInstallment,
  formatDate,
  createQuotation,
  updateQuotation,
  deleteQuotation
}) {
  const { user, isAuthenticated } = useAuth();
  
  // Estados locales
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedQuotations, setExpandedQuotations] = useState(new Set());
  const [expandedProjects, setExpandedProjects] = useState(new Set());

  // Cargar datos iniciales si no se reciben como props
  useEffect(() => {
    if (isAuthenticated && user?.organization_id && (!projects || projects.length === 0)) {
      fetchAllData();
    } else if (projects && projects.length > 0) {
      setLoading(false);
    }
  }, [isAuthenticated, user, projects]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Cargar proyectos, clientes y estadísticas
      await Promise.all([
        fetchClients(),
        fetchQuotationsSummary()
      ]);
      
      // Cargar proyectos por separado para poder usarlos inmediatamente
      console.log('📊 Loading projects...');
      const session = JSON.parse(localStorage.getItem('session'));
      const projectsResponse = await fetch('http://localhost:8001/projects/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        console.log('📊 Projects loaded:', projectsData);
        
        // Cargar cotizaciones después de tener los proyectos
        await fetchAllProjectQuotations(projectsData);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      const response = await fetch('http://localhost:8001/clients/', {
        headers: {
          'Authorization': `Bearer ${session.token}`
        }
      });
      
      if (response.ok) {
        // No necesitamos setClients aquí ya que viene como prop
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const handlePaymentUpdate = async (updatedInstallment) => {
    // Mostrar mensaje de éxito
    setSuccessMessage(`Cuota ${updatedInstallment.is_paid ? 'marcada como pagada' : 'marcada como pendiente'} exitosamente`);
    setTimeout(() => setSuccessMessage(''), 3000);
    
    // Refrescar los datos para actualizar el estado
    try {
      await fetchQuotationsSummary();
      if (projects && projects.length > 0) {
        await fetchAllProjectQuotations(projects);
      }
    } catch (error) {
      console.error('Error refreshing data after payment update:', error);
    }
  };

  const handleDeleteQuotation = async (quotationId) => {
    try {
      await deleteQuotation(quotationId);
      // Mostrar mensaje de éxito
      setSuccessMessage('Cotización eliminada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refrescar los datos para actualizar el estado inmediatamente
      await fetchQuotationsSummary();
      if (projects && projects.length > 0) {
        await fetchAllProjectQuotations(projects);
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      setSuccessMessage('Error al eliminar la cotización');
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  // Función para calcular el total del proyecto de forma segura
  const calculateProjectTotal = (projectQuotationsList) => {
    if (!projectQuotationsList || projectQuotationsList.length === 0) return 0;
    
    const total = projectQuotationsList.reduce((sum, q) => {
      const amount = parseFloat(q.total_amount) || 0;
      return sum + amount;
    }, 0);
    
    return Math.round(total);
  };

  // Función para calcular cotizaciones abiertas (con cuotas pendientes)
  const calculateOpenQuotations = () => {
    if (!projects || projects.length === 0) return 0;
    
    let openCount = 0;
    projects.forEach(project => {
      const projectQuotations = getQuotationsByProject(project.project_id);
      projectQuotations.forEach(quotation => {
        // Una cotización está abierta si tiene cuotas pendientes
        if (quotation.total_pending > 0) {
          openCount++;
        }
      });
    });
    
    return openCount;
  };

  const toggleQuotationExpansion = (quotationId) => {
    setExpandedQuotations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quotationId)) {
        newSet.delete(quotationId);
      } else {
        newSet.add(quotationId);
      }
      return newSet;
    });
  };

  const toggleProjectExpansion = (projectId) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Cargando cotizaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con resumen de cotizaciones */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-200 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
              <FiDollarSign className="w-6 h-6 text-white" />
              </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Gestión de Cotizaciones</h3>
              <p className="text-gray-600">Administra las cotizaciones y cuotas de todos los proyectos</p>
            </div>
          </div>
                <button
            onClick={() => setShowQuotationModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 font-semibold shadow-lg flex items-center space-x-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nueva Cotización</span>
                </button>
        </div>

        {/* Resumen de cotizaciones */}
        {quotationsSummary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Cotizaciones Abiertas</p>
                  <p className="text-2xl font-bold text-gray-800">{calculateOpenQuotations()}</p>
                </div>
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiDollarSign className="w-6 h-6 text-purple-600" />
                </div>
            </div>
          </div>
          
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">${Math.round(quotationsSummary.total_paid).toLocaleString()}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <FiCheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pendiente</p>
                  <p className="text-2xl font-bold text-orange-600">${Math.round(quotationsSummary.total_pending).toLocaleString()}</p>
                </div>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FiClock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">% Pagado</p>
                  <p className="text-2xl font-bold text-blue-600">{Math.round(quotationsSummary.payment_percentage)}%</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiPercent className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros y controles */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Filtro de proyecto */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Proyecto</label>
            <select
                value={quotationProjectFilter}
                onChange={(e) => setQuotationProjectFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos los proyectos</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                </option>
              ))}
            </select>
            </div>

            {/* Filtro de estado */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por Estado</label>
              <select
                value={quotationStatusFilter}
                onChange={(e) => setQuotationStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="sent">Enviada</option>
                <option value="approved">Aprobada</option>
                <option value="rejected">Rechazada</option>
                <option value="expired">Expirada</option>
              </select>
            </div>

              {/* Búsqueda */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={quotationSearchFilter}
                onChange={(e) => setQuotationSearchFilter(e.target.value)}
                  placeholder="Buscar cotizaciones..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
      </div>

          {/* Controles alineados verticalmente con los inputs */}
          <div className="flex flex-col sm:flex-row items-end gap-4">
            {/* Toggle para mostrar cuotas pagadas - Mejorado */}
            <div className="flex items-center space-x-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showPaidInstallments}
                  onChange={(e) => setShowPaidInstallments(e.target.checked)}
                  className="w-4 h-4 text-green-600 border-green-300 rounded focus:ring-green-500 focus:ring-2"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar pagadas</span>
              </div>
              <div className="flex items-center space-x-1">
                <FiCheckCircle className={`w-4 h-4 ${showPaidInstallments ? 'text-green-600' : 'text-gray-400'}`} />
                <span className="text-xs text-gray-500">({quotationsSummary?.total_quotations || 0} total)</span>
              </div>
            </div>

            {/* Botones de vista - Ajustados para coincidir con altura de inputs */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1 h-[42px]">
              <button
                onClick={() => setQuotationViewMode('cards')}
                className={`h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                  quotationViewMode === 'cards' 
                    ? 'bg-white text-purple-600 shadow-sm transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                title="Vista de tarjetas"
              >
                <FiGrid className="w-4 h-4" />
              </button>
            <button
                onClick={() => setQuotationViewMode('table')}
                className={`h-8 w-8 flex items-center justify-center rounded-md transition-all duration-200 ${
                  quotationViewMode === 'table' 
                    ? 'bg-white text-purple-600 shadow-sm transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
                title="Vista de tabla"
              >
                <FiList className="w-4 h-4" />
              </button>
            </div>

            {/* Botón limpiar filtros - Ajustado para coincidir con altura de inputs */}
            <button
              onClick={clearQuotationFilters}
              className={`h-[42px] px-4 rounded-lg transition-all duration-200 flex items-center space-x-2 ${
                quotationProjectFilter || quotationStatusFilter || quotationSearchFilter
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                  : 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
              disabled={!quotationProjectFilter && !quotationStatusFilter && !quotationSearchFilter}
              title={quotationProjectFilter || quotationStatusFilter || quotationSearchFilter ? "Limpiar filtros activos" : "No hay filtros activos"}
            >
              <FiFilter className="w-4 h-4" />
              <span className="text-sm font-medium">Limpiar</span>
              {(quotationProjectFilter || quotationStatusFilter || quotationSearchFilter) && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
          </div>
          </div>
        </div>

      {/* Lista de cotizaciones */}
      <div className="space-y-6">
        {quotationLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Cargando cotizaciones...</span>
            </div>
                </div>
        ) : (
          <div className="space-y-6">
            {projects.map((project) => {
              const projectQuotationsList = getQuotationsByProject(project.project_id);
              
              if (projectQuotationsList.length === 0) return null;
              
              const isProjectExpanded = expandedProjects.has(project.project_id);
              
              return (
                <div key={project.project_id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Header del proyecto con botón de expansión */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleProjectExpansion(project.project_id)}
                          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                          title={isProjectExpanded ? 'Contraer proyecto' : 'Expandir proyecto'}
                        >
                          <FiChevronDown 
                            className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                              isProjectExpanded ? 'rotate-180' : ''
                            }`} 
                          />
                        </button>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <FiDollarSign className="w-5 h-5 text-white" />
                        </div>
                    <div>
                          <h4 className="text-lg font-semibold text-gray-800">{project.name}</h4>
                          <p className="text-sm text-gray-600">{projectQuotationsList.length} cotización{projectQuotationsList.length !== 1 ? 'es' : ''}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total del proyecto</p>
                        <p className="text-lg font-bold text-gray-800">
                          ${calculateProjectTotal(projectQuotationsList).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lista de cotizaciones - solo mostrar si el proyecto está expandido */}
                  {isProjectExpanded && (
                    <div className="p-6">
                      {quotationViewMode === 'cards' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {projectQuotationsList.map((quotation) => (
                            <div key={quotation.quotation_id} className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                              {/* Header de la cotización */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                                  quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  quotation.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {quotation.status === 'approved' ? 'Aprobada' :
                                   quotation.status === 'sent' ? 'Enviada' :
                                   quotation.status === 'rejected' ? 'Rechazada' :
                                   quotation.status === 'expired' ? 'Expirada' : 'Borrador'}
                                </span>
                                  <span className="text-sm text-gray-500">#{quotation.quotation_id}</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleQuotationExpansion(quotation.quotation_id)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    title={expandedQuotations.has(quotation.quotation_id) ? 'Ocultar cuotas' : 'Ver cuotas'}
                                  >
                                    <FiEye className="w-4 h-4" />
                                  </button>
                  <button
                                  onClick={() => {
                                    setSelectedQuotation(quotation);
                                      const projectForQuotation = projects.find(p => p.project_id === quotation.project_id);
                                      setSelectedProject(projectForQuotation);
                                    setShowQuotationModal(true);
                                  }}
                                    className="p-2 text-purple-600 hover:text-purple-800"
                                  title="Editar cotización"
                                >
                                    <FiEdit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteQuotation(quotation.quotation_id)}
                                    className="p-2 text-red-600 hover:text-red-800"
                                    title="Eliminar cotización"
                                  >
                                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
                              </div>

                              {/* Información principal */}
                              <div className="mb-4">
                                <h6 className="font-bold text-xl text-gray-800 mb-2">${Math.round(quotation.total_amount).toLocaleString()}</h6>
                                <p className="text-sm text-gray-600 mb-3">{quotation.description || 'Sin descripción'}</p>
                                
                                {/* Progreso de pagos */}
                                <div className="mb-4">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Progreso de pagos</span>
                                    <span className="text-gray-800 font-medium">
                                      {quotation.paid_installments || 0}/{quotation.total_installments || 0} cuotas
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                                      style={{ width: `${((quotation.paid_installments || 0) / (quotation.total_installments || 1)) * 100}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Resumen de montos */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="text-sm text-green-600 font-medium">Pagado</div>
                                    <div className="text-lg font-bold text-green-700">${Math.round(quotation.total_paid).toLocaleString()}</div>
                                  </div>
                                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <div className="text-sm text-orange-600 font-medium">Pendiente</div>
                                    <div className="text-lg font-bold text-orange-700">${Math.round(quotation.total_pending).toLocaleString()}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Cuotas expandibles */}
                              {expandedQuotations.has(quotation.quotation_id) && (
                                <div className="border-t border-gray-200 pt-4">
                                  <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                    <FiCreditCard className="w-4 h-4 mr-2" />
                                    Cuotas de Pago
                                  </h6>
                                  <InstallmentsList
                                    installments={quotation.installments}
                                    onPaymentUpdate={handlePaymentUpdate}
                                  />
                                </div>
                              )}

                              {/* Próxima cuota destacada */}
                              {(() => {
                                const nextInstallment = getNextInstallment(quotation);
                                return nextInstallment ? (
                                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-blue-600 font-medium">Próxima cuota</p>
                                        <p className="text-sm text-blue-800 font-semibold">${Math.round(nextInstallment.amount).toLocaleString()}</p>
                </div>
                                      <div className="text-right">
                                        <p className="text-xs text-blue-600">Vence</p>
                                        <p className="text-sm text-blue-800 font-medium">{formatDate(nextInstallment.due_date)}</p>
                </div>
                </div>
                                  </div>
                                ) : null;
                              })()}
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Vista de tabla mejorada con cuotas expandibles
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pendiente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cuotas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Próxima Cuota</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {projectQuotationsList.map((quotation) => (
                                <React.Fragment key={quotation.quotation_id}>
                                  <tr className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    #{quotation.quotation_id}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                                    {quotation.description || 'Sin descripción'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                      ${Math.round(quotation.total_amount).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      quotation.status === 'approved' ? 'bg-green-100 text-green-800' :
                                      quotation.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                      quotation.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                      quotation.status === 'expired' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {quotation.status === 'approved' ? 'Aprobada' :
                                       quotation.status === 'sent' ? 'Enviada' :
                                       quotation.status === 'rejected' ? 'Rechazada' :
                                       quotation.status === 'expired' ? 'Expirada' : 'Borrador'}
                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                                      ${Math.round(quotation.total_paid).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                                      ${Math.round(quotation.total_pending).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {quotation.paid_installments || 0}/{quotation.total_installments || 0}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                      ${Math.round(getNextInstallment(quotation)?.amount || 0).toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex items-center space-x-2">
                                        <button
                                          onClick={() => toggleQuotationExpansion(quotation.quotation_id)}
                                          className="text-blue-600 hover:text-blue-900"
                                          title={expandedQuotations.has(quotation.quotation_id) ? 'Ocultar cuotas' : 'Ver cuotas'}
                                        >
                                          <FiEye className="w-4 h-4" />
                                        </button>
                                    <button
                                      onClick={() => {
                                        setSelectedQuotation(quotation);
                                            const projectForQuotation = projects.find(p => p.project_id === quotation.project_id);
                                            setSelectedProject(projectForQuotation);
                                        setShowQuotationModal(true);
                                      }}
                                          className="text-purple-600 hover:text-purple-900"
                                      title="Editar cotización"
                                    >
                                          <FiEdit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                          onClick={() => handleDeleteQuotation(quotation.quotation_id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="Eliminar cotización"
                                    >
                                          <FiTrash2 className="w-4 h-4" />
                                    </button>
                                      </div>
                                    </td>
                                  </tr>
                                  {/* Fila expandible para cuotas */}
                                  {expandedQuotations.has(quotation.quotation_id) && (
                                    <tr className="bg-gray-50">
                                      <td colSpan="9" className="px-6 py-4">
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                          <h6 className="font-semibold text-gray-800 mb-3 flex items-center">
                                            <FiCreditCard className="w-4 h-4 mr-2" />
                                            Cuotas de Pago - {quotation.description || 'Sin descripción'}
                                          </h6>
                                          <InstallmentsList
                                            installments={quotation.installments}
                                            onPaymentUpdate={handlePaymentUpdate}
                                          />
                                        </div>
                                  </td>
                                </tr>
                                  )}
                                </React.Fragment>
                              ))}
                            </tbody>
                          </table>
                  </div>
                )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}

        {/* Mensaje cuando no hay proyectos con cotizaciones */}
        {!quotationLoading && projects.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FiDollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-xl font-medium">No hay proyectos disponibles</p>
            <p className="text-sm text-gray-400 mt-1">Crea un proyecto primero para poder agregar cotizaciones</p>
            </div>
        )}
      </div>

      {/* Modal de cotizaciones */}
      {showQuotationModal && (
        <QuotationModal
          isOpen={showQuotationModal}
          quotation={selectedQuotation}
          project={selectedProject}
          projects={projects}
          onClose={() => {
            setShowQuotationModal(false);
            setSelectedQuotation(null);
            setSelectedProject(null);
          }}
          onSave={async (quotationData) => {
            try {
              if (selectedQuotation) {
                await updateQuotation(selectedQuotation.quotation_id, quotationData);
              } else {
                await createQuotation(quotationData);
              }
              setShowQuotationModal(false);
              setSelectedQuotation(null);
              setSelectedProject(null);
            } catch (error) {
              console.error('Error saving quotation:', error);
            }
          }}
        />
      )}

      {/* Success message con React Portal */}
      {successMessage && createPortal(
        <div className="fixed bottom-4 right-4 z-50 animate-bounce">
          <div className="bg-gradient-to-r from-green-500 to-green-600 border border-green-400 text-white px-6 py-4 rounded-lg shadow-xl transform transition-all duration-300 hover:scale-105">
            <div className="flex items-center space-x-3">
              <div className="p-1 bg-white/20 rounded-full">
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <span className="font-medium">{successMessage}</span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}