import React, { useState } from "react";

const COLOR_OPTIONS = [
  { color: "bg-gray-100", textColor: "text-gray-700", label: "Gris" },
  { color: "bg-blue-50", textColor: "text-blue-700", label: "Azul" },
  { color: "bg-yellow-50", textColor: "text-yellow-700", label: "Amarillo" },
  { color: "bg-green-50", textColor: "text-green-700", label: "Verde" },
  { color: "bg-red-50", textColor: "text-red-700", label: "Rojo" },
  { color: "bg-purple-50", textColor: "text-purple-700", label: "Morado" }
];

export default function KanbanStatesManager({ states, setStates }) {
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({ key: "", label: "", color: COLOR_OPTIONS[0].color, textColor: COLOR_OPTIONS[0].textColor });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleColorChange = idx => {
    setForm({ ...form, color: COLOR_OPTIONS[idx].color, textColor: COLOR_OPTIONS[idx].textColor });
  };

  const handleAdd = () => {
    if (!form.key || !form.label) return;
    setStates([...states, { ...form }]);
    setForm({ key: "", label: "", color: COLOR_OPTIONS[0].color, textColor: COLOR_OPTIONS[0].textColor });
  };

  const handleEdit = idx => {
    setEditIndex(idx);
    setForm(states[idx]);
  };

  const handleUpdate = () => {
    if (!form.key || !form.label) return;
    setStates(states.map((st, i) => (i === editIndex ? { ...form } : st)));
    setEditIndex(null);
    setForm({ key: "", label: "", color: COLOR_OPTIONS[0].color, textColor: COLOR_OPTIONS[0].textColor });
  };

  const handleDelete = idx => {
    setStates(states.filter((_, i) => i !== idx));
    if (editIndex === idx) setEditIndex(null);
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      <h2 className="font-bold text-lg mb-4">Gestor de Estados Kanban</h2>
      <div className="mb-4 flex gap-2">
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          name="key"
          placeholder="Clave (ej: nuevo)"
          value={form.key}
          onChange={handleChange}
          disabled={editIndex !== null}
        />
        <input
          className="border rounded px-2 py-1 text-sm flex-1"
          name="label"
          placeholder="Etiqueta"
          value={form.label}
          onChange={handleChange}
        />
        <select
          className="border rounded px-2 py-1 text-sm"
          value={form.color}
          onChange={e => handleColorChange(COLOR_OPTIONS.findIndex(opt => opt.color === e.target.value))}
        >
          {COLOR_OPTIONS.map((opt, idx) => (
            <option key={idx} value={opt.color}>{opt.label}</option>
          ))}
        </select>
        {editIndex === null ? (
          <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={handleAdd}>Agregar</button>
        ) : (
          <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={handleUpdate}>Actualizar</button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Clave</th>
            <th className="text-left">Etiqueta</th>
            <th className="text-left">Color</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {states.map((st, idx) => (
            <tr key={st.key}>
              <td>{st.key}</td>
              <td>{st.label}</td>
              <td>
                <span className={`${st.color} ${st.textColor} px-2 py-1 rounded`}>{st.label}</span>
              </td>
              <td>
                <button className="text-blue-600 mr-2" onClick={() => handleEdit(idx)}>Editar</button>
                <button className="text-red-600" onClick={() => handleDelete(idx)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}