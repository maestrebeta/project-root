import React from "react";
import { useAppTheme } from "../../context/ThemeContext";

// Opciones de colores y fuentes
const COLOR_OPTIONS = [
  { name: "Azul", value: "blue" },
  { name: "Rojo", value: "red" },
  { name: "Verde", value: "green" }
];

const FONT_OPTIONS = [
  { name: "Sans (Default)", value: "font-sans" },
  { name: "Serif", value: "font-serif" },
  { name: "Mono", value: "font-mono" },
  { name: "Inter", value: "font-inter" },
  { name: "Roboto", value: "font-roboto" },
  { name: "Montserrat", value: "font-montserrat" }
];

const FONT_SIZE_OPTIONS = [
  { name: "Pequeña", value: "text-sm" },
  { name: "Normal", value: "text-base" },
  { name: "Grande", value: "text-lg" },
  { name: "Extra Grande", value: "text-xl" }
];

export default function ThemeManager() {
  const theme = useAppTheme();

  const handleApplyChanges = () => {
    // Disparar evento de cambio de tema
    window.dispatchEvent(new CustomEvent('themeChanged'));

    // Notificar al usuario
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 right-4 bg-${theme.PRIMARY_COLOR}-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2`;
    notification.innerHTML = `
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      Tema actualizado correctamente
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const handleResetTheme = () => {
    theme.setPrimaryColor("blue");
    theme.setFont("font-sans");
    theme.setFontSize("text-base");
    theme.setAnimations(true);
    handleApplyChanges();
  };

  return (
    <div className={`max-w-2xl mx-auto p-6 bg-white rounded-xl shadow flex flex-col gap-6 ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      <h2 className="font-bold text-2xl text-gray-800 mb-2">Personalización de Tema</h2>
      
      {/* Color primario */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Color Primario</label>
        <div className="flex flex-wrap gap-3">
          {COLOR_OPTIONS.map(opt => (
            <button
              key={opt.value}
              className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center
                ${theme.PRIMARY_COLOR === opt.value ? `border-${opt.value}-600 scale-110` : "border-gray-200"}
                bg-${opt.value}-500 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${opt.value}-400
              `}
              title={opt.name}
              onClick={() => theme.setPrimaryColor(opt.value)}
              aria-label={opt.name}
              type="button"
            >
              {theme.PRIMARY_COLOR === opt.value && (
                <span className="text-white text-lg font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Fuente */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Fuente</label>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={theme.FONT_CLASS}
          onChange={e => theme.setFont(e.target.value)}
        >
          {FONT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.name}</option>
          ))}
        </select>
      </section>

      {/* Tamaño de fuente */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Tamaño de Fuente</label>
        <select
          className="border rounded px-3 py-2 text-sm"
          value={theme.FONT_SIZE_CLASS}
          onChange={e => theme.setFontSize(e.target.value)}
        >
          {FONT_SIZE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.name}</option>
          ))}
        </select>
      </section>

      {/* Animaciones */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Animaciones</label>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={theme.ANIMATION_ENABLED}
            onChange={e => theme.setAnimations(e.target.checked)}
            className="rounded text-blue-600"
            id="toggle-animations"
          />
          <label htmlFor="toggle-animations" className="text-gray-600">
            {theme.ANIMATION_ENABLED ? "Activadas" : "Desactivadas"}
          </label>
        </div>
      </section>

      {/* Vista previa */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Vista previa</label>
        <div
          className={`
            flex flex-col gap-2 p-4 rounded-lg border
            ${theme.PRIMARY_BG_CLASS}
            ${theme.FONT_CLASS}
            ${theme.FONT_SIZE_CLASS}
            ${theme.PRIMARY_COLOR_CLASS}
            transition-all
          `}
          style={{
            transition: theme.ANIMATION_ENABLED ? "all 0.3s" : "none"
          }}
        >
          <span className={`text-2xl font-extrabold tracking-tight ${theme.PRIMARY_FONT_CLASS}`}>
            SmartPlanner
          </span>
          <span className="font-medium">¡Personaliza tu experiencia!</span>
          <button
            className={`
              px-4 py-2 rounded-full font-semibold
              ${theme.PRIMARY_BG_CLASS}
              ${theme.PRIMARY_COLOR_CLASS}
              border border-transparent
              hover:shadow
            `}
          >
            Botón de ejemplo
          </button>
        </div>
      </section>

      {/* Variables generadas */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Variables generadas</label>
        <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-700">
          <div><b>PRIMARY_COLOR:</b> "{theme.PRIMARY_COLOR}"</div>
          <div><b>PRIMARY_COLOR_CLASS:</b> <code>{theme.PRIMARY_COLOR_CLASS}</code></div>
          <div><b>PRIMARY_BG_CLASS:</b> <code>{theme.PRIMARY_BG_CLASS}</code></div>
          <div><b>PRIMARY_FONT_CLASS:</b> <code>{theme.PRIMARY_FONT_CLASS}</code></div>
          <div><b>FONT:</b> <code>{theme.FONT_CLASS}</code></div>
          <div><b>FONT_SIZE:</b> <code>{theme.FONT_SIZE_CLASS}</code></div>
          <div><b>ANIMATIONS:</b> <code>{String(theme.ANIMATION_ENABLED)}</code></div>
        </div>
      </section>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleApplyChanges}
          className={`flex-1 px-4 py-2 ${theme.PRIMARY_BUTTON_CLASS} rounded-lg text-sm font-medium flex items-center justify-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Aplicar Cambios
        </button>
      <button
        onClick={handleResetTheme}
          className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition text-sm flex items-center justify-center gap-2"
      >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        Restaurar valores por defecto
      </button>
      </div>
    </div>
  );
}