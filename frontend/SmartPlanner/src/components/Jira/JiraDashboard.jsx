import React, { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, 
  Legend, ResponsiveContainer, AreaChart, Area, CartesianGrid
} from "recharts";
import { utils, writeFile } from "xlsx";
import { FiChevronDown, FiChevronRight, FiDownload, FiAlertCircle, 
  FiUser, FiCalendar, FiFilter, FiSearch, FiInfo, FiClock, 
  FiCheckCircle, FiCircle, FiTrendingUp, FiRefreshCw } from "react-icons/fi";
import { format, parseISO, isBefore, isToday, isAfter, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { useAppTheme } from "../../context/ThemeContext.jsx";
import Footer from "../Template/Footer.jsx";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

const StatusBadge = ({ status }) => {
  const statusColors = {
    "To Do": { bg: "bg-blue-100", text: "text-blue-800", icon: <FiCircle className="mr-1" /> },
    "In Progress": { bg: "bg-yellow-100", text: "text-yellow-800", icon: <FiRefreshCw className="mr-1" /> },
    "Done": { bg: "bg-green-100", text: "text-green-800", icon: <FiCheckCircle className="mr-1" /> },
    "Temas por aprender": { bg: "bg-purple-100", text: "text-purple-800" },
    "Sin estado": { bg: "bg-gray-100", text: "text-gray-800" }
  };
  
  const currentStatus = statusColors[status] || statusColors["Sin estado"];
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.text}`}>
      {currentStatus.icon || <FiInfo className="mr-1" />}
      {status}
    </span>
  );
};

const AssigneeBadge = ({ assignee, avatarUrl }) => {
  if (!assignee) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <FiUser className="mr-1" />
        Sin asignar
      </span>
    );
  }
  
  return (
    <div className="flex items-center">
      {avatarUrl && (
        <img 
          src={avatarUrl} 
          alt={assignee} 
          className="w-5 h-5 rounded-full mr-2"
          onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name='+encodeURIComponent(assignee)+'&background=random'; }}
        />
      )}
      <span className="text-sm text-gray-700 truncate max-w-xs">{assignee}</span>
    </div>
  );
};

const PriorityBadge = ({ priority }) => {
  const priorityMap = {
    "Highest": { color: "bg-red-500", label: "Alta" },
    "High": { color: "bg-orange-500", label: "Alta" },
    "Medium": { color: "bg-yellow-500", label: "Media" },
    "Low": { color: "bg-blue-500", label: "Baja" },
    "Lowest": { color: "bg-gray-500", label: "Muy baja" }
  };
  
  const currentPriority = priorityMap[priority] || { color: "bg-gray-300", label: priority || "Sin prioridad" };
  
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${currentPriority.color} mr-1`} 
          title={currentPriority.label} />
  );
};

const Skeleton = ({ width = "100%", height = 20, className = "" }) => {
  return (
    <div
      className={`animate-pulse rounded bg-gray-200 ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

const MetricCard = ({ title, value, trend, icon, color, tooltip }) => {
  const trendColor = trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500";
  const trendIcon = trend > 0 ? "↑" : trend < 0 ? "↓" : "→";
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color || "bg-blue-100"} text-blue-600`}>
          {icon}
        </div>
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center text-sm">
          <span className={`flex items-center ${trendColor}`}>
            <FiTrendingUp className="mr-1" />
            {trendIcon} {Math.abs(trend)}%
          </span>
          <span className="text-gray-500 ml-2">vs última semana</span>
        </div>
      )}
      {tooltip && (
        <div className="mt-1 text-xs text-gray-400">{tooltip}</div>
      )}
    </div>
  );
};

