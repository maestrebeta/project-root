import React, { useState, useEffect } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { handleAuthError } from '../../utils/authUtils';

const DAYS_OF_WEEK = [
  { id: 1, name: 'Lunes', short: 'L' },
  { id: 2, name: 'Martes', short: 'M' },
  { id: 3, name: 'Miércoles', short: 'X' },
  { id: 4, name: 'Jueves', short: 'J' },
  { id: 5, name: 'Viernes', short: 'V' },
  { id: 6, name: 'Sábado', short: 'S' },
  { id: 7, name: 'Domingo', short: 'D' }
];

export default function WorkHoursSettings() {
  const theme = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [config, setConfig] = useState({
    start_time: '08:00',
    end_time: '17:00',
    lunch_break_start: '12:00',
    lunch_break_end: '13:00',
    working_days: [1, 2, 3, 4, 5], // Lunes a Viernes por defecto
    daily_hours: 8,
    effective_daily_hours: 7
  });

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
    } catch (error) {
      throw new Error('Error de autenticación');
    }
  };

  const fetchWorkHoursConfig = async () => {
    if (!user?.organization_id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `http://localhost:8001/organizations/${user.organization_id}/work-hours`,
        {
          method: 'GET',
          headers,
          credentials: 'include'
        }
      );

      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar configuración');
      }

      const data = await response.json();
      setConfig(data.work_hours_config || config);
    } catch (error) {
      console.error('Error:', error);
      handleAuthError(error);
    } finally {
      setLoading(false);
    }
  };

  const saveWorkHoursConfig = async () => {
    if (!user?.organization_id) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const headers = getAuthHeaders();
      const response = await fetch(
        `http://localhost:8001/organizations/${user.organization_id}/work-hours`,
        {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify(config)
        }
      );

      if (response.status === 401) {
        handleAuthError(new Error('Unauthorized'), response);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al guardar configuración');
      }

      const data = await response.json();
      setConfig(data.work_hours_config);
      setSuccess('Configuración guardada exitosamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      handleAuthError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleTimeChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkingDayToggle = (dayId) => {
    setConfig(prev => ({
      ...prev,
      working_days: prev.working_days.includes(dayId)
        ? prev.working_days.filter(id => id !== dayId)
        : [...prev.working_days, dayId].sort()
    }));
  };

  const calculateHours = () => {
    const startTime = new Date(`2000-01-01T${config.start_time}:00`);
    const endTime = new Date(`2000-01-01T${config.end_time}:00`);
    const lunchStart = new Date(`2000-01-01T${config.lunch_break_start}:00`);
    const lunchEnd = new Date(`2000-01-01T${config.lunch_break_end}:00`);
    
    const totalMinutes = (endTime - startTime) / (1000 * 60);
    const lunchMinutes = (lunchEnd - lunchStart) / (1000 * 60);
    
    const dailyHours = totalMinutes / 60;
    const effectiveDailyHours = (totalMinutes - lunchMinutes) / 60;
    
    return {
      daily_hours: Math.round(dailyHours * 100) / 100,
      effective_daily_hours: Math.round(effectiveDailyHours * 100) / 100
    };
  };

  useEffect(() => {
    fetchWorkHoursConfig();
  }, [user?.organization_id]);

  useEffect(() => {
    const calculatedHours = calculateHours();
    setConfig(prev => ({
      ...prev,
      ...calculatedHours
    }));
  }, [config.start_time, config.end_time, config.lunch_break_start, config.lunch_break_end]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="material-icons-outlined text-blue-600">schedule</span>
            Configuración de Horas de Trabajo
          </h2>
          <p className="text-gray-600 mt-2">
            Define los horarios de trabajo de tu organización para cálculos precisos de estimaciones de proyectos
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-xl">error_outline</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-xl">check_circle</span>
              {success}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Horarios de trabajo */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-blue-600">access_time</span>
              Horarios de Trabajo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio
                </label>
                <input
                  type="time"
                  value={config.start_time}
                  onChange={(e) => handleTimeChange('start_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Fin
                </label>
                <input
                  type="time"
                  value={config.end_time}
                  onChange={(e) => handleTimeChange('end_time', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inicio de Almuerzo
                </label>
                <input
                  type="time"
                  value={config.lunch_break_start}
                  onChange={(e) => handleTimeChange('lunch_break_start', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fin de Almuerzo
                </label>
                <input
                  type="time"
                  value={config.lunch_break_end}
                  onChange={(e) => handleTimeChange('lunch_break_end', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Días laborables */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-blue-600">calendar_today</span>
              Días Laborables
            </h3>
            
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.id}
                  onClick={() => handleWorkingDayToggle(day.id)}
                  className={`
                    p-3 rounded-lg border-2 transition-all duration-200 text-center
                    ${config.working_days.includes(day.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="font-bold text-lg">{day.short}</div>
                  <div className="text-xs mt-1">{day.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Resumen de horas */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <span className="material-icons-outlined">analytics</span>
              Resumen de Horas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{config.daily_hours}h</div>
                <div className="text-sm text-gray-600">Horas Totales por Día</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{config.effective_daily_hours}h</div>
                <div className="text-sm text-gray-600">Horas Efectivas por Día</div>
              </div>
              
              <div className="bg-white rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {config.effective_daily_hours * config.working_days.length}h
                </div>
                <div className="text-sm text-gray-600">Horas Efectivas por Semana</div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="material-icons-outlined text-sm mr-1">info</span>
                <strong>Nota:</strong> Las horas efectivas se usan para calcular automáticamente las estimaciones de tiempo de los proyectos, 
                considerando los días laborables y descontando el tiempo de almuerzo.
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              onClick={() => fetchWorkHoursConfig()}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Restablecer
            </button>
            
            <button
              onClick={saveWorkHoursConfig}
              disabled={saving}
              className={`${theme.PRIMARY_BUTTON_CLASS} px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50`}
            >
              {saving && <span className="material-icons-outlined animate-spin text-lg">refresh</span>}
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 