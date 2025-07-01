import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { FiUsers, FiServer, FiPieChart, FiMessageCircle, FiDollarSign, FiCheckSquare } from 'react-icons/fi';
import Header from './components/Template/Header';
import Sidebar from './components/Template/Sidebar';
import Home from './components/Home/Home';
import Users from './components/Users/Users';
import Organizations from './components/Organizations/Organizations';
import Clients from './components/Customers/Clients';
import Projects from './components/Projects/Proyectos';
import TimeTracker from './components/timeTracker/TimeTracker';
import PlanningContainer from './components/Planning/PlanningContainer';
import KanbanStatesManager from './components/Planning/KanbanStatesManager';
import ThemeManager from './components/Config/ThemeManager';
import Tasks from './components/Tasks/Tasks';
import Tickets from './components/IT/Tickets';
import ExternalUsers from './components/IT/ExternalUsers';
import ExternalTicketForm from './components/External/ExternalTicketForm';
import ExternalFormManager from './components/IT/ExternalFormManager';
import Login from './components/Auth/Login.jsx';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AutoRedirect from './components/Auth/AutoRedirect.jsx';
import SubscriptionBlockedModal from './components/Common/SubscriptionBlockedModal';
import SubscriptionWarning from './components/Common/SubscriptionWarning';
import { AuthProvider } from "./context/AuthContext.jsx";
import { ExternalAuthProvider } from "./context/ExternalAuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { FocusModeProvider, useFocusMode } from "./context/FocusModeContext.jsx";
import { NotificationsProvider } from "./context/NotificationsContext.jsx";
import { useAppTheme } from "./context/ThemeContext.jsx";
import { useSubscriptionValidation } from "./hooks/useSubscriptionValidation";
import { useOrganizationStates } from "./hooks/useOrganizationStates";
import { getHeaderTitleFromSidebar } from './components/Template/sidebarConfig';
import UnitTesting from './components/Testing/UnitTesting';
import './index.css';
import { NotificationProvider } from './context/NotificationContext';
import { ProjectProgressProvider } from './context/ProjectProgressContext';

// Importar interceptor de fetch para manejar errores 401 automáticamente
import './utils/fetchInterceptor';

// Importar script de diagnóstico en desarrollo
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  import('./utils/debugAuth.js');
}

const DEFAULT_KANBAN_STATES = [
  { key: "nuevo", label: "Nuevo", color: "bg-gray-100", textColor: "text-gray-700" },
  { key: "en_progreso", label: "En Progreso", color: "bg-blue-50", textColor: "text-blue-700" },
  { key: "listo_pruebas", label: "Listo para Pruebas", color: "bg-yellow-50", textColor: "text-yellow-700" },
  { key: "cerrado", label: "Cerrado", color: "bg-green-50", textColor: "text-green-700" }
];

