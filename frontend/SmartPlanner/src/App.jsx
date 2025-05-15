import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from './components/Template/Header';
import Sidebar from './components/Template/Sidebar';
import Home from './components/Home/Home.jsx';
import Users from './components/Users/Users.jsx';
import Clients from './components/Clients/Clients.jsx';
import Projects from './components/Projects/Proyectos.jsx';
import Tasks from './components/Tasks/Tasks.jsx';
import './index.css';

const pageTransition = {
  initial: { opacity: 0, scale: 0.98, y: 24, filter: "blur(4px)" },
  animate: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  exit: { opacity: 0, scale: 0.98, y: -24, filter: "blur(4px)" },
  transition: { duration: 0.38, ease: [0.4, 0, 0.2, 1] }
};

export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
                path="/"
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
                path="/projects"
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
                path="/users"
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
                path="/clients"
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
                path="/tasks"
                element={
                  <motion.div
                    {...pageTransition}
                    className="h-full"
                  >
                    <Tasks />
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