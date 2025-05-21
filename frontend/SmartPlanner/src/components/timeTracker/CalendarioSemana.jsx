import React, { useState } from "react";
import { FiX, FiPlus, FiEdit2, FiTrash2, FiChevronLeft, FiChevronRight } from "react-icons/fi";
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
}) => {
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    hour: new Date().getHours(),
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);
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
    setFormData({
      entry_date: format(date, "yyyy-MM-dd"),
      start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${(hour + 1).toString().padStart(2, "0")}:00`,
      description: "",
      project_id: "",
      etiquetas: [],
      activity_type: "",
      billable: true,
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl relative">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Semana anterior"
            >
              <FiChevronLeft />
            </button>
            <button
              onClick={handleToday}
              className={`px-3 py-1 rounded-md bg-${theme.PRIMARY_COLOR}-50 text-${theme.PRIMARY_COLOR}-700 font-medium text-sm hover:bg-${theme.PRIMARY_COLOR}-100`}
            >
              Hoy
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none"
              aria-label="Semana siguiente"
            >
              <FiChevronRight />
            </button>
            <span className="ml-4 text-lg font-bold text-gray-900">
              Semana del {format(weekDays[0], "d MMM", { locale: es })} al {format(weekDays[6], "d MMM yyyy", { locale: es })}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500" aria-label="Cerrar calendario">
            <FiX className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="w-20"></th>
                {weekDays.map((day) => (
                  <th
                    key={day}
                    className={`text-center px-2 py-2 text-xs font-semibold uppercase tracking-wide ${
                      isToday(day) ? `text-${theme.PRIMARY_COLOR}-700` : "text-gray-500"
                    }`}
                  >
                    <div
                      className={`flex flex-col items-center ${
                        isToday(day) ? `bg-${theme.PRIMARY_COLOR}-50 rounded-lg px-2 py-1` : ""
                      }`}
                    >
                      <span>{format(day, "EEE", { locale: es })}</span>
                      <span className="text-base font-bold">{format(day, "d")}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map((hour) => (
                <tr key={hour}>
                  <td className="text-right pr-2 text-xs text-gray-400 font-mono align-top pt-2">
                    {hour}:00
                  </td>
                  {weekDays.map((day) => {
                    const key = `${format(day, "yyyy-MM-dd")}_${hour}`;
                    const entry = entriesByDayHour[key];
                    const isSelected =
                      selectedCell.date === format(day, "yyyy-MM-dd") && selectedCell.hour === hour;
                    return (
                      <td
                        key={key}
                        className={`relative group h-16 min-w-[120px] align-top transition cursor-pointer ${
                          isToday(day) && hour === new Date().getHours()
                            ? `bg-${theme.PRIMARY_COLOR}-50`
                            : "bg-white"
                        } ${isSelected ? `ring-2 ring-${theme.PRIMARY_COLOR}-400` : `hover:bg-${theme.PRIMARY_COLOR}-100`}`}
                        tabIndex={0}
                        aria-label={
                          entry
                            ? `Entrada: ${entry.description}, Proyecto: ${entry.project || "Sin proyecto"}`
                            : `Agregar entrada el ${format(day, "EEEE d", { locale: es })} a las ${hour}:00`
                        }
                        onClick={() =>
                          entry ? handleEntryClick(entry) : handleCellClick(day, hour)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            entry ? handleEntryClick(entry) : handleCellClick(day, hour);
                          }
                        }}
                      >
                        {entry ? (
                          <div className={`absolute inset-1 bg-${theme.PRIMARY_COLOR}-100 border border-${theme.PRIMARY_COLOR}-300 rounded-lg px-2 py-1 flex flex-col justify-between shadow group-hover:bg-${theme.PRIMARY_COLOR}-200 transition`}>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-semibold text-${theme.PRIMARY_COLOR}-900 truncate`}>
                                {entry.description}
                              </span>
                              <span className={`ml-2 text-xs text-${theme.PRIMARY_COLOR}-700 font-mono`}>
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {entry.etiquetas &&
                                entry.etiquetas.map((tag) => (
                                  <span
                                    key={tag}
                                    className={`
                                      bg-${theme.PRIMARY_COLOR}-200
                                      text-${theme.PRIMARY_COLOR}-800
                                      rounded-full px-2 py-0.5 text-xxs font-medium
                                    `}
                                  >
                                    {tag}
                                  </span>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition">
                            <FiPlus className={`text-${theme.PRIMARY_COLOR}-400`} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
          />
        )}
      </div>
    </div>
  );
};

export default CalendarioSemana;