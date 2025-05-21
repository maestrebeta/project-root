import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiInfo, FiCopy } from "react-icons/fi";
import { useHotkeys } from "react-hotkeys-hook";
import { Tooltip } from "react-tippy";
import { useAppTheme } from "../../context/ThemeContext";
import "react-tippy/dist/tippy.css";

const COLOR_PALETTES = [
  { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200", label: "Gris", class: "gray" },
  { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", label: "Azul", class: "blue" },
  { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", label: "Amarillo", class: "yellow" },
  { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", label: "Verde", class: "green" },
  { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", label: "Rojo", class: "rose" },
  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", label: "Violeta", class: "violet" }
];

function generateKey(label, colorClass) {
  const cleanLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return colorClass ? `${cleanLabel}-${colorClass}` : cleanLabel;
}

export default function KanbanStatesManager({ states = [], setStates }) {
  const theme = useAppTheme();
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    label: "",
    ...COLOR_PALETTES[0],
    key: generateKey("", COLOR_PALETTES[0].class)
  });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      key: generateKey(prev.label, prev.class)
    }));
    // eslint-disable-next-line
  }, [form.label, form.class]);

  useHotkeys('esc', () => {
    if (editIndex !== null) cancelEdit();
  });

  useHotkeys('enter', () => {
    if (form.label) editIndex === null ? handleAdd() : handleUpdate();
  });

  const resetForm = () => {
    setForm({
      label: "",
      ...COLOR_PALETTES[0],
      key: generateKey("", COLOR_PALETTES[0].class)
    });
    setEditIndex(null);
  };

  const cancelEdit = () => {
    setEditIndex(null);
    resetForm();
  };

  const handleLabelChange = (e) => {
    const { value } = e.target;
    setForm(prev => ({
      ...prev,
      label: value,
      key: generateKey(value, prev.class)
    }));
  };

  const handleColorChange = (palette) => {
    setForm(prev => ({
      ...prev,
      bg: palette.bg,
      text: palette.text,
      border: palette.border,
      class: palette.class,
      key: generateKey(prev.label, palette.class)
    }));
  };

  const handleAdd = () => {
    if (!form.label) return;
    const newState = {
      key: form.key,
      label: form.label,
      color: form.bg,
      textColor: form.text
    };
    setStates([...states, newState]);
    resetForm();
  };

  const handleEdit = (idx) => {
    const state = states[idx];
    const palette = COLOR_PALETTES.find(p => p.bg === state.color && p.text === state.textColor) || COLOR_PALETTES[0];
    setEditIndex(idx);
    setForm({
      label: state.label,
      bg: palette.bg,
      text: palette.text,
      border: palette.border,
      class: palette.class,
      key: state.key
    });
  };

  const handleUpdate = () => {
    if (!form.label) return;
    setStates(states.map((st, i) =>
      i === editIndex
        ? {
            key: form.key,
            label: form.label,
            color: form.bg,
            textColor: form.text
          }
        : st
    ));
    cancelEdit();
  };

  const handleDelete = (idx) => {
    setStates(states.filter((_, i) => i !== idx));
    if (editIndex === idx) cancelEdit();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDragStart = (e, index) => {
    e.dataTransfer.setData("index", index);
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newIndex) => {
    e.preventDefault();
    const oldIndex = e.dataTransfer.getData("index");
    if (oldIndex !== newIndex) {
      const newStates = [...states];
      const [removed] = newStates.splice(oldIndex, 1);
      newStates.splice(newIndex, 0, removed);
      setStates(newStates);
    }
    setIsDragging(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestor de Estados Kanban</h2>
      </div>

      {/* Formulario Mejorado */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8"
      >
        {/* Nombre del Estado */}
        <div className="md:col-span-4 flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Estado</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            name="label"
            placeholder="Ej: En Progreso"
            value={form.label}
            onChange={handleLabelChange}
            autoFocus
          />
        </div>

        {/* Color */}
        <div className="md:col-span-3 flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <div className="relative">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none transition"
              value={form.class}
              onChange={(e) => handleColorChange(COLOR_PALETTES.find(p => p.class === e.target.value))}
            >
              {COLOR_PALETTES.map((opt) => (
                <option key={opt.class} value={opt.class}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <div className={`w-4 h-4 rounded-full ${form.bg} ${form.border} border`} />
            </div>
          </div>
        </div>


        {/* Botón Agregar alineado */}
        <div className="md:col-span-1 flex flex-col">
          <label className="block text-sm font-medium text-transparent mb-1 select-none">Agregar</label>
          {editIndex === null ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`
                w-full
                min-w-[120px]
                px-4 py-2
                rounded-lg
                text-white font-medium
                text-base
                transition
                flex items-center justify-center
                ${!form.label ? 'bg-gray-400 cursor-not-allowed' : `bg-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-700`}
                shadow-sm
                h-[42px]
              `}
              style={{ minHeight: 42 }}
              onClick={handleAdd}
              disabled={!form.label}
              type="button"
            >
              <FiPlus className="mr-2 text-lg" />
              <span className="hidden md:inline">{!form.label ? "Ingresa nombre" : "Agregar"}</span>
              <span className="md:hidden">{!form.label ? "" : "+"}</span>
            </motion.button>
          ) : (
            <div className="flex gap-2 w-full">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full
                  min-w-[120px]
                  px-4 py-2
                  rounded-lg
                  text-white font-medium
                  text-base
                  transition
                  flex items-center justify-center
                  ${!form.label ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'}
                  shadow-sm
                  h-[42px]
                `}
                style={{ minHeight: 42 }}
                onClick={handleUpdate}
                disabled={!form.label}
                type="button"
              >
                <FiCheck className="mr-1" />
                <span className="hidden md:inline">Guardar</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full
                  min-w-[42px]
                  px-4 py-2
                  rounded-lg
                  bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium
                  text-base
                  transition
                  flex items-center justify-center
                  shadow-sm
                  h-[42px]
                `}
                style={{ minHeight: 42 }}
                onClick={cancelEdit}
                type="button"
              >
                <FiX />
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Lista de Estados */}
      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
          <div className="col-span-5">Estado</div>
          <div className="col-span-3">Clave</div>
          <div className="col-span-2">Previa</div>
          <div className="col-span-2 text-right">Acciones</div>
        </div>

        <AnimatePresence>
          {states.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg"
            >
              <div className="text-gray-400 mb-2">No hay estados configurados</div>
              <div className="text-sm text-gray-500">Comienza agregando tu primer estado</div>
            </motion.div>
          ) : (
            states.map((state, idx) => {
              const palette = COLOR_PALETTES.find(p => p.bg === state.color && p.text === state.textColor) || COLOR_PALETTES[0];
              return (
                <motion.div
                  key={state.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: isDragging ? 1.02 : 1,
                    boxShadow: isDragging ? "0 10px 15px -3px rgba(0, 0, 0, 0.1)" : "none"
                  }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`grid grid-cols-12 gap-4 items-center p-4 rounded-lg border ${palette.border} ${isDragging ? 'bg-white shadow-lg' : 'bg-white hover:bg-gray-50'} transition-all`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, idx)}
                >
                  <div className="col-span-5 font-medium text-gray-900 flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${palette.bg} ${palette.border} border`} />
                    {state.label}
                  </div>
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                        {state.key}
                      </span>
                      <Tooltip title="Copiar clave" position="top">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={() => copyToClipboard(state.key)}
                          type="button"
                        >
                          <FiCopy size={14} />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${palette.bg} ${palette.text} ${palette.border}`}>
                      {state.label}
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end space-x-2">
                    <Tooltip title="Editar" position="top" trigger="mouseenter">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition"
                        onClick={() => handleEdit(idx)}
                        type="button"
                      >
                        <FiEdit2 size={18} />
                      </motion.button>
                    </Tooltip>
                    <Tooltip title="Eliminar" position="top" trigger="mouseenter">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-full transition"
                        onClick={() => handleDelete(idx)}
                        type="button"
                      >
                        <FiTrash2 size={18} />
                      </motion.button>
                    </Tooltip>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}