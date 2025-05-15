import React, { useEffect, useState } from 'react';

function UsersTable() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "",
    password_hash: ""
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar usuarios
  const fetchUsers = () => {
    fetch('http://localhost:8000/users/')
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error('Error al cargar los usuarios:', error));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear o actualizar usuario
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = editId
      ? `http://localhost:8000/users/${editId}`
      : 'http://localhost:8000/users/';
    const method = editId ? 'PUT' : 'POST';

    // No enviar password_hash vacío en edición
    const body = { ...form };
    if (editId && !form.password_hash) {
      delete body.password_hash;
    }

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setShowForm(false);
    setEditId(null);
    setForm({
      username: "",
      full_name: "",
      email: "",
      role: "",
      password_hash: ""
    });
    fetchUsers();
    setLoading(false);
  };

  // Eliminar usuario
  const handleDelete = async (id, username) => {
    if (window.confirm(`¿Seguro que deseas eliminar el usuario "${username}" (ID: ${id})?`)) {
      await fetch(`http://localhost:8000/users/${id}`, {
        method: 'DELETE'
      });
      fetchUsers();
    }
  };

  // Editar usuario
  const handleEdit = (user) => {
    setForm({
      username: user.username,
      full_name: user.full_name || "",
      email: user.email,
      role: user.role,
      password_hash: ""
    });
    setEditId(user.user_id);
    setShowForm(true);
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-bold text-gray-700">Usuarios</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition"
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({
              username: "",
              full_name: "",
              email: "",
              role: "",
              password_hash: ""
            });
          }}
        >
          + Nuevo Usuario
        </button>
      </div>

      {showForm && (
        <form
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleCreateOrUpdate}
        >
          <input
            className="border rounded px-3 py-2"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            required
            disabled={!!editId}
          />
          <input
            className="border rounded px-3 py-2"
            name="full_name"
            placeholder="Nombre completo"
            value={form.full_name}
            onChange={handleChange}
          />
          <input
            className="border rounded px-3 py-2"
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="border rounded px-3 py-2"
            name="password"
            type="password"
            placeholder={editId ? "Nueva contraseña (opcional)" : "Contraseña"}
            value={form.password}
            onChange={handleChange}
            required={!editId}
          />
          <select
            className="border rounded px-3 py-2"
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>Selecciona un rol</option>
            <option value="admin">Administrador</option>
            <option value="dev">Desarrollador</option>
            <option value="infra">Infraestructura</option>
          </select>
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
                  username: "",
                  full_name: "",
                  email: "",
                  role: "",
                  password_hash: ""
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
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Username</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Nombre</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Rol</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.user_id} className="hover:bg-blue-50 transition">
              <td className="px-4 py-2">{user.user_id}</td>
              <td className="px-4 py-2">{user.username}</td>
              <td className="px-4 py-2">{user.full_name}</td>
              <td className="px-4 py-2">{user.email}</td>
              <td className="px-4 py-2">{user.role}</td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  onClick={() => handleEdit(user)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDelete(user.user_id, user.username)}
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

export default UsersTable;