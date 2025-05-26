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
import KanbanStatesManager from './components/Planning/KanbanStatesManager.jsx';
import ThemeManager from './components/Config/ThemeManager.jsx';
import Login from './components/Auth/Login.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { AuthProvider } from "./context/AuthContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { useAppTheme } from "./context/ThemeContext.jsx";
import { sidebarItems, getHeaderTitleFromSidebar } from './components/Template/sidebarConfig';
import Organizations from './components/Organizations/Organizations.jsx';
import './index.css';

const pageTransition = {
  initial: { opacity: 0, scale: 0.98, y: 24, filter: "blur(5px)" },
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

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [kanbanStates, setKanbanStates] = useState(DEFAULT_KANBAN_STATES);
  const location = useLocation();
  const headerTitle = getHeaderTitleFromSidebar(location.pathname);
  const theme = useAppTheme();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // No mostrar Sidebar ni Header en la página de login
  const isLoginPage = location.pathname === '/login';
  if (isLoginPage) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div id="app-layout" className={`app-layout bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3] min-h-screen ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      <Sidebar collapsed={sidebarCollapsed} onMenuClick={toggleSidebar} />
      <div
        className="app-content transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 80 : 260,
        }}
      >
        <Header onMenuClick={toggleSidebar} title={headerTitle}/>
        <div className="relative min-h-[calc(100vh-4rem)]">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <Home />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <Projects />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <Users />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <Organizations />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <Clients />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/time-tracker"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <TimeTracker />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/jira-summary"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <JiraDashboard />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/planning/*"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <PlanningContainer />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/kanban-states"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <KanbanStatesManager
                        states={kanbanStates}
                        setStates={setKanbanStates}
                      />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/config/theme"
                element={
                  <ProtectedRoute>
                    <motion.div {...pageTransition} className="h-full">
                      <ThemeManager />
                    </motion.div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}