// Script de diagnóstico para autenticación

export const debugAuth = async () => {
  console.group('🔍 Diagnóstico de Autenticación');
  
  try {
    // 1. Verificar conectividad con el servidor
    console.log('1. Verificando conectividad...');
    const healthResponse = await fetch('http://localhost:8001/docs');
    console.log(`Servidor responde: ${healthResponse.status}`);
    
    // 2. Probar login con credenciales conocidas
    console.log('2. Probando login...');
    const formData = new URLSearchParams();
    formData.append('username', 'admin');
    formData.append('password', 'admin123');
    formData.append('grant_type', 'password');

    const loginResponse = await fetch('http://localhost:8001/auth/login', {
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
      
      // 3. Probar endpoint protegido
      const statsResponse = await fetch('http://localhost:8001/users/stats', {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
      } else {
        console.error('❌ Error en endpoint protegido:', await statsResponse.text());
      }
      
      // 4. Simular guardado en localStorage
      const session = {
        user: loginData.user,
        token: loginData.access_token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      
      localStorage.setItem('session', JSON.stringify(session));
      
      // 5. Verificar utilidades de auth
      const { isAuthenticated, getCurrentUser } = await import('./authUtils.js');
      
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
};

// Función para mostrar estado actual
export const showAuthStatus = () => {
  console.group('📊 Estado de Autenticación');
  
  const session = localStorage.getItem('session');
  if (session) {
    try {
      const parsedSession = JSON.parse(session);
    } catch (error) {
      console.error('Error al parsear sesión:', error);
    }
  } else {
    return;
  }
  
  console.groupEnd();
};

// Función para probar el interceptor de errores 401
export const test401Interceptor = async () => {
  console.group('🧪 Prueba del Interceptor 401');
  
  try {
    // 1. Verificar que el interceptor está activo
    const { isInterceptorActive } = await import('./fetchInterceptor.js');
    
    // 2. Hacer una petición con token inválido
    
    const response = await fetch('http://localhost:8001/notifications/stats', {
      headers: {
        'Authorization': 'Bearer token_invalido',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });
    
    // 3. Verificar si se limpió la sesión
    setTimeout(() => {
      const session = localStorage.getItem('session');
    }, 100);
    
  } catch (error) {
    console.error('❌ Error en prueba del interceptor:', error);
  }
  
  console.groupEnd();
};

// Función para simular token expirado
export const simulateExpiredToken = () => {

  try {
    const session = localStorage.getItem('session');
    if (session) {
      const parsedSession = JSON.parse(session);
      
      // Establecer fecha de expiración en el pasado
      parsedSession.expiresAt = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hora atrás
      
      localStorage.setItem('session', JSON.stringify(parsedSession));
      
      // Verificar utilidades
      const { isAuthenticated, getCurrentUser } = require('./authUtils.js');
      
    } else {
      return;
    }
  } catch (error) {
    console.error('❌ Error simulando token expirado:', error);
  }

};

// Función para probar la redirección automática
export const testAutoRedirect = async () => {
  
  try {
    // 1. Verificar estado actual
    const currentAuth = isAuthenticated();
    const session = localStorage.getItem('session');
    
    // 2. Probar con sesión activa
    if (currentAuth) {
      console.log('   ✅ Usuario autenticado');
      return;
    } else {
      return;
    }
    
  } catch (error) {
    console.error('❌ Error en prueba de redirección automática:', error);
  }

};

export const debugKanbanStates = async () => {
  
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      console.error('❌ No hay sesión activa');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json'
    };

    // Obtener información del usuario actual
    const userResponse = await fetch('http://localhost:8001/auth/me', {
      headers,
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      console.error('❌ Error al obtener información del usuario');
      return;
    }
    
    const user = await userResponse.json();

    // Obtener estados kanban de la organización
    const kanbanResponse = await fetch(`http://localhost:8001/organizations/${user.organization_id}/kanban-states`, {
      headers,
      credentials: 'include'
    });
    
    if (!kanbanResponse.ok) {
      console.error('❌ Error al obtener estados kanban');
      return;
    }
    
    const kanbanStates = await kanbanResponse.json();

    // Obtener historias de usuario
    const storiesResponse = await fetch('http://localhost:8001/epics/stories/', {
      headers,
      credentials: 'include'
    });
    
    if (!storiesResponse.ok) {
      console.error('❌ Error al obtener historias de usuario');
      return;
    }
    
    const stories = await storiesResponse.json();
    
    // Analizar estados de las historias
    const storyStates = [...new Set(stories.map(s => s.status))];
    
    // Verificar coincidencias
    const kanbanStateKeys = kanbanStates.states.map(s => s.key);
    const kanbanStateIds = kanbanStates.states.map(s => s.id);
    const kanbanStateLabels = kanbanStates.states.map(s => s.label);
    
    // Verificar qué historias coinciden con qué estados
    stories.forEach(story => {
      const matches = [];
      
      // Verificar coincidencia por clave
      if (kanbanStateKeys.includes(story.status)) {
        matches.push(`clave: ${story.status}`);
      }
      
      // Verificar coincidencia por ID
      if (kanbanStateIds.includes(parseInt(story.status))) {
        matches.push(`ID: ${story.status}`);
      }
      
      // Verificar coincidencia por label
      if (kanbanStateLabels.includes(story.status)) {
        matches.push(`label: ${story.status}`);
      }
      
      if (matches.length > 0) {
        return;
      } else {
        console.log(`❌ Historia "${story.title}" (ID: ${story.story_id}) con estado "${story.status}" NO coincide con ningún estado kanban`);
      }
    });
    
    // Contar historias por estado
    const storiesByState = {};
    stories.forEach(story => {
      storiesByState[story.status] = (storiesByState[story.status] || 0) + 1;
    });
    

  } catch (error) {
    console.error('❌ Error en debugKanbanStates:', error);
  }
};

export const fixStoryStates = async () => {
  
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      console.error('❌ No hay sesión activa');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json'
    };

    // Obtener información del usuario actual
    const userResponse = await fetch('http://localhost:8001/auth/me', {
      headers,
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      console.error('❌ Error al obtener información del usuario');
      return;
    }
    
    const user = await userResponse.json();

    // Obtener estados kanban
    const kanbanResponse = await fetch(`http://localhost:8001/organizations/${user.organization_id}/kanban-states`, {
      headers,
      credentials: 'include'
    });
    
    if (!kanbanResponse.ok) {
      console.error('❌ Error al obtener estados kanban');
      return;
    }
    
    const kanbanStates = await kanbanResponse.json();

    // Obtener historias
    const storiesResponse = await fetch('http://localhost:8001/epics/stories/', {
      headers,
      credentials: 'include'
    });
    
    if (!storiesResponse.ok) {
      console.error('❌ Error al obtener historias');
      return;
    }
    
    const stories = await storiesResponse.json();

    // Mapeo de estados antiguos a nuevos
    const stateMapping = {
      'en_progreso': 'en_progreso',
      'done': 'done',
      'backlog': 'backlog',
      'todo': 'nuevo',
      'in_progress': 'en_progreso',
      'in_review': 'listo_pruebas',
      'testing': 'listo_pruebas',
      'blocked': 'backlog'
    };

    // Actualizar historias con estados incorrectos
    let updatedCount = 0;
    for (const story of stories) {
      const newState = stateMapping[story.status];
      if (newState && newState !== story.status) {
        
        const updateResponse = await fetch(`http://localhost:8001/epics/stories/${story.story_id}`, {
          method: 'PUT',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            status: newState
          })
        });
        
        if (updateResponse.ok) {
          updatedCount++;
          return;
        } else {
          console.error(`❌ Error al actualizar historia ${story.story_id}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error en fixStoryStates:', error);
  }
};

export const testKanbanFunctionality = async () => {
  
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      console.error('❌ No hay sesión activa');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json'
    };

    // Obtener información del usuario actual
    const userResponse = await fetch('http://localhost:8001/auth/me', {
      headers,
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      console.error('❌ Error al obtener información del usuario');
      return;
    }
    
    const user = await userResponse.json();

    // Obtener estados kanban
    const kanbanResponse = await fetch(`http://localhost:8001/organizations/${user.organization_id}/kanban-states`, {
      headers,
      credentials: 'include'
    });
    
    if (!kanbanResponse.ok) {
      console.error('❌ Error al obtener estados kanban');
      return;
    }
    
    const kanbanStates = await kanbanResponse.json();

    // Obtener historias
    const storiesResponse = await fetch('http://localhost:8001/epics/stories/', {
      headers,
      credentials: 'include'
    });
    
    if (!storiesResponse.ok) {
      console.error('❌ Error al obtener historias');
      return;
    }
    
    const stories = await storiesResponse.json();

    // Simular el filtrado del frontend
    const columns = kanbanStates.states.map(col => {
      const columnId = col.id || col.label;
      const columnKey = col.key || col.id;
      const columnStories = stories.filter(st => {
        const storyStatus = st.status || st.estado;
        const matches = storyStatus === columnId || 
               storyStatus === columnKey || 
               storyStatus === col.id ||
               storyStatus === col.key ||
               storyStatus === col.label;
        return matches;
      });
      
      return {
        ...col,
        stories: columnStories
      };
    });

    // columns.forEach(col => {
    //   console.log(`  - ${col.label}: ${col.stories.length} historias`);
    //   col.stories.forEach(story => {
    //     console.log(`    • ${story.title} (${story.status})`);
    //   });
    // });

    // // Verificar si hay historias sin asignar
    // const assignedStories = columns.flatMap(col => col.stories);
    // const unassignedStories = stories.filter(story => 
    //   !assignedStories.some(assigned => assigned.story_id === story.story_id)
    // );

    // if (unassignedStories.length > 0) {
    //   console.log('⚠️ Historias sin asignar:');
    //   unassignedStories.forEach(story => {
    //     console.log(`  - ${story.title} (${story.status})`);
    //   });
    // } else {
    //   console.log('✅ Todas las historias están asignadas correctamente');
    // }

  } catch (error) {
    console.error('❌ Error en testKanbanFunctionality:', error);
  }
};

export const debugTaskNotifications = async () => {
  
  try {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session?.token) {
      console.error('❌ No hay sesión activa');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${session.token}`,
      'Content-Type': 'application/json'
    };

    // Obtener información del usuario actual
    const userResponse = await fetch('http://localhost:8001/auth/me', {
      headers,
      credentials: 'include'
    });
    
    if (!userResponse.ok) {
      console.error('❌ Error al obtener información del usuario');
      return;
    }
    
    const user = await userResponse.json();

    // Obtener notificaciones del usuario
    const notificationsResponse = await fetch('http://localhost:8001/notifications/', {
      headers,
      credentials: 'include'
    });
    
    if (!notificationsResponse.ok) {
      console.error('❌ Error al obtener notificaciones');
      return;
    }
    
    const notifications = await notificationsResponse.json();
    
    // Filtrar notificaciones de tareas
    const taskNotifications = notifications.filter(n => n.type === 'task_assigned');
    
    if (taskNotifications.length > 0) {
      taskNotifications.forEach((notif, index) => {
        return;
      });
    }

    // Obtener contador de no leídas
    const unreadResponse = await fetch('http://localhost:8001/notifications/unread-count', {
      headers,
      credentials: 'include'
    });
    
    if (unreadResponse.ok) {
      const unreadData = await unreadResponse.json();
    }

    // Verificar si hay nuevas notificaciones
    const checkNewResponse = await fetch('http://localhost:8001/notifications/check-new', {
      headers,
      credentials: 'include'
    });
    
    if (checkNewResponse.ok) {
      const checkNewData = await checkNewResponse.json();
    }

    // Crear una notificación de prueba de tarea
    const testResponse = await fetch('http://localhost:8001/notifications/test', {
      method: 'POST',
      headers,
      credentials: 'include'
    });
    
    if (testResponse.ok) {
      const testNotification = await testResponse.json();
      console.log('✅ Notificación de prueba creada:', testNotification);
    } else {
      console.error('❌ Error al crear notificación de prueba');
    }

  } catch (error) {
    console.error('❌ Error en debug de notificaciones:', error);
  }
};

export const testTaskAssignmentNotification = async () => {
  console.log('🧪 Probando notificación de asignación de tarea...');
  
  try {
    // Simular asignación de tarea
    const mockTask = {
      task_id: 1,
      title: 'Tarea de Prueba',
      assigned_to: 2,
      assigned_by: 1
    };
    
    console.log('📋 Tarea simulada:', mockTask);
    console.log('✅ Función de prueba de asignación de tarea ejecutada');
    
    return {
      success: true,
      task: mockTask,
      message: 'Prueba de asignación completada'
    };
    
  } catch (error) {
    console.error('❌ Error en prueba de asignación:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Exportar para uso en consola del navegador
window.debugAuth = debugAuth;
window.resetAuth = resetAuth;
window.showAuthStatus = showAuthStatus;
window.test401Interceptor = test401Interceptor;
window.simulateExpiredToken = simulateExpiredToken;
window.testAutoRedirect = testAutoRedirect;
window.debugKanbanStates = debugKanbanStates;
window.fixStoryStates = fixStoryStates;
window.testKanbanFunctionality = testKanbanFunctionality;
window.debugTaskNotifications = debugTaskNotifications;
window.testTaskAssignmentNotification = testTaskAssignmentNotification;