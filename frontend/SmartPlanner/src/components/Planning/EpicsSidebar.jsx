import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiChevronRight, FiFilter, FiPlus } from "react-icons/fi";

// Estados Kanban normalizados
const KANBAN_DONE_STATE = "cerrado";

// Componente anillo de progreso para proyectos
function ProjectRing({ percent, done, total, size = 28, stroke = 4 }) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg
      width={size}
      height={size}
      className="mr-2 flex-shrink-0"
      style={{ display: "block", minWidth: size, minHeight: size }}
      viewBox={`0 0 ${size} ${size}`}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e5e7eb"
        strokeWidth={stroke}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#22c55e"
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.4s" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy="0.35em"
        fontSize="0.7em"
        fill="#222"
        fontWeight="bold"
        style={{ userSelect: "none" }}
      >
        {total > 0 ? `${done}` : "0"}
      </text>
    </svg>
  );
}

export default function EpicsSidebar({
  epics,
  selectedEpic,
  onSelectEpic,
  stories = [],
  onNewEpic,
  searchTerm,
  onSearchChange,
  projects = []
}) {
  const [collapsedEpics, setCollapsedEpics] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState(() => {
    const initial = {};
    projects.forEach(p => { initial[p.id] = true; });
    return initial;
  });

  // Enriquecer épicas con stats
  const epicsWithStats = useMemo(() => {
    return epics.map(epic => {
      const epicStories = stories.filter(st => st.epica_id === epic.id);
      const totalStories = epicStories.length;
      const doneStories = epicStories.filter(st => st.estado === KANBAN_DONE_STATE).length;
      const progress = totalStories ? (doneStories / totalStories) * 100 : 0;
      return {
        ...epic,
        totalStories,
        doneStories,
        progress,
        hasCompleted: doneStories > 0,
        hasActive: totalStories - doneStories > 0,
      };
    });
  }, [epics, stories]);

  // Filtrado de épicas
  const filteredEpics = useMemo(() => {
    let result = epicsWithStats;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(epic =>
        epic.nombre.toLowerCase().includes(term) ||
        epic.descripcion?.toLowerCase().includes(term)
      );
    }
    if (!showCompleted) {
      result = result.filter(epic => epic.hasActive);
    }
    return result;
  }, [epicsWithStats, searchTerm, showCompleted]);

  // Agrupar épicas por proyecto
  const epicsByProject = useMemo(() => {
    const map = {};
    filteredEpics.forEach(epic => {
      const pid = epic.projectId || epic.proyecto_id || epic.project_id || "Sin proyecto";
      if (!map[pid]) map[pid] = [];
      map[pid].push(epic);
    });
    return map;
  }, [filteredEpics]);

  // Calcular progreso global por proyecto
  const projectProgress = useMemo(() => {
    const progressMap = {};
    projects.forEach(project => {
      const projectEpics = epicsByProject[project.id] || [];
      let totalStories = 0;
      let doneStories = 0;
      projectEpics.forEach(epic => {
        totalStories += epic.totalStories;
        doneStories += epic.doneStories;
      });
      progressMap[project.id] = {
        totalStories,
        doneStories,
        percent: totalStories ? (doneStories / totalStories) * 100 : 0,
      };
    });
    // Para épicas sin proyecto
    if (epicsByProject["Sin proyecto"]) {
      let totalStories = 0;
      let doneStories = 0;
      epicsByProject["Sin proyecto"].forEach(epic => {
        totalStories += epic.totalStories;
        doneStories += epic.doneStories;
      });
      progressMap["Sin proyecto"] = {
        totalStories,
        doneStories,
        percent: totalStories ? (doneStories / totalStories) * 100 : 0,
      };
    }
    return progressMap;
  }, [projects, epicsByProject]);

  const toggleEpicCollapse = epicId => {
    setCollapsedEpics(prev => ({
      ...prev,
      [epicId]: !prev[epicId]
    }));
  };

  const toggleProjectCollapse = projectId => {
    setCollapsedProjects(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  // Ordena los proyectos por porcentaje de avance ASCENDENTE antes del render:
  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      const pa = projectProgress[a.id]?.percent ?? 0;
      const pb = projectProgress[b.id]?.percent ?? 0;
      return pa - pb;
    });
  }, [projects, projectProgress]);

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-lg text-gray-900 flex items-center justify-between">
          Épicas
          <button
            className="text-blue-600 hover:text-blue-800 p-1"
            onClick={onNewEpic}
            title="Nueva épica"
          >
            <FiPlus size={18} />
          </button>
        </h3>

        {/* Buscador */}
        <div className="relative mt-3">
          <input
            type="text"
            placeholder="Buscar épicas..."
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
          <FiFilter className="absolute left-3 top-2.5 text-gray-400" size={14} />
        </div>

        {/* Filtros */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <label className="flex items-center gap-1 text-gray-600">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={() => setShowCompleted(!showCompleted)}
              className="rounded text-blue-600"
            />
            Mostrar completadas
          </label>
          <span className="text-gray-500">
            {filteredEpics.length}/{epics.length} mostradas
          </span>
        </div>
      </div>

      {/* Lista de épicas agrupadas por proyecto */}
      <div className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-2">
          {/* Opción "Todas" */}
          <li
            className={`cursor-pointer mb-2 px-3 py-2 rounded-lg flex items-center justify-between ${!selectedEpic ? "bg-blue-100 font-medium text-blue-800" : "hover:bg-gray-50"}`}
            onClick={() => onSelectEpic(null)}
          >
            <span>Todas las historias</span>
            <span className="text-xs bg-white px-2 py-0.5 rounded-full">
              {stories.length}
            </span>
          </li>

          {/* Proyectos con épicas, ordenados por menor avance */}
          {sortedProjects.map(project => {
            // Ordena épicas por menor avance
            const projectEpics = (epicsByProject[project.id] || []).slice().sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0));
            if (projectEpics.length === 0) return null;
            return (
              <li key={project.id} className="mb-1">
                {/* Header de proyecto */}
                <div
                  className="flex items-center px-2 py-1 cursor-pointer rounded hover:bg-blue-50 group"
                  onClick={() => toggleProjectCollapse(project.id)}
                >
                  <ProjectRing
                    percent={projectProgress[project.id]?.percent || 0}
                    done={projectProgress[project.id]?.doneStories || 0}
                    total={projectProgress[project.id]?.totalStories || 0}
                    size={28}
                    stroke={4}
                  />
                  <span className="font-semibold text-xs uppercase tracking-wide text-gray-700 truncate ml-2">
                    {project.nombre}
                  </span>
                </div>
                {/* Lista de épicas del proyecto, ordenadas por menor avance */}
                <ul className={`${collapsedProjects[project.id] ? "hidden" : ""} mt-1`}>
                  <AnimatePresence>
                    {projectEpics.map(epic => (
                      <motion.li
                        key={epic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`rounded-lg overflow-hidden ${selectedEpic?.id === epic.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div
                          className="px-3 py-2 flex items-center justify-between cursor-pointer"
                          onClick={() => onSelectEpic(epic)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <button
                              className="text-gray-500 hover:text-gray-700 p-1"
                              onClick={e => {
                                e.stopPropagation();
                                setCollapsedEpics(prev => ({
                                  ...prev,
                                  [epic.id]: !prev[epic.id]
                                }));
                              }}
                            >
                              {collapsedEpics[epic.id] ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
                            </button>
                            <span className={`truncate ${selectedEpic?.id === epic.id ? "font-medium text-blue-800" : ""}`}>
                              {epic.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${epic.hasActive ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                              {epic.hasActive ? `${epic.totalStories - epic.doneStories}` : "✓"}
                            </span>
                          </div>
                        </div>
                        {/* Detalles de la épica (colapsable) */}
                        {!collapsedEpics[epic.id] && (
                          <div className="px-3 pb-2 pt-0 ml-8">
                            <div className="text-xs text-gray-500 mb-1">
                              {epic.doneStories}/{epic.totalStories} completadas
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${epic.progress}%` }}
                              />
                            </div>
                            {epic.descripcion && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {epic.descripcion}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </li>
            );
          })}

          {/* Épicas sin proyecto */}
          {epicsByProject["Sin proyecto"] && (
            <li className="mb-1">
              <div
                className="flex items-center justify-between px-2 py-1 cursor-pointer rounded hover:bg-blue-50 group"
                onClick={() => toggleProjectCollapse("Sin proyecto")}
              >
                <div className="flex items-center gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 p-1"
                    onClick={e => {
                      e.stopPropagation();
                      toggleProjectCollapse("Sin proyecto");
                    }}
                  >
                    {collapsedProjects["Sin proyecto"] ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
                  </button>
                  <span className="font-semibold text-xs uppercase tracking-wide text-gray-700 truncate">
                    Sin proyecto
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {projectProgress["Sin proyecto"]?.doneStories || 0}/{projectProgress["Sin proyecto"]?.totalStories || 0}
                  </span>
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${projectProgress["Sin proyecto"]?.percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
              <ul className={`${collapsedProjects["Sin proyecto"] ? "hidden" : ""} mt-1`}>
                <AnimatePresence>
                  {epicsByProject["Sin proyecto"]
                    .slice()
                    .sort((a, b) => (a.progress ?? 0) - (b.progress ?? 0))
                    .map(epic => (
                      <motion.li
                        key={epic.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`rounded-lg overflow-hidden ${selectedEpic?.id === epic.id ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <div
                          className="px-3 py-2 flex items-center justify-between cursor-pointer"
                          onClick={() => onSelectEpic(epic)}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <button
                              className="text-gray-500 hover:text-gray-700 p-1"
                              onClick={e => {
                                e.stopPropagation();
                                setCollapsedEpics(prev => ({
                                  ...prev,
                                  [epic.id]: !prev[epic.id]
                                }));
                              }}
                            >
                              {collapsedEpics[epic.id] ? <FiChevronRight size={16} /> : <FiChevronDown size={16} />}
                            </button>
                            <span className={`truncate ${selectedEpic?.id === epic.id ? "font-medium text-blue-800" : ""}`}>
                              {epic.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${epic.hasActive ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                              {epic.hasActive ? `${epic.totalStories - epic.doneStories}` : "✓"}
                            </span>
                          </div>
                        </div>
                        {/* Detalles de la épica (colapsable) */}
                        {!collapsedEpics[epic.id] && (
                          <div className="px-3 pb-2 pt-0 ml-8">
                            <div className="text-xs text-gray-500 mb-1">
                              {epic.doneStories}/{epic.totalStories} completadas
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${epic.progress}%` }}
                              />
                            </div>
                            {epic.descripcion && (
                              <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                                {epic.descripcion}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.li>
                    ))}
                </AnimatePresence>
              </ul>
            </li>
          )}
        </ul>
      </div>

      {/* Resumen global */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total historias:</span>
          <span className="font-medium">{stories.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600">Completadas:</span>
          <span className="font-medium text-green-600">
            {stories.filter(st => st.estado === KANBAN_DONE_STATE).length}
          </span>
        </div>
      </div>
    </aside>
  );
}