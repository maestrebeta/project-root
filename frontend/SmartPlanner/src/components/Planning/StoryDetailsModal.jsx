import React, { useState, useRef, useEffect, useMemo } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToVerticalAxis, restrictToWindowEdges } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// AI-generated color palette with perfect contrast
const COLOR_PALETTE = [
  { bg: "#3B82F6", text: "#FFFFFF" }, // Blue
  { bg: "#10B981", text: "#FFFFFF" }, // Emerald
  { bg: "#F59E0B", text: "#FFFFFF" }, // Amber
  { bg: "#EC4899", text: "#FFFFFF" }, // Pink
  { bg: "#8B5CF6", text: "#FFFFFF" }, // Violet
  { bg: "#14B8A6", text: "#FFFFFF" }, // Teal
  { bg: "#F97316", text: "#FFFFFF" }, // Orange
  { bg: "#6366F1", text: "#FFFFFF" }, // Indigo
];

const STATUS_OPTIONS = [
  { value: "backlog", label: "Backlog", icon: "📋" },
  { value: "todo", label: "Por hacer", icon: "🟡" },
  { value: "in_progress", label: "En progreso", icon: "🔵" },
  { value: "in_review", label: "En revisión", icon: "🟣" },
  { value: "done", label: "Completado", icon: "✅" },
  { value: "blocked", label: "Bloqueado", icon: "⛔" },
];

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Crítica", icon: "🔥", color: "#EF4444" },
  { value: "high", label: "Alta", icon: "⚠️", color: "#F59E0B" },
  { value: "medium", label: "Media", icon: "🔹", color: "#3B82F6" },
  { value: "low", label: "Baja", icon: "🌿", color: "#10B981" },
];

const TASK_TYPES = [
  { value: "feature", label: "Feature", icon: "✨" },
  { value: "bug", label: "Bug", icon: "🐛" },
  { value: "improvement", label: "Mejora", icon: "🔧" },
  { value: "research", label: "Investigación", icon: "🔍" },
  { value: "documentation", label: "Documentación", icon: "📄" },
];

const TIME_ESTIMATES = [
  { label: "XS", value: 1, emoji: "🐜" },
  { label: "S", value: 2, emoji: "🐇" },
  { label: "M", value: 4, emoji: "🦊" },
  { label: "L", value: 8, emoji: "🐘" },
  { label: "XL", value: 16, emoji: "🦖" },
];


const ChecklistItem = React.memo(({ item, idx, onToggle, onRemove, isDragging, attributes, listeners }) => {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
        isDragging ? "bg-opacity-70 shadow-lg" : "hover:bg-gray-50"
      } ${item.done ? "bg-green-50" : "bg-white"}`}
      {...attributes}
      {...listeners}
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
    >
      <button
        type="button"
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          item.done ? "bg-green-500 border-green-500" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => onToggle(idx)}
        aria-label={item.done ? "Marcar como pendiente" : "Marcar como completado"}
      >
        {item.done && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>
      
      <span className={`flex-1 ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>
        {item.text}
      </span>
      
      <button
        type="button"
        className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
        onClick={() => onRemove(idx)}
        aria-label="Eliminar tarea"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="text-gray-300 hover:text-gray-400 transition-colors p-1 cursor-move">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </motion.li>
  );
});

const TagPill = ({ tag, onRemove, color }) => {
  const bgColor = color?.bg || COLOR_PALETTE[Math.abs(hashCode(tag)) % COLOR_PALETTE.length].bg;
  const textColor = color?.text || COLOR_PALETTE[Math.abs(hashCode(tag)) % COLOR_PALETTE.length].text;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium`}
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {tag}
      {onRemove && (
        <button
          type="button"
          className="ml-1.5 -mr-1.5 inline-flex items-center justify-center rounded-full p-0.5 hover:bg-black hover:bg-opacity-10 focus:outline-none"
          onClick={() => onRemove(tag)}
          aria-label={`Eliminar etiqueta ${tag}`}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
};

const UserAvatar = ({ user, size = "md", showName = false, className = "" }) => {
  const sizes = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium`}
      >
        {user.name.split(" ").map(n => n[0]).join("").toUpperCase()}
      </div>
      {showName && <span className="text-gray-700">{user.name}</span>}
    </div>
  );
};

const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

