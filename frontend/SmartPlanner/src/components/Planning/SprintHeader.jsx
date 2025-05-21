import React from "react";
import { motion } from "framer-motion";

// Estado Kanban para historias completadas
const KANBAN_DONE_STATE = "cerrado";

export default function SprintHeader({ sprints = [], stories = [], onNewSprint }) {
  const today = new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Sprints
          </h2>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {sprints.map(sprint => {
              const sprintStories = stories.filter(st => st.sprint_id === sprint.id);
              // Usar el nuevo estado "cerrado" para historias completadas
              const done = sprintStories.filter(st => st.estado === KANBAN_DONE_STATE).length;
              const isActive = sprint.estado === "Activo";
              const total = sprintStories.length;
              const progress = total ? (done / total) * 100 : 0;
              const daysLeft = Math.max(0, Math.ceil((new Date(sprint.fecha_fin) - today) / (1000 * 60 * 60 * 24)));
              
              return (
                <motion.div
                  key={sprint.id}
                  whileHover={{ y: -2 }}
                  className={`flex-shrink-0 px-4 py-3 rounded-lg border ${isActive ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-blue-500" : "bg-gray-400"}`}></span>
                    <span className={`text-sm font-medium ${isActive ? "text-blue-700" : "text-gray-700"}`}>
                      {sprint.nombre}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    {new Date(sprint.fecha_inicio).toLocaleDateString()} - {new Date(sprint.fecha_fin).toLocaleDateString()}
                  </div>
                  
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs font-medium">
                      {done}/{total} completadas
                    </span>
                    {isActive && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        {daysLeft}d restantes
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isActive ? "bg-blue-500" : "bg-gray-400"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          onClick={onNewSprint}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nuevo Sprint
        </motion.button>
      </div>
    </div>
  );
}