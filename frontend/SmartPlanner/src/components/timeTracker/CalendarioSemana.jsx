import React, { useState } from "react";
import ReactDOM from 'react-dom';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight, FiClock } from "react-icons/fi";
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns";
import es from "date-fns/locale/es";
import FormularioEntrada from "./FormularioEntrada";
import { useAppTheme } from "../../context/ThemeContext";

const HOURS = Array.from({ length: 12 }, (_, i) => 7 + i); // 7:00 a 18:00

function getWeekDays(referenceDate = new Date()) {
  const start = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Lunes
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

const mockEntries = [
  // Ejemplo de entrada
  // { id, date, start_time, end_time, description, project, etiquetas }
];

const CalendarioSemana = ({
  onClose,
  onSelectEntry = () => {},
  entries = mockEntries,
  onCreate = () => {},
  onEdit = () => {},
  onDelete = () => {},
  projects = [],
  tags = [],
  organizationStates = null,
}) => {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    hour: new Date().getHours(),
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const theme = useAppTheme();
  const weekDays = getWeekDays(referenceDate);

  // Agrupa entradas por día y hora
  const entriesByDayHour = {};
  entries.forEach((entry) => {
    const key = `${entry.date}_${parseInt(entry.start_time)}`;
    entriesByDayHour[key] = entry;
  });

  // UX: Al hacer clic en celda vacía, abre formulario rápido
  const handleCellClick = (date, hour) => {
    setSelectedCell({ date: format(date, "yyyy-MM-dd"), hour });
    
    // Obtener la hora actual para calcular la hora de fin
    const endHour = hour + 1;
    
    setFormData({
      entry_date: format(date, "yyyy-MM-dd"),
      start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${endHour.toString().padStart(2, "0")}:00`,
      description: "",
      project_id: "",
      etiquetas: [],
      activity_type: "", // Se establecerá automáticamente en FormularioEntrada
      billable: true,
      // Agregar datos adicionales para mejor integración
      date: format(date, "yyyy-MM-dd"),
      hour: hour
    });
    setShowForm(true);
  };

  // UX: Al hacer clic en entrada, permite editar
  const handleEntryClick = (entry) => {
    setFormData({
      ...entry,
      entry_date: entry.date || entry.entry_date,
      start_time: entry.start_time,
      end_time: entry.end_time,
      description: entry.description,
      project_id: entry.project_id || entry.project,
      etiquetas: entry.etiquetas || entry.tags || [],
      activity_type: entry.activity_type || "",
      billable: typeof entry.billable === "boolean" ? entry.billable : true,
    });
    setShowForm(true);
  };

  // UX: Navegación de semana
  const handlePrevWeek = () => setReferenceDate(addDays(referenceDate, -7));
  const handleNextWeek = () => setReferenceDate(addDays(referenceDate, 7));
  const handleToday = () => setReferenceDate(new Date());

  // Guardar entrada usando FormularioEntrada
  const handleFormSubmit = async (data) => {
    await (data.id || data.entry_id ? onEdit(data) : onCreate(data));
    setShowForm(false);
    setFormData(null);
    onClose();
  };

  // Eliminar entrada
  const handleDelete = async (id) => {
    await onDelete(id);
    setShowForm(false);
    setFormData(null);
  };

  // Función para obtener el color de fondo de la celda
  const getCellBackground = (day, hour, isSelected, isHovered) => {
    const now = new Date();
    const isCurrentHour = isToday(day) && hour === now.getHours();
    
    if (isSelected) {
      return `bg-${theme.PRIMARY_COLOR}-100 border-2 border-${theme.PRIMARY_COLOR}-400`;
    }
    
    if (isHovered) {
      return `bg-${theme.PRIMARY_COLOR}-50 border border-${theme.PRIMARY_COLOR}-200`;
    }
    
    if (isCurrentHour) {
      return `bg-${theme.PRIMARY_COLOR}-25 border border-${theme.PRIMARY_COLOR}-100`;
    }
    
    // Alternar colores de fondo para mejor legibilidad
    return hour % 2 === 0 ? 'bg-gray-25 border border-gray-100' : 'bg-white border border-gray-100';
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
              aria-label="Semana anterior"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className={`px-4 py-2 rounded-lg bg-${theme.PRIMARY_COLOR}-100 text-${theme.PRIMARY_COLOR}-700 font-medium text-sm hover:bg-${theme.PRIMARY_COLOR}-200 transition-colors flex items-center gap-2`}
            >
              <FiClock className="w-4 h-4" />
              Hoy
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none transition-colors"
              aria-label="Semana siguiente"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">
                Semana del {format(weekDays[0], "d MMM", { locale: es })} al {format(weekDays[6], "d MMM yyyy", { locale: es })}
              </h2>
              <p className="text-sm text-gray-500">Haz clic en cualquier hora para agregar una entrada</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
            aria-label="Cerrar calendario"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Calendario */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="w-20 p-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Hora
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day}
                      className={`p-3 text-center border-l border-gray-200 ${
                        isToday(day) ? `bg-${theme.PRIMARY_COLOR}-50` : "bg-gray-50"
                      }`}
                    >
                      <div className={`flex flex-col items-center ${
                        isToday(day) ? `bg-${theme.PRIMARY_COLOR}-100 rounded-lg px-3 py-2` : ""
                      }`}>
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          isToday(day) ? `text-${theme.PRIMARY_COLOR}-700` : "text-gray-500"
                        }`}>
                          {format(day, "EEE", { locale: es })}
                        </span>
                        <span className={`text-lg font-bold ${
                          isToday(day) ? `text-${theme.PRIMARY_COLOR}-900` : "text-gray-900"
                        }`}>
                          {format(day, "d")}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="group">
                    <td className="p-3 text-right text-sm font-mono text-gray-500 border-r border-gray-200 bg-gray-25 align-top">
                      <div className="flex items-center justify-end gap-1">
                        <span>{hour.toString().padStart(2, "0")}:00</span>
                      </div>
                    </td>
                    {weekDays.map((day) => {
                      const key = `${format(day, "yyyy-MM-dd")}_${hour}`;
                      const entry = entriesByDayHour[key];
                      const isSelected = selectedCell.date === format(day, "yyyy-MM-dd") && selectedCell.hour === hour;
                      const isHovered = hoveredCell === key;
                      const now = new Date();
                      const isCurrentHour = isToday(day) && hour === now.getHours();
                      
                      return (
                        <td
                          key={key}
                          className={`relative h-20 min-w-[140px] align-top transition-all duration-200 cursor-pointer border-l border-gray-200 ${
                            getCellBackground(day, hour, isSelected, isHovered)
                          }`}
                          onMouseEnter={() => setHoveredCell(key)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => entry ? handleEntryClick(entry) : handleCellClick(day, hour)}
                          tabIndex={0}
                          aria-label={
                            entry
                              ? `Entrada: ${entry.description}, Proyecto: ${entry.project || "Sin proyecto"}`
                              : `Agregar entrada el ${format(day, "EEEE d", { locale: es })} a las ${hour}:00`
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              entry ? handleEntryClick(entry) : handleCellClick(day, hour);
                            }
                          }}
                        >
                          {/* Indicador de hora actual */}
                          {isCurrentHour && (
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-${theme.PRIMARY_COLOR}-500`}></div>
                          )}
                          
                          {/* Contenido de la celda */}
                          <div className="p-2 h-full flex flex-col">
                            {entry ? (
                              // Entrada existente
                              <div className={`h-full bg-${theme.PRIMARY_COLOR}-100 border border-${theme.PRIMARY_COLOR}-300 rounded-lg p-2 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group-hover:bg-${theme.PRIMARY_COLOR}-200`}>
                                <div className="flex items-start justify-between">
                                  <span className={`text-xs font-semibold text-${theme.PRIMARY_COLOR}-900 truncate flex-1`}>
                                    {entry.description}
                                  </span>
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEntryClick(entry);
                                      }}
                                      className={`p-1 rounded text-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-200 transition-colors`}
                                      title="Editar"
                                    >
                                      <FiEdit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('¿Eliminar esta entrada?')) {
                                          handleDelete(entry.id || entry.entry_id);
                                        }
                                      }}
                                      className="p-1 rounded text-red-600 hover:bg-red-100 transition-colors"
                                      title="Eliminar"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="mt-1">
                                  <span className={`text-xs text-${theme.PRIMARY_COLOR}-700 font-mono`}>
                                    {entry.start_time} - {entry.end_time}
                                  </span>
                                  {entry.etiquetas && entry.etiquetas.length > 0 && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {entry.etiquetas.slice(0, 2).map((tag, index) => (
                                        <span
                                          key={tag}
                                          className={`bg-${theme.PRIMARY_COLOR}-200 text-${theme.PRIMARY_COLOR}-800 rounded-full px-1.5 py-0.5 text-xxs font-medium`}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                      {entry.etiquetas.length > 2 && (
                                        <span className={`text-xxs text-${theme.PRIMARY_COLOR}-600`}>
                                          +{entry.etiquetas.length - 2}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Celda vacía
                              <div className="h-full flex items-center justify-center group-hover:bg-gray-50 rounded-lg transition-colors">
                                <div className={`flex items-center gap-2 text-gray-400 group-hover:text-${theme.PRIMARY_COLOR}-500 transition-colors ${
                                  isHovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                }`}>
                                  <FiPlus className="w-4 h-4" />
                                  <span className="text-xs font-medium">Agregar</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FormularioEntrada como modal */}
        {showForm && (
          <FormularioEntrada
            editId={formData?.id || formData?.entry_id}
            initialData={formData}
            onClose={() => {
              setShowForm(false);
              setFormData(null);
            }}
            onSubmit={handleFormSubmit}
            organizationStates={organizationStates}
          />
        )}
      </div>
    </div>,
    document.getElementById('root')
  );
};

export default CalendarioSemana;