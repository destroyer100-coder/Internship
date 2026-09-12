import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight,
  Sun, Clock, RotateCw, CheckCircle2, Star, MoreVertical, Calendar as CalIcon,
  FileText, Users, Folder, Dumbbell, Monitor, Flag, ShoppingCart,
  Edit3, Trash2, Bell, Check, X, ArrowLeft, RefreshCw
} from 'lucide-react'
import { getTasks, updateTask, deleteTask } from '../services/api'
import { toast } from 'react-toastify'
import TaskModal from '../components/TaskModal'

// Sample rich tasks matching the reference image layout
const INITIAL_DEMO_TASKS = []

export default function Tasks() {
  const [searchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [tasks, setTasks] = useState(INITIAL_DEMO_TASKS)
  const [selectedTaskId, setSelectedTaskId] = useState('task-1')
  const [activeTab, setActiveTab] = useState('All')
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [sortBy, setSortBy] = useState('Due Date')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedRows, setSelectedRows] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [addDropdownOpen, setAddDropdownOpen] = useState(false)
  const [openActionMenuId, setOpenActionMenuId] = useState(null)
  const addDropdownRef = useRef(null)
  const actionMenuRef = useRef(null)

  // Reminder Modal State
  const [reminderModalTask, setReminderModalTask] = useState(null)
  const [reminderDate, setReminderDate] = useState('')
  const [reminderTime, setReminderTime] = useState('')

  // Fetch backend tasks and merge
  const fetchTasksData = async () => {
    try {
      const { data } = await getTasks({})
      if (data && data.length > 0) {
        const serverMapped = data.map((t, idx) => ({
          _id: t._id,
          title: t.title,
          description: t.description || 'No description provided.',
          dueDate: t.dueDate ? t.dueDate.slice(0, 10) : '2026-08-26',
          dueTime: t.dueTime || '09:00',
          priority: t.priority || 'Medium',
          status: t.status || 'To Do',
          category: t.category || 'Work',
          timeSpent: '1h',
          timeEstimated: '2h',
          starred: false,
          reminder: '26 Aug 2026, 09:00 AM',
          recurrence: 'Does not repeat',
          notes: t.description || 'No extra notes.',
          loggedTime: '30m',
          remainingTime: '1h 30m',
          scheduledRange: '09:00 AM - 11:00 AM',
          progress: t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 50 : 0,
          createdAt: '26 Aug 2026, 09:00 AM',
          updatedAt: '26 Aug 2026, 09:00 AM',
          iconType: idx % 3 === 0 ? 'file' : idx % 3 === 1 ? 'users' : 'folder',
          iconBg: idx % 3 === 0 ? 'bg-[#E7F0EC] text-[#145A4A]' : idx % 3 === 1 ? 'bg-[#F3EDF4] text-[#765C78]' : 'bg-[#FAF2E6] text-[#B78332]',
          isServer: true
        }))

        // Merge keeping unique
        const combined = [...serverMapped]
        INITIAL_DEMO_TASKS.forEach(d => {
          if (!combined.some(c => c._id === d._id || (c.title === d.title && c.dueDate === d.dueDate))) {
            combined.push(d)
          }
        })
        setTasks(combined)
      }
    } catch {}
  }

  useEffect(() => {
    fetchTasksData()
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target)) {
        setAddDropdownOpen(false)
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setOpenActionMenuId(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Toggle task complete status
  const handleToggleComplete = async (taskId) => {
    const target = tasks.find(t => t._id === taskId)
    if (!target) return
    const nextStatus = target.status === 'Completed' ? 'In Progress' : 'Completed'
    
    setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, status: nextStatus, progress: nextStatus === 'Completed' ? 100 : 50 } : t)))
    
    if (target.isServer) {
      try { await updateTask(taskId, { status: nextStatus }) } catch {}
    }
    toast.success(nextStatus === 'Completed' ? 'Task marked as done 🎉' : 'Task reopened as active')
  }

  // Toggle star
  const handleToggleStar = (e, taskId) => {
    if (e) e.stopPropagation()
    const target = tasks.find(t => t._id === taskId)
    const nextStarred = target ? !target.starred : true
    setTasks(prev => prev.map(t => (t._id === taskId ? { ...t, starred: nextStarred } : t)))
    toast.info(nextStarred ? '⭐ Task added to Starred favorites!' : 'Removed from Starred')
  }

  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return
    const target = tasks.find(t => t._id === taskId)
    setTasks(prev => prev.filter(t => t._id !== taskId))
    if (selectedTaskId === taskId) {
      const remaining = tasks.filter(t => t._id !== taskId)
      setSelectedTaskId(remaining.length > 0 ? remaining[0]._id : null)
    }
    if (target?.isServer) {
      try { await deleteTask(taskId) } catch {}
    }
    toast.success('Task deleted successfully')
  }

  // Open Reminder Modal
  const handleOpenReminderModal = (e, task) => {
    if (e) e.stopPropagation()
    setReminderModalTask(task)
    setReminderDate(task.dueDate || new Date().toISOString().slice(0, 10))
    setReminderTime(task.dueTime || '09:00')
    setOpenActionMenuId(null)
  }

  // Save Reminder
  const handleSaveReminder = async () => {
    if (!reminderModalTask) return
    if (!reminderDate) return toast.error('Please select a reminder date')

    const reminderFormatted = `${formatShortDate(reminderDate)} 2026, ${formatTime12(reminderTime)}`
    
    setTasks(prev => prev.map(t => (t._id === reminderModalTask._id ? { ...t, reminder: reminderFormatted } : t)))
    
    if (reminderModalTask.isServer) {
      try {
        await updateTask(reminderModalTask._id, { reminder: reminderFormatted })
      } catch {}
    }
    
    toast.success(`🔔 Reminder scheduled for ${reminderFormatted}!`)
    setReminderModalTask(null)
  }

  // Toggle row selection
  const handleSelectRow = (e, taskId) => {
    e.stopPropagation()
    setSelectedRows(prev =>
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    )
  }

  // Select all rows
  const handleSelectAll = () => {
    if (selectedRows.length === filteredTasks.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredTasks.map(t => t._id))
    }
  }

  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedPriority, setSelectedPriority] = useState('All')

  // Filter tasks based on activeTab, searchQuery, category, and priority
  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'Starred' && !t.starred) return false
    if (activeTab === 'To Do' && t.status !== 'To Do') return false
    if (activeTab === 'In Progress' && t.status !== 'In Progress') return false
    if (activeTab === 'Completed' && t.status !== 'Completed') return false
    if (selectedCategory !== 'All' && t.category !== selectedCategory) return false
    if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    }
    return true
  }).sort((a, b) => {
    if (sortBy === 'Due Date') {
      const diff = a.dueDate.localeCompare(b.dueDate)
      return sortAsc ? diff : -diff
    }
    if (sortBy === 'Priority') {
      const pMap = { High: 3, Medium: 2, Low: 1 }
      const diff = (pMap[b.priority] || 0) - (pMap[a.priority] || 0)
      return sortAsc ? diff : -diff
    }
    return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
  })

  // Selected task object for the right details panel
  const selectedTask = tasks.find(t => t._id === selectedTaskId) || filteredTasks[0] || tasks[0]

  // Render Icon helper
  const renderTaskIcon = (type) => {
    switch (type) {
      case 'users': return <Users size={16} />
      case 'folder': return <Folder size={16} />
      case 'dumbbell': return <Dumbbell size={16} />
      case 'monitor': return <Monitor size={16} />
      case 'flag': return <Flag size={16} />
      case 'cart': return <ShoppingCart size={16} />
      default: return <FileText size={16} />
    }
  }

  // Format date helper: 2026-08-26 -> 26 Aug
  const formatShortDate = (dStr) => {
    if (!dStr) return '26 Aug'
    const parts = dStr.split('-')
    if (parts.length < 3) return dStr
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]}`
  }

  // Format 24h time to 12h: 11:00 -> 11:00 AM
  const formatTime12 = (tStr) => {
    if (!tStr) return '11:00 AM'
    if (tStr.includes('AM') || tStr.includes('PM')) return tStr
    const [h, m] = tStr.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${String(h12).padStart(2, '0')}:${m || '00'} ${ampm}`
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header & Controls */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight">
            Tasks
          </h1>
          <p className="text-sm font-medium text-[#5F6872] dark:text-[#89919A] mt-1">
            Organize your tasks. Focus on what matters.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* + Add Task Dropdown */}
          <div className="relative" ref={addDropdownRef}>
            <button
              onClick={() => setAddDropdownOpen(!addDropdownOpen)}
              className="bg-[#145A4A] hover:bg-[#0F4639] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add Task</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${addDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {addDropdownOpen && (
              <div className="absolute left-0 sm:right-0 mt-2 w-48 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                <button
                  onClick={() => { setAddDropdownOpen(false); setEditTaskId(null); setIsModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2 font-medium"
                >
                  <Plus size={15} className="text-[#145A4A]" />
                  <span>New Task</span>
                </button>
              </div>
            )}
          </div>

          {/* Filters button with toggle & active indicator badge */}
          <div className="relative">
            <button
              onClick={() => setFilterPanelOpen(!filterPanelOpen)}
              className={`px-4 py-2.5 rounded-xl border transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold ${
                filterPanelOpen || selectedCategory !== 'All' || selectedPriority !== 'All'
                  ? 'bg-[#145A4A] text-white border-[#0F4639]'
                  : 'border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-[#17202A] dark:text-white hover:bg-[#F1EFE9]'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {(selectedCategory !== 'All' || selectedPriority !== 'All') && (
                <span className="w-2 h-2 rounded-full bg-[#B78332]" />
              )}
            </button>

            {/* Filter Dropdown Popover */}
            {filterPanelOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in text-xs space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                  <span className="font-bold font-serif text-sm text-[#17202A] dark:text-white">Filter Tasks</span>
                  <button
                    onClick={() => {
                      setSelectedCategory('All')
                      setSelectedPriority('All')
                    }}
                    className="text-[#145A4A] text-[11px] font-semibold hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                {/* Filter By Category */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Work', 'Finance', 'Health', 'Personal', 'Design'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedCategory === cat
                            ? 'bg-[#145A4A] text-white font-bold shadow-sm'
                            : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-gray-300 hover:bg-[#F1EFE9]'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter By Priority */}
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'High', 'Medium', 'Low'].map((pri) => (
                      <button
                        key={pri}
                        onClick={() => setSelectedPriority(pri)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          selectedPriority === pri
                            ? 'bg-[#145A4A] text-white font-bold shadow-sm'
                            : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-gray-300 hover:bg-[#F1EFE9]'
                        }`}
                      >
                        {pri}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setFilterPanelOpen(false)}
                  className="w-full py-2 bg-[#F7F5F0] dark:bg-[#172638] hover:bg-[#F1EFE9] text-[#17202A] dark:text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>

          {/* Search with '/' shortcut */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89919A]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-xs font-medium text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] w-48 sm:w-60 transition-all shadow-sm"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#89919A] bg-[#F7F5F0] dark:bg-[#172638] px-1.5 py-0.5 rounded border border-[#DEDCD5] dark:border-[#1E2D40]">
              /
            </span>
          </div>

        </div>
      </header>

      {/* 2. Four Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Today */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF2E6] text-[#B78332] flex items-center justify-center flex-shrink-0">
            <Sun size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 block">Today</span>
            <span className="text-2xl font-bold font-serif text-[#17202A] dark:text-white leading-tight">12</span>
            <span className="text-[11px] text-[#5F6872] dark:text-gray-400 block mt-0.5">Tasks planned for today</span>
          </div>
        </div>

        {/* Card 2: Due Soon */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#F8EBEA] text-[#B65D52] flex items-center justify-center flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 block">Due Soon</span>
            <span className="text-2xl font-bold font-serif text-[#17202A] dark:text-white leading-tight">4</span>
            <span className="text-[11px] text-[#5F6872] dark:text-gray-400 block mt-0.5">Within next 3 days</span>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EEF3F8] text-[#61758A] flex items-center justify-center flex-shrink-0">
            <RotateCw size={22} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 block">In Progress</span>
            <span className="text-2xl font-bold font-serif text-[#17202A] dark:text-white leading-tight">3</span>
            <span className="text-[11px] text-[#5F6872] dark:text-gray-400 block mt-0.5">Keep it going</span>
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EBF3EF] text-[#4F8068] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 block">Completed</span>
            <span className="text-2xl font-bold font-serif text-[#17202A] dark:text-white leading-tight">8</span>
            <span className="text-[11px] text-[#4F8068] font-medium block mt-0.5">Well done!</span>
          </div>
        </div>

      </div>

      {/* 3. Main Workspace: Tasks Table (Left 8) + Task Details (Right 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Table Section (Span 8) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Table Container Card */}
          <div className="card p-0 overflow-hidden shadow-sm">
            
            {/* Filter Tabs & Sort Header */}
            <div className="px-6 py-3.5 border-b border-[#DEDCD5] dark:border-[#1E2D40] flex flex-wrap items-center justify-between gap-3">
              
              {/* Filter Tabs */}
              <div className="flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto">
                {['All', 'Starred', 'To Do', 'In Progress', 'Completed'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-1 transition-all whitespace-nowrap relative ${
                      activeTab === tab
                        ? 'text-[#145A4A] dark:text-[#4F8068] font-bold border-b-2 border-[#145A4A]'
                        : 'text-[#5F6872] hover:text-[#17202A] dark:text-gray-400'
                    }`}
                  >
                    {tab === 'Starred' ? '⭐ Starred' : tab}
                  </button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl px-3 py-1.5 pr-7 text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none cursor-pointer"
                  >
                    <option>Sort: Due Date</option>
                    <option>Sort: Priority</option>
                    <option>Sort: Title</option>
                  </select>
                  <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5F6872] pointer-events-none" />
                </div>

                <button
                  onClick={() => setSortAsc(!sortAsc)}
                  className="p-1.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872] hover:text-[#17202A] transition-colors"
                  title="Toggle sort direction"
                >
                  <ArrowUpDown size={14} />
                </button>
              </div>

            </div>

            {/* Task Rows List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-[11px] font-bold text-[#5F6872] uppercase tracking-wider bg-[#F7F5F0]/50 dark:bg-[#101C2B]/50 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                    <th className="py-3 px-4 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.length > 0 && selectedRows.length === filteredTasks.length}
                        onChange={handleSelectAll}
                        className="rounded accent-[#145A4A] cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 font-bold">Task</th>
                    <th className="py-3 px-3 font-bold">Due</th>
                    <th className="py-3 px-3 font-bold">Priority</th>
                    <th className="py-3 px-3 font-bold">Status</th>
                    <th className="py-3 px-3 font-bold">Time</th>
                    <th className="py-3 px-3 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DEDCD5]/80 dark:divide-[#1E2D40]/80">
                  {filteredTasks.map((task) => {
                    const isSelected = task._id === selectedTaskId
                    const isRowChecked = selectedRows.includes(task._id)

                    return (
                      <tr
                        key={task._id}
                        onClick={() => setSelectedTaskId(task._id)}
                        className={`transition-colors cursor-pointer select-none ${
                          isSelected
                            ? 'bg-[#E7F0EC]/60 dark:bg-[#145A4A]/20 relative'
                            : 'hover:bg-[#F1EFE9]/60 dark:hover:bg-[#172638]'
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isRowChecked}
                            onChange={(e) => handleSelectRow(e, task._id)}
                            className="rounded accent-[#145A4A] cursor-pointer"
                          />
                        </td>

                        {/* Task Icon + Title + Description */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${task.iconBg || 'bg-[#E7F0EC] text-[#145A4A]'}`}>
                              {renderTaskIcon(task.iconType)}
                            </div>
                            <div className="min-w-0 max-w-[240px]">
                              <p className={`font-bold text-xs truncate ${task.status === 'Completed' ? 'line-through text-[#89919A]' : 'text-[#17202A] dark:text-white'}`}>
                                {task.title}
                              </p>
                              <p className="text-[11px] text-[#5F6872] dark:text-[#89919A] truncate mt-0.5">
                                {task.description}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-[#17202A] dark:text-white font-semibold">
                            <CalIcon size={13} className="text-[#5F6872]" />
                            <span>{formatShortDate(task.dueDate)}</span>
                          </div>
                          <span className="text-[10px] text-[#5F6872] block ml-4">
                            {formatTime12(task.dueTime)}
                          </span>
                        </td>

                        {/* Priority Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            task.priority === 'High'
                              ? 'bg-[#F8EBEA] text-[#B65D52]'
                              : task.priority === 'Medium'
                              ? 'bg-[#FAF2E6] text-[#B78332]'
                              : 'bg-[#EBF3EF] text-[#4F8068]'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              task.priority === 'High' ? 'bg-[#B65D52]' : task.priority === 'Medium' ? 'bg-[#B78332]' : 'bg-[#4F8068]'
                            }`} />
                            <span>{task.priority}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold ${
                            task.status === 'Completed'
                              ? 'bg-[#EBF3EF] text-[#4F8068]'
                              : task.status === 'In Progress'
                              ? 'bg-[#FAF2E6] text-[#B78332]'
                              : 'bg-[#EEF3F8] text-[#61758A]'
                          }`}>
                            {task.status}
                          </span>
                        </td>

                        {/* Time Spent */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-[#5F6872]">
                          <div className="flex items-center gap-1.5">
                            <Clock size={13} />
                            <span className="font-semibold text-[#17202A] dark:text-white">{task.timeSpent || '1h'}</span>
                          </div>
                          <span className="text-[10px] text-[#5F6872] block ml-4">
                            / {task.timeEstimated || '2h'}
                          </span>
                        </td>

                        {/* Actions: Star + 3-Dots Action Menu */}
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2 relative">
                            <button
                              onClick={(e) => handleToggleStar(e, task._id)}
                              className={`p-1 transition-colors ${task.starred ? 'text-[#B78332] hover:text-[#9B6C24]' : 'text-gray-300 hover:text-gray-400'}`}
                              title={task.starred ? 'Starred (High Priority Favorite)' : 'Star task (Bookmark)'}
                            >
                              <Star size={15} fill={task.starred ? '#B78332' : 'none'} />
                            </button>

                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenuId(openActionMenuId === task._id ? null : task._id)
                                }}
                                className="p-1 text-[#5F6872] hover:text-[#17202A] dark:hover:text-white transition-colors rounded-lg hover:bg-[#F1EFE9] dark:hover:bg-[#172638]"
                                title="More actions"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {openActionMenuId === task._id && (
                                <div
                                  ref={actionMenuRef}
                                  onClick={(e) => e.stopPropagation()}
                                  className="absolute right-0 mt-1 w-44 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl py-1.5 z-40 animate-in fade-in text-left text-xs space-y-0.5"
                                >
                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      setEditTaskId(task._id)
                                      setIsModalOpen(true)
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2 font-medium"
                                  >
                                    <Edit3 size={14} className="text-[#145A4A]" />
                                    <span>Edit Task</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleToggleComplete(task._id)
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2 font-medium"
                                  >
                                    <CheckCircle2 size={14} className="text-[#4F8068]" />
                                    <span>{task.status === 'Completed' ? 'Mark Active' : 'Mark as Done'}</span>
                                  </button>

                                  <button
                                    onClick={(e) => handleOpenReminderModal(e, task)}
                                    className="w-full px-3.5 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2 font-medium"
                                  >
                                    <Bell size={14} className="text-[#B78332]" />
                                    <span>Set Reminder</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      setOpenActionMenuId(null)
                                      handleToggleStar(e, task._id)
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2 font-medium"
                                  >
                                    <Star size={14} className="text-[#B78332]" fill={task.starred ? '#B78332' : 'none'} />
                                    <span>{task.starred ? 'Unstar Task' : 'Star Task'}</span>
                                  </button>

                                  <div className="my-1 border-t border-[#DEDCD5] dark:border-[#1E2D40]" />

                                  <button
                                    onClick={() => {
                                      setOpenActionMenuId(null)
                                      handleDeleteTask(task._id)
                                    }}
                                    className="w-full px-3.5 py-2 hover:bg-[#F8EBEA] dark:hover:bg-[#1E2D40] text-[#B65D52] flex items-center gap-2 font-semibold"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete Task</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-6 py-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] flex flex-wrap items-center justify-between gap-3 text-xs text-[#5F6872]">
              <span>Showing 1 to {filteredTasks.length} of {tasks.length} tasks</span>

              <div className="flex items-center gap-1.5">
                <button className="p-1 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]">
                  <ChevronLeft size={14} />
                </button>
                <button className="w-7 h-7 rounded-lg bg-[#145A4A] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  1
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872] font-semibold text-xs flex items-center justify-center">
                  2
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872] font-semibold text-xs flex items-center justify-center">
                  3
                </button>
                <button className="w-7 h-7 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872] font-semibold text-xs flex items-center justify-center">
                  4
                </button>
                <button className="p-1 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]">
                  <ChevronRight size={14} />
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Show</span>
                <select className="bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-lg px-2 py-1 text-xs font-semibold">
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
              </div>
            </div>

          </div>

          {/* Bottom Timeline Strip Widget */}
          <div className="card p-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              
              {/* Left Mini Card */}
              <div className="flex items-center gap-3 w-full md:w-60 flex-shrink-0 border-b md:border-b-0 md:border-r border-[#DEDCD5] dark:border-[#1E2D40] pb-3 md:pb-0 md:pr-4">
                <div className="w-8 h-8 rounded-xl bg-[#E7F0EC] text-[#145A4A] flex items-center justify-center flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[#17202A] dark:text-white truncate">
                    {selectedTask?.title || 'Prepare Monthly Report'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#5F6872] mt-0.5">
                    <span>{selectedTask?.timeSpent || '1h 30m'} / {selectedTask?.timeEstimated || '3h'}</span>
                    <span className="font-bold text-[#145A4A]">{selectedTask?.progress || 50}%</span>
                  </div>
                </div>
              </div>

              {/* Right Horizontal Hours Strip */}
              <div className="flex-1 w-full overflow-x-auto">
                <div className="min-w-[500px] relative pt-6 pb-2">
                  
                  {/* Hours Markers */}
                  <div className="flex justify-between text-[10px] font-semibold text-[#5F6872] border-b border-[#DEDCD5] dark:border-[#1E2D40] pb-1">
                    <span>9 AM</span>
                    <span>10 AM</span>
                    <span>11 AM</span>
                    <span>12 PM</span>
                    <span>1 PM</span>
                    <span>2 PM</span>
                    <span>3 PM</span>
                    <span>4 PM</span>
                    <span>5 PM</span>
                    <span>6 PM</span>
                  </div>

                  {/* Pin (10:30 AM) */}
                  <div className="absolute top-0 left-[18%] -translate-x-1/2 flex flex-col items-center">
                    <span className="bg-[#145A4A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      10:30 AM
                    </span>
                    <div className="w-[1px] h-12 bg-[#145A4A]" />
                  </div>

                  {/* Scheduled Task Blocks */}
                  <div className="mt-2 flex gap-2">
                    {/* Primary Forest green block */}
                    <div className="w-[28%] ml-[22%] bg-[#145A4A] text-white p-2 rounded-xl text-[10px] shadow-sm">
                      <p className="font-bold truncate">11:00 AM - 12:30 PM</p>
                      <p className="text-[#E7F0EC] text-[9px]">1h 30m planned</p>
                    </div>

                    {/* Slate / Info block */}
                    <div className="w-[20%] ml-[8%] bg-[#EEF3F8] text-[#61758A] p-2 rounded-xl text-[10px] border border-[#CAD8E6]">
                      <p className="font-bold truncate">Client Call</p>
                      <p className="text-[#61758A] text-[9px]">1h</p>
                    </div>

                    {/* Amber block */}
                    <div className="w-[22%] ml-[4%] bg-[#FAF2E6] text-[#B78332] p-2 rounded-xl text-[10px] border border-[#EADCC8]">
                      <p className="font-bold truncate">Review & Approve</p>
                      <p className="text-[#B78332] text-[9px]">1h 30m</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Task Details Panel (Span 4) */}
        <div className="lg:col-span-4 card p-6 space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info('Back to list')}
                className="p-1 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-lg text-[#5F6872] transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="font-serif font-bold text-sm text-[#17202A] dark:text-white">
                Task Details
              </h3>
            </div>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="p-1 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-lg text-[#5F6872] transition-colors"
              title="Close panel"
            >
              <X size={16} />
            </button>
          </div>

          {selectedTask ? (
            <>
              {/* Title & Star */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold font-serif text-[#17202A] dark:text-white leading-snug break-words">
                    {selectedTask.title}
                  </h2>
                  <button
                    onClick={(e) => handleToggleStar(e, selectedTask._id)}
                    className="text-[#B78332] hover:text-[#9B6C24] mt-1"
                  >
                    <Star size={18} fill={selectedTask.starred ? '#B78332' : 'none'} />
                  </button>
                </div>

                {/* Status selector */}
                <div className="mt-2.5 relative inline-block">
                  <button
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    className="px-3 py-1 bg-[#FAF2E6] text-[#B78332] rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B78332]" />
                    <span>{selectedTask.status}</span>
                    <ChevronDown size={13} />
                  </button>

                  {statusMenuOpen && (
                    <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-lg py-1 z-30 text-xs">
                      {['To Do', 'In Progress', 'Completed'].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            setTasks(prev => prev.map(t => t._id === selectedTask._id ? { ...t, status: s } : t))
                            setStatusMenuOpen(false)
                            toast.success(`Status updated to ${s}`)
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white font-medium"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[#5F6872] dark:text-[#89919A] mt-3 leading-relaxed break-words">
                  {selectedTask.description}
                </p>
              </div>

              {/* Section 1: Schedule */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#17202A] dark:text-white">
                  <div className="flex items-center gap-2">
                    <CalIcon size={14} className="text-[#5F6872]" />
                    <span>Schedule</span>
                  </div>
                  <button
                    onClick={() => { setEditTaskId(selectedTask._id); setIsModalOpen(true); }}
                    className="text-[11px] font-semibold text-[#145A4A] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span className="flex items-center gap-1.5">
                      <CalIcon size={13} /> Due Date
                    </span>
                    <span className="font-semibold text-[#17202A] dark:text-white">
                      {selectedTask.dueDate} {formatTime12(selectedTask.dueTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span className="flex items-center gap-1.5">
                      <Bell size={13} /> Reminder
                    </span>
                    <span className="font-semibold text-[#17202A] dark:text-white">
                      {selectedTask.reminder || '26 Aug 2026, 09:00 AM'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={13} /> Recurrence
                    </span>
                    <span className="font-semibold text-[#17202A] dark:text-white">
                      {selectedTask.recurrence || 'Does not repeat'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Task Details */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-[#17202A] dark:text-white">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#5F6872]" />
                    <span>Task</span>
                  </div>
                  <button
                    onClick={() => { setEditTaskId(selectedTask._id); setIsModalOpen(true); }}
                    className="text-[11px] font-semibold text-[#145A4A] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span>Priority</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-[#B65D52]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B65D52]" />
                      <span>{selectedTask.priority}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span>Category</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#EEF3F8] text-[#61758A] font-bold text-[11px]">
                      {selectedTask.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6872]">
                    <span>Status</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FAF2E6] text-[#B78332] font-bold text-[11px]">
                      {selectedTask.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Plan this task */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#17202A] dark:text-white">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#5F6872]" />
                    <span>Plan this task</span>
                  </div>
                  <button
                    onClick={() => { setEditTaskId(selectedTask._id); setIsModalOpen(true); }}
                    className="text-[11px] font-semibold text-[#145A4A] hover:underline"
                  >
                    Edit
                  </button>
                </div>

                {/* 4 Metrics Tiles */}
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#F7F5F0] dark:bg-[#172638]">
                    <span className="text-[10px] text-[#5F6872] block">Estimated</span>
                    <span className="text-xs font-bold text-[#17202A] dark:text-white block mt-0.5">
                      {selectedTask.timeEstimated || '3h 0m'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7F5F0] dark:bg-[#172638]">
                    <span className="text-[10px] text-[#5F6872] block">Scheduled</span>
                    <span className="text-[10px] font-bold text-[#17202A] dark:text-white block mt-0.5 truncate">
                      {selectedTask.scheduledRange || '11:00 AM'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7F5F0] dark:bg-[#172638]">
                    <span className="text-[10px] text-[#5F6872] block">Logged</span>
                    <span className="text-xs font-bold text-[#17202A] dark:text-white block mt-0.5">
                      {selectedTask.loggedTime || '1h 25m'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-[#F7F5F0] dark:bg-[#172638]">
                    <span className="text-[10px] text-[#5F6872] block">Remaining</span>
                    <span className="text-xs font-bold text-[#17202A] dark:text-white block mt-0.5">
                      {selectedTask.remainingTime || '1h 35m'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-[#F7F5F0] dark:bg-[#172638] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#145A4A] h-full rounded-full transition-all duration-300"
                      style={{ width: `${selectedTask.progress || 47}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-[#5F6872] block text-right">
                    {selectedTask.progress || 47}%
                  </span>
                </div>
              </div>

              {/* Section 4: Notes */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#17202A] dark:text-white">
                  <span>Notes</span>
                  <button
                    onClick={() => { setEditTaskId(selectedTask._id); setIsModalOpen(true); }}
                    className="text-[11px] font-semibold text-[#145A4A] hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="p-3 rounded-xl bg-[#FAF2E6] dark:bg-[#172638] border border-[#EADCC8] dark:border-[#1E2D40] text-xs text-[#5F6872] dark:text-gray-300 leading-relaxed">
                  {selectedTask.notes || 'Focus on sales and marketing metrics. Use last month\'s template.'}
                </div>
              </div>

              {/* Section 5: Action Buttons */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] space-y-2.5">
                <span className="text-xs font-bold text-[#17202A] dark:text-white block">Actions</span>
                
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                  <button
                    onClick={() => handleOpenReminderModal(null, selectedTask)}
                    className="p-2.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#17202A] dark:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Bell size={14} className="text-[#145A4A]" />
                    <span>Add Reminder</span>
                  </button>

                  <button
                    onClick={() => { setEditTaskId(selectedTask._id); setIsModalOpen(true); }}
                    className="p-2.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#17202A] dark:text-white flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Edit3 size={14} />
                    <span>Edit Task</span>
                  </button>

                  <button
                    onClick={() => handleToggleComplete(selectedTask._id)}
                    className="p-2.5 rounded-xl border border-[#C8DDD2] bg-[#EBF3EF] hover:bg-[#C8DDD2] text-[#4F8068] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    <span>{selectedTask.status === 'Completed' ? 'Mark Active' : 'Mark as Done'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteTask(selectedTask._id)}
                    className="p-2.5 rounded-xl border border-[#E8D0CE] bg-[#F8EBEA] hover:bg-[#E8D0CE] text-[#B65D52] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>Delete Task</span>
                  </button>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-between text-[10px] text-[#5F6872]">
                <div>
                  <span className="block">Created</span>
                  <span className="font-semibold text-[#17202A] dark:text-white">{selectedTask.createdAt || '24 Aug 2026, 09:15 AM'}</span>
                </div>
                <div className="text-right">
                  <span className="block">Last Updated</span>
                  <span className="font-semibold text-[#17202A] dark:text-white">{selectedTask.updatedAt || '26 Aug 2026, 09:30 AM'}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-[#5F6872]">
              Select a task from the list to view full details.
            </div>
          )}

        </div>

      </div>

      {/* Set Reminder Modal */}
      {reminderModalTask && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#101C2B]/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#101C2B] rounded-[28px] max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#DEDCD5] dark:border-[#1E2D40]">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#FAF2E6] text-[#B78332] flex items-center justify-center shadow-sm">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold font-serif text-[#17202A] dark:text-white">
                    Set Task Reminder
                  </h3>
                  <p className="text-xs text-[#5F6872] truncate max-w-[240px]">
                    {reminderModalTask.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setReminderModalTask(null)}
                className="p-1 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-full text-[#89919A] hover:text-[#17202A] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#17202A] dark:text-white mb-1.5">
                  Reminder Date
                </label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#17202A] dark:text-white mb-1.5">
                  Reminder Time
                </label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="w-full p-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
                />
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1.5">
                  Quick Presets
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Morning 9 AM', time: '09:00' },
                    { label: 'Afternoon 2 PM', time: '14:00' },
                    { label: 'Evening 6 PM', time: '18:00' }
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setReminderTime(p.time)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        reminderTime === p.time
                          ? 'bg-[#145A4A] text-white border-[#145A4A]'
                          : 'bg-[#F7F5F0] dark:bg-[#172638] border-[#DEDCD5] dark:border-[#1E2D40] text-[#17202A] dark:text-gray-300 hover:bg-[#F1EFE9]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setReminderModalTask(null)}
                  className="flex-1 py-2.5 px-4 bg-[#F1EFE9] dark:bg-[#172638] hover:bg-[#DEDCD5] text-[#17202A] dark:text-gray-200 font-semibold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReminder}
                  className="flex-1 py-2.5 px-4 bg-[#145A4A] hover:bg-[#0F4639] text-white font-semibold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Save Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskId={editTaskId}
        onSuccess={() => { fetchTasksData(); }}
      />

    </div>
  )
}
