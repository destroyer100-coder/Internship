import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import TaskModal from '../components/TaskModal'
import QuickNoteModal from '../components/QuickNoteModal'
import {
  Calendar as CalIcon, Bell, Sun, Moon, Plus, ChevronDown,
  ArrowRight, MoreVertical, Clock, Users, FileText, Coffee,
  Video, Dumbbell, Sparkles, Check, CheckCircle2, ChevronRight,
  ListTodo, AlertCircle, RotateCcw
} from 'lucide-react'
import { getTasks, getAnalytics, updateTask, deleteTask } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'

// Default schedule items matching the reference image
const DEFAULT_TIMELINE = []

// Default quick notes matching the reference image
const DEFAULT_NOTES = []

// Default upcoming reminders matching the reference image
const DEFAULT_REMINDERS = []

// Generate current week dynamically
const getWeekDays = () => {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  const today = new Date()
  const currentDayOfWeek = today.getDay() // 0 (Sun) to 6 (Sat)
  
  // Calculate Monday of the current week (assuming Monday is start of week)
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek
  const monday = new Date(today)
  monday.setDate(today.getDate() + diffToMonday)

  const week = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const isToday = d.toDateString() === today.toDateString()
    
    week.push({
      day: days[d.getDay()],
      date: String(d.getDate()),
      tasks: '0 tasks', // We will update this dynamically later if needed
      active: isToday
    })
  }
  return week
}

