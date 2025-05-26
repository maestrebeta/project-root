import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function UsersTable() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "",
    password: "",
    organization_id: null
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  // Verificar si el usuario es super_user
  const isSuperUser = user?.role === 'super_user';

  // Obtener token de la sesión
  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.token}`
      };
    } catch (error) {
      throw new Error('Error de autenticación');
    }
  };

  // Cargar organizaciones
  const fetchOrganizations = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/organizations/', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar las organizaciones');
      }
      
      const data = await response.json();
      setOrganizations(data);
    } catch (error) {
      console.error('Error al cargar las organizaciones:', error);
    }
  };

  // Cargar usuarios
  const fetchUsers = async () => {
    try {
      if (!isAuthenticated) {
        throw new Error('Usuario no autenticado');
      }

      const session = localStorage.getItem('session');
      const { token, user } = JSON.parse(session);

      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/users/', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar los usuarios');
      }
      
      const data = await response.json();
      setUsers(data);
      setError('');
    } catch (error) {
      console.error('Error al cargar los usuarios:', error);
      setError(error.message || 'Error al cargar los usuarios');
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
      if (isSuperUser) {
        fetchOrganizations();
      }
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ 
      ...form, 
      [name]: name === 'organization_id' ? (value ? parseInt(value, 10) : null) : value 
    });
  };

  // Crear o actualizar usuario
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!isAuthenticated) {
        throw new Error('Usuario no autenticado');
      }

      const session = JSON.parse(localStorage.getItem('session'));
      const currentUserOrganizationId = session.user.organization_id;

      const url = editId
        ? `http://localhost:8000/users/${editId}`
        : 'http://localhost:8000/users/';
      const method = editId ? 'PUT' : 'POST';

      // Preparar el cuerpo de la petición según sea creación o actualización
      const body = editId ? {
        full_name: form.full_name || undefined,
        email: form.email,
        role: form.role,
        is_active: true,
        password: form.password || undefined,
        organization_id: isSuperUser 
          ? (form.organization_id ? Number(form.organization_id) : null)
          : currentUserOrganizationId
      } : {
        username: form.username,
        full_name: form.full_name || undefined,
        email: form.email,
        role: form.role,
        password: form.password,
        is_active: true,
        organization_id: isSuperUser 
          ? (form.organization_id ? Number(form.organization_id) : null)
          : currentUserOrganizationId
      };

      // Eliminar campos undefined
      Object.keys(body).forEach(key => {
        if (body[key] === undefined) {
          delete body[key];
        }
      });

      const headers = getAuthHeaders();
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.detail || 'Error al procesar la solicitud');
      }

      const responseData = await response.json();
      console.log('Respuesta exitosa:', responseData);

      setShowForm(false);
      setEditId(null);
      setForm({
        username: "",
        full_name: "",
        email: "",
        role: "",
        password: "",
        organization_id: null
      });
      await fetchUsers();
    } catch (error) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al crear/actualizar usuario');
    } finally {
      setLoading(false);
    }
  };

  // Editar usuario
  const handleEdit = (userId, userData) => {
    setForm({
      username: userData.username || '',
      full_name: userData.full_name || '',
      email: userData.email || '',
      role: userData.role || '',
      password: '', // Resetear password en edición
      organization_id: userData.organization_id || null
    });
    setEditId(userId);
    setShowForm(true);
    setError('');
  };

  // Eliminar usuario
  const handleDelete = async (userId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8000/users/${userId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar el usuario');
      }

      setUsers(users.filter(user => user.user_id !== userId));
      setError('');
    } catch (error) {
      setError(error.message || 'Error al eliminar el usuario');
    }
  };

  return (
    <div className={`${theme.FONT_CLASS}`}>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg font-bold text-gray-700">Usuarios</h2>
          <button
            className={`${theme.PRIMARY_BUTTON_CLASS} px-4 py-2 rounded-lg flex items-center gap-2`}
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({
                username: "",
                full_name: "",
                email: "",
                role: "",
                password: "",
                organization_id: null
              });
              setError('');
            }}
          >
            <span className="material-icons-outlined text-xl">add</span>
            Nuevo Usuario
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <div className="flex items-center gap-2">
              <span className="material-icons-outlined text-xl">error_outline</span>
              {error}
            </div>
          </div>
        )}

        {showForm && (
          <form
            className="mb-8 rounded-xl border border-gray-100 bg-white/50 backdrop-blur-sm p-6"
            onSubmit={handleCreateOrUpdate}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                  required
                  disabled={!!editId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="full_name"
                  placeholder="Nombre completo"
                  value={form.full_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editId ? "Nueva contraseña (opcional)" : "Contraseña"}
                </label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="password"
                  type="password"
                  placeholder={editId ? "Dejar en blanco para mantener" : "Contraseña"}
                  value={form.password}
                  onChange={handleChange}
                  required={!editId}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled hidden>Selecciona un rol</option>
                  <option value="admin">Administrador</option>
                  <option value="dev">Desarrollador</option>
                  <option value="infra">Infraestructura</option>
                  <option value="super_user">Super Usuario</option>
                </select>
              </div>
              {isSuperUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Organización</label>
                  <select
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    name="organization_id"
                    value={form.organization_id || ''}
                    onChange={handleChange}
                  >
                    <option value="">Sin organización</option>
                    {organizations.map(org => (
                      <option key={org.organization_id} value={org.organization_id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                    username: "",
                    full_name: "",
                    email: "",
                    role: "",
                    password: "",
                    organization_id: null
                  });
                  setError('');
                }}
                disabled={loading}
              >
                <span className="material-icons-outlined text-xl">close</span>
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="rounded-xl border border-gray-100 overflow-hidden bg-white/50 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Organización</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.user_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : ''}
                      ${user.role === 'dev' ? 'bg-blue-100 text-blue-800' : ''}
                      ${user.role === 'infra' ? 'bg-green-100 text-green-800' : ''}
                      ${user.role === 'super_user' ? 'bg-red-100 text-red-800' : ''}
                    `}>
                      {user.role === 'super_user' ? 'Super Usuario' : user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.organization?.name || user.organization_name || 'Sin organización'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      onClick={() => handleEdit(user.user_id, user)}
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      onClick={() => handleDelete(user.user_id)}
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