import React from "react";
import { motion } from "framer-motion";

export default function UserLoadBar({ user, stories, onClick }) {
  const totalHours = stories.reduce(
    (sum, st) => sum + Object.values(st.estimaciones || {}).reduce((a, b) => a + Number(b || 0), 0),
    0
  );

  const workloadPercentage = Math.min(totalHours, 40) * 2.5;
  const statusColor = 
    workloadPercentage > 90 ? "bg-red-500" :
    workloadPercentage > 70 ? "bg-yellow-500" :
    workloadPercentage > 30 ? "bg-green-500" : "bg-blue-400";

  return (
    <motion.div 
      className="flex items-center gap-4 p-3 bg-white rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer border border-gray-100"
      whileHover={{ y: -2 }}
      onClick={onClick}
    >
      {/* User avatar */}
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-sm">
          {user.nombre.split(" ").map(n => n[0]).join("").toUpperCase()}
        </div>
        
        {/* Workload indicator dot */}
        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${statusColor}`}></div>
      </div>

      {/* User info and workload */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate text-sm">{user.nombre}</h3>
        
        {/* Simplified workload bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${statusColor}`}
              initial={{ width: 0 }}
              animate={{ width: `${workloadPercentage}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {totalHours}<span className="text-gray-400">/40h</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}