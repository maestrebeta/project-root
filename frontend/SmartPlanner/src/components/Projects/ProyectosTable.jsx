import React, { useEffect, useState } from 'react';
import { useAppTheme } from '../../context/ThemeContext';

function ProyectosTable() {
  const theme = useAppTheme();
  const [proyectos, setProyectos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    fechaInicio: "",
    fechaFin: "",
    estado: "",
    montoFacturado: ""
  });
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  // Cargar proyectos
  const fetchProyectos = () => {
    fetch('http://localhost:8000/projects/')
      .then((response) => response.json())
      .then((data) => setProyectos(data))
      .catch((error) => console.error('Error al cargar los proyectos:', error));
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Crear o actualizar proyecto
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const url = editId
      ? `http://localhost:8000/projects/${editId}`
      : 'http://localhost:8000/projects/';
    const method = editId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        montoFacturado: parseFloat(form.montoFacturado) || 0
      })
    });
    setShowForm(false);
    setEditId(null);
    setForm({
      nombre: "",
      tipo: "",
      fechaInicio: "",
      fechaFin: "",
      estado: "",
      montoFacturado: ""
    });
    fetchProyectos();
    setLoading(false);
  };

  // Eliminar proyecto
  const handleDelete = async (id, nombre) => {
    if (window.confirm(`¿Seguro que deseas eliminar el proyecto "${nombre}" (ID: ${id})?`)) {
      await fetch(`http://localhost:8000/projects/${id}`, {
        method: 'DELETE'
      });
      fetchProyectos();
    }
  };

  // Editar proyecto
  const handleEdit = (proyecto) => {
    setForm({
      nombre: proyecto.nombre,
      idCliente: proyecto.idCliente,
      fechaInicio: proyecto.fechaInicio,
      fechaFin: proyecto.fechaFin,
      estado: proyecto.estado,
      montoFacturado: proyecto.montoFacturado
    });
    setEditId(proyecto.id);
    setShowForm(true);
  };

  return (
    <div className="overflow-x-auto">
      
      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-bold text-gray-700">Proyectos</h2>
        <button
          className={`bg-${theme.PRIMARY_COLOR}-600 hover:bg-${theme.PRIMARY_COLOR}-700 text-white font-semibold px-4 py-2 rounded-lg shadow transition`}
          onClick={() => {
            setShowForm(true);
            setEditId(null);
            setForm({
              nombre: "",
              idCliente: "",
              fechaInicio: "",
              fechaFin: "",
              estado: "",
              montoFacturado: ""
            });
          }}
        >
          + Nuevo Proyecto
        </button>
      </div>

      {showForm && (
        <form
          className="bg-white border border-gray-200 rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          onSubmit={handleCreateOrUpdate}
        >
          <input
            className="border rounded px-3 py-2"
            name="nombre"
            placeholder="Nombre"
            value={form.nombre}
            onChange={handleChange}
            required
          />
          <input
            className="border rounded px-3 py-2"
            name="idCliente"
            placeholder="ID Cliente"
            value={form.idCliente}
            onChange={handleChange}
            required
          />
          <input
            className="border rounded px-3 py-2"
            name="fechaInicio"
            type={form.fechaInicio ? "date" : "text"}
            placeholder="Fecha Inicio"
            value={form.fechaInicio}
            onFocus={e => e.target.type = "date"}
            onBlur={e => { if (!form.fechaInicio) e.target.type = "text"; }}
            onChange={handleChange}
          />
          <input
            className="border rounded px-3 py-2"
            name="fechaFin"
            type={form.fechaFin ? "date" : "text"}
            placeholder="Fecha Fin"
            value={form.fechaFin}
            onFocus={e => e.target.type = "date"}
            onBlur={e => { if (!form.fechaFin) e.target.type = "text"; }}
            onChange={handleChange}
          />
          <input
            className="border rounded px-3 py-2"
            name="estado"
            placeholder="Estado"
            value={form.estado}
            onChange={handleChange}
          />
          <input
            className="border rounded px-3 py-2"
            name="montoFacturado"
            type="number"
            step="0.01"
            placeholder="Monto Facturado"
            value={form.montoFacturado}
            onChange={handleChange}
          />
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
              onClick={() => {
                setShowForm(false);
                setEditId(null);
                setForm({
                  nombre: "",
                  tipo: "",
                  fechaInicio: "",
                  fechaFin: "",
                  estado: "",
                  montoFacturado: ""
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
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Inicio</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Fecha Fin</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proyectos.map((proyecto) => (
            <tr key={proyecto.id} className="hover:bg-blue-50 transition">
              <td className="px-4 py-2">{proyecto.project_id}</td>
              <td className="px-4 py-2">{proyecto.name}</td>
              <td className="px-4 py-2">{proyecto.project_type}</td>
              <td className="px-4 py-2">{proyecto.start_date}</td>
              <td className="px-4 py-2">{proyecto.end_date}</td>
              <td className="px-4 py-2">{proyecto.status}</td>
              <td className="px-4 py-2 flex gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                  onClick={() => handleEdit(proyecto)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => handleDelete(proyecto.project_id, proyecto.name)}
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

export default ProyectosTable;