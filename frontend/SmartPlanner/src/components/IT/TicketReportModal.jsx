import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { 
  FiX, FiDownload, FiBarChart, FiPieChart, FiUsers, 
  FiTrendingUp, FiTrendingDown, FiActivity, FiTarget,
  FiRefreshCw, FiFileText, FiUser, FiMessageSquare
} from 'react-icons/fi';
import * as XLSX from 'xlsx';

export default function TicketReportModal({ 
  isOpen, 
  onClose, 
  tickets, 
  users 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: '' });
  const svgRef = useRef(null);
  const barsContainerRef = useRef(null);
  const [roleFilter, setRoleFilter] = useState('all');

  // Calcular datos del reporte cuando se abre el modal
  useEffect(() => {
    if (isOpen && tickets && users) {
      calculateReportData();
    }
  }, [isOpen, tickets, users]);

  const calculateReportData = () => {
    setIsLoading(true);
    
    // Filtrar solo tickets abiertos (nuevo y en_progreso)
    const openTickets = tickets.filter(ticket => 
      ticket.status === 'nuevo' || ticket.status === 'en_progreso'
    );

    // Agrupar tickets por usuario asignado
    const userTicketCounts = {};
    
    // Inicializar contadores para todos los usuarios
    users.forEach(user => {
      userTicketCounts[user.user_id] = {
        user_id: user.user_id,
        user_name: getUserDisplayName(user.full_name),
        username: user.username,
        role: user.role,
        ticket_count: 0,
        tickets: []
      };
    });

    // Contar tickets por usuario
    openTickets.forEach(ticket => {
      if (ticket.assigned_to_user_id) {
        if (userTicketCounts[ticket.assigned_to_user_id]) {
          userTicketCounts[ticket.assigned_to_user_id].ticket_count++;
          userTicketCounts[ticket.assigned_to_user_id].tickets.push(ticket);
        }
      }
    });

    // Convertir a array y ordenar por cantidad de tickets (descendente)
    const sortedData = Object.values(userTicketCounts)
      .filter(user => user.ticket_count > 0) // Solo usuarios con tickets
      .sort((a, b) => b.ticket_count - a.ticket_count); // Orden descendente

    setReportData(sortedData);
    setIsLoading(false);
  };

  // Función para extraer solo el nombre del usuario sin la compañía
  const getUserDisplayName = (fullName) => {
    if (!fullName) return 'Usuario desconocido';
    const nameParts = fullName.split(' - ');
    return nameParts[0] || fullName;
  };

  const downloadExcel = () => {
    if (filteredReportData.length === 0) return;

    // Función para obtener el nombre del rol
    const getRoleName = (role) => {
      switch (role) {
        case 'dev': return 'Desarrollador';
        case 'infra': return 'Infraestructura';
        case 'admin': return 'Administrador';
        case 'super_user': return 'Super Usuario';
        default: return role;
      }
    };

    // Preparar datos para Excel
    const excelData = filteredReportData.map(user => ({
      'Usuario Asignado': user.user_name,
      'Rol': getRoleName(user.role),
      'Cantidad de Tickets Abiertos': user.ticket_count
    }));

    // Crear workbook y worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte Tickets por Usuario');

    // Generar archivo y descargar
    const fileName = `reporte_tickets_por_usuario_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getTotalOpenTickets = () => {
    return reportData.reduce((total, user) => total + user.ticket_count, 0);
  };

  const getAverageTicketsPerUser = () => {
    if (reportData.length === 0) return 0;
    return Math.round(getTotalOpenTickets() / reportData.length);
  };

  // Colores para el gráfico
  const barColor = '#2563eb'; // Azul corporativo

  // Tooltip handlers para barras
  const handleBarMouseMove = (e, user) => {
    const rect = barsContainerRef.current.getBoundingClientRect();
    setTooltip({
      show: true,
      x: e.clientX - rect.left + 10,
      y: e.clientY - rect.top + 10,
      content: (
        <div className="text-left">
          <div className="font-semibold text-gray-900">{user.user_name}</div>
          <div className="text-sm text-gray-600">Tickets abiertos: <span className="font-bold text-blue-700">{user.ticket_count}</span></div>
        </div>
      )
    });
  };
  const handleBarMouseOut = () => setTooltip({ show: false, x: 0, y: 0, content: '' });

  // Filtrar usuarios por rol
  const filteredReportData = reportData.filter(user => {
    if (roleFilter === 'all') return true;
    return user.role === roleFilter;
  });

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full min-h-[600px] max-h-[98vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <FiBarChart className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Reporte de Tickets por Usuario</h2>
                  <p className="text-sm text-blue-100">
                    Distribución de tickets abiertos por usuario asignado
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Contenido del modal */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-spin mx-auto mb-4">
                    <div className="w-8 h-8 bg-white rounded-full m-2"></div>
                  </div>
                  <p className="text-gray-600">Generando reporte...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Estadísticas rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Tickets Abiertos</p>
                        <p className="text-2xl font-bold text-blue-800">{getTotalOpenTickets()}</p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-lg">
                        <FiMessageSquare className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Usuarios con Tickets</p>
                        <p className="text-2xl font-bold text-green-800">{reportData.length}</p>
                      </div>
                      <div className="p-3 bg-green-500 rounded-lg">
                        <FiUsers className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Promedio por Usuario</p>
                        <p className="text-2xl font-bold text-purple-800">{getAverageTicketsPerUser()}</p>
                      </div>
                      <div className="p-3 bg-purple-500 rounded-lg">
                        <FiTarget className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Máximo por Usuario</p>
                        <p className="text-2xl font-bold text-orange-800">
                          {reportData[0]?.ticket_count || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-orange-500 rounded-lg">
                        <FiTrendingUp className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtro por rol */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Desglose por Usuario</h4>
                  <div className="flex items-center gap-2">
                  <label htmlFor="role-filter" className="text-sm font-medium text-gray-700">
                    Rol:
                  </label>
                    <select
                      id="role-filter"
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="dev">Desarrollador</option>
                      <option value="infra">Infraestructura</option>
                    </select>
                    <button
                      onClick={downloadExcel}
                      disabled={filteredReportData.length === 0}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-all duration-200 text-sm font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiDownload className="w-4 h-4" />
                      Descargar Excel
                    </button>
                  </div>
                </div>

                {/* Gráfico */}
                <div className="bg-white border border-gray-200 rounded-xl p-6">
                  {reportData.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiUsers className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No hay datos para mostrar</h3>
                      <p className="text-gray-600">
                        No hay tickets abiertos asignados a usuarios en este momento.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Gráfico */}
                      <div className="flex items-center justify-center">
                        <div ref={barsContainerRef} className="w-full h-64 flex flex-col justify-center gap-4 relative">
                          {filteredReportData.map((user) => {
                            const maxTickets = Math.max(...filteredReportData.map(u => u.ticket_count));
                            const width = (user.ticket_count / (maxTickets || 1)) * 80; // porcentaje del ancho
                            return (
                              <div key={user.user_id} className="flex items-center group relative">
                                <div className="min-w-[160px] max-w-[220px] mr-2">
                                  <span className="text-sm font-medium text-gray-900 truncate block">{user.user_name}</span>
                                </div>
                                <div
                                  className="h-8 rounded-lg transition-all duration-500 hover:opacity-80 cursor-pointer"
                                  style={{
                                    width: `${width}%`,
                                    backgroundColor: barColor
                                  }}
                                  onMouseMove={e => handleBarMouseMove(e, user)}
                                  onMouseLeave={handleBarMouseOut}
                                />
                              </div>
                            );
                          })}
                          {tooltip.show && (
                            <div
                              className="absolute z-50 px-4 py-2 bg-white border border-gray-300 rounded shadow text-xs text-gray-800 pointer-events-none"
                              style={{ left: tooltip.x, top: tooltip.y }}
                            >
                              {tooltip.content}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lista detallada */}
                      <div className="space-y-4">
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {filteredReportData.map((user, index) => (
                            <div
                              key={user.user_id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: barColor }}
                                />
                                <div>
                                  <div className="font-medium text-gray-900">{user.user_name}</div>
                                  <div className="text-sm text-gray-600">@{user.username}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900">{user.ticket_count}</div>
                                <div className="text-sm text-gray-600">
                                  {((user.ticket_count / getTotalOpenTickets()) * 100).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Última actualización: {new Date().toLocaleString('es-ES')}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>,
    document.body
  );
} 