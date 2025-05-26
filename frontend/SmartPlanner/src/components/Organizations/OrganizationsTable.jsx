import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function OrganizationsTable() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    country_code: "",
    timezone: "UTC",
    subscription_plan: "free",
    max_users: 5,
    primary_contact_email: "",
    primary_contact_name: "",
    primary_contact_phone: ""
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  // Si el usuario no es super_user, mostrar mensaje de acceso denegado
  if (user?.role !== 'super_user') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-8 py-6 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
          <p className="mb-4">
            No tienes permisos para acceder a la gestión de organizaciones.
          </p>
          <p className="text-sm text-red-600">
            Esta funcionalidad está reservada exclusivamente para super usuarios.
          </p>
        </div>
      </div>
    );
  }

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
      if (!isAuthenticated || user.role !== 'super_user') {
        throw new Error('No tienes permisos para ver organizaciones');
      }

      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/organizations/', {
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar las organizaciones');
      }
      
      const data = await response.json();
      setOrganizations(data);
      setError('');
    } catch (error) {
      console.error('Error al cargar las organizaciones:', error);
      setError(error.message || 'No se pudieron cargar las organizaciones');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user.role === 'super_user') {
      fetchOrganizations();
    }
  }, [isAuthenticated, user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear o actualizar organización
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!isAuthenticated || user.role !== 'super_user') {
        throw new Error('No tienes permisos para gestionar organizaciones');
      }

      const url = editId
        ? `http://localhost:8000/organizations/${editId}`
        : 'http://localhost:8000/organizations/';
      const method = editId ? 'PUT' : 'POST';

      // Preparar el cuerpo de la petición
      const body = {
        name: form.name,
        description: form.description || undefined,
        country_code: form.country_code || undefined,
        timezone: form.timezone,
        subscription_plan: form.subscription_plan,
        max_users: parseInt(form.max_users, 10),
        primary_contact_email: form.primary_contact_email || undefined,
        primary_contact_name: form.primary_contact_name || undefined,
        primary_contact_phone: form.primary_contact_phone || undefined,
        is_active: true
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
        throw new Error(errorData.detail || 'Error al procesar la solicitud');
      }

      const responseData = await response.json();
      console.log('Respuesta exitosa:', responseData);

      setShowForm(false);
      setEditId(null);
      setForm({
        name: "",
        description: "",
        country_code: "",
        timezone: "UTC",
        subscription_plan: "free",
        max_users: 5,
        primary_contact_email: "",
        primary_contact_name: "",
        primary_contact_phone: ""
      });
      await fetchOrganizations();
    } catch (error) {
      console.error('Error en handleCreateOrUpdate:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Editar organización
  const handleEdit = (orgId, orgData) => {
    setEditId(orgId);
    setForm({
      name: orgData.name || '',
      description: orgData.description || '',
      country_code: orgData.country_code || '',
      timezone: orgData.timezone || 'UTC',
      subscription_plan: orgData.subscription_plan || 'free',
      max_users: orgData.max_users || 5,
      primary_contact_email: orgData.primary_contact_email || '',
      primary_contact_name: orgData.primary_contact_name || '',
      primary_contact_phone: orgData.primary_contact_phone || ''
    });
    setShowForm(true);
    setError('');
  };

  // Eliminar organización
  const handleDelete = async (orgId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta organización?')) {
      return;
    }

    try {
      const headers = getAuthHeaders();
      const response = await fetch(`http://localhost:8000/organizations/${orgId}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la organización');
      }

      setOrganizations(organizations.filter(org => org.organization_id !== orgId));
      setError('');
    } catch (error) {
      setError(error.message || 'Error al eliminar la organización');
    }
  };

  return (
    <div className={`${theme.FONT_CLASS}`}>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg font-bold text-gray-700">Organizaciones</h2>
          <button
            className={`${theme.PRIMARY_BUTTON_CLASS} px-4 py-2 rounded-lg flex items-center gap-2`}
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({
                name: "",
                description: "",
                country_code: "",
                timezone: "UTC",
                subscription_plan: "free",
                max_users: 5,
                primary_contact_email: "",
                primary_contact_name: "",
                primary_contact_phone: ""
              });
              setError('');
            }}
          >
            <span className="material-icons-outlined text-xl">add</span>
            Nueva Organización
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la Organización</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="name"
                  placeholder="Nombre de la organización"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="description"
                  placeholder="Descripción de la organización"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="country_code"
                  placeholder="Código de país (ej. CL, AR)"
                  value={form.country_code}
                  onChange={handleChange}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona Horaria</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="timezone"
                  placeholder="Zona horaria (ej. America/Santiago)"
                  value={form.timezone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan de Suscripción</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="subscription_plan"
                  value={form.subscription_plan}
                  onChange={handleChange}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Máximo de Usuarios</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="max_users"
                  placeholder="Máximo de usuarios"
                  value={form.max_users}
                  onChange={handleChange}
                  min={1}
                  max={1000}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                <input
                  type="email"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="primary_contact_email"
                  placeholder="Email de contacto"
                  value={form.primary_contact_email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de Contacto</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="primary_contact_name"
                  placeholder="Nombre de contacto"
                  value={form.primary_contact_name}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Contacto</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="primary_contact_phone"
                  placeholder="Teléfono de contacto"
                  value={form.primary_contact_phone}
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
                    description: "",
                    country_code: "",
                    timezone: "UTC",
                    subscription_plan: "free",
                    max_users: 5,
                    primary_contact_email: "",
                    primary_contact_name: "",
                    primary_contact_phone: ""
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Usuarios</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
              {organizations.map((org) => (
                <tr key={org.organization_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.organization_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{org.country_code || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${org.subscription_plan === 'free' ? 'bg-gray-100 text-gray-800' : ''}
                      ${org.subscription_plan === 'pro' ? 'bg-blue-100 text-blue-800' : ''}
                      ${org.subscription_plan === 'enterprise' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {org.subscription_plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {org.max_users} máx.
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      onClick={() => handleEdit(org.organization_id, org)}
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      onClick={() => handleDelete(org.organization_id)}
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