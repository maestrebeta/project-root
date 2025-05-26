import React from 'react';
import { FiClock, FiCalendar, FiTrendingUp } from 'react-icons/fi';

/**
 * EstadisticasPanel
 * Recibe las estadísticas ya calculadas como props desde TimeTracker.jsx.
 * Muestra horas y entradas de hoy, semana y puntos de productividad.
 */
const EstadisticasPanel = ({
  todayHours = 0,
  todayEntries = 0,
  weekHours = 0,
  weekEntries = 0,
  productivityPoints = 0,
  loading = false,
}) => {
  // Convertir a número y asegurar un valor por defecto
  const safeHours = (hours) => {
    const numHours = Number(hours);
    return isNaN(numHours) ? '0.00' : numHours.toFixed(2);
  };

  return (
    <section
      aria-label="Panel de estadísticas"
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
    >
      {/* Hoy */}
      <div
        className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 flex flex-col justify-between transition hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-400"
        tabIndex={0}
        aria-label={`Hoy: ${todayHours} horas, ${todayEntries} entradas`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-600">Hoy</h3>
            <p className="text-3xl font-extrabold text-gray-900" aria-live="polite">
              {loading ? '...' : safeHours(todayHours)} horas
            </p>
          </div>
          <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
            <FiClock className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {loading ? 'Cargando...' : `${todayEntries} entradas hoy`}
        </div>
      </div>
      {/* Semana */}
      <div
        className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 flex flex-col justify-between transition hover:shadow-xl focus-within:ring-2 focus-within:ring-green-400"
        tabIndex={0}
        aria-label={`Esta semana: ${weekHours} horas, ${weekEntries} entradas`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-600">Esta semana</h3>
            <p className="text-3xl font-extrabold text-gray-900" aria-live="polite">
              {loading ? '...' : safeHours(weekHours)} horas
            </p>
          </div>
          <div className="bg-green-100 text-green-600 p-3 rounded-lg">
            <FiCalendar className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {loading ? 'Cargando...' : `${weekEntries} entradas`}
        </div>
      </div>
      {/* Productividad */}
      <div
        className="bg-white shadow-lg rounded-xl p-6 border border-gray-100 flex flex-col justify-between transition hover:shadow-xl focus-within:ring-2 focus-within:ring-purple-400"
        tabIndex={0}
        aria-label={`Productividad: ${productivityPoints} puntos`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-600">Productividad</h3>
            <p className="text-3xl font-extrabold text-gray-900" aria-live="polite">
              {loading ? '...' : productivityPoints} pts
            </p>
          </div>
          <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
            <FiTrendingUp className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          {loading ? 'Cargando...' : 'Puntos acumulados'}
        </div>
      </div>
    </section>
  );
};

export default EstadisticasPanel;