const WEEK_DAYS = getWeekDays()

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Theme state
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('taskflow_dark') === 'true')

  // Modals & Popovers
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [planMenuOpenId, setPlanMenuOpenId] = useState(null)

  // Timeline & Notes state
  const [timelineItems, setTimelineItems] = useState(DEFAULT_TIMELINE)
  const [quickNotes, setQuickNotes] = useState(() => {
    const saved = localStorage.getItem('taskflow_all_notes')
    return saved ? JSON.parse(saved) : DEFAULT_NOTES
  })
  const [selectedDay, setSelectedDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase())

  // Stats State
  const [stats, setStats] = useState({
    tasksToday: 0,
    completedToday: 0,
    eventsToday: 0,
    nextEvent: '--:--',
    remindersCount: 0,
    remindersUpcoming: 0,
    overdueCount: 0,
  })

  const quickAddRef = useRef(null)
  const notifRef = useRef(null)

  // Handle Theme Toggle
  const toggleTheme = () => {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('taskflow_dark', next)
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  // Load Tasks and integrate with server
  useEffect(() => {
    getTasks({}).then(({ data }) => {
      if (data) {
        const todayStr = new Date().toLocaleDateString('en-CA')
        const todayTasks = data.filter(t => t.dueDate?.slice(0, 10) === todayStr)
        const overdue = data.filter(t => t.dueDate && t.dueDate < todayStr && t.status !== 'Completed').length
        const completed = todayTasks.filter(t => t.status === 'Completed').length
        const events = todayTasks.filter(t => t.category === 'Work' && t.title.toLowerCase().includes('meeting')).length

        // Compute notifications
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        const dueTasks = data.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < tomorrow)
                             .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        setNotifications(dueTasks.slice(0, 5))

        setStats(prev => ({
          ...prev,
          tasksToday: todayTasks.length,
          completedToday: completed,
          eventsToday: events,
          overdueCount: overdue
        }))

        if (todayTasks.length > 0) {
          const mapped = todayTasks.map((t, idx) => {
            const time = t.dueTime ? new Date('1970-01-01T' + t.dueTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : `0${9 + idx * 2}:00 AM`
            const isMeeting = t.category === 'Work' && t.title.toLowerCase().includes('meeting')
            return {
              id: t._id,
              time: time,
              dotColor: t.priority === 'High' ? 'bg-[#B65D52]' : t.priority === 'Medium' ? 'bg-[#B78332]' : 'bg-[#4F8068]',
              icon: isMeeting ? Users : t.category === 'Work' ? FileText : t.category === 'Health' ? Dumbbell : Coffee,
              title: t.title,
              location: t.description || (t.category === 'Work' ? 'Work' : ''),
              category: isMeeting ? 'Meeting' : t.category === 'Work' ? 'Task' : 'Personal',
              tagClass: isMeeting ? 'tag-meeting' : t.category === 'Work' ? 'tag-task' : 'tag-personal',
              completed: t.status === 'Completed',
              serverTask: t
            }
          })
          setTimelineItems(mapped)
        } else {
          setTimelineItems([])
        }
      }
    }).catch(() => {})
  }, [])

  const [undoNotesHistory, setUndoNotesHistory] = useState([])

  // Undo last note operation
  const handleUndoNote = () => {
    if (undoNotesHistory.length === 0) {
      toast.info('Nothing to undo')
      return
    }
    const previous = undoNotesHistory[undoNotesHistory.length - 1]
    setUndoNotesHistory(prev => prev.slice(0, -1))
    setQuickNotes(previous)
    localStorage.setItem('taskflow_all_notes', JSON.stringify(previous))
    toast.success('Undone successfully! ↩️')
  }

  // Save quick notes
  const handleSaveNote = (note) => {
    setUndoNotesHistory(prev => [...prev, quickNotes])
    const colorMap = {
      yellow: { bg: 'bg-[#FAF2E6] dark:bg-[#251D14]', border: 'border-[#EADCC8] dark:border-[#543E19]', quote: 'text-[#B78332]', tagText: 'text-[#B78332]' },
      green:  { bg: 'bg-[#EBF3EF] dark:bg-[#13241C]', border: 'border-[#C8DDD2] dark:border-[#1E4D30]', quote: 'text-[#4F8068]', tagText: 'text-[#4F8068]' },
      blue:   { bg: 'bg-[#EEF3F8] dark:bg-[#121E2C]', border: 'border-[#CAD8E6] dark:border-[#1A3A54]', quote: 'text-[#61758A]', tagText: 'text-[#61758A]' },
      purple: { bg: 'bg-[#F3EDF4] dark:bg-[#231A26]', border: 'border-[#D9CDDC] dark:border-[#4B3450]', quote: 'text-[#765C78]', tagText: 'text-[#765C78]' },
      peach:  { bg: 'bg-[#F8EBEA] dark:bg-[#2A1918]', border: 'border-[#E8D0CE] dark:border-[#5E2B27]', quote: 'text-[#B65D52]', tagText: 'text-[#B65D52]' },
    }
    const styling = colorMap[note.color] || colorMap.yellow
    let updated
    if (editingNote) {
      updated = quickNotes.map(n => n.id === note.id ? { ...n, ...note, ...styling } : n)
    } else {
      updated = [...quickNotes, { ...note, ...styling }]
    }
    setQuickNotes(updated)
    localStorage.setItem('taskflow_all_notes', JSON.stringify(updated))
    toast.success(editingNote ? 'Note updated' : 'Note created')
  }

  const handleDeleteNote = (id) => {
    setUndoNotesHistory(prev => [...prev, quickNotes])
    const updated = quickNotes.filter(n => n.id !== id)
    setQuickNotes(updated)
    localStorage.setItem('taskflow_all_notes', JSON.stringify(updated))
    toast.success(
      <div className="flex items-center justify-between gap-2">
        <span>Note deleted</span>
        <button onClick={handleUndoNote} className="font-bold underline text-[#145A4A] ml-2">Undo</button>
      </div>
    )
  }

  // Toggle item completion
  const handleToggleComplete = async (item) => {
    const nextCompleted = !item.completed
    setTimelineItems(prev => prev.map(it => it.id === item.id ? { ...it, completed: nextCompleted } : it))
    if (item.serverTask) {
      try {
        await updateTask(item.id, { status: nextCompleted ? 'Completed' : 'In Progress' })
      } catch {}
    }
    toast.success(nextCompleted ? 'Item marked complete' : 'Item marked in progress')
  }

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setQuickAddOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (!e.target.closest('.plan-menu-container')) setPlanMenuOpenId(null)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const firstName = user?.name ? user.name.split(' ')[0] : 'Vansh'

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header Greeting & Top Action Bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight flex items-center gap-2">
            Good Morning, {firstName}! <span>👋</span>
          </h1>
          <p className="text-sm font-medium text-[#5F6872] dark:text-gray-400 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          
          {/* Quick Add Dropdown */}
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="bg-[#145A4A] hover:bg-[#0F4639] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Quick Add</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${quickAddOpen ? 'rotate-180' : ''}`} />
            </button>

            {quickAddOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                <button
                  onClick={() => { setQuickAddOpen(false); setEditTaskId(null); setIsTaskModalOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <ListTodo size={16} className="text-[#145A4A]" />
                  <span>New Task</span>
                </button>
                <button
                  onClick={() => { setQuickAddOpen(false); setEditingNote(null); setIsNoteModalOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <FileText size={16} className="text-[#B78332]" />
                  <span>Quick Note</span>
                </button>
                <button
                  onClick={() => { setQuickAddOpen(false); setEditTaskId(null); setIsTaskModalOpen(true); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2.5 font-medium transition-colors"
                >
                  <CalIcon size={16} className="text-[#4F8068]" />
                  <span>Schedule Event</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-10 h-10 rounded-full border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] flex items-center justify-center text-[#5F6872] dark:text-[#89919A] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors relative shadow-sm"
              title="Notifications"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-[#B65D52] border-2 border-white dark:border-[#101C2B] rounded-full"></span>
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in">
                <div className="px-3 py-2 border-b border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-[#17202A] dark:text-white">Notifications</h4>
                  {notifications.length > 0 && (
                    <span className="text-[11px] bg-[#E7F0EC] text-[#145A4A] font-bold px-2 py-0.5 rounded-full">{notifications.length} New</span>
                  )}
                </div>
                <div className="py-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-[#5F6872] dark:text-[#89919A]">You have no new notifications.</p>
                    </div>
                  ) : (
                    notifications.map(task => {
                      const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                      return (
                        <div 
                          key={task._id} 
                          onClick={() => { setNotifOpen(false); navigate(`/tasks`); }}
                          className="px-3 py-3 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] cursor-pointer rounded-lg transition-colors flex flex-col gap-1"
                        >
                          <p className="text-sm font-medium text-[#17202A] dark:text-white line-clamp-1">{task.title}</p>
                          <div className="flex items-center gap-1.5">
                            <CalIcon size={12} className={isOverdue ? 'text-[#B65D52]' : 'text-[#B78332]'} />
                            <span className={`text-xs font-semibold ${isOverdue ? 'text-[#B65D52]' : 'text-[#B78332]'}`}>
                              {isOverdue ? 'Overdue' : 'Due Today'}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] flex items-center justify-center text-[#5F6872] dark:text-[#89919A] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors shadow-sm"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun size={18} className="text-[#B78332]" /> : <Sun size={18} className="text-[#5F6872]" />}
          </button>

        </div>
      </header>

      {/* 2. Top Metric Cards (Row of 4) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* Card 1: Tasks Today */}
        <div className="card flex items-center gap-4 py-5 hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-[#145A4A] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <CalIcon size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#17202A] dark:text-white leading-none block font-serif">
              {stats.tasksToday}
            </span>
            <p className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 mt-1">Tasks Today</p>
            <span className="text-xs font-semibold text-[#4F8068] dark:text-emerald-400 block mt-0.5">
              {stats.completedToday} Completed
            </span>
          </div>
        </div>

        {/* Card 2: Events Today */}
        <div className="card flex items-center gap-4 py-5 hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-[#4F8068] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <CalIcon size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#17202A] dark:text-white leading-none block font-serif">
              {stats.eventsToday}
            </span>
            <p className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 mt-1">Events Today</p>
            <span className="text-xs font-semibold text-[#4F8068] dark:text-emerald-400 block mt-0.5">
              Next: {stats.nextEvent}
            </span>
          </div>
        </div>

        {/* Card 3: Reminders */}
        <div className="card flex items-center gap-4 py-5 hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-[#B78332] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Bell size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#17202A] dark:text-white leading-none block font-serif">
              {stats.remindersCount}
            </span>
            <p className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 mt-1">Reminders</p>
            <span className="text-xs font-semibold text-[#B78332] dark:text-amber-400 block mt-0.5">
              {stats.remindersUpcoming} Upcoming
            </span>
          </div>
        </div>

        {/* Card 4: Overdue */}
        <div className="card flex items-center gap-4 py-5 hover:shadow-card-hover transition-all">
          <div className="w-12 h-12 rounded-full bg-[#61758A] text-white flex items-center justify-center flex-shrink-0 shadow-md">
            <Clock size={20} strokeWidth={2.2} />
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-[#17202A] dark:text-white leading-none block font-serif">
              {stats.overdueCount}
            </span>
            <p className="text-xs font-semibold text-[#5F6872] dark:text-gray-400 mt-1">Overdue</p>
            <span className="text-xs font-semibold text-[#B65D52] dark:text-rose-400 block mt-0.5">
              Needs attention
            </span>
          </div>
        </div>

      </section>

      {/* 3. Main Dashboard Grid (Left: Plan + Quick Notes, Right: Upcoming Week + Progress + Reminders) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Today's Plan Section */}
          <div className="card">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2.5">
                <CalIcon size={20} className="text-[#17202A] dark:text-white" />
                <h2 className="text-xl font-bold font-serif text-[#17202A] dark:text-white">
                  Today's Plan
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {/* Day selector dropdown */}
                <div className="relative">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] text-xs font-medium text-[#17202A] dark:text-white bg-white dark:bg-[#101C2B] hover:bg-[#F1EFE9]">
                    <span>Day</span>
                    <ChevronDown size={13} className="text-[#5F6872]" />
                  </button>
                </div>

                {/* View Full Day button */}
                <Link
                  to="/calendar"
                  className="flex items-center gap-1 text-xs font-medium text-[#17202A] dark:text-white hover:text-[#145A4A] dark:hover:text-emerald-300 transition-colors"
                >
                  <span>View Full Day</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Timeline List */}
            <div className="py-4 relative space-y-4">
              {timelineItems.map((item, index) => {
                const IconComponent = item.icon || FileText
                return (
                  <div key={item.id} className="flex items-center gap-4 group">
                    
                    {/* Time */}
                    <div className="w-20 text-xs font-medium text-[#5F6872] dark:text-gray-400 text-right flex-shrink-0">
                      {item.time}
                    </div>

                    {/* Timeline Line & Dot Indicator */}
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      {/* Vertical connector track */}
                      {index < timelineItems.length - 1 && (
                        <div className="absolute top-4 bottom-[-24px] w-[1.5px] bg-[#DEDCD5] dark:bg-[#1E2D40] z-0" />
                      )}
                      {/* Dot */}
                      <div className={`w-2.5 h-2.5 rounded-full ${item.dotColor} z-10 shadow-sm`} />
                    </div>

                    {/* Task Details Card Row */}
                    <div className="flex-1 flex items-center justify-between p-3 rounded-xl hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors border border-transparent hover:border-[#DEDCD5] dark:hover:border-[#1E2D40]">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#F1EFE9] dark:bg-[#172638] text-[#5F6872] dark:text-gray-300 flex items-center justify-center flex-shrink-0">
                          <IconComponent size={16} />
                        </div>
                        <div className="min-w-0">
                          <h4 className={`text-sm font-semibold truncate ${item.completed ? 'text-[#17202A] dark:text-white' : 'text-[#17202A] dark:text-white'}`}>
                            {item.title}
                          </h4>
                          {item.location && (
                            <p className="text-xs text-[#5F6872] dark:text-gray-400 truncate">
                              {item.location}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Tag Pill & Options */}
                      <div className="flex items-center gap-3 flex-shrink-0 relative plan-menu-container">
                        <span className={item.tagClass}>
                          {item.category}
                        </span>

                        <button
                          onClick={() => setPlanMenuOpenId(planMenuOpenId === item.id ? null : item.id)}
                          className="text-[#89919A] hover:text-[#17202A] dark:hover:text-white p-1 rounded transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu for Timeline Item */}
                        {planMenuOpenId === item.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in">
                            <button
                              onClick={() => { handleToggleComplete(item); setPlanMenuOpenId(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2"
                            >
                              <CheckCircle2 size={13} className="text-[#4F8068]" />
                              <span>{item.completed ? 'Mark Pending' : 'Mark Completed'}</span>
                            </button>
                            <button
                              onClick={() => { setEditTaskId(item.id); setIsTaskModalOpen(true); setPlanMenuOpenId(null); }}
                              className="w-full text-left px-3 py-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#17202A] dark:text-white flex items-center gap-2"
                            >
                              <FileText size={13} className="text-[#61758A]" />
                              <span>Edit Details</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                )
              })}
            </div>

            {/* Bottom Add New Button */}
            <div className="pt-2 text-center border-t border-[#DEDCD5]/60 dark:border-[#1E2D40]/60">
              <button
                onClick={() => { setEditTaskId(null); setIsTaskModalOpen(true); }}
                className="text-[#145A4A] hover:text-[#0F4639] text-sm font-semibold flex items-center gap-1.5 mx-auto py-2 px-4 rounded-xl hover:bg-[#E7F0EC] dark:hover:bg-[#145A4A]/20 transition-colors"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Add New</span>
              </button>
            </div>

          </div>

          {/* Quick Notes Section */}
          <div className="card" id="quick-notes">
            {/* Header with Undo Button */}
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2.5">
                <FileText size={19} className="text-[#17202A] dark:text-white" />
                <h2 className="text-xl font-bold font-serif text-[#17202A] dark:text-white">
                  Quick Notes
                </h2>
              </div>

              {undoNotesHistory.length > 0 && (
                <button
                  onClick={handleUndoNote}
                  className="px-3 py-1.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068] hover:bg-[#E7F0EC] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Undo last change (Ctrl+Z)"
                >
                  <RotateCcw size={13} />
                  <span>Undo</span>
                </button>
              )}
            </div>

            {/* Sticky Notes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3.5 pt-4">
              {quickNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => { setEditingNote(note); setIsNoteModalOpen(true); }}
                  className={`p-4 rounded-2xl border ${note.bg} ${note.border} flex flex-col justify-between min-h-[140px] shadow-sm relative group cursor-pointer hover:shadow-md transition-all hover:scale-[1.02]`}
                  title="Click to edit text, time, or color"
                >
                  <div className="flex items-start justify-between">
                    <span className={`${note.quote} text-xl font-serif leading-none select-none font-bold`}>“</span>
                    
                    {/* Delete Note */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                      className="opacity-0 group-hover:opacity-100 text-[#89919A] hover:text-[#B65D52] transition-opacity p-0.5"
                      title="Delete note"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-[#17202A] dark:text-white my-2 leading-relaxed line-clamp-3">
                    {note.text}
                  </p>

                  <span className={`text-[11px] font-semibold ${note.tagText} block mt-auto`}>
                    {note.timeLabel}
                  </span>
                </div>
              ))}

              {/* Add Note Card */}
              <button
                onClick={() => { setEditingNote(null); setIsNoteModalOpen(true); }}
                className="border-2 border-dashed border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#5F6872] hover:text-[#145A4A] dark:hover:text-emerald-300 transition-colors group cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full border border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Plus size={16} />
                </div>
                <span className="text-xs font-semibold">Add Note</span>
              </button>
            </div>

          </div>

        </div>

        {/* Right Column (Span 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Upcoming This Week */}
          <div className="card">
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <h3 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                Upcoming This Week
              </h3>
              <Link
                to="/calendar"
                className="text-xs font-semibold text-[#5F6872] hover:text-[#145A4A] dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>View Calendar</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Horizontal 7-day Strip */}
            <div className="grid grid-cols-7 gap-1.5 pt-4">
              {WEEK_DAYS.map((w) => {
                const isSelected = selectedDay === w.day
                return (
                  <button
                    key={w.day}
                    onClick={() => setSelectedDay(w.day)}
                    className={`py-3 px-1 rounded-xl text-center flex flex-col items-center justify-between transition-all ${
                      isSelected
                        ? 'bg-[#145A4A] text-white shadow-sm'
                        : 'bg-[#F7F5F0] dark:bg-[#101C2B] text-[#5F6872] dark:text-gray-400 hover:bg-[#F1EFE9]'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#E7F0EC]' : 'text-[#89919A]'}`}>
                      {w.day}
                    </span>
                    <span className={`text-sm font-bold font-serif my-1 ${isSelected ? 'text-white' : 'text-[#17202A] dark:text-white'}`}>
                      {w.date}
                    </span>
                    
                    {/* Tasks count & Dot indicator */}
                    <div className="flex flex-col items-center">
                      <span className={`text-[9px] font-medium leading-none ${isSelected ? 'text-white/90 font-semibold' : 'text-[#89919A]'}`}>
                        {w.tasks}
                      </span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#4F8068] mt-1 shadow-sm" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Today's Progress */}
          <div className="card">
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <h3 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                Today's Progress
              </h3>
              <div className="flex items-center gap-1 text-xs font-medium text-[#5F6872] cursor-pointer hover:text-[#17202A]">
                <span>This Day</span>
                <ChevronDown size={13} />
              </div>
            </div>

            {/* Circular Progress + Breakdown */}
            <div className="py-5 flex items-center justify-between gap-4">
              
              {/* Circular SVG Gauge */}
              <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Background Track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#DEDCD5"
                    strokeWidth="10"
                    fill="transparent"
                    className="dark:stroke-[#1E2D40]"
                  />
                  {/* Filled Arc (66% completion = 6/9) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="48"
                    stroke="#4F8068"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 48}
                    strokeDashoffset={2 * Math.PI * 48 * (1 - 6 / 9)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                {/* Center Content */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-bold font-serif text-[#17202A] dark:text-white leading-none">
                    {stats.completedToday}/{stats.tasksToday}
                  </span>
                  <span className="text-[11px] font-semibold text-[#5F6872] dark:text-gray-400 mt-1">
                    Completed
                  </span>
                </div>
              </div>

              {/* Stat breakdown list */}
              <div className="flex-1 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5F6872] dark:text-gray-400 font-medium">Planned Items</span>
                  <span className="font-bold text-[#17202A] dark:text-white text-sm">{stats.tasksToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5F6872] dark:text-gray-400 font-medium">Completed</span>
                  <span className="font-bold text-[#4F8068] dark:text-emerald-400 text-sm">{stats.completedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#5F6872] dark:text-gray-400 font-medium">Remaining</span>
                  <span className="font-bold text-[#B78332] dark:text-amber-400 text-sm">{stats.tasksToday - stats.completedToday}</span>
                </div>
              </div>

            </div>

            {/* Time Breakdown cards */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7F5F0] dark:bg-[#101C2B]">
                <Clock size={16} className="text-[#5F6872] flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#17202A] dark:text-white leading-tight">--</p>
                  <p className="text-[10px] text-[#5F6872] font-medium">Planned Time</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F7F5F0] dark:bg-[#101C2B]">
                <Clock size={16} className="text-[#5F6872] flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#17202A] dark:text-white leading-tight">--</p>
                  <p className="text-[10px] text-[#5F6872] font-medium">Remaining Time</p>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Upcoming Reminders */}
          <div className="card">
            <div className="flex items-center justify-between pb-4 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <h3 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                Upcoming Reminders
              </h3>
              <Link
                to="/tasks"
                className="text-xs font-semibold text-[#5F6872] hover:text-[#145A4A] dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Reminder Items */}
            <div className="py-3 space-y-3">
              {DEFAULT_REMINDERS.map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-[#F1EFE9] dark:hover:bg-[#101C2B] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${rem.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Bell size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#17202A] dark:text-white truncate">
                        {rem.title}
                      </p>
                      <p className="text-[11px] text-[#5F6872] dark:text-gray-400">
                        {rem.time}
                      </p>
                    </div>
                  </div>

                  <span className="tag-upcoming">
                    Upcoming
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskId={editTaskId}
        onSuccess={() => window.location.reload()}
      />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />

    </div>
  )
}