export default function UltraTaskModal({
  task,
  users = [],
  projects = [],
  sprints = [],
  tags = [],
  onClose,
  onSave,
  onDelete,
  onDuplicate,
  onConvertToEpic,
}) {
  const isNew = !task?.id;
  const modalRef = useRef(null);
  const titleRef = useRef(null);
  const [form, setForm] = useState(() => ({
    title: task?.title || "",
    description: task?.description || "",
    projectId: task?.projectId || projects[0]?.id || "",
    status: task?.status || "backlog",
    priority: task?.priority || "medium",
    type: task?.type || "feature",
    color: task?.color || COLOR_PALETTE[0].bg,
    estimate: task?.estimate || null,
    assigneeId: task?.assigneeId || "",
    sprintId: task?.sprintId || "",
    tags: task?.tags || [],
    checklist: task?.checklist || [],
    comments: task?.comments || [],
    attachments: task?.attachments || [],
    activity: task?.activity || [],
    dueDate: task?.dueDate || null,
  }));

  const [newTag, setNewTag] = useState("");
  const [newChecklist, setNewChecklist] = useState("");
  const [newComment, setNewComment] = useState("");
  const [searchUser, setSearchUser] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [isExpanded, setIsExpanded] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [fileUploadProgress, setFileUploadProgress] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Form validation
  const isValid = form.title.trim().length > 0 && form.description.trim().length > 0;

  // Auto-focus title field on open
  useEffect(() => {
    titleRef.current?.focus();
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && isValid) handleSave();
      if ((e.ctrlKey || e.metaKey) && e.key === "d") handleDuplicate();
      if ((e.ctrlKey || e.metaKey) && e.key === "e") onConvertToEpic && onConvertToEpic(form);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [form, isValid]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      (user?.name || "").toLowerCase().includes((searchUser || "").toLowerCase())
    );
  }, [users, searchUser]);

  // Suggested assignee (least busy user in the project)
  const suggestedAssignee = useMemo(() => {
    if (form.projectId) {
      const projectUsers = users.filter(u => 
        u.projects?.includes(form.projectId)
      );
      return projectUsers.sort((a, b) => (a.taskCount || 0) - (b.taskCount || 0))[0];
    }
    return null;
  }, [form.projectId, users]);

  // Total hours from checklist items
  const totalChecklistItems = form.checklist.length;
  const completedChecklistItems = form.checklist.filter(item => item.done).length;
  const checklistProgress = totalChecklistItems > 0 
    ? Math.round((completedChecklistItems / totalChecklistItems) * 100) 
    : 0;

  // Drag and drop handlers
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setForm(prev => ({
      ...prev,
      checklist: arrayMove(prev.checklist, active.id, over.id),
    }));
  };

  // Tag management
  const handleAddTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
        activity: [
          ...prev.activity,
          { type: "tag_added", value: newTag.trim(), date: new Date().toISOString() },
        ],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
      activity: [
        ...prev.activity,
        { type: "tag_removed", value: tag, date: new Date().toISOString() },
      ],
    }));
  };

  // Checklist management
  const handleAddChecklist = () => {
    if (newChecklist.trim()) {
      setForm(prev => ({
        ...prev,
        checklist: [...prev.checklist, { text: newChecklist.trim(), done: false }],
        activity: [
          ...prev.activity,
          { type: "checklist_added", value: newChecklist.trim(), date: new Date().toISOString() },
        ],
      }));
      setNewChecklist("");
    }
  };

  const handleToggleChecklist = (idx) => {
    setForm(prev => {
      const newChecklist = [...prev.checklist];
      newChecklist[idx] = { ...newChecklist[idx], done: !newChecklist[idx].done };
      return {
        ...prev,
        checklist: newChecklist,
        activity: [
          ...prev.activity,
          { 
            type: newChecklist[idx].done ? "checklist_completed" : "checklist_reopened",
            value: newChecklist[idx].text,
            date: new Date().toISOString(),
          },
        ],
      };
    });
  };

  const handleRemoveChecklist = (idx) => {
    const itemToRemove = form.checklist[idx];
    setForm(prev => ({
      ...prev,
      checklist: prev.checklist.filter((_, i) => i !== idx),
      activity: [
        ...prev.activity,
        { type: "checklist_removed", value: itemToRemove.text, date: new Date().toISOString() },
      ],
    }));
  };

  // Comments management
  const handleAddComment = () => {
    if (newComment.trim()) {
      const now = new Date().toISOString();
      setForm(prev => ({
        ...prev,
        comments: [
          ...prev.comments,
          {
            text: newComment.trim(),
            date: now,
            userId: "current-user", // In a real app, use the logged-in user's ID
          },
        ],
        activity: [
          ...prev.activity,
          { type: "comment_added", value: newComment.trim(), date: now },
        ],
      }));
      setNewComment("");
    }
  };

  // File upload simulation
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploading(true);
    setFileUploadProgress(0);

    // Simulate upload progress
    const interval = setInterval(() => {
      setFileUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setFileUploading(false);
      setFileUploadProgress(0);
      const now = new Date().toISOString();
      setForm(prev => ({
        ...prev,
        attachments: [
          ...prev.attachments,
          {
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file),
            date: now,
          },
        ],
        activity: [
          ...prev.activity,
          { type: "attachment_added", value: file.name, date: now },
        ],
      }));
    }, 2000);
  };

  const handleRemoveAttachment = (idx) => {
    const attachmentToRemove = form.attachments[idx];
    setForm(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== idx),
      activity: [
        ...prev.activity,
        { type: "attachment_removed", value: attachmentToRemove.name, date: new Date().toISOString() },
      ],
    }));
  };

  // Color selection
  const handleColorChange = (color) => {
    setForm(prev => ({
      ...prev,
      color,
      activity: [
        ...prev.activity,
        { type: "color_changed", value: color, date: new Date().toISOString() },
      ],
    }));
  };

  // Save handler
  const handleSave = () => {
    if (isValid) {
      onSave({
        ...form,
        id: task?.id || undefined,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Duplicate handler
  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate({
        ...form,
        id: undefined,
        title: `${form.title} (Copia)`,
        status: "backlog",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Format activity dates
  const formatActivityDate = (dateString) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true,
      locale: es,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", damping: 25 }}
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border-4"
        style={{ borderColor: form.color, boxShadow: `0 0 0 8px ${form.color}22` }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <select
                className="border rounded-lg px-3 py-1 text-sm font-medium appearance-none bg-no-repeat pr-8"
                style={{ 
                  backgroundColor: form.color,
                  color: COLOR_PALETTE.find(c => c.bg === form.color)?.text || "#FFFFFF",
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundSize: "1rem",
                }}
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
              >
                {TASK_TYPES.map(type => (
                  <option 
                    key={type.value} 
                    value={type.value}
                    style={{ backgroundColor: "#FFFFFF", color: "#000000" }}
                  >
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              
              <input
                ref={titleRef}
                className="flex-1 text-xl font-bold focus:outline-none min-w-0"
                placeholder="Título de la tarea"
                value={form.title}
                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                maxLength={120}
              />
            </div>
          </div>
          
          <button
            className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left sidebar */}
          <div className="w-16 bg-gray-50 border-r flex flex-col items-center py-4">
            <button
              className={`p-3 rounded-lg mb-2 ${activeTab === "details" ? "bg-white shadow-sm" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("details")}
              aria-label="Detalles"
              title="Detalles"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button
              className={`p-3 rounded-lg mb-2 ${activeTab === "checklist" ? "bg-white shadow-sm" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("checklist")}
              aria-label="Checklist"
              title="Checklist"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </button>
            
            <button
              className={`p-3 rounded-lg mb-2 ${activeTab === "comments" ? "bg-white shadow-sm" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("comments")}
              aria-label="Comentarios"
              title="Comentarios"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            
            <button
              className={`p-3 rounded-lg mb-2 ${activeTab === "activity" ? "bg-white shadow-sm" : "hover:bg-gray-100"}`}
              onClick={() => setActiveTab("activity")}
              aria-label="Actividad"
              title="Actividad"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            
            <div className="mt-auto">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                  {suggestedAssignee?.name.split(" ").map(n => n[0]).join("").toUpperCase()}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                  <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Details tab */}
            {activeTab === "details" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left column */}
                  <div className="space-y-6">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                      <textarea
                        className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                        rows={5}
                        placeholder="Describe la tarea en detalle..."
                        value={form.description}
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      />
                    </div>

                    {/* Attachments */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntos</label>
                      <div className="space-y-2">
                        <AnimatePresence>
                          {form.attachments.map((file, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</div>
                                  <div className="text-xs text-gray-500">{Math.round(file.size / 1024)} KB</div>
                                </div>
                              </div>
                              <button
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
                                onClick={() => handleRemoveAttachment(idx)}
                                aria-label="Eliminar adjunto"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>

                        {fileUploading ? (
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-blue-600 h-2.5 rounded-full" 
                                style={{ width: `${fileUploadProgress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Subiendo archivo...</div>
                          </div>
                        ) : (
                          <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                            <svg className="-ml-1 mr-2 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Subir archivo
                            <input type="file" className="sr-only" onChange={handleFileUpload} />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right column */}
                  <div className="space-y-6">
                    {/* Status and Priority */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          value={form.status}
                          onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                        >
                          {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          value={form.priority}
                          onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
                        >
                          {PRIORITY_OPTIONS.map(option => (
                            <option 
                              key={option.value} 
                              value={option.value}
                              style={{ color: option.color }}
                            >
                              {option.icon} {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Project and Sprint */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          value={form.projectId}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            projectId: e.target.value,
                            assigneeId: suggestedAssignee?.id || "",
                          }))}
                        >
                          {projects.map(project => (
                            <option key={project.id} value={project.id}>{project.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sprint</label>
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          value={form.sprintId}
                          onChange={(e) => setForm(prev => ({ ...prev, sprintId: e.target.value }))}
                        >
                          <option value="">Sin sprint</option>
                          {sprints.map(sprint => (
                            <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Assignee and Due Date */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asignado a</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition mb-1"
                            placeholder="Buscar usuario..."
                            value={searchUser}
                            onChange={(e) => setSearchUser(e.target.value)}
                          />
                          <select
                            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                            value={form.assigneeId}
                            onChange={(e) => setForm(prev => ({ ...prev, assigneeId: e.target.value }))}
                          >
                            <option value="">Sin asignar</option>
                            {filteredUsers.map(user => (
                              <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                          </select>
                        </div>
                        {suggestedAssignee && form.assigneeId === "" && (
                          <div className="text-xs text-blue-500 mt-1">
                            Sugerido: {suggestedAssignee.name}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                        <input
                          type="date"
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          value={form.dueDate || ""}
                          onChange={(e) => setForm(prev => ({ 
                            ...prev, 
                            dueDate: e.target.value || null 
                          }))}
                        />
                      </div>
                    </div>

                    {/* Estimate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimación</label>
                      <div className="flex gap-2">
                        {TIME_ESTIMATES.map(estimate => (
                          <button
                            key={estimate.value}
                            type="button"
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm flex items-center justify-center gap-1 transition ${
                              form.estimate === estimate.value 
                                ? "bg-blue-100 border-blue-300 text-blue-700" 
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => setForm(prev => ({ 
                              ...prev, 
                              estimate: prev.estimate === estimate.value ? null : estimate.value 
                            }))}
                          >
                            <span>{estimate.emoji}</span>
                            <span>{estimate.label}</span>
                            <span className="text-gray-500">({estimate.value}h)</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Etiquetas</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <AnimatePresence>
                          {form.tags.map(tag => (
                            <TagPill 
                              key={tag} 
                              tag={tag} 
                              onRemove={handleRemoveTag}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          placeholder="Nueva etiqueta"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (handleAddTag(), e.preventDefault())}
                          list="tag-suggestions"
                        />
                        <button
                          type="button"
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                          onClick={handleAddTag}
                        >
                          +
                        </button>
                      </div>
                      <datalist id="tag-suggestions">
                        {tags.filter(t => !form.tags.includes(t)).map(tag => (
                          <option key={tag} value={tag} />
                        ))}
                      </datalist>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                      <div className="flex gap-2">
                        {COLOR_PALETTE.map(color => (
                          <button
                            key={color.bg}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              form.color === color.bg ? "border-black scale-110" : "border-transparent hover:scale-105"
                            }`}
                            style={{ backgroundColor: color.bg }}
                            onClick={() => handleColorChange(color.bg)}
                            aria-label={`Color ${color.bg}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Checklist tab */}
            {activeTab === "checklist" && (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Checklist</h3>
                    <div className="text-sm text-gray-500">
                      {completedChecklistItems} de {totalChecklistItems} completadas
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-green-500 h-2.5 rounded-full" 
                        style={{ width: `${checklistProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={form.checklist.map((_, idx) => idx)} 
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="space-y-2">
                        <AnimatePresence>
                          {form.checklist.map((item, idx) => (
                            <ChecklistItem
                              key={idx}
                              item={item}
                              idx={idx}
                              onToggle={handleToggleChecklist}
                              onRemove={handleRemoveChecklist}
                              attributes={{
                                "data-id": idx,
                              }}
                              listeners={{
                                onPointerDown: () => {},
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </ul>
                    </SortableContext>
                  </DndContext>

                  <div className="flex gap-2 mt-4">
                    <input
                      type="text"
                      className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                      placeholder="Nueva tarea del checklist"
                      value={newChecklist}
                      onChange={(e) => setNewChecklist(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (handleAddChecklist(), e.preventDefault())}
                    />
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      onClick={handleAddChecklist}
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments tab */}
            {activeTab === "comments" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Comentarios</h3>
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {form.comments.map((comment, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex gap-3"
                        >
                          <div className="flex-shrink-0">
                            <UserAvatar 
                              user={users.find(u => u.id === comment.userId) || { name: "Usuario" }} 
                              size="sm" 
                            />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {users.find(u => u.id === comment.userId)?.name || "Usuario"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {formatActivityDate(comment.date)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.text}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <div className="mt-6">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        <UserAvatar 
                          user={{ name: "Tú" }} 
                          size="sm" 
                        />
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="w-full border rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                          rows={3}
                          placeholder="Escribe un comentario..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                          >
                            Comentar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Activity tab */}
            {activeTab === "activity" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de actividad</h3>
                  
                  <div className="space-y-4">
                    <AnimatePresence>
                      {form.activity.map((activity, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="flex gap-3"
                        >
                          <div className="flex-shrink-0 pt-1">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                              {activity.type === "comment_added" && (
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                              )}
                              {activity.type === "attachment_added" && (
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                              )}
                              {activity.type === "checklist_added" && (
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              )}
                              {activity.type === "checklist_completed" && (
                                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {activity.type === "color_changed" && (
                                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-700">
                              {activity.type === "comment_added" && (
                                <span>Agregó un comentario: "{activity.value}"</span>
                              )}
                              {activity.type === "attachment_added" && (
                                <span>Agregó un archivo: "{activity.value}"</span>
                              )}
                              {activity.type === "checklist_added" && (
                                <span>Agregó una tarea al checklist: "{activity.value}"</span>
                              )}
                              {activity.type === "checklist_completed" && (
                                <span>Completó la tarea: "{activity.value}"</span>
                              )}
                              {activity.type === "checklist_removed" && (
                                <span>Eliminó la tarea: "{activity.value}"</span>
                              )}
                              {activity.type === "checklist_reopened" && (
                                <span>Reabrió la tarea: "{activity.value}"</span>
                              )}
                              {activity.type === "tag_added" && (
                                <span>Agregó la etiqueta: "{activity.value}"</span>
                              )}
                              {activity.type === "tag_removed" && (
                                <span>Eliminó la etiqueta: "{activity.value}"</span>
                              )}
                              {activity.type === "color_changed" && (
                                <span>Cambió el color de la tarea</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatActivityDate(activity.date)}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap gap-3 justify-between">
          <div className="flex items-center gap-2">
            {!isNew && (
              <button
                className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition"
                onClick={() => setShowDelete(true)}
              >
                Eliminar
              </button>
            )}
            <button
              className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition"
              onClick={handleDuplicate}
            >
              Duplicar
            </button>
            {onConvertToEpic && (
              <button
                className="text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm font-medium transition"
                onClick={() => onConvertToEpic(form)}
              >
                Convertir en Épica
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              className="text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              className={`bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition ${
                !isValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={handleSave}
              disabled={!isValid}
            >
              Guardar <span className="ml-1 text-xs opacity-75">(Ctrl+Enter)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="mt-3 text-lg font-medium text-gray-900">¿Eliminar esta tarea?</h3>
                <div className="mt-2 text-sm text-gray-500">
                  Esta acción no se puede deshacer. Todos los datos asociados a esta tarea serán eliminados permanentemente.
                </div>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    onClick={() => setShowDelete(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      onDelete(task);
                      setShowDelete(false);
                      onClose();
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}