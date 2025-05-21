import React from "react";

// Opciones de colores y fuentes
const COLOR_OPTIONS = [
  { name: "Azul", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Rojo", value: "red" },
  { name: "Verde", value: "green" },
  { name: "Amarillo", value: "yellow" },
  { name: "Naranja", value: "orange" },
  { name: "Rosa", value: "pink" },
  { name: "Morado", value: "purple" },
  { name: "Gris", value: "gray" },
  { name: "Cian", value: "cyan" },
  { name: "Teal", value: "teal" },
  { name: "Lima", value: "lime" },
  { name: "Piedra", value: "stone" },
  { name: "Zinc", value: "zinc" },
  { name: "Neutro", value: "neutral" },
  { name: "Blanco", value: "white" },
  { name: "Negro", value: "black" }
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

// Hook para gestionar el tema
export function useTheme(defaults = {}) {

  const getInitialTheme = () => {
    try {
      const saved = localStorage.getItem("smartplanner_theme");
      return saved ? JSON.parse(saved) : defaults;
    } catch {
      return defaults;
    }
  };

  const [primaryColor, setPrimaryColor] = React.useState(getInitialTheme().primaryColor || "blue");
  const [font, setFont] = React.useState(getInitialTheme().font || "font-sans");
  const [fontSize, setFontSize] = React.useState(getInitialTheme().fontSize || "text-base");
  const [animations, setAnimations] = React.useState(getInitialTheme().animations ?? true);

  // Derivadas de Tailwind
  const PRIMARY_COLOR = `${primaryColor}`;
  const PRIMARY_COLOR_CLASS = `text-${primaryColor}-500`;
  const PRIMARY_BG_CLASS = `bg-${primaryColor}-100`;
  const PRIMARY_BG_SOFT = `bg-${primaryColor}-50`;
  const PRIMARY_FONT_CLASS = `text-${primaryColor}-600`;

  // Guarda en localStorage cada vez que cambie algo
  React.useEffect(() => {
    localStorage.setItem(
      "smartplanner_theme",
      JSON.stringify({ primaryColor, font, fontSize, animations })
    );
  }, [primaryColor, font, fontSize, animations]);

  return {
    primaryColor,
    setPrimaryColor,
    font,
    setFont,
    fontSize,
    setFontSize,
    animations,
    setAnimations,
    PRIMARY_COLOR,
    PRIMARY_COLOR_CLASS,
    PRIMARY_BG_CLASS,
    PRIMARY_BG_SOFT,
    PRIMARY_FONT_CLASS
  };
}

// Componente visual para gestionar el tema
export default function ThemeManager({
  theme,
  setTheme // { primaryColor, font, fontSize, animations }
}) {
  // Si no se pasa theme/setTheme, usa local state (para pruebas)
  const local = useTheme();
  const t = theme || local;
  const s = setTheme || (() => {});

  const handleResetTheme = () => {
    localStorage.removeItem("smartplanner_theme");
    if (t.setPrimaryColor) t.setPrimaryColor("blue");
    if (t.setFont) t.setFont("font-sans");
    if (t.setFontSize) t.setFontSize("text-base");
    if (t.setAnimations) t.setAnimations(true);
    // window.location.reload(); // solo si quieres recargar la app
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow flex flex-col gap-6">
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
                ${t.primaryColor === opt.value ? `border-${opt.value}-600 scale-110` : "border-gray-200"}
                bg-${opt.value}-500 transition-all duration-150
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${opt.value}-400
              `}
              title={opt.name}
              onClick={() => (s.setPrimaryColor || t.setPrimaryColor)(opt.value)}
              aria-label={opt.name}
              type="button"
            >
              {t.primaryColor === opt.value && (
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
          value={t.font}
          onChange={e => (s.setFont || t.setFont)(e.target.value)}
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
          value={t.fontSize}
          onChange={e => (s.setFontSize || t.setFontSize)(e.target.value)}
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
            checked={t.animations}
            onChange={e => (s.setAnimations || t.setAnimations)(e.target.checked)}
            className="rounded text-blue-600"
            id="toggle-animations"
          />
          <label htmlFor="toggle-animations" className="text-gray-600">
            {t.animations ? "Activadas" : "Desactivadas"}
          </label>
        </div>
      </section>
      {/* Vista previa */}
      <section>
        <label className="block font-semibold mb-2 text-gray-700">Vista previa</label>
        <div
          className={`
            flex flex-col gap-2 p-4 rounded-lg border
            ${t.PRIMARY_BG_CLASS || `bg-${t.primaryColor}-100`}
            ${t.font || "font-sans"}
            ${t.fontSize || "text-base"}
            ${t.PRIMARY_COLOR_CLASS || `text-${t.primaryColor}-500`}
            transition-all
          `}
          style={{
            transition: t.animations ? "all 0.3s" : "none"
          }}
        >
          <span className={`text-2xl font-extrabold tracking-tight ${t.PRIMARY_FONT_CLASS || `text-${t.primaryColor}-600`}`}>
            SmartPlanner
          </span>
          <span className="font-medium">¡Personaliza tu experiencia!</span>
          <button
            className={`
              px-4 py-2 rounded-full font-semibold
              ${t.PRIMARY_BG_CLASS || `bg-${t.primaryColor}-100`}
              ${t.PRIMARY_COLOR_CLASS || `text-${t.primaryColor}-500`}
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
          <div><b>PRIMARY_COLOR:</b> "{t.primaryColor}"</div>
          <div><b>PRIMARY_COLOR_CLASS:</b> <code>{`text-${t.primaryColor}-500`}</code></div>
          <div><b>PRIMARY_BG_CLASS:</b> <code>{`bg-${t.primaryColor}-100`}</code></div>
          <div><b>PRIMARY_FONT_CLASS:</b> <code>{`text-${t.primaryColor}-600`}</code></div>
          <div><b>FONT:</b> <code>{t.font}</code></div>
          <div><b>FONT_SIZE:</b> <code>{t.fontSize}</code></div>
          <div><b>ANIMATIONS:</b> <code>{String(t.animations)}</code></div>
        </div>
      </section>
      <button
        onClick={handleResetTheme}
        className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded font-semibold text-gray-700 transition"
      >
        Restaurar valores por defecto
      </button>
    </div>
  );
}