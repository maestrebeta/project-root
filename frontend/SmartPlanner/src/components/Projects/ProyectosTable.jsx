import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';

export default function ProyectosTable() {
  const theme = useAppTheme();
  const [proyectos, setProyectos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    project_type: "",
    client_id: "",
    status: "",
    start_date: "",
    end_date: "",
    description: "",
    code: ""
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar proyectos
  const fetchProyectos = async () => {
    try {
      const session = localStorage.getItem('session');
      console.log('Sesión almacenada:', session); // Log de la sesión completa

      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const parsedSession = JSON.parse(session);
      console.log('Token:', parsedSession.token); // Log del token
      console.log('Usuario:', parsedSession.user); // Log del usuario

      if (!parsedSession.token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const response = await fetch('http://localhost:8001/projects/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${parsedSession.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Respuesta completa:', response);
      console.log('Estado de la respuesta:', response.status);

      if (!response.ok) {
        const errorData = await response.text(); // Cambiar a .text() para ver el contenido completo
        console.error('Datos de error:', errorData);
        throw new Error(errorData || 'Error al cargar los proyectos');
      }

      const data = await response.json();
      console.log('Proyectos cargados:', data);
      setProyectos(data);
    } catch (error) {
      console.error('Error completo al cargar los proyectos:', error);
      alert(`Error al cargar proyectos: ${error.message}`);
      setProyectos([]); 
    }
  };

  // Cargar clientes de la organización
  const fetchClientes = async () => {
    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const parsedSession = JSON.parse(session);
      if (!parsedSession.token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const response = await fetch('http://localhost:8001/clients/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${parsedSession.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error al cargar clientes:', errorData);
        throw new Error(errorData || 'Error al cargar los clientes');
      }

      const data = await response.json();
      console.log('Clientes cargados:', data);
      setClientes(data);
    } catch (error) {
      console.error('Error completo al cargar los clientes:', error);
      setClientes([]);
    }
  };

  useEffect(() => {
    fetchProyectos();
    fetchClientes();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear o actualizar proyecto
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { token } = JSON.parse(session);
      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      const url = editId
        ? `http://localhost:8001/projects/${editId}`
        : 'http://localhost:8001/projects/';
      const method = editId ? 'PUT' : 'POST';

      const projectData = {
        name: form.name,
        project_type: form.project_type,
        client_id: form.client_id ? parseInt(form.client_id, 10) : null,
        status: form.status,
        start_date: form.start_date ? new Date(form.start_date).toISOString().split('T')[0] : null,
        end_date: form.end_date ? new Date(form.end_date).toISOString().split('T')[0] : null,
        description: form.description || null,
        code: form.code || null
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(projectData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || 'Error al procesar el proyecto');
      }

      setShowForm(false);
      setEditId(null);
      setForm({
        name: "",
        project_type: "",
        client_id: "",
        status: "",
        start_date: "",
        end_date: "",
        description: "",
        code: ""
      });
      await fetchProyectos();
    } catch (error) {
      console.error('Error completo:', error);
      
      // Manejar específicamente errores de autenticación o CORS
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('Error de conexión. Por favor, verifica tu conexión de red o el servidor.');
      } else if (error.message.includes('Unauthorized') || error.message.includes('token')) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        // Opcional: Redirigir a la página de login
        // navigate('/login');
      } else {
        alert(error.message || 'Error al crear/actualizar el proyecto');
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proyecto
  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${nombre}" (ID: ${id})?`)) {
      try {
        const session = localStorage.getItem('session');
        if (!session) {
          throw new Error('No hay sesión activa');
        }

        const { token } = JSON.parse(session);
        if (!token) {
          throw new Error('Token de autenticación no encontrado');
        }

        const response = await fetch(`http://localhost:8001/projects/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al eliminar el proyecto');
        }

        await fetchProyectos();
      } catch (error) {
        console.error('Error:', error);
        
        // Manejar específicamente errores de autenticación
        if (error.message.includes('Unauthorized') || error.message.includes('token')) {
          alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
          // Opcional: Redirigir a la página de login
          // navigate('/login');
        } else {
          alert(error.message);
        }
      }
    }
  };

  // Editar proyecto
  const handleEdit = (proyecto) => {
    setForm({
      name: proyecto.name,
      project_type: proyecto.project_type,
      client_id: proyecto.client_id,
      status: proyecto.status,
      start_date: proyecto.start_date,
      end_date: proyecto.end_date,
      description: proyecto.description || "",
      code: proyecto.code || ""
    });
    setEditId(proyecto.project_id);
    setShowForm(true);
  };

  // Función para obtener el nombre del cliente por su ID
  const getClientName = (clientId) => {
    const cliente = clientes.find(c => c.client_id === clientId);
    return cliente ? cliente.name : 'Sin cliente';
  };

  // Función para traducir tipos de proyecto
  const getProjectTypeLabel = (projectType) => {
    const typeLabels = {
      'development': 'Desarrollo',
      'support': 'Soporte',
      'meeting': 'Reunión',
      'training': 'Capacitación',
      'other': 'Otro'
    };
    return typeLabels[projectType] || projectType;
  };

  // Función para traducir estados del inglés al español
  const getStatusLabel = (status) => {
    const statusLabels = {
      'registered_initiative': 'Iniciativa registrada',
      'in_quotation': 'En cotización',
      'proposal_approved': 'Propuesta aprobada',
      'in_planning': 'En planeación',
      'in_progress': 'En curso',
      'at_risk': 'En riesgo',
      'suspended': 'Suspendido',
      'completed': 'Completado',
      'canceled': 'Cancelado',
      'post_delivery_support': 'Soporte Post-Entrega',
      // Mantener compatibilidad con estados anteriores
      'nuevo': 'Nuevo',
      'en_progreso': 'En Progreso',
      'completado': 'Completado',
      'pausado': 'Pausado',
      'cancelado': 'Cancelado'
    };
    return statusLabels[status] || status;
  };

  // Función para obtener el color del estado
  const getStatusColor = (status) => {
    const statusColors = {
      // Estados iniciales - Azules (información/inicio)
      'registered_initiative': 'bg-blue-100 text-blue-800',      // Azul claro - Inicio del proceso
      'in_quotation': 'bg-blue-200 text-blue-900',               // Azul medio - En proceso comercial
      
      // Estados de aprobación - Verdes (positivo/aprobado)
      'proposal_approved': 'bg-green-100 text-green-800',        // Verde claro - Aprobado
      'in_planning': 'bg-emerald-100 text-emerald-800',          // Verde esmeralda - Planificando
      
      // Estados activos - Índigo/Púrpura (trabajo activo)
      'in_progress': 'bg-indigo-100 text-indigo-800',            // Índigo - Trabajo activo
      
      // Estados de alerta - Amarillo/Naranja (atención)
      'at_risk': 'bg-orange-100 text-orange-800',                // Naranja - Requiere atención
      
      // Estados pausados - Gris (neutro/pausado)
      'suspended': 'bg-gray-200 text-gray-800',                  // Gris - Pausado temporalmente
      
      // Estados finales positivos - Verde oscuro (éxito)
      'completed': 'bg-green-200 text-green-900',                // Verde oscuro - Completado exitosamente
      'post_delivery_support': 'bg-teal-100 text-teal-800',      // Verde azulado - Soporte post-entrega
      
      // Estados finales negativos - Rojo (cancelado/error)
      'canceled': 'bg-red-100 text-red-800',                     // Rojo - Cancelado
      
      // Mantener compatibilidad con estados anteriores
      'nuevo': 'bg-blue-100 text-blue-800',
      'en_progreso': 'bg-indigo-100 text-indigo-800',
      'completado': 'bg-green-200 text-green-900',
      'pausado': 'bg-gray-200 text-gray-800',
      'cancelado': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={`${theme.FONT_CLASS}`}>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg font-bold text-gray-700">Proyectos</h2>
          <button
            className={`bg-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition`}
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({
                name: "",
                project_type: "",
                client_id: "",
                status: "",
                start_date: "",
                end_date: "",
                description: "",
                code: ""
              });
            }}
          >
            + Nuevo Proyecto
          </button>
        </div>

        {showForm && (
          <form
            className="mb-8 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm p-6"
            onSubmit={handleCreateOrUpdate}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Proyecto</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="name"
                  placeholder="Nombre"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Proyecto</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="project_type"
                  value={form.project_type}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled hidden>Selecciona un tipo</option>
                  <option value="development">Desarrollo</option>
                  <option value="support">Soporte</option>
                  <option value="meeting">Reunión</option>
                  <option value="training">Capacitación</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="client_id"
                  value={form.client_id}
                  onChange={handleChange}
                >
                  <option value="" disabled hidden>Selecciona un cliente</option>
                  <option value="">Sin cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.client_id} value={cliente.client_id}>
                      {cliente.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="start_date"
                  type="date"
                  placeholder="Fecha Inicio"
                  value={form.start_date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="end_date"
                  type="date"
                  placeholder="Fecha Fin"
                  value={form.end_date}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled hidden>Selecciona un estado</option>
                  <option value="registered_initiative">Iniciativa registrada</option>
                  <option value="in_quotation">En cotización</option>
                  <option value="proposal_approved">Propuesta aprobada</option>
                  <option value="in_planning">En planeación</option>
                  <option value="in_progress">En curso</option>
                  <option value="at_risk">En riesgo</option>
                  <option value="suspended">Suspendido</option>
                  <option value="completed">Completado</option>
                  <option value="canceled">Cancelado</option>
                  <option value="post_delivery_support">Soporte Post-Entrega</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="description"
                  placeholder="Descripción del proyecto"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="code"
                  placeholder="Código del proyecto"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className={`${theme.PRIMARY_BUTTON_CLASS} px-4 py-2 rounded-lg flex items-center gap-2`}
                disabled={loading}
              >
                <span className="material-icons-outlined text-xl">
                  {editId ? 'save' : 'add'}
                </span>
                {loading ? (editId ? "Actualizando..." : "Creando...") : (editId ? "Actualizar" : "Crear")}
              </button>
              <button
                type="button"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2"
                onClick={() => {
                  setShowForm(false);
                  setEditId(null);
                  setForm({
                    name: "",
                    project_type: "",
                    client_id: "",
                    status: "",
                    start_date: "",
                    end_date: "",
                    description: "",
                    code: ""
                  });
                }}
                disabled={loading}
              >
                <span className="material-icons-outlined text-xl">close</span>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Inicio</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha Fin</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
              {proyectos.map((proyecto) => (
                <tr key={proyecto.project_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proyecto.project_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proyecto.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getClientName(proyecto.client_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getProjectTypeLabel(proyecto.project_type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proyecto.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{proyecto.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(proyecto.status)}`}>
                      {getStatusLabel(proyecto.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      onClick={() => handleEdit(proyecto)}
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      onClick={() => handleDelete(proyecto.project_id, proyecto.name)}
                    >
                      <span className="material-icons-outlined text-base">delete</span>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}