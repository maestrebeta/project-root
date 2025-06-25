import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { FiDollarSign, FiCalendar, FiPercent, FiTrash2, FiPlus, FiCheck, FiAlertCircle } from 'react-icons/fi';

const QuotationModal = ({ quotation, project, projects, onClose, onSave, isOpen }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    project_id: project?.project_id || '',
    total_amount: quotation?.total_amount || '',
    currency: quotation?.currency || 'COP',
    status: quotation?.status || 'draft',
    description: quotation?.description || '',
    installments: quotation?.installments || [
      { installment_number: 1, percentage: 50, amount: 0, due_date: '', notes: 'Pago inicial' },
      { installment_number: 2, percentage: 50, amount: 0, due_date: '', notes: 'Pago final' }
    ]
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentProject, setCurrentProject] = useState(project);

  // Calcular montos de cuotas cuando cambia el monto total
  const calculateInstallmentAmount = (percentage, totalAmount) => {
    return (parseFloat(percentage) / 100) * parseFloat(totalAmount);
  };

  // Función para formatear moneda
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: formData.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleTotalAmountChange = (value) => {
    const total = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      total_amount: value,
      installments: prev.installments.map(installment => ({
        ...installment,
        amount: calculateInstallmentAmount(installment.percentage, total)
      }))
    }));
  };

  const handleInstallmentChange = (index, field, value) => {
    const newInstallments = [...formData.installments];
    
    if (field === 'percentage') {
      const percentage = parseFloat(value) || 0;
      newInstallments[index] = {
        ...newInstallments[index],
        percentage,
        amount: calculateInstallmentAmount(percentage, formData.total_amount)
      };
    } else {
      newInstallments[index] = {
        ...newInstallments[index],
        [field]: value
      };
    }

    setFormData(prev => ({
      ...prev,
      installments: newInstallments
    }));
  };

  const addInstallment = () => {
    const newInstallmentNumber = formData.installments.length + 1;
    const totalPercentage = formData.installments.reduce((sum, inst) => sum + parseFloat(inst.percentage || 0), 0);
    const remainingPercentage = Math.max(0, 100 - totalPercentage);
    
    setFormData(prev => ({
      ...prev,
      installments: [
        ...prev.installments,
        {
          installment_number: newInstallmentNumber,
          percentage: remainingPercentage,
          amount: calculateInstallmentAmount(remainingPercentage, prev.total_amount),
          due_date: '',
          notes: `Cuota ${newInstallmentNumber}`
        }
      ]
    }));
  };

  const removeInstallment = (index) => {
    if (formData.installments.length <= 1) return;
    
    const newInstallments = formData.installments.filter((_, i) => i !== index);
    // Renumerar las cuotas
    const renumberedInstallments = newInstallments.map((inst, i) => ({
      ...inst,
      installment_number: i + 1
    }));
    
    setFormData(prev => ({
      ...prev,
      installments: renumberedInstallments
    }));
  };

  // Función para distribuir porcentajes automáticamente sin decimales
  const autoDistributePercentages = () => {
    const count = formData.installments.length;
    const equalPercentage = Math.floor(100 / count); // Sin decimales
    
    // Distribuir el porcentaje igual entre todas las cuotas
    const newInstallments = formData.installments.map((inst, index) => {
      // Para la última cuota, usar el porcentaje restante para asegurar 100%
      const isLast = index === formData.installments.length - 1;
      const percentage = isLast ? 
        100 - (equalPercentage * (count - 1)) : 
        equalPercentage;
      
      return {
        ...inst,
        percentage,
        amount: calculateInstallmentAmount(percentage, formData.total_amount)
      };
    });
    
    setFormData(prev => ({
      ...prev,
      installments: newInstallments
    }));
  };

  // Validación por paso
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.project_id) newErrors.project_id = 'Proyecto es requerido';
      if (!formData.total_amount || parseFloat(formData.total_amount) <= 0) {
        newErrors.total_amount = 'Monto total debe ser mayor a 0';
      }
    }
    if (step === 2) {
      const totalPercentage = formData.installments.reduce((sum, inst) => sum + parseFloat(inst.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        newErrors.installments = 'El total de porcentajes debe ser 100%';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setLoading(true);
    try {
      const processedData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount),
        installments: formData.installments.map((inst, index) => ({
          installment_number: index + 1,
          percentage: parseFloat(inst.percentage),
          amount: parseFloat(inst.amount || 0),
          due_date: inst.due_date || null,
          is_paid: inst.is_paid || false,
          paid_date: inst.paid_date || null,
          payment_reference: inst.payment_reference || null,
          notes: inst.notes || null
        }))
      };
      await onSave(processedData);
    } catch {
      // Manejo de error visual
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quotation) {
      setFormData({
        project_id: quotation.project_id,
        total_amount: quotation.total_amount,
        currency: quotation.currency || 'COP',
        status: quotation.status,
        description: quotation.description,
        installments: quotation.installments || []
      });
      
      // Si tenemos la cotización, buscar el proyecto correspondiente en la lista de proyectos
      if (quotation.project_id && projects && projects.length > 0) {
        const foundProject = projects.find(p => p.project_id === quotation.project_id);
        if (foundProject) {
          setCurrentProject(foundProject);
        } else {
          // Si no se encuentra, crear un placeholder
          setCurrentProject({
            project_id: quotation.project_id,
            name: `Proyecto ID: ${quotation.project_id}`
          });
        }
      }
    } else if (project) {
      // Si es una nueva cotización, usar el proyecto seleccionado
      setFormData(prev => ({
        ...prev,
        project_id: project.project_id
      }));
      setCurrentProject(project);
    }
    setCurrentStep(1);
    setErrors({});
  }, [quotation, project, projects]);

  if (!isOpen) return null;

  // Calcular totales para mostrar
  const totalPercentage = formData.installments.reduce((sum, inst) => sum + parseFloat(inst.percentage || 0), 0);
  const totalAmount = formData.installments.reduce((sum, inst) => sum + parseFloat(inst.amount || 0), 0);
  const isPercentageValid = Math.abs(totalPercentage - 100) < 0.01;
  const isAmountValid = Math.abs(totalAmount - parseFloat(formData.total_amount || 0)) < 0.01;

  // Renderizado de pasos
  const renderStep1 = () => (
    <div
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Proyecto</label>
          {quotation ? (
            // Al editar: mostrar como campo de solo lectura
            <input
              type="text"
              value={currentProject?.name || 'Proyecto no encontrado'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          ) : (
            // Al crear nueva: mostrar como selector
            <select
              value={formData.project_id}
              onChange={(e) => {
                const selectedProject = projects?.find(p => p.project_id === parseInt(e.target.value));
                setFormData(prev => ({ ...prev, project_id: parseInt(e.target.value) }));
                setCurrentProject(selectedProject);
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.project_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleccionar proyecto</option>
              {projects && projects.length > 0 ? (
                projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>No hay proyectos disponibles</option>
              )}
            </select>
          )}
          {errors.project_id && (
            <p className="text-red-500 text-sm mt-1">{errors.project_id}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="approved">Aprobada</option>
            <option value="rejected">Rechazada</option>
            <option value="expired">Expirada</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Monto Total *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'COP' ? '$' : '$'}
            </span>
            <input
              type="number"
              step="1"
              value={formData.total_amount}
              onChange={(e) => handleTotalAmountChange(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.total_amount ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0"
            />
          </div>
          {errors.total_amount && (
            <p className="text-red-500 text-sm mt-1">{errors.total_amount}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Moneda</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="COP">COP - Peso Colombiano</option>
            <option value="USD">USD - Dólar Estadounidense</option>
            <option value="EUR">EUR - Euro</option>
            <option value="MXN">MXN - Peso Mexicano</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Descripción detallada de la cotización..."
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div
      className="space-y-6"
    >
      {/* Header con controles */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Cuotas de Pago</h3>
          <p className="text-sm text-gray-600 mt-1">Configura las cuotas y fechas de pago</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={autoDistributePercentages}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <FiPercent className="w-4 h-4" />
            Distribuir Igual
          </button>
          <button
            type="button"
            onClick={addInstallment}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Agregar Cuota
          </button>
        </div>
      </div>

      {/* Resumen visual */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formData.installments.length}</div>
            <div className="text-sm text-gray-600">Cuotas</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isPercentageValid ? 'text-green-600' : 'text-red-600'}`}>
              {Math.round(totalPercentage)}%
            </div>
            <div className="text-sm text-gray-600">Total %</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${isAmountValid ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalAmount)}
            </div>
            <div className="text-sm text-gray-600">Total Monto</div>
          </div>
        </div>
        
        {/* Barra de progreso visual */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progreso de porcentajes</span>
            <span>{Math.round(totalPercentage)}% / 100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isPercentageValid ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de error */}
      {errors.installments && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{errors.installments}</p>
        </div>
      )}

      {/* Lista de cuotas */}
      <div className="space-y-4">
        {formData.installments.map((installment, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header de la cuota */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-semibold">
                  {installment.installment_number}
                </div>
                <h4 className="font-semibold text-gray-800">Cuota {installment.installment_number}</h4>
              </div>
              <button
                type="button"
                onClick={() => removeInstallment(index)}
                disabled={formData.installments.length <= 1}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                title="Eliminar cuota"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Campos de la cuota */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiPercent className="w-4 h-4" />
                  Porcentaje (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={installment.percentage}
                    onChange={(e) => handleInstallmentChange(index, 'percentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiDollarSign className="w-4 h-4" />
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'COP' ? '$' : '$'}
                  </span>
                  <input
                    type="text"
                    value={formatCurrency(installment.amount)}
                    disabled
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <FiCalendar className="w-4 h-4" />
                  Fecha Vencimiento
                </label>
                <input
                  type="date"
                  value={installment.due_date}
                  onChange={(e) => handleInstallmentChange(index, 'due_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notas */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
              <input
                type="text"
                value={installment.notes}
                onChange={(e) => handleInstallmentChange(index, 'notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Descripción de esta cuota..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render principal del modal
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                {quotation ? 'Editar Cotización' : 'Nueva Cotización'}
              </h2>
              <p className="text-purple-100 mt-1">
                {quotation ? 'Modifica los detalles de la cotización' : 'Crea una nueva cotización para el proyecto'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Indicadores de pasos */}
          <div className="flex items-center justify-center mt-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 1 ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 mx-2 ${currentStep >= 2 ? 'bg-white' : 'bg-white/30'}`} />
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= 2 ? 'bg-white text-purple-600' : 'bg-white/30 text-white'
              }`}>
                2
              </div>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <div
                key="step1"
                className="transition-all duration-300"
              >
                {renderStep1()}
              </div>
            )}
            {currentStep === 2 && (
              <div
                key="step2"
                className="transition-all duration-300"
              >
                {renderStep2()}
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
            {currentStep > 1 && (
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
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                Siguiente
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || !isPercentageValid || !isAmountValid}
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
                    Guardar Cotización
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuotationModal; 