const DueDateBadge = ({ date }) => {
  if (!date) return <span className="text-gray-400">-</span>;
  
  const parsedDate = parseISO(date);
  const today = new Date();
  const isOverdue = isBefore(parsedDate, today) && !isToday(parsedDate);
  const isDueToday = isToday(parsedDate);
  const isDueSoon = isAfter(parsedDate, today) && isBefore(parsedDate, addDays(today, 3));
  
  let className = "text-sm";
  let icon = <FiCalendar className="mr-1" />;
  
  if (isOverdue) {
    className += " text-red-600 font-medium";
    icon = <FiAlertCircle className="mr-1" />;
  } else if (isDueToday) {
    className += " text-yellow-600 font-medium";
    icon = <FiAlertCircle className="mr-1" />;
  } else if (isDueSoon) {
    className += " text-blue-600";
  } else {
    className += " text-gray-600";
  }
  
  return (
    <span className={`inline-flex items-center ${className}`}>
      {icon}
      {format(parsedDate, "PP", { locale: es })}
    </span>
  );
};

const JiraDashboard = () => {
  // STATES
  const theme = useAppTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const projectsPerPage = 5;

  // Verificar estado de la sesión
  const checkSession = async () => {
    try {
      const res = await fetch("http://localhost:8000/jira/check-session", {
        credentials: "include"
      });
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
      return data.isAuthenticated;
    } catch (err) {
      console.error("Error checking session:", err);
      setIsAuthenticated(false);
      return false;
    }
  };

  // DATA FETCH
  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      
      // Verificar sesión antes de hacer la petición
      const sessionValid = await checkSession();
      if (!sessionValid) {
        // Guardar la URL actual para redirigir después del login
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `http://localhost:8000/jira/oauth/login?return_url=${currentUrl}`;
        return;
      }

      const res = await fetch("http://localhost:8000/jira/projects-with-issues", { 
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache"
        }
      });
      
      if (res.status === 401) {
        setIsAuthenticated(false);
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `http://localhost:8000/jira/oauth/login?return_url=${currentUrl}`;
        return;
      }
      
      const data = await res.json();
      setProjects(data.projects || []);
      setLastUpdated(new Date());
      setError("");
      setIsAuthenticated(true);
    } catch (err) {
      if (!isAuthenticated) {
        // Si no está autenticado, no mostrar error
        return;
      }
      setError("No se pudo cargar la información de Jira. Verifica tu conexión e intenta nuevamente.");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Si no está autenticado, mostrar pantalla de carga
  if (!isAuthenticated && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className={`w-16 h-16 ${theme.PRIMARY_BG_SOFT} rounded-full mx-auto mb-4 flex items-center justify-center`}>
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Verificando sesión de Jira</h3>
          <p className="text-sm text-gray-500">Por favor espera mientras verificamos tu sesión...</p>
        </div>
      </div>
    );
  }

  // DATA PROCESSING
  const allIssues = useMemo(() => projects.flatMap(p => p.issues || []), [projects]);
  
  const {
    totalProjects,
    totalIssues,
    issuesByStatus,
    overdueIssues,
    issuesByAssignee,
    issuesByPriority,
    nextDue,
    issuesDueThisWeek,
    issuesCompletedThisWeek,
    weeklyCompletionTrend
  } = useMemo(() => {
    const totalProjects = projects.length;
    const totalIssues = allIssues.length;
    
    const issuesByStatus = allIssues.reduce((acc, issue) => {
      const status = issue.status || "Sin estado";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    const overdueIssues = allIssues.filter(issue => 
      issue.duedate && isBefore(parseISO(issue.duedate), new Date()) && !isToday(parseISO(issue.duedate))
    );
    
    const issuesByAssignee = allIssues.reduce((acc, issue) => {
      const user = issue.assignee || "Sin asignar";
      acc[user] = (acc[user] || 0) + 1;
      return acc;
    }, {});
    
    const issuesByPriority = allIssues.reduce((acc, issue) => {
      const priority = issue.priority || "Sin prioridad";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    const nextDue = allIssues
      .filter(issue => issue.duedate)
      .sort((a, b) => parseISO(a.duedate) - parseISO(b.duedate))
      .slice(0, 5);
    
    // Mock data for trends (in a real app, you'd calculate this from historical data)
    const issuesDueThisWeek = allIssues.filter(issue => 
      issue.duedate && isAfter(parseISO(issue.duedate), new Date()) && 
      isBefore(parseISO(issue.duedate), addDays(new Date(), 7))
    ).length;
    
    const issuesCompletedThisWeek = allIssues.filter(issue => 
      issue.status === "Done" && 
      issue.resolutionDate && 
      isAfter(parseISO(issue.resolutionDate), addDays(new Date(), -7))
    ).length;
    
    const weeklyCompletionTrend = Math.floor(Math.random() * 20) - 10; // Random trend for demo
    
    return {
      totalProjects,
      totalIssues,
      issuesByStatus,
      overdueIssues,
      issuesByAssignee,
      issuesByPriority,
      nextDue,
      issuesDueThisWeek,
      issuesCompletedThisWeek,
      weeklyCompletionTrend
    };
  }, [allIssues, projects]);

  // FILTERS & PAGINATION
  const filteredProjects = useMemo(() => 
    projects
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .map(p => ({
        ...p,
        issues: p.issues.filter(issue =>
          (!statusFilter || issue.status === statusFilter) &&
          (!assigneeFilter || (issue.assignee || "Sin asignar") === assigneeFilter) &&
          (!priorityFilter || (issue.priority || "Sin prioridad") === priorityFilter) &&
          (
            !dueFilter ||
            (dueFilter === "overdue" && issue.duedate && isBefore(parseISO(issue.duedate), new Date())) ||
            (dueFilter === "thisWeek" && issue.duedate && isAfter(parseISO(issue.duedate), new Date()) && isBefore(parseISO(issue.duedate), addDays(new Date(), 7)))
          )
        )
      }))
      .filter(p => p.issues.length > 0 || search.length > 0)
  , [projects, search, statusFilter, assigneeFilter, priorityFilter, dueFilter]);

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage) || 1;
  const paginatedProjects = filteredProjects.slice((page - 1) * projectsPerPage, page * projectsPerPage);

  // CHART DATA
  const statusData = Object.entries(issuesByStatus).map(([status, count]) => ({
    status,
    count,
    fill: COLORS[Object.keys(issuesByStatus).indexOf(status) % COLORS.length]
  }));

  const assigneeData = Object.entries(issuesByAssignee)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value], idx) => ({
      name: name.length > 15 ? name.substring(0, 12) + "..." : name,
      fullName: name,
      value,
      fill: COLORS[idx % COLORS.length]
    }));

  const priorityData = Object.entries(issuesByPriority).map(([priority, count]) => ({
    priority,
    count
  }));

  // EXPAND/COLLAPSE
  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // EXPORT TO EXCEL
  const exportToExcel = () => {
    const rows = [];
    filteredProjects.forEach(project => {
      project.issues.forEach(issue => {
        rows.push({
          Proyecto: project.name,
          Clave: issue.key,
          Resumen: issue.summary,
          Estado: issue.status,
          Prioridad: issue.priority,
          Responsable: issue.assignee || "Sin asignar",
          Vence: issue.duedate,
          'Fecha creación': issue.created,
          'Fecha resolución': issue.resolutionDate,
          Etiquetas: (issue.labels || []).join(", "),
          URL: issue.url
        });
      });
    });
    
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Tareas Jira");
    writeFile(wb, `jira_export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

  // UI
  return (
    <div className={`min-h-screen bg-gray-50 ${theme.FONT_CLASS}`}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <span className={`${theme.PRIMARY_BG_STRONG} text-white p-2 rounded-lg mr-3`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </span>
              Jira Dashboard Pro
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Resumen completo de tus proyectos Jira • 
              <span className="ml-2 flex items-center">
                <FiClock className="mr-1" />
                Actualizado: {format(lastUpdated, "PPpp", { locale: es })}
              </span>
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme.PRIMARY_RING_CLASS} ${isRefreshing ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            <FiRefreshCw className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Buscar proyecto</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                  placeholder="Buscar proyectos..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                id="status"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todos los estados</option>
                {Object.keys(issuesByStatus).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
              <select
                id="assignee"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                value={assigneeFilter}
                onChange={e => { setAssigneeFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todos los responsables</option>
                {Object.keys(issuesByAssignee).sort().map(assignee => (
                  <option key={assignee} value={assignee}>{assignee}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <select
                id="priority"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                value={priorityFilter}
                onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todas las prioridades</option>
                {Object.keys(issuesByPriority).map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="due" className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <select
                id="due"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2"
                value={dueFilter}
                onChange={e => { setDueFilter(e.target.value); setPage(1); }}
              >
                <option value="">Todas las fechas</option>
                <option value="overdue">Vencidas</option>
                <option value="thisWeek">Esta semana</option>
              </select>
            </div>
            
            <button
              onClick={exportToExcel}
              className={`flex items-center justify-center px-4 py-2 rounded-md shadow-sm text-sm font-medium ${theme.PRIMARY_BUTTON_CLASS}`}
            >
              <FiDownload className="mr-2" />
              Exportar
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {loading ? (
            <>
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={120} />
              <Skeleton height={120} />
            </>
          ) : (
            <>
              <MetricCard 
                title="Proyectos activos" 
                value={totalProjects} 
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>}
                color="bg-blue-100 text-blue-600"
                tooltip="Número total de proyectos con tareas asignadas"
              />
              <MetricCard 
                title="Tareas totales" 
                value={totalIssues} 
                trend={5}
                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>}
                color="bg-green-100 text-green-600"
                tooltip="Número total de tareas en todos los proyectos"
              />
              <MetricCard 
                title="Tareas vencidas" 
                value={overdueIssues.length} 
                trend={-2}
                icon={<FiAlertCircle className="w-6 h-6" />}
                color="bg-red-100 text-red-600"
                tooltip="Tareas cuya fecha límite ha pasado"
              />
              <MetricCard 
                title="Completadas esta semana" 
                value={issuesCompletedThisWeek} 
                trend={weeklyCompletionTrend}
                icon={<FiCheckCircle className="w-6 h-6" />}
                color="bg-purple-100 text-purple-600"
                tooltip="Tareas marcadas como completadas en los últimos 7 días"
              />
            </>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiFilter className="mr-2" />
              Distribución de tareas por estado
            </h3>
            {loading ? (
              <Skeleton height={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 8) + "..." : value}
                  />
                  <YAxis allowDecimals={false} />
                  <Tooltip 
                    formatter={(value) => [value, "Tareas"]}
                    labelFormatter={(label) => `Estado: ${label}`}
                    contentStyle={{ borderRadius: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {statusData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <FiUser className="mr-2" />
              Tareas por responsable (Top 5)
            </h3>
            {loading ? (
              <Skeleton height={300} />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={assigneeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={40}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {assigneeData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => [`${value} tareas`, props.payload.fullName]}
                    contentStyle={{ borderRadius: '6px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    formatter={(value, entry, index) => assigneeData[index].fullName}
                    wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Alerts Section */}
        <div className="mb-6 space-y-3">
          {overdueIssues.length > 0 && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiAlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <span className="font-bold">¡Alerta!</span> Hay {overdueIssues.length} tareas vencidas que requieren atención.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {issuesDueThisWeek > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiClock className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <span className="font-bold">¡Atención!</span> Hay {issuesDueThisWeek} tareas que vencen esta semana.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {issuesByAssignee["Sin asignar"] > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FiUser className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-bold">¡Nota!</span> Hay {issuesByAssignee["Sin asignar"]} tareas sin responsable asignado.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiCalendar className="mr-2" />
            Próximas tareas por vencer
          </h3>
          {loading ? (
            <div className="space-y-2">
              <Skeleton height={20} width="80%" />
              <Skeleton height={20} width="60%" />
              <Skeleton height={20} width="70%" />
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proyecto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vence
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Responsable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {nextDue.map((issue) => (
                    <tr key={issue.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <PriorityBadge priority={issue.priority} />
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900">
                              <a 
                                href={issue.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`${theme.PRIMARY_COLOR_CLASS} ${theme.PRIMARY_HOVER_TEXT} hover:underline`}
                              >
                                {issue.key}
                              </a>
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{issue.summary}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{issue.projectName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <DueDateBadge date={issue.duedate} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AssigneeBadge assignee={issue.assignee} avatarUrl={issue.assigneeAvatar} />
                      </td>
                    </tr>
                  ))}
                  {nextDue.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay tareas próximas a vencer
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Projects and Issues */}
        <div className="bg-white shadow-sm rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              Proyectos y Tareas
            </h3>
            <div className="flex items-center text-sm text-gray-500">
              <span>Mostrando {paginatedProjects.length} de {filteredProjects.length} proyectos</span>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton height={80} />
              <Skeleton height={80} />
              <Skeleton height={80} />
            </div>
          ) : (
            <>
              {paginatedProjects.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron proyectos</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Intenta ajustar tus filtros de búsqueda.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedProjects.map((project) => (
                    <div key={project.key} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={() => toggleExpand(project.key)}
                        aria-expanded={!!expanded[project.key]}
                      >
                        <div className="flex items-center">
                          {expanded[project.key] ? (
                            <FiChevronDown className="h-5 w-5 text-gray-500 mr-3" />
                          ) : (
                            <FiChevronRight className="h-5 w-5 text-gray-500 mr-3" />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                {project.key}
                              </span>
                              <span>{project.issues.length} tareas</span>
                              {project.lead && (
                                <span className="ml-2 flex items-center">
                                  <FiUser className="mr-1" />
                                  {project.lead}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {project.issues.some(issue => issue.duedate && isBefore(parseISO(issue.duedate), new Date())) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mr-2">
                              <FiAlertCircle className="mr-1" />
                              Vencidas
                            </span>
                          )}
                          {project.issues.some(issue => !issue.assignee) && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              <FiUser className="mr-1" />
                              Sin asignar
                            </span>
                          )}
                        </div>
                      </button>

                      {expanded[project.key] && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {project.issues.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">
                              No hay tareas que coincidan con los filtros seleccionados para este proyecto.
                            </p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Tarea
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Estado
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Prioridad
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Responsable
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Vence
                                    </th>
                                    <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Etiquetas
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {project.issues.map((issue) => (
                                    <tr key={issue.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <div className="flex-shrink-0">
                                            <PriorityBadge priority={issue.priority} />
                                          </div>
                                          <div className="ml-2">
                                            <div className="text-sm font-medium">
                                              <a 
                                                href={issue.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`${theme.PRIMARY_COLOR_CLASS} ${theme.PRIMARY_HOVER_TEXT} hover:underline`}
                                              >
                                                {issue.key}
                                              </a>
                                            </div>
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{issue.summary}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <StatusBadge status={issue.status} />
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <PriorityBadge priority={issue.priority} />
                                          <span className="ml-1 text-sm text-gray-500">{issue.priority || "Sin prioridad"}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <AssigneeBadge assignee={issue.assignee} avatarUrl={issue.assigneeAvatar} />
                                      </td>
                                      <td className="px-4 py-3 whitespace-nowrap">
                                        <DueDateBadge date={issue.duedate} />
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 max-w-xs">
                                          {issue.labels && issue.labels.length > 0 ? (
                                            issue.labels.map(label => (
                                              <span 
                                                key={label} 
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                              >
                                                {label}
                                              </span>
                                            ))
                                          ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination */}
              {filteredProjects.length > projectsPerPage && (
                <div className="flex items-center justify-between border-t border-gray-200 pt-4 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Siguiente
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Mostrando <span className="font-medium">{(page - 1) * projectsPerPage + 1}</span> a{' '}
                        <span className="font-medium">{Math.min(page * projectsPerPage, filteredProjects.length)}</span> de{' '}
                        <span className="font-medium">{filteredProjects.length}</span> proyectos
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => setPage(1)}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Primera página</span>
                          «
                        </button>
                        <button
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Anterior</span>
                          ‹
                        </button>
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (page <= 3) {
                            pageNum = i + 1;
                          } else if (page >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = page - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === page
                                  ? `z-10 ${theme.PRIMARY_BG_SOFT} ${theme.PRIMARY_BORDER_CLASS} ${theme.PRIMARY_FONT_CLASS}`
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Siguiente</span>
                          ›
                        </button>
                        <button
                          onClick={() => setPage(totalPages)}
                          disabled={page === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span className="sr-only">Última página</span>
                          »
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default JiraDashboard;