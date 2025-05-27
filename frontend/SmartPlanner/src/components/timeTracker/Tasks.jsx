import React, { useState, useEffect, useCallback } from 'react';
import { FiPlay, FiPause, FiSquare, FiEdit2, FiTrash2, FiPlus, FiClock, FiCalendar, FiUser, FiTag, FiChevronDown, FiChevronUp, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { format, parseISO, startOfToday, isToday, isSameDay, addHours, addMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import TasksTable from './TasksTable';
import FormularioEntrada from './FormularioEntrada';
import { useOrganizationStates } from '../../hooks/useOrganizationStates';
import { useAppTheme } from "../../context/ThemeContext.jsx";
import { useProjectsAndTags } from './useProjectsAndTags';

const TimeTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const theme = useAppTheme();
  const { states: organizationStates, loading: statesLoading } = useOrganizationStates();
  const { activityTypes, suggestedActivity } = useProjectsAndTags();

  // Cargar tareas
  const fetchTasks = useCallback(async () => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const response = await fetch('http://localhost:8000/time-entries/', {
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar las tareas');
      }

      const data = await response.json();
      console.log('Tareas cargadas:', data);
      setTasks(data);
      } catch (err) {
      console.error('Error al cargar tareas:', err);
      setError(err.message);
      } finally {
        setLoading(false);
      }
  }, []);

  // Efecto para recargar cuando cambien los estados
  useEffect(() => {
    if (organizationStates) {
      fetchTasks();
    }
  }, [organizationStates, fetchTasks]);

  // Efecto inicial para cargar tareas
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Editar tarea
  const handleEdit = useCallback((task) => {
    setEditTask(task);
    setShowForm(true);
  }, []);

  // Eliminar tarea
  const handleDelete = useCallback(async (taskId) => {
    console.log('Intentando eliminar tarea con ID:', taskId);
    
    if (!taskId) {
      console.error('ID de tarea inválido:', taskId);
      setError('ID de tarea inválido');
      return;
    }
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta entrada?')) {
      return;
    }

    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      console.log('Enviando petición DELETE a:', `http://localhost:8000/time-entries/${taskId}`);
      
      const response = await fetch(`http://localhost:8000/time-entries/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al eliminar la entrada');
      }

      setTasks(prev => prev.filter(task => task.entry_id !== taskId));
      console.log('Tarea eliminada exitosamente:', taskId);
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError(err.message);
    }
  }, []);

  // Guardar tarea (nueva o editada)
  const handleSubmit = async (taskData) => {
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session?.token) {
        throw new Error('No hay sesión activa');
      }

      const url = editTask
        ? `http://localhost:8000/time-entries/${editTask.entry_id}`
        : 'http://localhost:8000/time-entries/';

      const response = await fetch(url, {
        method: editTask ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(taskData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Error al guardar la entrada');
      }

      const savedTask = await response.json();
      console.log('Tarea guardada:', savedTask);

      setTasks(prev => {
        if (editTask) {
          return prev.map(task => 
            task.entry_id === editTask.entry_id ? savedTask : task
          );
        }
        return [...prev, savedTask];
      });

      setShowForm(false);
      setEditTask(null);
    } catch (err) {
      console.error('Error al guardar tarea:', err);
      throw new Error(err.message || 'Error al guardar la entrada');
    }
  };

  if (loading || statesLoading) {
    return <div className="text-center py-4">Cargando...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && (
        <FormularioEntrada
          editId={editTask?.entry_id}
          initialData={editTask}
          onClose={() => {
            setShowForm(false);
            setEditTask(null);
          }}
          onSubmit={handleSubmit}
          organizationStates={organizationStates}
          activityTypes={activityTypes}
          suggestedActivity={suggestedActivity}
        />
      )}

      <TasksTable
        tasks={tasks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        organizationStates={organizationStates}
      />
    </div>
  );
};

export default TimeTracker;