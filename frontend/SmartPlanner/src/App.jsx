import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Template/Header';
import Sidebar from './components/Template/Sidebar';
import Home from './components/Home/Home.jsx';
import Users from './components/Users/Users.jsx';
import Clients from './components/Customers/Clients.jsx';
import Projects from './components/Projects/Proyectos.jsx';
import TimeTracker from './components/timeTracker/TimeTracker.jsx';
import JiraDashboard from './components/Jira/JiraDashboard';
import PlanningContainer from "./components/Planning/PlanningContainer";
import KanbanStatesManager from './components/Config/KanbanStatesManager.jsx';
import ThemeManager from './components/Config/ThemeManager.jsx';
import { useAppTheme } from "./context/ThemeContext.jsx";
import './index.css';

const pageTransition = {
  initial: { opacity: 0, scale: 0.98, y: 24, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.98, y: -24, filter: "blur(4px)" },
  transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
};

const DEFAULT_KANBAN_STATES = [
  { key: "nuevo", label: "Nuevo", color: "bg-gray-100", textColor: "text-gray-700" },
  { key: "en_progreso", label: "En Progreso", color: "bg-blue-50", textColor: "text-blue-700" },
  { key: "listo_pruebas", label: "Listo para Pruebas", color: "bg-yellow-50", textColor: "text-yellow-700" },
  { key: "cerrado", label: "Cerrado", color: "bg-green-50", textColor: "text-green-700" }
];

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [kanbanStates, setKanbanStates] = useState(DEFAULT_KANBAN_STATES);
  const location = useLocation();

  return (
    <div id="app-layout" className="app-layout bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3] min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className={`app-content ${sidebarCollapsed ? 'collapsed' : ''} transition-all duration-300`}>
        <Header onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className="relative min-h-[calc(100vh-4rem)]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/home"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <Home />
                  </motion.div>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <Projects />
                  </motion.div>
                }
              />
              <Route
                path="admin/users"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <Users />
                  </motion.div>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <Clients />
                  </motion.div>
                }
              />
              <Route
                path="/user/time-tracker"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <TimeTracker />
                  </motion.div>
                }
              />
              <Route
                path="/manager/jira-summary"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <JiraDashboard />
                  </motion.div>
                }
              />
              <Route
                path="manager/planning"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <PlanningContainer />
                  </motion.div>
                }
              />
              <Route
                path="/manager/kanban-states"
                element={
                  <motion.div
                    {...pageTransition}s
                    className="h-full"
                  >
                    <KanbanStatesManager
                      states={kanbanStates}
                      setStates={setKanbanStates}
                    />
                  </motion.div>
                }
              />
              <Route
                path="/config/theme"
                element={
                  <motion.div
                    {...pageTransition}s
                    className="h-full"
                  >
                    <ThemeManager
                      theme={useAppTheme()}
                    />
                  </motion.div>
                }
              />
              {/* Agrega más rutas según tus componentes */}
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