// Componente ComingSoon para funcionalidades en desarrollo
const ComingSoon = ({ title, description, icon }) => {
  const theme = useAppTheme();
  const IconComponent = icon;
  
  return (
    <div className={`flex flex-col min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] ${theme.FONT_CLASS}`}>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div
          className="text-center max-w-2xl mx-auto"
        >
          {/* Icono animado */}
          <div
            className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-2xl"
          >
            <IconComponent className="w-16 h-16 text-blue-600" />
          </div>

          {/* Título */}
          <h1
            className="text-4xl md:text-5xl font-bold text-gray-800 mb-6 tracking-tight"
          >
            {title}
          </h1>

          {/* Descripción */}
          <p
            className="text-xl text-gray-600 mb-8 leading-relaxed"
          >
            {description}
          </p>

          {/* Badge de estado */}
          <div
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 rounded-full font-semibold shadow-lg"
          >
            <div
              className="w-5 h-5 mr-3"
            >
              ⚡
            </div>
            Solución en Desarrollo
          </div>

          {/* Información adicional */}
          <div
            className="mt-12 p-6 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">🚀 Próximamente</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Interfaz moderna y responsive
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Integración completa
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                Automatización inteligente
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

function AppContent() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { kanbanStates: kanbanStatesData } = useOrganizationStates();
  const kanbanStates = kanbanStatesData?.states || [];
  const location = useLocation();
  const headerTitle = getHeaderTitleFromSidebar(location.pathname);
  const theme = useAppTheme();
  const { isFocusMode } = useFocusMode();
  
  // Validación de suscripción
  const {
    isBlocked,
    blockReason,
    subscriptionInfo,
    loading: subscriptionLoading,
    organizationName
  } = useSubscriptionValidation();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Efecto para contraer automáticamente el sidebar principal cuando se active el modo enfoque
  useEffect(() => {
    if (isFocusMode && !sidebarCollapsed) {
      // Solo contraer si el modo enfoque se acaba de activar y el sidebar no está colapsado
      // Usar sessionStorage para evitar contraer múltiples veces
      const hasContracted = sessionStorage.getItem('focusModeSidebarContracted');
      if (!hasContracted) {
        setSidebarCollapsed(true);
        sessionStorage.setItem('focusModeSidebarContracted', 'true');
      }
    } else if (!isFocusMode) {
      // Limpiar el flag cuando se desactiva el modo enfoque
      sessionStorage.removeItem('focusModeSidebarContracted');
    }
  }, [isFocusMode, sidebarCollapsed]);

  // Efecto para resetear el estado del sidebar al iniciar sesión
  useEffect(() => {
    const handleLogin = () => {
      // Limpiar flags de sessionStorage al iniciar sesión
      sessionStorage.removeItem('focusModeSidebarContracted');
      // Asegurar que el sidebar esté expandido por defecto al iniciar sesión
      if (sidebarCollapsed) {
        setSidebarCollapsed(false);
      }
    };

    window.addEventListener('userLoggedIn', handleLogin);
    
    return () => {
      window.removeEventListener('userLoggedIn', handleLogin);
    };
  }, [sidebarCollapsed]);

  // No mostrar Sidebar ni Header en la página de login
  const isLoginPage = location.pathname === '/login';
  if (isLoginPage) {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  // Verificar si es una ruta del portal externo
  const isExternalPortal = location.pathname === '/external/ticket-form' || location.pathname.startsWith('/external/form/');
  
  // Si es portal externo, renderizar sin header ni sidebar
  if (isExternalPortal) {
    return (
      <ExternalAuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30">
          <Routes location={location} key={location.pathname}>
            <Route path="/external/ticket-form" element={<ExternalTicketForm />} />
            <Route path="/external/form/:token" element={<ExternalTicketForm />} />
          </Routes>
        </div>
      </ExternalAuthProvider>
    );
  }

  return (
    <div id="app-layout" className={`app-layout bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3] min-h-screen ${theme.FONT_CLASS} ${theme.FONT_SIZE_CLASS}`}>
      {/* Modal de bloqueo de suscripción */}
      <SubscriptionBlockedModal
        isOpen={isBlocked}
        reason={blockReason}
        organizationName={organizationName}
        subscriptionInfo={subscriptionInfo}
      />
      
      {/* Advertencia de suscripción */}
      <SubscriptionWarning />
      
      <Sidebar collapsed={sidebarCollapsed} onMenuClick={toggleSidebar} />
      <div
        className="app-content focus-mode-expand transition-all duration-300"
        style={{
          marginLeft: sidebarCollapsed ? 80 : 256,
        }}
      >
        <Header onMenuClick={toggleSidebar} title={headerTitle}/>
        <div className="relative min-h-[calc(100vh-4rem)]">
          {/* Overlay de bloqueo cuando la suscripción está inactiva */}
          {isBlocked && (
            <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50" />
          )}
          
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              {/* Ruta raíz - redirección automática basada en autenticación */}
              <Route
                path="/"
                element={<AutoRedirect />}
              />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Home />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communications"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ComingSoon 
                        title="Sistema de Comunicaciones"
                        description="Plataforma de chat y comunicación en tiempo real para equipos de trabajo con gestión de conversaciones por usuarios admin."
                        icon={FiMessageCircle}
                      />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Tasks />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/projects"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Projects />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Users />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/organizations"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Organizations />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/customers"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Clients />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/time-tracker"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <TimeTracker />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/it/tickets"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <Tickets />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/it/infra"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ComingSoon 
                        title="Gestión de Infraestructura"
                        description="Panel de control para monitoreo y gestión de infraestructura IT con alertas y métricas en tiempo real."
                        icon={FiServer}
                      />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="manager/planning/*"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <PlanningContainer />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manager/kanban-states"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <KanbanStatesManager onClose={() => navigate('/home')} />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/config/theme"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ThemeManager />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/unit-testing"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <UnitTesting />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/quotations"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ComingSoon 
                        title="Sistema de Cotizaciones"
                        description="Plataforma completa para cotización de proyectos y creación de cuotas con gestión de presupuestos y seguimiento de propuestas."
                        icon={FiDollarSign}
                      />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/external/form-manager"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ExternalFormManager />
                    </div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/it/external-users"
                element={
                  <ProtectedRoute>
                    <div className="h-full">
                      <ExternalUsers />
                    </div>
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
        <ExternalAuthProvider>
          <FocusModeProvider>
            <NotificationsProvider>
              <NotificationProvider>
                <ProjectProgressProvider>
                  <AppContent />
                </ProjectProgressProvider>
              </NotificationProvider>
            </NotificationsProvider>
          </FocusModeProvider>
        </ExternalAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}