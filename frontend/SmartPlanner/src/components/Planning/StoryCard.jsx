import React from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const PRIORITY_DATA = {
  Alta: { color: "#EF4444", bg: "#FEE2E2", icon: "🔥" },
  Media: { color: "#F59E0B", bg: "#FEF3C7", icon: "⚠️" },
  Baja: { color: "#10B981", bg: "#D1FAE5", icon: "🌿" },
};

const STATUS_COLORS = {
  Backlog: "#94A3B8",
  "En progreso": "#3B82F6",
  "En revisión": "#8B5CF6",
  Hecho: "#10B981",
  Bloqueado: "#EF4444",
};

export default function StoryCard({ story, users, kanbanStates, onClick, isSelected = false }) {
  const assignedUser = users.find(u => u.id === Number(story.usuario_asignado));
  const totalHours = Object.values(story.estimaciones || {}).reduce((a, b) => a + Number(b || 0), 0);
  const hasWarnings = !story.usuario_asignado || totalHours === 0;
  const state = kanbanStates?.find(s => s.key === story.estado);
  const updatedAt = story.updatedAt ? formatDistanceToNow(new Date(story.updatedAt), { 
    addSuffix: true,
    locale: es,
  }) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        borderLeftWidth: isSelected ? "6px" : "4px",
        boxShadow: isSelected ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none"
      }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`bg-white rounded-xl p-3 mb-3 cursor-pointer transition-all flex flex-col gap-2 border-l-4 relative overflow-hidden
        ${isSelected ? "ring-2 ring-blue-400" : "hover:ring-1 hover:ring-blue-200"}`}
      style={{ 
        borderLeftColor: state?.color || "#3B82F6",
      }}
      onClick={onClick}
    >
      {/* Warning overlay for incomplete cards */}
      {hasWarnings && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-bl-lg">
          ⚠️ Incompleta
        </div>
      )}

      {/* Priority and tags row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span 
          className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}
          style={{
            backgroundColor: PRIORITY_DATA[story.prioridad]?.bg || "#F3F4F6",
            color: PRIORITY_DATA[story.prioridad]?.color || "#6B7280",
          }}
        >
          {PRIORITY_DATA[story.prioridad]?.icon || "⚪"} {story.prioridad}
        </span>
        
        {story.etiquetas?.map(tag => (
          <span 
            key={tag} 
            className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title and description */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{story.titulo}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{story.descripcion}</p>
      </div>

      {/* Time estimates */}
      {totalHours > 0 && (
        <div className="flex gap-1 flex-wrap">
          {Object.entries(story.estimaciones).map(([type, hours]) => 
            hours > 0 && (
              <div 
                key={type} 
                className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1"
              >
                <span className="text-blue-500">{type === "UI" ? "🎨" : type === "Desarrollo" ? "💻" : "📝"}</span>
                <span>{hours}h</span>
              </div>
            )
          )}
          <div className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
            Total: {totalHours}h
          </div>
        </div>
      )}

      {/* Footer with user and metadata */}
      <div className="flex items-center justify-between mt-2">
        {assignedUser ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
              title={assignedUser.nombre}
            >
              {assignedUser.nombre.split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <span className="text-xs text-gray-700">{assignedUser.nombre.split(" ")[0]}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">Sin asignar</div>
        )}

        {updatedAt && (
          <div className="text-xs text-gray-400" title={`Actualizado ${updatedAt}`}>
            {updatedAt}
          </div>
        )}
      </div>

      {/* Progress bar for done status */}
      {story.estado === "Hecho" && story.checklist?.length > 0 && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-green-500 h-1.5 rounded-full" 
              style={{ 
                width: `${(story.checklist.filter(item => item.done).length / story.checklist.length) * 100}%` 
              }}
            />
          </div>
          <div className="text-xs text-gray-500 text-right mt-0.5">
            {story.checklist.filter(item => item.done).length}/{story.checklist.length} tareas
          </div>
        </div>
      )}
    </motion.div>
  );
}