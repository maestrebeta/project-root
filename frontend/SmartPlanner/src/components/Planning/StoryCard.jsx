import React from "react";
import { motion } from "framer-motion";
import { FiUser, FiClock, FiCheckCircle } from 'react-icons/fi';
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { formatDateForDisplay, formatDateForTooltip, debugDate } from '../../utils/dateUtils';

// Configuraciones de estimación por tallas (mismo que en StoryDetailsModal)
const ESTIMATION_SIZES = {
  'XS': { 
    label: 'XS', 
    hours: 2, 
    description: '2 horas - Tarea muy pequeña',
    color: '#10B981',
    bg: '#D1FAE5',
    icon: '🟢'
  },
  'S': { 
    label: 'S', 
    hours: 4, 
    description: '4 horas - Tarea pequeña',
    color: '#3B82F6',
    bg: '#DBEAFE',
    icon: '🔵'
  },
  'M': { 
    label: 'M', 
    hours: 8, 
    description: '8 horas - Tarea mediana',
    color: '#F59E0B',
    bg: '#FEF3C7',
    icon: '🟡'
  },
  'L': { 
    label: 'L', 
    hours: 16, 
    description: '16 horas - Tarea grande',
    color: '#F97316',
    bg: '#FED7AA',
    icon: '🟠'
  },
  'XL': { 
    label: 'XL', 
    hours: 32, 
    description: '32 horas - Tarea muy grande',
    color: '#EF4444',
    bg: '#FEE2E2',
    icon: '🔴'
  }
};

const PRIORITY_DATA = {
  high: { color: "#EF4444", bg: "#FEE2E2", icon: "🔥", label: "Alta" },
  medium: { color: "#F59E0B", bg: "#FEF3C7", icon: "⚠️", label: "Media" },
  low: { color: "#10B981", bg: "#D1FAE5", icon: "🌿", label: "Baja" },
  critical: { color: "#DC2626", bg: "#FEE2E2", icon: "🚨", label: "Crítica" },
};

const STATUS_COLORS = {
  backlog: "#94A3B8",
  todo: "#6B7280",
  in_progress: "#3B82F6",
  in_review: "#8B5CF6",
  testing: "#F59E0B",
  done: "#10B981",
  blocked: "#EF4444",
};

// Función para determinar la talla de estimación basada en las horas
const getEstimationSize = (estimatedHours) => {
  if (!estimatedHours || estimatedHours <= 0) return null;
  
  if (estimatedHours <= 2) return 'XS';
  if (estimatedHours <= 4) return 'S';
  if (estimatedHours <= 8) return 'M';
  if (estimatedHours <= 16) return 'L';
  return 'XL';
};

export default function StoryCard({ story, users, kanbanStates, onClick, isSelected = false }) {

  const assignedUser = users.find(u => u.user_id === story.assigned_user_id);
  
  // Calcular horas totales estimadas
  const totalEstimatedHours = 
    Number(story.estimated_hours) || 
    ((Number(story.ui_hours) || 0) + 
     (Number(story.development_hours) || 0) + 
     (Number(story.testing_hours) || 0) + 
     (Number(story.documentation_hours) || 0));
  
  const hasWarnings = !story.assigned_user_id || totalEstimatedHours === 0;
  
  // Verificar que kanbanStates sea un array
  const state = Array.isArray(kanbanStates) ? kanbanStates.find(s => s.key === story.status) : null;
  
  // Obtener talla de estimación y sus colores
  const estimationSize = getEstimationSize(totalEstimatedHours);
  const estimationConfig = estimationSize ? ESTIMATION_SIZES[estimationSize] : null;
  
  // Obtener configuración de prioridad
  const priorityConfig = PRIORITY_DATA[story.priority] || PRIORITY_DATA.medium;
  
  const updatedAt = story.updated_at ? formatDistanceToNow(new Date(story.updated_at), { 
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
        // Usar color de estimación como indicador principal
        borderLeftColor: estimationConfig?.color || state?.color || "#3B82F6",
      }}
      onClick={onClick}
    >
      {/* Warning overlay for incomplete cards */}
      {hasWarnings && (
        <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs px-2 py-1 rounded-bl-lg">
          ⚠️ Incompleta
        </div>
      )}

      {/* Estimation size and priority row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Indicador de estimación de esfuerzo */}
        {estimationConfig && (
          <span 
            className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}
            style={{
              backgroundColor: estimationConfig.bg,
              color: estimationConfig.color,
            }}
            title={estimationConfig.description}
          >
            {estimationConfig.icon} {estimationConfig.label} ({totalEstimatedHours}h)
          </span>
        )}
        
        {/* Indicador de prioridad (secundario) */}
        <span 
          className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 opacity-75`}
          style={{
            backgroundColor: priorityConfig.bg,
            color: priorityConfig.color,
          }}
          title={`Prioridad: ${priorityConfig.label}`}
        >
          {priorityConfig.icon}
        </span>
        
        {/* Etiquetas o Fecha de Completado */}
        {(() => {
          const shouldShowCompletedDate = story.status === "done" && story.completed_date;
          
          if (shouldShowCompletedDate) {
            // Debug de la fecha
            debugDate(story.completed_date, 'StoryCard - Fecha de completado');
            
            return (
              <span 
                className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium flex items-center gap-1"
                title={`Completada el ${formatDateForTooltip(story.completed_date)}`}
              >
                <span>✅</span>
                <span>Completada {formatDateForDisplay(story.completed_date)}</span>
              </span>
            );
          } else if (story.tags && story.tags.length > 0) {
            return story.tags.map((tag, index) => (
              <span 
                key={`${tag}-${index}`}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ));
          }
          return null;
        })()}
      </div>

      {/* Title and description */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 line-clamp-2">{story.title}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{story.description}</p>
      </div>

      {/* Sub-especializaciones */}
      {story.sub_specializations && story.sub_specializations.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {story.sub_specializations.map((subSpec, index) => (
            <span 
              key={`${subSpec}-${index}`}
              className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1"
            >
              <span>🔧</span>
              <span>{subSpec}</span>
            </span>
          ))}
        </div>
      )}

      {/* Time estimates breakdown */}
      {(story.ui_hours > 0 || story.development_hours > 0 || story.testing_hours > 0 || story.documentation_hours > 0) && (
        <div className="flex gap-1 flex-wrap">
          {story.ui_hours > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-700 flex items-center gap-1">
              <span>🎨</span>
              <span>{story.ui_hours}h</span>
            </div>
          )}
          {story.development_hours > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
              <span>💻</span>
              <span>{story.development_hours}h</span>
            </div>
          )}
          {story.testing_hours > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 flex items-center gap-1">
              <span>🧪</span>
              <span>{story.testing_hours}h</span>
            </div>
          )}
          {story.documentation_hours > 0 && (
            <div className="text-xs px-2 py-1 rounded-full bg-gray-50 text-gray-700 flex items-center gap-1">
              <span>📝</span>
              <span>{story.documentation_hours}h</span>
            </div>
          )}
        </div>
      )}

      {/* Footer with user and metadata */}
      <div className="flex items-center justify-between mt-2">
        {assignedUser ? (
          <div className="flex items-center gap-2">
            <div 
              className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold"
              title={assignedUser.full_name || assignedUser.username}
            >
              {(assignedUser.full_name || assignedUser.username).split(" ").map(n => n[0]).join("").toUpperCase()}
            </div>
            <span className="text-xs text-gray-700">
              {(assignedUser.full_name || assignedUser.username).split(" ")[0]}
            </span>
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
      {story.status === "done" && story.checklist?.length > 0 && (
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