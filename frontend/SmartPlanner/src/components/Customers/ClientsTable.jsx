import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function ClientsTable() {
  const theme = useAppTheme();
  const { user, isAuthenticated } = useAuth();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    is_active: true,
    country_code: "",
    address: "",
    contact_email: "",
    contact_phone: "",
    tax_id: "",
    organization_id: null
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);

  // Obtener token de la sesión
  const getAuthHeaders = () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      console.log('Sesión completa:', session);
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

  // Cargar países
  const fetchCountries = async () => {
    try {
      const headers = getAuthHeaders();
      const response = await fetch('http://localhost:8000/countries/', {
        headers,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al cargar los países');
      }
      
      const data = await response.json();
      setCountries(data);
    } catch (error) {
      console.error('Error al cargar los países:', error);
    }
  };

  // Cargar clientes
  const fetchClients = async () => {
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

      const response = await fetch('http://localhost:8000/clients/', {
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
        throw new Error(errorData || 'Error al cargar los clientes');
      }

      const data = await response.json();
      console.log('Clientes cargados:', data);
      setClients(data);
    } catch (error) {
      console.error('Error completo al cargar los clientes:', error);
      alert(`Error al cargar clientes: ${error.message}`);
      setClients([]); 
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchClients();
      fetchCountries();
    }
  }, [isAuthenticated]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ 
      ...form, 
      [name]: type === "checkbox" ? checked : value 
    });
  };

  // Crear o actualizar cliente
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = localStorage.getItem('session');
      if (!session) {
        throw new Error('No hay sesión activa');
      }

      const { token, user } = JSON.parse(session);
      
      // Logging detallado para depuración
      console.group('Depuración de Creación de Cliente');
      console.log('Sesión completa:', JSON.parse(session));
      console.log('Token:', token);
      console.log('Usuario:', user);
      console.log('organization_id:', user.organization_id);
      console.log('Estructura de organización:', {
        organization_id: user.organization_id,
        organization: user.organization,
        organization_name: user.organization?.name
      });
      console.groupEnd();

      if (!token) {
        throw new Error('Token de autenticación no encontrado');
      }

      // Verificar que el usuario tenga una organización
      if (!user.organization_id) {
        throw new Error('El usuario no tiene una organización asignada. Por favor, contacte al administrador.');
      }

      const url = editId
        ? `http://localhost:8000/clients/${editId}`
        : 'http://localhost:8000/clients/';
      const method = editId ? 'PUT' : 'POST';

      const clientData = {
        name: form.name,
        code: form.code || null,
        is_active: form.is_active,
        country_code: form.country_code || null,
        address: form.address || null,
        contact_email: form.contact_email || null,
        contact_phone: form.contact_phone || null,
        tax_id: form.tax_id || null,
        organization_id: user.organization_id  // Agregar explícitamente organization_id
      };

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(clientData),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        throw new Error(errorData || 'Error al procesar el cliente');
      }

      setShowForm(false);
      setEditId(null);
      setForm({
        name: "",
        code: "",
        is_active: true,
        country_code: "",
        address: "",
        contact_email: "",
        contact_phone: "",
        tax_id: "",
        organization_id: null
      });
      await fetchClients();
    } catch (error) {
      console.error('Error completo:', error);
      
      // Manejar específicamente errores de autenticación o CORS
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        alert('Error de conexión. Por favor, verifica tu conexión de red o el servidor.');
      } else if (error.message.includes('Unauthorized') || error.message.includes('token')) {
        alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
      } else {
        alert(error.message || 'Error al crear/actualizar el cliente');
      }
    } finally {
      setLoading(false);
    }
  };

  // Eliminar cliente
  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Seguro que deseas eliminar el cliente "${name}" (ID: ${id})?`)) {
      try {
        const headers = getAuthHeaders();
        const response = await fetch(`http://localhost:8000/clients/${id}`, {
          method: 'DELETE',
          headers,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al eliminar el cliente');
        }

        await fetchClients();
      } catch (error) {
        console.error('Error:', error);
        
        // Manejar específicamente errores de autenticación
        if (error.message.includes('Unauthorized') || error.message.includes('token')) {
          setError('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
        } else {
          setError(error.message);
        }
      }
    }
  };

  // Editar cliente
  const handleEdit = (client) => {
    setForm({
      name: client.name || "",
      code: client.code || "",
      is_active: client.is_active,
      country_code: client.country_code || "",
      address: client.address || "",
      contact_email: client.contact_email || "",
      contact_phone: client.contact_phone || "",
      tax_id: client.tax_id || "",
      organization_id: client.organization_id || null
    });
    setEditId(client.client_id);
    setShowForm(true);
    setError('');
  };

  return (
    <div className={`${theme.FONT_CLASS}`}>
      <div className="overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
          <h2 className="text-lg font-bold text-gray-700">Clientes</h2>
          <button
            className={`bg-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition`}
            onClick={() => {
              setShowForm(true);
              setEditId(null);
              setForm({
                name: "",
                code: "",
                is_active: true,
                country_code: "",
                address: "",
                contact_email: "",
                contact_phone: "",
                tax_id: "",
                organization_id: null
              });
              setError('');
            }}
          >
            + Nuevo Cliente
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Cliente *</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="name"
                  placeholder="Nombre del cliente"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Código</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="code"
                  placeholder="Código del cliente"
                  value={form.code}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                <select
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="country_code"
                  value={form.country_code}
                  onChange={handleChange}
                >
                  <option value="">Seleccionar país</option>
                  {countries.map(country => (
                    <option key={country.country_code} value={country.country_code}>
                      {country.country_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="address"
                  placeholder="Dirección"
                  value={form.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email de Contacto</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="contact_email"
                  type="email"
                  placeholder="Email de contacto"
                  value={form.contact_email}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono de Contacto</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="contact_phone"
                  placeholder="Teléfono"
                  value={form.contact_phone}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ID Fiscal</label>
                <input
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  name="tax_id"
                  placeholder="ID Fiscal"
                  value={form.tax_id}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Cliente Activo</span>
                </div>
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
                    code: "",
                    is_active: true,
                    country_code: "",
                    address: "",
                    contact_email: "",
                    contact_phone: "",
                    tax_id: "",
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

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">País</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
              {clients.map((client) => (
                <tr key={client.client_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.client_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.code || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.country_code || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${client.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                    `}>
                      {client.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                      onClick={() => handleEdit(client)}
                    >
                      <span className="material-icons-outlined text-base">edit</span>
                      Editar
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      onClick={() => handleDelete(client.client_id, client.name)}
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