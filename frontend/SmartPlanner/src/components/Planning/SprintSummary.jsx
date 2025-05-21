import React from "react";
import { motion } from "framer-motion";
import UserLoadBar from "./UserLoadBar";

export default function SprintSummary({ sprints, stories = [], users = [], activeSprint }) {
  const MAX_HOURS = 40;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-white rounded-xl shadow-sm border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Distribución de Carga
        </h3>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
          Sprint: {activeSprint?.nombre || "Sin sprint activo"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map(user => {
          const userStories = stories.filter(st => 
            st.usuario_asignado === user.id && 
            (!activeSprint || st.sprint_id === activeSprint.id)
          );
          
          const totalHoras = userStories.reduce(
            (sum, st) => sum + Object.values(st.estimaciones || {}).reduce((a, b) => a + Number(b || 0), 0),
            0
          );

          return (
            <motion.div
              key={user.id}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <UserLoadBar 
                user={user} 
                stories={userStories} 
                showDetails={totalHoras > MAX_HOURS}
              />
            </motion.div>
          );
        })}
      </div>

      {activeSprint && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{stories.filter(st => st.sprint_id === activeSprint.id).length}</span> tareas en este sprint
          </div>
          <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
            Límite: {MAX_HOURS}h por usuario
          </div>
        </div>
      )}
    </motion.div>
  );
}