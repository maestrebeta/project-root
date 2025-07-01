import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAuthenticated } from '../../utils/authUtils';

export default function AutoRedirect() {
  const { isAuthenticated: authContextAuthenticated, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  
  // Verificar autenticación tanto del contexto como de las utilidades
  const isUserAuthenticated = authContextAuthenticated || isAuthenticated();
  
  useEffect(() => {
    // Pequeño delay para asegurar que el contexto se haya inicializado
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
  }, [authContextAuthenticated, isUserAuthenticated, loading, isChecking]);
  
  // Si está cargando o verificando, mostrar un loading sutil
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f6f7fb] to-[#e9eaf3] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }
  
  // Si está autenticado, redirigir al home
  if (isUserAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  
  // Si no está autenticado, redirigir al login
  return <Navigate to="/login" replace />;
} 