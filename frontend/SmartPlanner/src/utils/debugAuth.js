// Script de diagnóstico para autenticación

export const debugAuth = async () => {
  console.group('🔍 Diagnóstico de Autenticación');
  
  try {
    // 1. Verificar conectividad con el servidor
    console.log('1. Verificando conectividad...');
    const healthResponse = await fetch('http://localhost:8000/docs');
    console.log(`Servidor responde: ${healthResponse.status}`);
    
    // 2. Probar login con credenciales conocidas
    console.log('2. Probando login...');
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');
    formData.append('grant_type', 'password');

    const loginResponse = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
      credentials: 'include'
    });

    console.log(`Login Status: ${loginResponse.status}`);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login exitoso');
      console.log('Token:', loginData.access_token?.substring(0, 50) + '...');
      console.log('Usuario:', loginData.user);
      
      // 3. Probar endpoint protegido
      console.log('3. Probando endpoint protegido...');
      const statsResponse = await fetch('http://localhost:8000/users/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      console.log(`Stats Status: ${statsResponse.status}`);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('✅ Endpoint protegido funcionando');
        console.log('Stats:', statsData);
      } else {
        console.error('❌ Error en endpoint protegido:', await statsResponse.text());
      }
      
      // 4. Simular guardado en localStorage
      console.log('4. Simulando sesión...');
      const session = {
        user: loginData.user,
        token: loginData.access_token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      localStorage.setItem('session', JSON.stringify(session));
      console.log('✅ Sesión guardada en localStorage');
      
      // 5. Verificar utilidades de auth
      console.log('5. Verificando utilidades de auth...');
      const { isAuthenticated, getCurrentUser } = await import('./authUtils.js');
      
      console.log('isAuthenticated():', isAuthenticated());
      console.log('getCurrentUser():', getCurrentUser());
      
    } else {
      const errorData = await loginResponse.text();
      console.error('❌ Error en login:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
  
  console.groupEnd();
};

// Función para limpiar y reiniciar
export const resetAuth = () => {
  localStorage.removeItem('session');
  console.log('🧹 Sesión limpiada');
};

// Función para mostrar estado actual
export const showAuthStatus = () => {
  console.group('📊 Estado de Autenticación');
  
  const session = localStorage.getItem('session');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
      console.log('Sesión encontrada:', {
        usuario: parsedSession.user?.username,
        rol: parsedSession.user?.role,
        organización: parsedSession.user?.organization_id,
        expira: new Date(parsedSession.expiresAt),
        token: parsedSession.token?.substring(0, 50) + '...'
      });
    } catch (error) {
      console.error('Error al parsear sesión:', error);
    }
  } else {
    console.log('No hay sesión activa');
  }
  
  console.groupEnd();
};

// Exportar para uso en consola del navegador
window.debugAuth = debugAuth;
window.resetAuth = resetAuth;
window.showAuthStatus = showAuthStatus; 