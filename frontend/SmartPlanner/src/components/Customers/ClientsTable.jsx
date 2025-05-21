import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';

function ClientsTable() {
  const theme = useAppTheme();
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    is_active: true
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar clientes
  const fetchClients = () => {
    fetch('http://localhost:8000/clients/')
      .then((response) => response.json())
      .then((data) => setClients(data))
      .catch((error) => console.error('Error al cargar los clientes:', error));
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // Crear o actualizar cliente
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = editId
      ? `http://localhost:8000/clients/${editId}`
      : 'http://localhost:8000/clients/';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setShowForm(false);
    setEditId(null);
    setForm({
      name: "",
      is_active: true
    });
    fetchClients();
    setLoading(false);
  };

  // Eliminar cliente
  const handleDelete = async (id, name) => {
    if (window.confirm(`¿Seguro que deseas eliminar el cliente "${name}" (ID: ${id})?`)) {
      await fetch(`http://localhost:8000/clients/${id}`, {
        method: 'DELETE'
      });
      fetchClients();
    }
  };

  // Editar cliente
  const handleEdit = (client) => {
    setForm({
      name: client.name || "",
      is_active: client.is_active
    });
    setEditId(client.client_id);
    setShowForm(true);
  };

  return (
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
              is_active: true
            });
          }}
        >
          + Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <form
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleCreateOrUpdate}
        >
          <input
            className="border rounded px-3 py-2"
            name="name"
            placeholder="Nombre del cliente"
            value={form.name}
            onChange={handleChange}
            required
            disabled={!!editId}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            Activo
          </label>
          <div className="flex gap-2 col-span-1 md:col-span-2">
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
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setForm({
                  name: "",
                  is_active: true
                });
              }}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Activo</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.client_id} className="hover:bg-blue-50 transition">
              <td className="px-4 py-2">{client.client_id}</td>
              <td className="px-4 py-2">{client.name}</td>
              <td className="px-4 py-2">
                {client.is_active ? (
                  <span className="text-green-600 font-semibold">Sí</span>
                ) : (
                  <span className="text-red-500 font-semibold">No</span>
                )}
              </td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  onClick={() => handleEdit(client)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDelete(client.client_id, client.name)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClientsTable;