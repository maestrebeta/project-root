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

function generateKey(label) {
  return label.toLowerCase()
    .replace(/[áéíóúñü]/g, c => ({ 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u', 'ñ': 'n', 'ü': 'u' })[c])
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/(^_|_$)/g, '')
    .replace(/_{2,}/g, '_');
}

export default function KanbanStatesManager({ states = [], setStates }) {
  const theme = useAppTheme();
  const [editIndex, setEditIndex] = useState(null);
  const [form, setForm] = useState({
    label: "",
    ...COLOR_PALETTES[0],
    key: "",
    originalKey: ""
  });
  const [isDragging, setIsDragging] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (form.label) {
      setForm(prev => ({
        ...prev,
        key: generateKey(form.label)
      }));
    }
  }, [form.label]);

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
      key: "",
      originalKey: ""
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
      key: generateKey(value)
    }));
  };

  const handleColorChange = (palette) => {
    setForm(prev => ({
      ...prev,
      bg: palette.bg,
      text: palette.text,
      border: palette.border,
      class: palette.class,
      key: generateKey(prev.label)
    }));
  };

  const handleAdd = () => {
    if (!form.label) return;
    
    const newKey = generateKey(form.label);
    const newState = {
      key: newKey,
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
      key: state.key,
      originalKey: state.key
    });
  };

  const handleUpdate = () => {
    if (!form.label) return;
    
    setStates(states.map((st, i) => {
      if (i === editIndex) {
        return {
          key: form.originalKey,
          label: form.label,
          color: form.bg,
          textColor: form.text
        };
      }
      return st;
    }));
    
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
      className={`max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}
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
              className={`px-3 py-2 rounded-lg ${theme.PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2`}
              onClick={handleAdd}
              disabled={!form.label}
            >
              <FiPlus className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className={`px-3 py-2 rounded-lg ${theme.PRIMARY_BUTTON_CLASS} flex items-center justify-center gap-2`}
              onClick={handleUpdate}
              disabled={!form.label}
            >
              <FiCheck className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Lista de Estados */}
      <div className="space-y-2">
        {states.map((state, idx) => (
          <motion.div
            key={state.key}
            layout
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            className={`
              flex items-center gap-4 p-3 rounded-lg border
              ${isDragging ? 'border-dashed' : 'border-solid'}
              ${state.color} ${state.textColor}
              cursor-grab active:cursor-grabbing
              transition-all duration-200
            `}
          >
            <div className="flex-1 flex items-center gap-3">
              <span className="font-medium">{state.label}</span>
              <span className="text-xs opacity-60">({state.key})</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Tooltip
                title="Copiar clave"
                position="top"
                arrow={true}
                distance={10}
                theme="light"
              >
                <button
                  onClick={() => copyToClipboard(state.key)}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <FiCopy className="w-4 h-4" />
                </button>
              </Tooltip>
              
              <button
                onClick={() => handleEdit(idx)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => handleDelete(idx)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}