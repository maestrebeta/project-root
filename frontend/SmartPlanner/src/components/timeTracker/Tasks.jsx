import React, { useState, useEffect, useRef } from 'react';
import { FiPlay, FiPause, FiSquare, FiEdit2, FiTrash2, FiPlus, FiClock, FiCalendar, FiUser, FiTag, FiChevronDown, FiChevronUp, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import { format, parseISO, startOfToday, isToday, isSameDay, addHours, addMinutes, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAutoAnimate } from '@formkit/auto-animate/react';

const TimeTracker = () => {
  // State for time entries
  const [timeEntries, setTimeEntries] = useState([]);
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Timer state
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    project_id: '',
    client_id: '',
    start_time: '',
    end_time: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    tags: [],
    billable: false
  });
  
  // UI state
  const [activeDateFilter, setActiveDateFilter] = useState('today');
  const [expandedEntries, setExpandedEntries] = useState({});
  const [parent] = useAutoAnimate({ duration: 150 });
  
  // Stats
  const [stats, setStats] = useState({
    totalEntries: 0,
    totalHours: 0,
    todayEntries: 0,
    todayHours: 0,
    activeUsers: 0,
    activeProjects: 0
  });

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [entriesRes, projectsRes, clientsRes, tagsRes, usersRes] = await Promise.all([
          fetch('http://localhost:8000/time-entries/'),
          fetch('http://localhost:8000/projects/'),
          fetch('http://localhost:8000/clients/'),
          fetch('http://localhost:8000/tags/'),
          fetch('http://localhost:8000/users/')
        ]);
        
        const [entriesData, projectsData, clientsData, tagsData, usersData] = await Promise.all([
          entriesRes.json(),
          projectsRes.json(),
          clientsRes.json(),
          tagsRes.json(),
          usersRes.json()
        ]);
        
        setTimeEntries(entriesData);
        setProjects(projectsData);
        setClients(clientsData);
        setTags(tagsData);
        setUsers(usersData);
        
        // Calculate stats
        calculateStats(entriesData);
        
        // Check for running timer in localStorage
        const savedTimer = localStorage.getItem('runningTimer');
        if (savedTimer) {
          const { entry, startTime } = JSON.parse(savedTimer);
          setCurrentEntry(entry);
          const seconds = Math.floor((new Date() - new Date(startTime)) / 1000);
          setTimerSeconds(seconds);
          setIsRunning(true);
          startTimer();
        }
        
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Cleanup timer on unmount
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Calculate statistics
  const calculateStats = (entries) => {
    const today = startOfToday();
    const todayEntries = entries.filter(entry => 
      isSameDay(parseISO(entry.start_time), today)
    );
    
    const totalHours = entries.reduce((sum, entry) => {
      if (entry.end_time) {
        const start = parseISO(entry.start_time);
        const end = parseISO(entry.end_time);
        return sum + differenceInMinutes(end, start) / 60;
      }
      return sum;
    }, 0);
    
    const todayHours = todayEntries.reduce((sum, entry) => {
      if (entry.end_time) {
        const start = parseISO(entry.start_time);
        const end = parseISO(entry.end_time);
        return sum + differenceInMinutes(end, start) / 60;
      }
      return sum;
    }, 0);
    
    const activeUsers = new Set(entries.map(e => e.user_id)).size;
    const activeProjects = new Set(entries.map(e => e.project_id)).size;
    
    setStats({
      totalEntries: entries.length,
      totalHours,
      todayEntries: todayEntries.length,
      todayHours,
      activeUsers,
      activeProjects
    });
  };

  // Timer functions
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleStartTimer = () => {
    if (!formData.description) {
      setError('Please enter a description before starting');
      return;
    }
    
    const newEntry = {
      ...formData,
      start_time: new Date().toISOString(),
      status: 'running'
    };
    
    setCurrentEntry(newEntry);
    setIsRunning(true);
    setTimerSeconds(0);
    startTimer();
    
    // Save to localStorage in case of page refresh
    localStorage.setItem('runningTimer', JSON.stringify({
      entry: newEntry,
      startTime: new Date().toISOString()
    }));
    
    // Reset form
    setFormData({
      description: '',
      project_id: '',
      client_id: '',
      start_time: '',
      end_time: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      tags: [],
      billable: false
    });
  };

  const handleStopTimer = async () => {
    if (!currentEntry) return;
    
    clearInterval(timerRef.current);
    setIsRunning(false);
    
    const endTime = new Date().toISOString();
    const duration = timerSeconds;
    
    // Create the completed entry
    const completedEntry = {
      ...currentEntry,
      end_time: endTime,
      duration_hours: (duration / 3600).toFixed(2),
      status: 'completed'
    };
    
    try {
      // Save to backend
      const response = await fetch('http://localhost:8000/time-entries/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completedEntry)
      });
      
      if (!response.ok) throw new Error('Failed to save time entry');
      
      const savedEntry = await response.json();
      
      // Update state
      setTimeEntries(prev => [savedEntry, ...prev]);
      calculateStats([savedEntry, ...timeEntries]);
      
    } catch (err) {
      setError('Failed to save time entry. Please try again.');
      console.error('Error saving time entry:', err);
    }
    
    // Reset timer state
    setCurrentEntry(null);
    setTimerSeconds(0);
    localStorage.removeItem('runningTimer');
  };

  const handlePauseTimer = () => {
    clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const handleResumeTimer = () => {
    setIsRunning(true);
    startTimer();
  };

  // Format time display
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Form handling
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    const project = projects.find(p => p.project_id == projectId);
    
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      client_id: project ? project.client_id : ''
    }));
  };

  const handleTagToggle = (tagId) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId];
      return { ...prev, tags: newTags };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      if (editId) {
        // Update existing entry
        response = await fetch(`http://localhost:8000/time-entries/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new entry
        response = await fetch('http://localhost:8000/time-entries/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            status: 'completed'
          })
        });
      }
      
      if (!response.ok) throw new Error('Failed to save time entry');
      
      const savedEntry = await response.json();
      
      // Update state
      if (editId) {
        setTimeEntries(prev => prev.map(entry => 
          entry.entry_id === editId ? savedEntry : entry
        ));
      } else {
        setTimeEntries(prev => [savedEntry, ...prev]);
      }
      
      calculateStats(timeEntries);
      setShowForm(false);
      setEditId(null);
      
    } catch (err) {
      setError('Failed to save time entry. Please try again.');
      console.error('Error saving time entry:', err);
    }
  };

  const handleEdit = (entry) => {
    setFormData({
      description: entry.description,
      project_id: entry.project_id,
      client_id: entry.client_id,
      start_time: entry.start_time,
      end_time: entry.end_time,
      date: format(parseISO(entry.start_time), 'yyyy-MM-dd'),
      tags: entry.tags || [],
      billable: entry.billable || false
    });
    setEditId(entry.entry_id);
    setShowForm(true);
  };

  const handleDelete = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this time entry?')) return;
    
    try {
      const response = await fetch(`http://localhost:8000/time-entries/${entryId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete time entry');
      
      setTimeEntries(prev => prev.filter(entry => entry.entry_id !== entryId));
      calculateStats(timeEntries.filter(entry => entry.entry_id !== entryId));
      
    } catch (err) {
      setError('Failed to delete time entry. Please try again.');
      console.error('Error deleting time entry:', err);
    }
  };

  const handleNewEntry = () => {
    setFormData({
      description: '',
      project_id: '',
      client_id: '',
      start_time: '',
      end_time: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      tags: [],
      billable: false
    });
    setEditId(null);
    setShowForm(true);
  };

  const toggleExpandEntry = (entryId) => {
    setExpandedEntries(prev => ({
      ...prev,
      [entryId]: !prev[entryId]
    }));
  };

  // Filter entries by date
  const filteredEntries = timeEntries.filter(entry => {
    const entryDate = parseISO(entry.start_time);
    
    switch (activeDateFilter) {
      case 'today':
        return isToday(entryDate);
      case 'week':
        return differenceInDays(new Date(), entryDate) <= 7;
      case 'month':
        return differenceInDays(new Date(), entryDate) <= 30;
      default:
        return true;
    }
  });

  // Get project name by ID
  const getProjectName = (projectId) => {
    const project = projects.find(p => p.project_id == projectId);
    return project ? project.name : 'No project';
  };

  // Get client name by ID
  const getClientName = (clientId) => {
    const client = clients.find(c => c.client_id == clientId);
    return client ? client.name : 'No client';
  };

  // Get tag names by IDs
  const getTagNames = (tagIds) => {
    return tagIds.map(tagId => {
      const tag = tags.find(t => t.tag_id == tagId);
      return tag ? tag.name : null;
    }).filter(Boolean);
  };

  // Calculate duration for an entry
  const calculateDuration = (start, end) => {
    if (!start || !end) return '0:00';
    
    const startTime = parseISO(start);
    const endTime = parseISO(end);
    const minutes = differenceInMinutes(endTime, startTime);
    
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
              <FiClock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Time Tracker Pro</h1>
          </div>
          <div className="flex items-center space-x-4">
            {isRunning ? (
              <div className="flex items-center bg-red-100 text-red-800 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
                <span className="font-medium">Tracking time</span>
              </div>
            ) : (
              <div className="text-gray-500">Ready to track</div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Timer Section */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Timer display */}
            <div className="flex-1">
              <div className="flex items-center">
                <input
                  type="text"
                  className="flex-1 text-3xl font-bold border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none py-2 px-1"
                  placeholder="What are you working on?"
                  value={isRunning ? currentEntry?.description : formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isRunning}
                />
              </div>
              
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {/* Project dropdown */}
                <div className="relative">
                  <select
                    className="appearance-none bg-gray-100 border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={isRunning ? currentEntry?.project_id : formData.project_id}
                    onChange={isRunning ? null : handleProjectChange}
                    disabled={isRunning}
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                </div>
                
                {/* Tags dropdown */}
                <div className="relative">
                  <button
                    className="flex items-center bg-gray-100 border border-gray-300 rounded-md pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    disabled={isRunning}
                  >
                    <FiTag className="mr-2 text-gray-500" />
                    <span>Tags</span>
                    <FiChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" />
                  </button>
                </div>
                
                {/* Billable toggle */}
                <label className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isRunning ? currentEntry?.billable : formData.billable}
                      onChange={(e) => setFormData({ ...formData, billable: e.target.checked })}
                      disabled={isRunning}
                    />
                    <div className="block bg-gray-300 w-10 h-6 rounded-full"></div>
                    <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition"></div>
                  </div>
                  <div className="ml-3 text-gray-700 font-medium">Billable</div>
                </label>
              </div>
            </div>
            
            {/* Timer controls */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-bold text-gray-800 mb-2">
                {isRunning ? formatTime(timerSeconds) : '00:00:00'}
              </div>
              
              <div className="flex space-x-3">
                {isRunning ? (
                  <>
                    <button
                      onClick={handlePauseTimer}
                      className="flex items-center justify-center bg-yellow-500 hover:bg-yellow-600 text-white rounded-full w-10 h-10 shadow-md transition"
                    >
                      <FiPause className="w-5 h-5" />
                    </button>
                    <button
                      onClick={handleStopTimer}
                      className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 shadow-md transition"
                    >
                      <FiSquare className="w-5 h-5" />
                    </button>
                  </>
                ) : currentEntry ? (
                  <button
                    onClick={handleResumeTimer}
                    className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 shadow-md transition"
                  >
                    <FiPlay className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full w-10 h-10 shadow-md transition"
                  >
                    <FiPlay className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-500">Today</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.todayHours.toFixed(2)} hours</p>
              </div>
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <FiClock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {stats.todayEntries} entries logged today
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-500">This Week</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.totalHours.toFixed(2)} hours</p>
              </div>
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <FiCalendar className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {stats.totalEntries} total entries
            </div>
          </div>
          
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-500">Team Activity</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.activeUsers} users</p>
              </div>
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <FiUser className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {stats.activeProjects} active projects
            </div>
          </div>
        </div>
        
        {/* Time Entries Section */}
        <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Time Entries</h2>
            
            <div className="flex items-center space-x-4">
              <div className="flex border border-gray-300 rounded-md overflow-hidden">
                <button
                  className={`px-3 py-1 text-sm font-medium ${activeDateFilter === 'today' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setActiveDateFilter('today')}
                >
                  Today
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium ${activeDateFilter === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setActiveDateFilter('week')}
                >
                  Week
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium ${activeDateFilter === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                  onClick={() => setActiveDateFilter('month')}
                >
                  Month
                </button>
              </div>
              
              <button
                onClick={handleNewEntry}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow transition"
              >
                <FiPlus className="mr-2" />
                New Entry
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
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="space-y-4" ref={parent}>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-12">
                  <FiClock className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No time entries</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by creating a new time entry.
                  </p>
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <div key={entry.entry_id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleExpandEntry(entry.entry_id)}
                          className="mr-3 text-gray-400 hover:text-gray-600"
                        >
                          {expandedEntries[entry.entry_id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {entry.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getProjectName(entry.project_id)} • {getClientName(entry.client_id)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 ml-4">
                        <span className="text-sm font-medium text-gray-900">
                          {calculateDuration(entry.start_time, entry.end_time)}
                        </span>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(entry);
                            }}
                            className="text-gray-400 hover:text-blue-500"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.entry_id);
                            }}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {expandedEntries[entry.entry_id] && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Details</h4>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Date:</span> {format(parseISO(entry.start_time), 'PPP', { locale: es })}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Time:</span> {format(parseISO(entry.start_time), 'p')} - {entry.end_time ? format(parseISO(entry.end_time), 'p') : 'Now'}
                              </p>
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">Duration:</span> {calculateDuration(entry.start_time, entry.end_time)}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Tags</h4>
                            <div className="flex flex-wrap gap-1">
                              {getTagNames(entry.tags || []).length > 0 ? (
                                getTagNames(entry.tags || []).map(tag => (
                                  <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {tag}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-gray-400">No tags</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* Entry Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            {/* <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                {editId ? 'Edit Time Entry' : 'New Time Entry'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div> */}
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Project
                  </label>
                  <select
                    id="project_id"
                    name="project_id"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.project_id}
                    onChange={handleProjectChange}
                  >
                    <option value="">No project</option>
                    {projects.map(project => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.tag_id}
                      type="button"
                      onClick={() => handleTagToggle(tag.tag_id)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        formData.tags.includes(tag.tag_id)
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {tag.name}
                      {formData.tags.includes(tag.tag_id) && (
                        <FiCheck className="ml-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billable"
                  name="billable"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  checked={formData.billable}
                  onChange={handleInputChange}
                />
                <label htmlFor="billable" className="ml-2 block text-sm text-gray-700">
                  Billable
                </label>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editId ? 'Update Entry' : 'Create Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;