import React, { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppTheme } from "../../context/ThemeContext.jsx";

// Estados predeterminados para las tareas
const STATUS_ICONS = {
  pendiente: { icon: "🔴", color: "text-red-500", label: "Pendiente" },
  en_progreso: { icon: "🔵", color: "text-blue-500", label: "En Progreso" },
  completada: { icon: "🟢", color: "text-green-600", label: "Completada" }
};

const STATUS_ORDER = [
  "pendiente",
  "en_progreso",
  "completada"
];

function TasksTable({ tasks: initialTasks, onEdit, onDelete, organizationStates }) {
  const theme = useAppTheme();
  const [tasks, setTasks] = useState(initialTasks || []);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [collapsed, setCollapsed] = useState({});

  // Actualizar tareas cuando cambien las props o los estados
  useEffect(() => {
    setTasks(initialTasks || []);
  }, [initialTasks, organizationStates]);

  // Función para obtener la información del estado
  const getStateInfo = (stateId) => {
    const state = organizationStates.states.find(s => s.id === stateId) || organizationStates.states[0];
    return {
      icon: state.icon,
      label: state.label,
      color: state.color
    };
  };

  // Calcula el proyecto con más horas registradas
  const getDefaultProjectId = () => {
    if (!tasks.length || !projects.length) return "";
    const hoursByProject = {};
    tasks.forEach(t => {
      if (!t.project_id) return;
      hoursByProject[t.project_id] = (hoursByProject[t.project_id] || 0) + (parseFloat(t.duration_hours) || 0);
    });
    const maxProject = Object.entries(hoursByProject).sort((a, b) => b[1] - a[1])[0];
    return maxProject ? String(maxProject[0]) : "";
  };

  // Calcula el activity_type con más horas registradas
  const getDefaultActivityType = () => {
    if (!tasks.length) return "";
    const hoursByActivity = {};
    tasks.forEach(t => {
      if (!t.activity_type) return;
      hoursByActivity[t.activity_type] = (hoursByActivity[t.activity_type] || 0) + (parseFloat(t.duration_hours) || 0);
    });
    const maxActivity = Object.entries(hoursByActivity).sort((a, b) => b[1] - a[1])[0];
    return maxActivity ? maxActivity[0] : "";
  };

  // Estado del formulario
  const [form, setForm] = useState({
    entry_date: "",
    activity_type: "",
    project_id: "",
    client_id: "",
    start_time: "",
    end_time: "",
    description: "",
    status: "",
    user_id: ""
  });

  // Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session?.token) {
          throw new Error('No hay sesión activa');
        }

        const [projectsResponse, clientsResponse, usersResponse] = await Promise.all([
          fetch('http://localhost:8000/projects/', {
            headers: {
              'Authorization': `Bearer ${session.token}`,
              'Accept': 'application/json'
            }
          }),
          fetch('http://localhost:8000/clients/', {
            headers: {
              'Authorization': `Bearer ${session.token}`,
              'Accept': 'application/json'
            }
          }),
          fetch('http://localhost:8000/users/', {
            headers: {
              'Authorization': `Bearer ${session.token}`,
              'Accept': 'application/json'
            }
          })
        ]);

        const [projectsData, clientsData, usersData] = await Promise.all([
          projectsResponse.json(),
          clientsResponse.json(),
          usersResponse.json()
        ]);

        setProjects(projectsData);
        setClients(clientsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    fetchData();
  }, []);

  // Utilidades
  const getClientName = (client_id) => {
    const client = clients.find(c => c.client_id === client_id);
    return client ? client.name : "";
  };
  const getUserName = (user_id) => {
    const user = users.find(u => u.user_id === user_id);
    return user ? (user.full_name ? `${user.full_name} (${user.username})` : user.username) : user_id;
  };

  // Cuando cambia el proyecto, actualiza el cliente automáticamente
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "project_id") {
      const selectedProject = projects.find(p => String(p.project_id) === value);
      setForm({
        ...form,
        project_id: value,
        client_id: selectedProject ? selectedProject.client_id : ""
      });
    } else if (name === "end_time") {
      setForm({
        ...form,
        end_time: value,
        status: value ? "completada" : (form.status || "pendiente")
      });
    } else if (name === "status") {
      setForm({
        ...form,
        status: value
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Crear o actualizar tarea
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Si end_time está vacío, calcula start_time + 1 hora
    let endTimeToSend = form.end_time;
    let statusToSend = form.status;
    if (!endTimeToSend && form.start_time) {
      const [h, m] = form.start_time.split(':');
      const date = new Date();
      date.setHours(Number(h) + 1, Number(m), 0, 0);
      endTimeToSend = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      statusToSend = "pendiente";
    } else if (form.end_time) {
      statusToSend = form.status || "completada";
    } else {
      statusToSend = "pendiente";
    }

    // user_id y project_id deben ser números
    const payload = {
      ...form,
      user_id: Number(form.user_id),
      project_id: Number(form.project_id),
      end_time: endTimeToSend,
      status: statusToSend
    };

    const url = editId
      ? `http://localhost:8000/time-entries/${editId}`
      : 'http://localhost:8000/time-entries/';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setShowForm(false);
    setEditId(null);
    setForm({
      entry_date: "",
      activity_type: "",
      project_id: "",
      client_id: "",
      start_time: "",
      end_time: "",
      description: "",
      status: "",
      user_id: ""
    });
    fetch('http://localhost:8000/time-entries/')
      .then(res => res.json())
      .then(setTasks);
    setLoading(false);
  };

  // Eliminar tarea
  const handleDelete = (taskId, description) => {
    console.log('TasksTable - Intentando eliminar tarea:', { taskId, description });
    
    if (!taskId || isNaN(taskId)) {
      console.error('TasksTable - ID de tarea inválido:', taskId);
      return;
    }

    onDelete(Number(taskId));
  };

  // Editar tarea
  const handleEdit = (task) => {
    const selectedProject = projects.find(p => p.project_id === task.project_id);
    setForm({
      entry_date: task.entry_date || "",
      activity_type: task.activity_type || "",
      project_id: task.project_id || "",
      client_id: selectedProject ? selectedProject.client_id : "",
      start_time: task.start_time || "",
      end_time: task.end_time || "",
      description: task.description || "",
      status: task.status || (task.end_time ? "completada" : "pendiente"),
      user_id: task.user_id || "",
    });
    setEditId(task.entry_id);
    setShowForm(true);
  };

  // Reset form
  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({
      entry_date: "",
      activity_type: "",
      project_id: "",
      client_id: "",
      start_time: "",
      end_time: "",
      description: "",
      status: "",
      user_id: ""
    });
  };

  // Al abrir el formulario, setea valores predeterminados inteligentes
  const handleNewTask = () => {
    const today = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const start = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    now.setHours(now.getHours() + 1);
    const end = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const defaultProjectId = getDefaultProjectId();
    const selectedProject = projects.find(p => String(p.project_id) === defaultProjectId);
    setShowForm(true);
    setEditId(null);
    setForm({
      entry_date: today,
      activity_type: getDefaultActivityType(),
      project_id: defaultProjectId,
      client_id: selectedProject ? selectedProject.client_id : "",
      start_time: start,
      end_time: end,
      description: "",
      status: "pendiente",
      user_id: ""
    });
  };

  // Reordenar y reagrupar tareas cuando cambien los estados
  const groupedTasks = useMemo(() => {
    if (!organizationStates?.states) return {};
    
    const groups = {};
    organizationStates.states.forEach(state => {
      groups[state.id] = [];
    });
    
    tasks.forEach(task => {
      const stateId = task.status || organizationStates.default_state;
      if (groups[stateId]) {
        groups[stateId].push(task);
      } else {
        groups[organizationStates.default_state].push(task);
      }
    });
    
    // Ordenar tareas dentro de cada grupo
    Object.keys(groups).forEach(stateId => {
      groups[stateId].sort((a, b) => {
        // Primero por fecha
        const dateA = new Date(a.entry_date);
        const dateB = new Date(b.entry_date);
        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;
        
        // Si las fechas son iguales, por hora de inicio
        const startA = new Date(a.start_time);
        const startB = new Date(b.start_time);
        return startB - startA;
      });
    });
    
    return groups;
  }, [tasks, organizationStates]);

  // Ordena tareas por fecha y hora de inicio descendente
  const sortTasks = (tasksList) => {
    return [...tasksList].sort((a, b) => {
      const dateA = a.entry_date || "";
      const dateB = b.entry_date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      const timeA = a.start_time || "";
      const timeB = b.start_time || "";
      return timeB.localeCompare(timeA);
    });
  };

  // Alterna el colapso de un grupo de estado
  const toggleCollapse = (status) => {
    setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
  };

  // Agrupar tareas por estado y calcular totales
  const { tasksByState, totalHours, activeStates } = useMemo(() => {
    const grouped = tasks.reduce((acc, task) => {
      const state = task.status || 'pendiente';
      if (!acc[state]) {
        acc[state] = [];
      }
      acc[state].push(task);
      return acc;
    }, {});

    // Calcular horas totales
    const total = tasks.reduce((sum, task) => sum + (task.duration_hours || 0), 0);

    // Obtener solo los estados que tienen tareas
    const states = Object.keys(grouped);

    return {
      tasksByState: grouped,
      totalHours: total,
      activeStates: states
    };
  }, [tasks]);

  // Formatear fecha UTC a fecha local
  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return format(date, 'dd/MM/yyyy', { locale: es });
  };

  // Formatear hora UTC a hora local
  const formatDateTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return format(date, 'HH:mm', { locale: es });
  };

  if (!organizationStates?.states) {
    return <div className="text-center py-4 text-red-600">Error: No se pudieron cargar los estados</div>;
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-bold text-gray-700">Tareas Registradas</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
          onClick={handleNewTask}
        >
          + Nueva Tarea
        </button>
      </div>

      {showForm && (
        <form
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          onSubmit={handleCreateOrUpdate}
        >
          {/* entry_date */}
          <input
            className="border rounded px-3 py-2"
            name="entry_date"
            type="date"
            placeholder="Fecha"
            value={form.entry_date || new Date().toISOString().slice(0, 10)}
            onChange={handleChange}
            required
            autoFocus
          />
          {/* activity_type */}
          <select
            className="border rounded px-3 py-2"
            name="activity_type"
            value={form.activity_type}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>Tipo de actividad</option>
            <option value="development">Desarrollo</option>
            <option value="support">Soporte</option>
            <option value="meeting">Reunión</option>
            <option value="documentation">Documentación</option>
            <option value="training">Capacitación</option>
            <option value="other">Otra</option>
          </select>
          {/* project_id */}
          <select
            className="border rounded px-3 py-2"
            name="project_id"
            value={form.project_id}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>Selecciona un proyecto</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>
          {/* client_id (solo lectura) */}
          <input
            className="border rounded px-3 py-2 bg-gray-100"
            name="client_name"
            placeholder="Cliente"
            value={getClientName(Number(form.client_id))}
            disabled
            readOnly
          />
          {/* start_time */}
          <input
            className="border rounded px-3 py-2"
            name="start_time"
            type="time"
            placeholder="Inicio"
            value={form.start_time}
            onChange={e => {
              // Al cambiar start_time, end_time = start_time + 1hr si no está editando
              const start = e.target.value;
              let end = form.end_time;
              if (!editId && start) {
                const [h, m] = start.split(':');
                const date = new Date();
                date.setHours(Number(h) + 1, Number(m), 0, 0);
                end = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              }
              setForm({ ...form, start_time: start, end_time: end });
            }}
            required
          />
          {/* end_time */}
          <input
            className="border rounded px-3 py-2"
            name="end_time"
            type="time"
            placeholder="Fin"
            value={form.end_time}
            onChange={handleChange}
          />
          {/* description */}
          <input
            className="border rounded px-3 py-2"
            name="description"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            required
          />
          {/* status */}
          <select
            className="border rounded px-3 py-2"
            name="status"
            value={form.status || (form.end_time ? organizationStates.final_states[0] : organizationStates.default_state)}
            onChange={handleChange}
            required
          >
            {organizationStates.states.map(state => (
              <option key={state.id} value={state.id}>
                {state.icon} {state.label}
              </option>
            ))}
          </select>
          {/* user_id */}
          <select
            className="border rounded px-3 py-2"
            name="user_id"
            value={form.user_id}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>Selecciona un usuario</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.full_name ? `${user.full_name} (${user.username})` : user.username}
              </option>
            ))}
          </select>
          <div className="flex gap-2 col-span-1 md:col-span-3">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? (editId ? "Actualizando..." : "Creando...") : (editId ? "Actualizar" : "Crear")}
            </button>
            <button
              type="button"
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded"
              onClick={resetForm}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Agrupación por estado */}
      <div className="space-y-6">
        {organizationStates.states.map(state => (
          <div key={state.id} className="bg-gray-50 rounded-lg shadow border">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-lg font-semibold focus:outline-none"
              onClick={() => toggleCollapse(state.id)}
            >
              <span className="flex items-center gap-2">
                <span style={{ fontSize: 22 }}>{state.icon}</span>
                <span style={{ 
                  color: state.color === 'red' ? '#EF4444' : 
                         state.color === 'blue' ? '#3B82F6' : 
                         state.color === 'green' ? '#22C55E' : 
                         state.color === 'yellow' ? '#EAB308' : '#71717A'
                }}>
                  {state.label}
                </span>
                <span className="ml-2 text-xs bg-gray-200 rounded-full px-2 py-0.5 text-gray-700 font-normal">
                  {groupedTasks[state.id]?.length || 0}
                </span>
              </span>
              <span className="text-gray-400">{collapsed[state.id] ? "▼" : "▲"}</span>
            </button>
            {!collapsed[state.id] && (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white rounded-lg">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Descripción</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Proyecto</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Cliente</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Inicio</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fin</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Horas</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedTasks[state.id]?.map((task) => {
                      const project = projects.find(p => p.project_id === task.project_id);
                      const clientName = project ? getClientName(project.client_id) : "";
                      const taskState = organizationStates.states.find(s => s.id === task.status) || 
                                     organizationStates.states.find(s => s.id === organizationStates.default_state);
                      
                      return (
                        <tr key={task.entry_id} className="hover:bg-blue-50 transition">
                          <td className="px-4 py-2">{task.entry_id}</td>
                          <td className="px-4 py-2">{task.description}</td>
                          <td className="px-4 py-2">{getUserName(task.user_id)}</td>
                          <td className="px-4 py-2">{project ? project.name : task.project_id}</td>
                          <td className="px-4 py-2">{clientName}</td>
                          <td className="px-4 py-2">{formatDate(task.entry_date)}</td>
                          <td className="px-4 py-2">{formatDateTime(task.start_time)}</td>
                          <td className="px-4 py-2">{formatDateTime(task.end_time)}</td>
                          <td className="px-4 py-2">{task.duration_hours?.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span style={{ 
                              color: taskState.color === 'red' ? '#EF4444' : 
                                     taskState.color === 'blue' ? '#3B82F6' : 
                                     taskState.color === 'green' ? '#22C55E' : 
                                     taskState.color === 'yellow' ? '#EAB308' : '#71717A'
                            }}>
                              {taskState.icon} {taskState.label}
                            </span>
                          </td>
                          <td className="px-4 py-2 flex gap-2">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                              onClick={() => handleEdit(task)}
                            >
                              Editar
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                              onClick={() => task.entry_id ? handleDelete(Number(task.entry_id), task.description) : null}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TasksTable;