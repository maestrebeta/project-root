import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FiZap, FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiMail, FiMaximize2, FiMinimize2, FiLoader, FiCheckCircle, FiDatabase, FiCpu, FiPackage } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useFocusMode } from '../../context/FocusModeContext';
import { useNavigate } from 'react-router-dom';

// --- Componente de fondo animado estilo Tron ---
const TronGridBackground = () => (
  <div className="absolute inset-0 w-full h-full bg-black overflow-hidden z-0">
    <div className="absolute inset-0 bg-gradient-to-c from-black via-indigo-900/40 to-black" />
    <div className="absolute w-full h-full tron-grid" />
    <div className="absolute w-full h-full tron-glow" />
  </div>
);

export default function Login() {
  const [view, setView] = useState('login'); // 'login' or 'recovery'
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState({ isActive: false, currentStep: '', progress: 0 });
  const [appOptimized, setAppOptimized] = useState(false);
  const [showPreparationModal, setShowPreparationModal] = useState(false);
  const [preparationComplete, setPreparationComplete] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const [showAppContent, setShowAppContent] = useState(false);
  const [backgroundPhase, setBackgroundPhase] = useState('dark'); // 'dark' | 'light' | 'gradient'
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(false);
  const [showOptimizedCard, setShowOptimizedCard] = useState(false);
  const [autoRedirectTimer, setAutoRedirectTimer] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(2.5);

  const { login } = useAuth();
  const focusMode = useFocusMode();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      await login(credentials.username, credentials.password);
      
      // Limpiar flag de logout ya que el login fue exitoso
      localStorage.removeItem('smartplanner_just_logged_out');
      
      // Verificar si la app está completamente optimizada
      // FORZAR modal de preparación para experiencia premium
      // Solo continuar directamente si está optimizada Y no hay precarga activa Y es una sesión recurrente
      const isRecurrentSession = localStorage.getItem('smartplanner_recurrent_session') === 'true';
      
      if (appOptimized && !preloadStatus.isActive && isRecurrentSession) {
        // App ya optimizada y sesión recurrente, continuar directamente
        const focusActivated = focusMode.activateFocusMode();
        
        if (focusActivated) {
          // Verificar que se activó correctamente
          setTimeout(() => {
            if (!focusMode.isFocusMode) {
              focusMode.activateFocusMode();
            }
          }, 500);
          
          // Verificación adicional después de 2 segundos
          setTimeout(() => {
            if (!focusMode.isFocusMode) {
              focusMode.activateFocusMode();
              // También agregar la clase CSS directamente como fallback
              document.body.classList.add('focus-mode-active');
            }
          }, 2000);
          
          // Navegar al home después de activar el modo enfoque
          setTimeout(() => {
            navigate('/home');
          }, 2500);
        } else {
          navigate('/home');
        }
      } else {
        // Mostrar modal de preparación - primera vez o app no optimizada
        setShowPreparationModal(true);
        
        // Simular proceso de preparación simple y directo
        const steps = [
          'Cargando datos de usuario...',
          'Preparando componentes...',
          'Optimizando servicios...',
          'Cargando estilos y recursos...',
          'Renderizando interfaces...',
          'Finalizando configuración...'
        ];
        
        // Ejecutar pasos secuencialmente
        for (let i = 0; i < steps.length; i++) {
          setPreloadStatus({
            isActive: true,
            currentStep: steps[i],
            progress: ((i + 1) / steps.length) * 100
          });
          
          // Esperar 1 segundo por paso
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Marcar como completado
        setPreloadStatus({
          isActive: false,
          currentStep: '',
          progress: 100
        });
        setAppOptimized(true);
        setPreparationComplete(true);
      }
    } catch (error) {
      setError(error.message || 'Credenciales inválidas o error en el sistema.');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const handleRecoverySubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    
    // Simulación de llamada a API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoading(false);
    setRecoverySuccess(true);
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError('');
  };

  const switchToLogin = () => {
    setView('login');
    setError('');
    setRecoveryEmail('');
    setRecoverySuccess(false);
  };

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        // Limpiar flag de rechazo ya que el usuario la está activando
        localStorage.removeItem('smartplanner_fullscreen_rejected');
        
        // Activar pantalla completa
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
          document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
          document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
          document.documentElement.mozRequestFullScreen();
        }
      } else {
        // Salir de pantalla completa
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        }
        
        // No marcar nada - el usuario puede volver a activarla
      }
    } catch (error) {
    }
  };

  // --- Variantes de animación para Framer Motion ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    },
  };

  const formContainerVariants = {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 50 },
  };

  useEffect(() => {
    // Verificar si el usuario acaba de cerrar sesión
    const justLoggedOut = localStorage.getItem('smartplanner_just_logged_out') === 'true';
    
    // Verificar si el usuario rechazó explícitamente la pantalla completa
    const explicitlyRejected = localStorage.getItem('smartplanner_fullscreen_rejected') === 'true';
    
    // Si acaba de cerrar sesión o rechazó explícitamente, no activar pantalla completa automáticamente
    if (justLoggedOut || explicitlyRejected) {
      // Limpiar el flag de logout
      localStorage.removeItem('smartplanner_just_logged_out');
      return;
    }

    // Estrategia agresiva para activar pantalla completa
    const activateFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          // Intentar diferentes métodos de pantalla completa para compatibilidad
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
          } else if (document.documentElement.msRequestFullscreen) {
            await document.documentElement.msRequestFullscreen();
          } else if (document.documentElement.mozRequestFullScreen) {
            await document.documentElement.mozRequestFullScreen();
          }
        }
      } catch (error) {
      }
    };

    // Si no acaba de cerrar sesión, activar pantalla completa normalmente
    const attempts = [
      () => activateFullscreen(), // Inmediato
      () => setTimeout(activateFullscreen, 500), // 500ms
      () => setTimeout(activateFullscreen, 1000), // 1 segundo
      () => setTimeout(activateFullscreen, 2000), // 2 segundos
      () => setTimeout(activateFullscreen, 3000), // 3 segundos
    ];

    // Ejecutar todos los intentos
    attempts.forEach(attempt => attempt());

    // También intentar cuando el usuario interactúe con la página
    const handleUserInteraction = () => {
      // Solo activar si no fue rechazado explícitamente
      if (!localStorage.getItem('smartplanner_fullscreen_rejected')) {
        activateFullscreen();
      }
      // Remover el listener después del primer intento exitoso
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    // Agregar listeners para interacción del usuario
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    // Mostrar prompt de pantalla completa después de 4 segundos si no se activó
    const showPromptTimer = setTimeout(() => {
      if (!document.fullscreenElement && 
          !localStorage.getItem('smartplanner_fullscreen_rejected')) {
        setShowFullscreenPrompt(true);
      }
    }, 4000);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      clearTimeout(showPromptTimer);
    };
  }, []);

  // Detectar cambios de pantalla completa
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        document.mozFullScreenElement
      );
      setIsFullscreen(isFullscreen);
    };

    // Agregar listeners para diferentes navegadores
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Sistema de precarga inteligente
  const startPreloadProcess = async () => {
    try {
      // Verificar si la app ya está optimizada
      const lastOptimization = localStorage.getItem('smartplanner_last_optimization');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 hora en milisegundos
      
      if (lastOptimization && (now - parseInt(lastOptimization)) < oneHour) {
        setAppOptimized(true);
        return;
      }

      setPreloadStatus({ isActive: true, currentStep: 'Iniciando optimización...', progress: 0 });

      const steps = [
        { name: 'Cargando datos de usuario...', icon: FiDatabase, duration: 800 },
        { name: 'Preparando componentes...', icon: FiPackage, duration: 1200 },
        { name: 'Optimizando servicios...', icon: FiCpu, duration: 1000 },
        { name: 'Cargando estilos y recursos...', icon: FiLoader, duration: 800 },
        { name: 'Renderizando interfaces...', icon: FiLoader, duration: 1500 },
        { name: 'Finalizando configuración...', icon: FiCheckCircle, duration: 500 }
      ];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const progress = ((i + 1) / steps.length) * 100;

        setPreloadStatus({
          isActive: true,
          currentStep: step.name,
          progress: progress
        });

        // Simular trabajo de precarga
        await new Promise(resolve => setTimeout(resolve, step.duration));
        
        // Precarregar componentes pesados
        if (step.name.includes('componentes')) {
          try {
            await preloadHeavyComponents();
          } catch (error) {
            console.warn('Error precargando componentes:', error);
          }
        }
        
        if (step.name.includes('servicios')) {
          try {
            await preloadServices();
          } catch (error) {
            console.warn('Error precargando servicios:', error);
          }
        }

        if (step.name.includes('estilos')) {
          try {
            await preloadStyles();
          } catch (error) {
            console.warn('Error precargando estilos:', error);
          }
        }
      }

      // Marcar como optimizada
      localStorage.setItem('smartplanner_last_optimization', now.toString());
      setAppOptimized(true);
      
      setTimeout(() => {
        setPreloadStatus({ isActive: false, currentStep: '', progress: 0 });
      }, 2000);
    } catch (error) {
      console.error('Error en el proceso de precarga:', error);
      // En caso de error, marcar como optimizada para no bloquear la app
      setAppOptimized(true);
      setPreloadStatus({ isActive: false, currentStep: '', progress: 0 });
    }
  };

  const preloadHeavyComponents = async () => {
    try {
      // Precarregar componentes pesados dinámicamente
      const components = [
        // Componentes principales
        () => import('../../components/Planning/PlanningBoard'),
        () => import('../../components/Planning/EpicsSidebar'),
        () => import('../../components/Home/Home'),
        () => import('../../components/Notifications/NotificationsPanel'),
        () => import('../../components/Settings/SettingsLayout'),
        
        // Centro de proyectos (carpeta Projects)
        () => import('../../components/Projects/Proyectos'),
        () => import('../../components/Projects/ProjectModal'),
        () => import('../../components/Projects/ProyectosTable'),
        () => import('../../components/Projects/ProjectPlanningIntegration'),
        
        // Time Tracker (carpeta timeTracker)
        () => import('../../components/timeTracker/TimeTracker'),
        () => import('../../components/timeTracker/FormularioEntrada'),
        () => import('../../components/timeTracker/TimerPanel'),
        () => import('../../components/timeTracker/CalendarioSemana'),
        () => import('../../components/timeTracker/TaskStatesManager'),
        () => import('../../components/timeTracker/EntradasTiempo'),
        () => import('../../components/timeTracker/useProjectsAndTags'),
        () => import('../../components/timeTracker/Tasks'),
        () => import('../../components/timeTracker/TasksTable'),
        () => import('../../components/timeTracker/EstadisticasPanel'),
        () => import('../../components/timeTracker/NotificationPortal'),
        
        // Componentes de gestión (archivos reales)
        () => import('../../components/Users/Users'),
        () => import('../../components/Users/UserModal'),
        () => import('../../components/Users/UsersTable'),
        () => import('../../components/Users/CapacityEfficiencyView'),
        () => import('../../components/Organizations/Organizations'),
        () => import('../../components/Organizations/OrganizationsTable'),
        
        // Componentes de perfil
        () => import('../../components/Profile/ProfileModal'),
        
        // Componentes de configuración
        () => import('../../components/Config/ThemeManager'),
        () => import('../../components/Config/theme')
      ];

      const results = await Promise.allSettled(components.map(component => component()));
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;
      
    } catch (error) {
      console.error('Error en precarga de componentes:', error);
      throw error;
    }
  };

  const preloadServices = async () => {
    try {
      // Precarregar servicios y datos
      const services = [
        // Simular precarga de servicios de autenticación
        new Promise(resolve => setTimeout(resolve, 300)),
        
        // Simular precarga de datos de proyectos
        new Promise(resolve => setTimeout(resolve, 200)),
        
        // Simular precarga de datos de usuarios
        new Promise(resolve => setTimeout(resolve, 400)),
        
        // Simular precarga de configuración de la app
        new Promise(resolve => setTimeout(resolve, 150)),
        
        // Simular precarga de datos de time tracking
        new Promise(resolve => setTimeout(resolve, 250)),
        
        // Simular precarga de notificaciones
        new Promise(resolve => setTimeout(resolve, 180))
      ];

      await Promise.allSettled(services);
    } catch (error) {
      console.error('Error en precarga de servicios:', error);
      throw error;
    }
  };

  // Función para precargar estilos y recursos
  const preloadStyles = async () => {
    try {
      // Precarregar estilos CSS críticos
      const stylePromises = [
        // Precargar estilos de componentes
        new Promise(resolve => {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = '/src/styles/focusMode.css';
          link.onload = resolve;
          link.onerror = resolve; // No fallar si no existe
          document.head.appendChild(link);
        }),
        
        // Precargar fuentes si no están cargadas
        new Promise(resolve => {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(resolve);
          } else {
            resolve();
          }
        }),
        
        // Precargar iconos de react-icons
        new Promise(resolve => setTimeout(resolve, 200)),
        
        // Precargar estilos de Tailwind CSS (si no están ya cargados)
        new Promise(resolve => {
          if (!document.querySelector('link[href*="tailwind"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/src/index.css';
            link.onload = resolve;
            link.onerror = resolve;
            document.head.appendChild(link);
          } else {
            resolve();
          }
        }),
        
        // Precargar estilos de animaciones
        new Promise(resolve => setTimeout(resolve, 150))
      ];

      await Promise.allSettled(stylePromises);
    } catch (error) {
      console.error('Error en precarga de estilos:', error);
      throw error;
    }
  };

  // Iniciar precarga cuando se carga el componente
  useEffect(() => {
    const timer = setTimeout(() => {
      startPreloadProcess();
    }, 1000); // Esperar 1 segundo antes de iniciar

    return () => clearTimeout(timer);
  }, []);

  // Controlar la visibilidad de la tarjeta "App Optimizada"
  useEffect(() => {
    if (appOptimized && !preloadStatus.isActive) {
      setShowOptimizedCard(true);
      
      // Ocultar la tarjeta después de 5 segundos
      const timer = setTimeout(() => {
        setShowOptimizedCard(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    } else {
      setShowOptimizedCard(false);
    }
  }, [appOptimized, preloadStatus.isActive]);

  // Timer automático para redirección cuando se complete la preparación
  useEffect(() => {
    if (preparationComplete) {
      // Limpiar timer anterior si existe
      if (autoRedirectTimer) {
        clearTimeout(autoRedirectTimer);
      }
      
      // Resetear contador
      setRedirectCountdown(2.5);
      
      // Configurar timer automático de 2.5 segundos
      const timer = setTimeout(() => {
        closePreparationModal();
      }, 2500);
      
      setAutoRedirectTimer(timer);
      
      // Contador regresivo cada 100ms
      const countdownInterval = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 0.1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return Math.max(0, prev - 0.1);
        });
      }, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(countdownInterval);
      };
    } else {
      setRedirectCountdown(2.5);
    }
  }, [preparationComplete]);

  // Cuando se completa la preparación, animar el fondo y mostrar el contenido principal
  const closePreparationModal = () => {
    // Limpiar timer automático si existe
    if (autoRedirectTimer) {
      clearTimeout(autoRedirectTimer);
      setAutoRedirectTimer(null);
    }
    
    // Resetear contador
    setRedirectCountdown(2.5);
    
    // Fase 1: Iniciar transición - ocultar modal y activar estado de transición
    setShowPreparationModal(false);
    setPreparationComplete(false);
    setIsTransitioning(true);
    
    // Marcar como sesión recurrente para futuros logins
    localStorage.setItem('smartplanner_recurrent_session', 'true');
    
    // Fase 2: Transición de fondo oscuro a blanco
    setTimeout(() => {
      setBackgroundPhase('light');
      
      // Mostrar pantalla de bienvenida después de que el fondo blanco esté visible
      setTimeout(() => {
        setShowWelcomeScreen(true);
      }, 1000); // Esperar a que la transición a blanco esté completa
      
      // Fase 3: Transición al gradiente de la app
      setTimeout(() => {
        setBackgroundPhase('gradient');
        
        // Ocultar pantalla de bienvenida de manera fluida
        setTimeout(() => {
          setShowWelcomeScreen(false);
        }, 500);
        
        // Fase 4: Mostrar contenido principal
        setTimeout(() => {
          setShowAppContent(true);
          
          // Activar modo enfoque si no está activo
          if (!focusMode.isFocusMode) {
            focusMode.activateFocusMode();
          }
          
          // Fase 5: Finalizar transición y navegar al home
          setTimeout(() => {
            setIsTransitioning(false);
            navigate('/home');
          }, 1000);
        }, 1000);
      }, 3000); // Mantener fondo blanco por 3 segundos para mostrar bienvenida
    }, 800); // Pequeño delay para que el modal termine de desaparecer
  };

  // Fondo animado premium con transiciones más suaves
  const getBgStyle = () => {
    if (backgroundPhase === 'dark') {
      return {
        background: '#000',
        transition: 'background 2s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };
    }
    if (backgroundPhase === 'light') {
      return {
        background: '#fff',
        transition: 'background 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
      };
    }
    // gradient de Home con transición más suave
    return {
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      transition: 'background 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    };
  };

  // Cuando se muestra el modal de preparación, iniciar transición de fondo oscuro a blanco
  useEffect(() => {
    if (showPreparationModal) {
      setBackgroundPhase('dark');
    }
  }, [showPreparationModal]);

  // Cuando se monta el login, fondo oscuro
  useEffect(() => {
    setBackgroundPhase('dark');
    setShowAppContent(false);
  }, []);

  return (
    <>
      <style>{`
        .tron-grid {
          background-image:
            linear-gradient(rgba(0, 192, 255, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 192, 255, 0.3) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: pan-grid 20s linear infinite;
        }

        .tron-glow {
          background: radial-gradient(circle at center, rgba(0, 128, 255, 0.3), transparent 70%);
          animation: pulse-glow 8s ease-in-out infinite;
        }

        @keyframes pan-grid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }

        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        
        .input-glow:focus {
          box-shadow: 0 0 10px rgba(0, 192, 255, 0.7), 0 0 20px rgba(0, 192, 255, 0.5);
        }

        .text-glow {
          text-shadow: 0 0 8px rgba(0, 192, 255, 0.8);
        }

        /* Prevenir scroll durante transiciones */
        body {
          overflow: hidden;
        }

        /* Asegurar que los modales no causen scroll */
        .modal-container {
          overflow: hidden;
          max-height: 100vh;
        }
      `}</style>
      
      {/* Fondo animado premium */}
      <motion.div
        className="fixed inset-0 w-full h-full z-0"
        style={getBgStyle()}
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Efecto de partículas sutiles durante transición */}
      {(backgroundPhase === 'light' || backgroundPhase === 'gradient') && (
        <motion.div
          className="fixed inset-0 z-10 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-indigo-50/30" />
          <motion.div 
            className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400/25 rounded-full animate-pulse" 
            style={{ animationDuration: '4s' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400/35 rounded-full animate-pulse" 
            style={{ animationDuration: '3.5s' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-indigo-400/30 rounded-full animate-pulse" 
            style={{ animationDuration: '4.5s' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-1 h-1 bg-blue-400/20 rounded-full animate-pulse" 
            style={{ animationDuration: '3s' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2, duration: 1.5, ease: "easeOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-0.5 h-0.5 bg-purple-400/40 rounded-full animate-pulse" 
            style={{ animationDuration: '5s' }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 2.5, duration: 1.5, ease: "easeOut" }}
          />
        </motion.div>
      )}

      {/* TronGridBackground solo si no está el fondo gradient */}
      {backgroundPhase !== 'gradient' && <TronGridBackground />}

      {/* Prompt de pantalla completa - siempre visible cuando sea necesario */}
      <AnimatePresence>
        {showFullscreenPrompt && !isFullscreen && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 right-6 z-50 bg-cyan-400/20 backdrop-blur-xl border border-cyan-400/50 rounded-2xl p-4 shadow-2xl max-w-xs overflow-hidden"
          >
            <div className="flex items-center gap-3">
              <FiMaximize2 className="w-5 h-5 text-cyan-300 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-cyan-200">
                  ¿Activar pantalla completa?
                </p>
                <p className="text-xs text-cyan-200/70 mt-1">
                  Para una mejor experiencia
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  // Limpiar flag de rechazo ya que el usuario quiere activar
                  localStorage.removeItem('smartplanner_fullscreen_rejected');
                  toggleFullscreen();
                  setShowFullscreenPrompt(false);
                }}
                className="px-3 py-1.5 bg-cyan-400/30 text-cyan-200 rounded-lg text-xs font-medium hover:bg-cyan-400/50 transition-colors"
              >
                Sí, activar
              </button>
              <button
                onClick={() => {
                  setShowFullscreenPrompt(false);
                  // Marcar que el usuario rechazó la pantalla completa para no volver a preguntar
                  localStorage.setItem('smartplanner_fullscreen_rejected', 'true');
                }}
                className="px-3 py-1.5 bg-gray-600/30 text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-600/50 transition-colors"
              >
                No, gracias
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Efecto de transición al contenido de la app */}
      {showAppContent && (
        <motion.div
          className="fixed inset-0 z-15 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/15 via-purple-100/10 to-indigo-100/15" />
          <motion.div 
            className="absolute top-1/3 left-1/3 w-3 h-3 bg-blue-500/15 rounded-full animate-ping" 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
            style={{ animationDuration: '3s' }}
          />
          <motion.div 
            className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-500/20 rounded-full animate-ping" 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, duration: 1.5, ease: "easeOut" }}
            style={{ animationDuration: '4s' }}
          />
        </motion.div>
      )}

      {/* Efecto de transición suave del modal al fondo */}
      {isTransitioning && !showAppContent && (
        <motion.div
          className="fixed inset-0 z-12 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-gray-50/15 to-white/20" />
          <motion.div 
            className="absolute top-1/2 left-1/2 w-4 h-4 bg-blue-400/10 rounded-full"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 1], opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </motion.div>
      )}

      {/* Pantalla de bienvenida estilo iPhone */}
      <AnimatePresence>
        {showWelcomeScreen && (
          <motion.div
            className="fixed inset-0 z-25 flex items-center justify-center bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="text-center space-y-8">
              {/* Logo animado */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
                className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"
              >
                <FiZap className="w-12 h-12 text-white" />
              </motion.div>
              
              {/* Título de bienvenida */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                className="space-y-4"
              >
                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                  ¡Bienvenido!
                </h1>
                <p className="text-xl text-gray-600 font-medium">
                  SmartPlanner está listo
                </p>
              </motion.div>
              
              {/* Indicador de carga elegante */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ delay: 1, duration: 0.8, ease: "easeOut" }}
                className="flex justify-center"
              >
                <div className="flex space-x-2">
                  <motion.div
                    className="w-3 h-3 bg-blue-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className="w-3 h-3 bg-purple-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                  />
                  <motion.div
                    className="w-3 h-3 bg-indigo-500 rounded-full"
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                  />
                </div>
              </motion.div>
              
              {/* Mensaje de estado */}
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
                className="text-sm text-gray-500 font-medium"
              >
                Preparando tu experiencia...
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de preparación con transición premium */}
      <AnimatePresence>
        {showPreparationModal && !showAppContent && (
          <motion.div
            key="preparation-modal"
            className="fixed inset-0 flex items-center justify-center z-20 modal-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ pointerEvents: 'auto' }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ 
                scale: 1.05, 
                opacity: 0, 
                y: -30,
                transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
              }}
              transition={{ 
                type: 'spring', 
                stiffness: 60, 
                damping: 20,
                duration: 0.8
              }}
              className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-md w-full p-8 text-center overflow-hidden"
              style={{ maxHeight: '90vh' }}
            >
              <motion.div
                animate={{ rotate: preparationComplete ? 360 : 0 }}
                transition={{ 
                  duration: preparationComplete ? 0.8 : 2, 
                  repeat: preparationComplete ? 0 : Infinity, 
                  ease: "easeInOut" 
                }}
                className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                {preparationComplete ? (
                  <FiCheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <FiLoader className="w-10 h-10 text-white" />
                )}
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  delay: 0.2, 
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="text-2xl font-bold text-gray-900 mb-4"
              >
                {preparationComplete ? '¡Listo!' : 'Preparando SmartPlanner'}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ 
                  delay: 0.3, 
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                className="text-gray-600 mb-6 leading-relaxed"
              >
                {preparationComplete 
                  ? 'Todo está listo para ofrecerte la mejor experiencia. ¡Bienvenido a SmartPlanner!'
                  : 'Estamos preparando todos los componentes y optimizando la aplicación para ofrecerte la mejor experiencia posible.'
                }
              </motion.p>
              {preparationComplete && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ 
                    delay: 0.4, 
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="text-sm text-blue-600 font-medium mb-4"
                >
                  Redirigiendo automáticamente al home...
                </motion.p>
              )}
              {!preparationComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    delay: 0.4, 
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  className="space-y-3 mb-6"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    {preloadStatus.currentStep || 'Inicializando...'}
                  </p>
                </motion.div>
              )}
              {preparationComplete && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  transition={{ 
                    delay: 0.3, 
                    duration: 0.6,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  whileHover={{ 
                    scale: 1.05, 
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ 
                    scale: 0.95,
                    transition: { duration: 0.1 }
                  }}
                  onClick={closePreparationModal}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Continuar ({redirectCountdown.toFixed(1)}s)
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal (login, home, etc) */}
      <AnimatePresence>
        {!showPreparationModal && !showAppContent && !isTransitioning && (
          <motion.div
            key="login-content"
            className="min-h-screen flex items-center justify-center relative z-10"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 1.02, 
              y: -20,
              transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
            }}
            transition={{ 
              duration: 0.8, 
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
          >
            {/* Botón de pantalla completa en la esquina superior derecha */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              onClick={toggleFullscreen}
              className="absolute top-6 right-6 z-20 p-3 rounded-full bg-cyan-400/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/30 hover:border-cyan-400/70 transition-all duration-300 backdrop-blur-sm"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Activar pantalla completa'}
            >
              {isFullscreen ? <FiMinimize2 className="w-5 h-5" /> : <FiMaximize2 className="w-5 h-5" />}
            </motion.button>

            {/* Indicador de precarga en la esquina inferior derecha */}
            <AnimatePresence>
              {preloadStatus.isActive && (
                <motion.div
                  initial={{ opacity: 0, x: 100, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.8 }}
                  className="absolute bottom-6 right-6 z-20 w-80 bg-black/60 backdrop-blur-xl border border-cyan-400/30 rounded-2xl p-4 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-cyan-400 rounded-full border-t-transparent"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FiLoader className="w-3 h-3 text-cyan-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-cyan-300 font-mono">Optimizando SmartPlanner</h3>
                      <p className="text-xs text-cyan-200/70 font-mono">{preloadStatus.currentStep}</p>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="w-full bg-cyan-400/20 rounded-full h-2 mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${preloadStatus.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full shadow-lg"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-cyan-200/60 font-mono">
                      {Math.round(preloadStatus.progress)}% completado
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Indicador de app optimizada */}
            <AnimatePresence>
              {showOptimizedCard && !preloadStatus.isActive && (
                <motion.div
                  initial={{ opacity: 0, x: 100, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 100, scale: 0.8 }}
                  transition={{ 
                    enter: { duration: 0.3, ease: "easeOut" },
                    exit: { duration: 0.5, ease: "easeIn" }
                  }}
                  className="absolute bottom-6 right-6 z-20 w-64 bg-black/60 backdrop-blur-xl border border-green-400/30 rounded-2xl p-4 shadow-2xl overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-400/20 rounded-full flex items-center justify-center">
                      <FiCheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-green-300 font-mono">App Optimizada</h3>
                      <p className="text-xs text-green-200/70 font-mono">Lista para usar</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-sm relative z-10"
        >
          {/* Logo y título */}
          <motion.div variants={itemVariants} className="text-center mb-12">
            <div className="inline-block p-4 rounded-full bg-cyan-400/20 border border-cyan-400/50 mb-4">
              <FiZap className="w-10 h-10 text-cyan-300 text-glow" />
            </div>
            <h1 className="text-4xl font-bold text-white text-glow tracking-widest">
              SmartPlanner
            </h1>
            <h2 className="text-md text-cyan-100/80 mt-2">
              Plataforma de Gestión de Proyectos y Recursos
            </h2>
            <p className="text-cyan-200/70 mt-4 text-sm font-mono uppercase">
              {view === 'login' ? 'Acceso al Sistema' : 'Modo de Recuperación'}
            </p>
          </motion.div>

          {/* Contenedor de Formulario con AnimatePresence */}
          <AnimatePresence mode="wait">
            {view === 'login' ? (
              <motion.div
                key="login"
                variants={formContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20 shadow-[0_0_30px_rgba(0,192,255,0.2)]">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Campos de login... */}
                    <div className="relative">
                      <input type="text" name="username" value={credentials.username} onChange={handleChange} className="w-full bg-transparent border-b-2 border-cyan-300/30 text-white placeholder-cyan-200/50 px-2 py-3 focus:outline-none focus:border-cyan-400 transition-all duration-300 input-glow" placeholder="Usuario" required />
                      <FiUser className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-300/50" />
                    </div>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" value={credentials.password} onChange={handleChange} className="w-full bg-transparent border-b-2 border-cyan-300/30 text-white placeholder-cyan-200/50 px-2 py-3 focus:outline-none focus:border-cyan-400 transition-all duration-300 input-glow" placeholder="Contraseña" required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-300/50 hover:text-cyan-300 transition-colors">{showPassword ? <FiEyeOff /> : <FiEye />}</button>
                    </div>

                    <div className="text-right -mt-4">
                      <button type="button" onClick={() => setView('recovery')} className="text-xs text-cyan-200/60 hover:text-cyan-200 hover:underline transition font-mono">¿Olvidaste tu contraseña?</button>
                    </div>

                    {error && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-mono text-center">{`// ERROR: ${error}`}</motion.div>}
                    
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.05 }} whileTap={{ scale: loading ? 1 : 0.95 }} className={`w-full font-bold text-lg py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${loading ? 'bg-cyan-500/50 text-cyan-200 cursor-wait' : 'bg-cyan-400/20 text-cyan-200 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,192,255,0.7)]'}`}>
                      {loading ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-cyan-200 rounded-full border-t-transparent" /><span>Autenticando...</span></>) : (<><span>Acceder</span><FiArrowRight /></>)}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="recovery"
                variants={formContainerVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ type: 'spring', stiffness: 100 }}
              >
                <div className="bg-black/50 backdrop-blur-md rounded-2xl p-8 border border-cyan-300/20 shadow-[0_0_30px_rgba(0,192,255,0.2)]">
                  <form onSubmit={handleRecoverySubmit} className="space-y-8">
                    {recoverySuccess ? (
                      <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 text-green-300 text-sm font-mono text-center h-24 flex items-center justify-center">
                        // Éxito: Protocolo de recuperación enviado.
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input type="email" name="recoveryEmail" value={recoveryEmail} onChange={(e) => setRecoveryEmail(e.target.value)} className="w-full bg-transparent border-b-2 border-cyan-300/30 text-white placeholder-cyan-200/50 px-2 py-3 focus:outline-none focus:border-cyan-400 transition-all duration-300 input-glow" placeholder="Dirección de Email" required />
                          <FiMail className="absolute right-2 top-1/2 transform -translate-y-1/2 text-cyan-300/50" />
                        </div>
                        <motion.button type="submit" disabled={loading} whileHover={{ scale: loading ? 1 : 1.05 }} whileTap={{ scale: loading ? 1 : 0.95 }} className={`w-full font-bold text-lg py-3 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 ${loading ? 'bg-cyan-500/50 text-cyan-200 cursor-wait' : 'bg-cyan-400/20 text-cyan-200 border-2 border-cyan-400 hover:bg-cyan-400 hover:text-black hover:shadow-[0_0_20px_rgba(0,192,255,0.7)]'}`}>
                          {loading ? (<><motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-cyan-200 rounded-full border-t-transparent" /><span>Enviando...</span></>) : (<span>Iniciar Recuperación</span>)}
                        </motion.button>
                      </>
                    )}
                    <button type="button" onClick={switchToLogin} className="!mt-4 text-center w-full text-xs text-cyan-200/60 hover:text-cyan-200 hover:underline transition font-mono">&lt; Volver al Inicio de Sesión</button>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <motion.p variants={itemVariants} className="text-center mt-8 text-xs text-cyan-200/50 font-mono">
            © 2025 SmartPlanner | Todos los derechos reservados.
          </motion.p>
        </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 