import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import TaskModal from '../components/TaskModal'
import QuickNoteModal from '../components/QuickNoteModal'
import {
  ChevronLeft, ChevronRight, Plus, ChevronDown, SlidersHorizontal,
  Calendar as CalIcon, Users, FileText, Video, Dumbbell, Coffee,
  Edit3, ArrowRight, CheckCircle2, Clock, Check, AlertCircle, Tag
} from 'lucide-react'
import { getTasks, updateTask } from '../services/api'
import { toast } from 'react-toastify'

// Curated default task templates for visual completeness matching reference design
const DEFAULT_TASKS_DATA = []

// Day category colors
const CATEGORY_STYLES = {
  Meeting:  { bg: 'bg-[#EEF3F8] text-[#61758A]', dot: '#61758A', icon: Users },
  Task:     { bg: 'bg-[#EBF3EF] text-[#4F8068]', dot: '#4F8068', icon: FileText },
  Reminder: { bg: 'bg-[#F3EDF4] text-[#765C78]', dot: '#765C78', icon: Dumbbell },
  Personal: { bg: 'bg-[#FAF2E6] text-[#B78332]', dot: '#B78332', icon: Coffee },
  Work:     { bg: 'bg-[#E7F0EC] text-[#145A4A]', dot: '#145A4A', icon: FileText },
  Health:   { bg: 'bg-[#EBF3EF] text-[#4F8068]', dot: '#4F8068', icon: Dumbbell },
  Finance:  { bg: 'bg-[#FAF2E6] text-[#B78332]', dot: '#B78332', icon: FileText },
  Other:    { bg: 'bg-[#F1EFE9] text-[#5F6872]', dot: '#5F6872', icon: CalIcon },
}

export default function CalendarPage() {
  // Current view date (stores Year, Month, Day)
  const todayReal = new Date()
  const [currentDate, setCurrentDate] = useState(todayReal)
  const [selectedDateStr, setSelectedDateStr] = useState(todayReal.toLocaleDateString('en-CA'))
  const [viewMode, setViewMode] = useState('Month') // 'Month' | 'Week' | 'Day'
  const [allTasks, setAllTasks] = useState(DEFAULT_TASKS_DATA)

  // Modals & UI States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const quickAddRef = useRef(null)

  // Quick notes from localStorage
  const [quickNotes, setQuickNotes] = useState(() => {
    const saved = localStorage.getItem('taskflow_quick_notes')
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Call Rahul at 4 PM' },
      { id: '2', text: 'Bring documents tomorrow' },
      { id: '3', text: 'Ask HR about annual report' },
    ]
  })

  // Load server tasks and merge with demo tasks
  const fetchTasks = async () => {
    try {
      const { data } = await getTasks({})
      if (data && data.length > 0) {
        const mappedServerTasks = data.map(t => ({
          id: t._id,
          title: t.title,
          location: t.description || (t.category === 'Work' ? 'Work' : 'Personal'),
          date: t.dueDate ? t.dueDate.slice(0, 10) : '',
          time: t.dueTime ? new Date('1970-01-01T' + t.dueTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '09:00 AM',
          category: t.category === 'Work' ? (t.title.toLowerCase().includes('meeting') ? 'Meeting' : 'Task') : t.category === 'Health' ? 'Reminder' : 'Personal',
          priority: t.priority,
          completed: t.status === 'Completed',
          serverTask: t
        }))
        // Combine keeping uniques
        const combined = [...mappedServerTasks]
        DEFAULT_TASKS_DATA.forEach(d => {
          if (!combined.some(c => c.date === d.date && c.title === d.title)) {
            combined.push(d)
          }
        })
        setAllTasks(combined)
      }
    } catch {}
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target)) setQuickAddOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Date Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    } else if (viewMode === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'Month') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    } else if (viewMode === 'Week') {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))
    } else {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDateStr(today.toLocaleDateString('en-CA'))
  }

  // Header Title formatted dynamically
  const getHeaderTitle = () => {
    if (viewMode === 'Month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
    if (viewMode === 'Week') {
      const startOfWeek = new Date(currentDate)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  // Generate Month Grid Matrix (Monday to Sunday)
  const generateMonthMatrix = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const mondayShiftedIndex = (firstDayIndex + 6) % 7 // 0 = Mon, 6 = Sun

    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const cells = []

    // Previous month padding days
    for (let i = mondayShiftedIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i
      const prevDate = new Date(year, month - 1, dayNum)
      const dateStr = prevDate.toLocaleDateString('en-CA')
      const events = allTasks.filter(t => t.date === dateStr)
      cells.push({
        dayNum,
        isCurrentMonth: false,
        dateStr,
        events,
        moreCount: events.length > 2 ? events.length - 2 : 0
      })
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      const events = allTasks.filter(t => t.date === dateStr)
      cells.push({
        dayNum,
        isCurrentMonth: true,
        dateStr,
        events,
        moreCount: events.length > 2 ? events.length - 2 : 0
      })
    }

    // Next month padding days to fill 35 or 42 grid
    const totalCells = cells.length > 35 ? 42 : 35
    const remaining = totalCells - cells.length
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const nextDate = new Date(year, month + 1, dayNum)
      const dateStr = nextDate.toLocaleDateString('en-CA')
      const events = allTasks.filter(t => t.date === dateStr)
      cells.push({
        dayNum,
        isCurrentMonth: false,
        dateStr,
        events,
        moreCount: events.length > 2 ? events.length - 2 : 0
      })
    }

    return cells
  }

  // Get days for Week View (7 days)
  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      const dateStr = d.toLocaleDateString('en-CA')
      const events = allTasks.filter(t => t.date === dateStr)
      days.push({
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        dayNum: d.getDate(),
        dateStr,
        events
      })
    }
    return days
  }

  // Selected Day's tasks (for the Right Panel)
  const selectedDateTasks = allTasks.filter(t => t.date === selectedDateStr)

  // Selected Date nicely formatted for the header of the right side panel
  const getSelectedDateTitle = () => {
    const [y, m, d] = selectedDateStr.split('-').map(Number)
    const dateObj = new Date(y, m - 1, d)
    return dateObj.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Quick note add handler
  const handleSaveNote = (newNote) => {
    const updated = [...quickNotes, newNote]
    setQuickNotes(updated)
    localStorage.setItem('taskflow_quick_notes', JSON.stringify(updated))
    toast.success('Note added')
  }

  // Toggle item complete
  const handleToggleTask = async (task) => {
    const nextComp = !task.completed
    setAllTasks(prev => prev.map(t => (t.id === task.id ? { ...t, completed: nextComp } : t)))
    if (task.serverTask) {
      try {
        await updateTask(task.id, { status: nextComp ? 'Completed' : 'In Progress' })
      } catch {}
    }
    toast.success(nextComp ? 'Task completed' : 'Task marked active')
  }

  const monthMatrix = generateMonthMatrix()
  const weekDays = generateWeekDays()

  // Upcoming 7 days from selected date
  const upcomingList = allTasks
    .filter(t => t.date > selectedDateStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Top Header & Action Controls */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight">
            Calendar
          </h1>
          <p className="text-sm font-medium text-[#5F6872] dark:text-gray-400 mt-1">
            Plan your time. Stay on track.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* + Add New Dropdown */}
          <div className="relative" ref={quickAddRef}>
            <button
              onClick={() => setQuickAddOpen(!quickAddOpen)}
              className="bg-[#145A4A] hover:bg-[#0F4639] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Add New</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${quickAddOpen ? 'rotate-180' : ''}`} />
            </button>

            {quickAddOpen && (
              <div className="absolute left-0 sm:right-0 mt-2 w-48 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in">
                <button
                  onClick={() => { setQuickAddOpen(false); setEditTaskId(null); setIsTaskModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2 font-medium"
                >
                  <Plus size={15} className="text-[#145A4A]" />
                  <span>New Task</span>
                </button>
                <button
                  onClick={() => { setQuickAddOpen(false); setIsNoteModalOpen(true); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2 font-medium"
                >
                  <Edit3 size={15} className="text-[#B78332]" />
                  <span>Quick Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Today Button */}
          <button
            onClick={handleToday}
            className="px-4 py-2.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-xs font-semibold text-[#17202A] dark:text-white hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors shadow-sm"
          >
            Today
          </button>

          {/* Navigation Arrows */}
          <div className="flex items-center rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] overflow-hidden shadow-sm">
            <button
              onClick={handlePrev}
              className="p-2.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#5F6872] hover:text-[#17202A] transition-colors border-r border-[#DEDCD5] dark:border-[#1E2D40]"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-2.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#5F6872] hover:text-[#17202A] transition-colors"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* View Switcher Control */}
          <div className="flex items-center p-1 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] shadow-sm">
            {['Month', 'Week', 'Day'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === mode
                    ? 'border border-[#145A4A] text-[#145A4A] dark:text-[#4F8068] bg-[#E7F0EC] dark:bg-[#145A4A]/20'
                    : 'text-[#5F6872] hover:text-[#17202A] dark:text-gray-400'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Filter options */}
          <button
            onClick={() => toast.info('Filters: Showing all tasks and events')}
            className="p-2.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-[#5F6872] hover:text-[#17202A] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors shadow-sm"
            title="Filters"
          >
            <SlidersHorizontal size={16} />
          </button>

        </div>
      </header>

      {/* 2. Main Calendar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Span 8) - Interactive Calendar Views */}
        <div className="lg:col-span-8 card p-5 sm:p-6 space-y-4">
          
          {/* Header Title with Navigation Arrows */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-lg text-[#5F6872] hover:text-[#17202A] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <h2 className="text-xl font-bold font-serif text-[#17202A] dark:text-white">
              {getHeaderTitle()}
            </h2>
            <button
              onClick={handleNext}
              className="p-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-lg text-[#5F6872] hover:text-[#17202A] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* VIEW MODE 1: MONTH VIEW */}
          {viewMode === 'Month' && (
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {/* Weekday Column Headers */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-[#5F6872] dark:text-gray-400 uppercase tracking-wider py-2 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                <div>MON</div>
                <div>TUE</div>
                <div>WED</div>
                <div>THU</div>
                <div>FRI</div>
                <div>SAT</div>
                <div>SUN</div>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-2">
                {monthMatrix.map((cell, idx) => {
                  const isSelected = cell.dateStr === selectedDateStr
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDateStr(cell.dateStr)
                        const [y, m, d] = cell.dateStr.split('-').map(Number)
                        setCurrentDate(new Date(y, m - 1, d))
                      }}
                      className={`min-h-[105px] sm:min-h-[115px] p-2 rounded-2xl flex flex-col justify-between transition-all cursor-pointer select-none border ${
                        isSelected
                          ? 'border-2 border-[#145A4A] bg-[#E7F0EC] dark:bg-[#145A4A]/20 shadow-sm ring-1 ring-[#145A4A]'
                          : cell.isCurrentMonth
                          ? 'border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] hover:border-[#89919A]'
                          : 'border-transparent bg-[#F7F5F0]/60 dark:bg-[#0B131E]/60 text-[#89919A] opacity-60'
                      }`}
                    >
                      {/* Date Number Badge */}
                      <div className="flex items-center justify-center">
                        {isSelected ? (
                          <div className="w-7 h-7 rounded-full bg-[#145A4A] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                            {cell.dayNum}
                          </div>
                        ) : (
                          <span className={`text-xs font-bold ${cell.isCurrentMonth ? 'text-[#17202A] dark:text-white' : 'text-[#89919A]'}`}>
                            {cell.dayNum}
                          </span>
                        )}
                      </div>

                      {/* Events List for Day */}
                      <div className="space-y-1 my-1">
                        {cell.events.slice(0, 3).map((evt, eIdx) => {
                          const style = CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.Task
                          return (
                            <div
                              key={eIdx}
                              className={`text-[10px] font-semibold truncate rounded-md px-1.5 py-0.5 flex items-center gap-1 ${
                                isSelected
                                  ? 'text-[#17202A] dark:text-white bg-white/70 dark:bg-[#101C2B]/70'
                                  : style.bg
                              }`}
                            >
                              {evt.time && <span className="font-bold text-[9px] text-[#5F6872]">{evt.time.split(' ')[0]}</span>}
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: style.dot }} />
                              <span className="truncate">{evt.title}</span>
                            </div>
                          )
                        })}
                      </div>

                      {/* + X more label */}
                        {cell.moreCount > 0 && (
                          <div className="text-[10px] font-bold text-[#89919A] text-center mt-1">
                            +{cell.moreCount} more
                          </div>
                        )}
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          )}



          {/* VIEW MODE 2: WEEK VIEW */}
          {viewMode === 'Week' && (
            <div className="space-y-4 pt-2 overflow-x-auto">
              <div className="min-w-[600px]">
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((w, wIdx) => {
                  const isSelected = w.dateStr === selectedDateStr
                  return (
                    <div
                      key={wIdx}
                      onClick={() => setSelectedDateStr(w.dateStr)}
                      className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-2 border-[#145A4A] bg-[#E7F0EC] dark:bg-[#145A4A]/20'
                          : 'border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] hover:bg-[#F1EFE9]'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-[#5F6872] uppercase block">{w.dayName}</span>
                      <span className="text-lg font-bold font-serif my-1 block text-[#17202A] dark:text-white">{w.dayNum}</span>
                      <span className="text-[10px] font-semibold text-[#145A4A] block">{w.events.length} items</span>
                    </div>
                  )
                })}
              </div>

              {/* Weekly Hourly Agenda */}
              <div className="divide-y divide-[#DEDCD5] dark:divide-[#1E2D40] pt-2">
                {['09:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'].map((slot) => {
                  const slotTasks = allTasks.filter(t => t.date === selectedDateStr && t.time.includes(slot.split(':')[0]))
                  return (
                    <div key={slot} className="py-3 flex items-start gap-4">
                      <span className="w-20 text-xs font-semibold text-[#5F6872] pt-1">{slot}</span>
                      <div className="flex-1 space-y-2">
                        {slotTasks.length === 0 ? (
                          <span className="text-xs text-[#89919A] italic">No scheduled items</span>
                        ) : (
                          slotTasks.map(st => (
                            <div key={st.id} className="p-3 rounded-xl bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-[#17202A] dark:text-white">{st.title}</p>
                                <p className="text-[11px] text-[#5F6872]">{st.location || 'No location'}</p>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3EF] text-[#4F8068]">{st.category}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: DAY VIEW */}
          {viewMode === 'Day' && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F7F5F0] dark:bg-[#172638] flex items-center justify-between">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#17202A] dark:text-white">{getSelectedDateTitle()}</h3>
                  <p className="text-xs text-[#5F6872]">{selectedDateTasks.length} tasks and events planned for this day</p>
                </div>
                <button
                  onClick={() => { setEditTaskId(null); setIsTaskModalOpen(true); }}
                  className="btn-primary text-xs px-4 py-2"
                >
                  + Add Event
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {selectedDateTasks.length === 0 ? (
                  <div className="text-center py-12 text-[#89919A] text-sm">
                    No items scheduled for this day. Click "+ Add Event" to plan!
                  </div>
                ) : (
                  selectedDateTasks.map(t => (
                    <div key={t.id} className="p-4 rounded-2xl bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleTask(t)} className="text-[#89919A] hover:text-[#4F8068]">
                          {t.completed ? <CheckCircle2 size={18} className="text-[#4F8068]" /> : <div className="w-4 h-4 rounded-full border-2 border-[#89919A]" />}
                        </button>
                        <div>
                          <p className={`text-sm font-bold ${t.completed ? 'line-through text-[#89919A]' : 'text-[#17202A] dark:text-white'}`}>{t.title}</p>
                          <p className="text-xs text-[#5F6872] mt-0.5">{t.time} • {t.location || 'Online'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EBF3EF] text-[#4F8068]">{t.category}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Span 4) - Day Plan, Upcoming, Notes */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Selected Day Plan Card */}
          <div className="card">
            {/* Header with Complete Date Title */}
            <div className="flex items-start justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40] gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif font-bold text-base text-[#17202A] dark:text-white leading-snug break-words">
                  {getSelectedDateTitle()}
                </h3>
                <p className="text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mt-1">
                  TODAY'S PLAN
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F7F5F0] dark:bg-[#172638] flex items-center justify-center flex-shrink-0 text-[#5F6872]">
                <CalIcon size={16} />
              </div>
            </div>

            {/* Timeline Entries with Complete Titles */}
            <div className="py-4 space-y-3.5 relative">
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#5F6872] italic">
                  No plans scheduled for this day.
                </div>
              ) : (
                selectedDateTasks.map((plan, index) => {
                  const style = CATEGORY_STYLES[plan.category] || CATEGORY_STYLES.Task
                  const IconComp = style.icon || FileText
                  return (
                    <div key={plan.id} className="flex items-start gap-3">
                      {/* Time marker */}
                      <span className="w-16 text-[11px] font-semibold text-[#5F6872] text-right flex-shrink-0 pt-1">
                        {plan.time}
                      </span>

                      {/* Timeline Dot & Connector */}
                      <div className="relative flex flex-col items-center justify-center flex-shrink-0 pt-1.5">
                        <div className="w-2.5 h-2.5 rounded-full z-10 shadow-sm" style={{ backgroundColor: style.dot }} />
                        {index < selectedDateTasks.length - 1 && (
                          <div className="w-[1.5px] bg-[#DEDCD5] dark:bg-[#1E2D40] h-10 my-1" />
                        )}
                      </div>

                      {/* Task Content Card with Complete Text Wrapping */}
                      <div className="flex-1 min-w-0 p-2.5 rounded-xl hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors border border-transparent hover:border-[#DEDCD5] dark:hover:border-[#1E2D40]">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0 flex-1">
                            <div className="text-[#5F6872] dark:text-gray-400 mt-0.5 flex-shrink-0">
                              <IconComp size={15} />
                            </div>
                            <div className="min-w-0 flex-1">
                              {/* Complete Title */}
                              <h4 className="text-xs font-bold text-[#17202A] dark:text-white leading-snug break-words whitespace-normal">
                                {plan.title}
                              </h4>
                              {plan.location && (
                                <p className="text-[10px] font-medium text-[#5F6872] dark:text-gray-400 mt-0.5 break-words whitespace-normal">
                                  {plan.location}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Category Tag */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${style.bg}`}>
                            {plan.category}
                          </span>
                        </div>
                      </div>

                    </div>
                  )
                })
              )}
            </div>

            {/* Add Plan Button */}
            <div className="pt-2 text-center border-t border-[#DEDCD5]/60 dark:border-[#1E2D40]/60">
              <button
                onClick={() => { setEditTaskId(null); setIsTaskModalOpen(true); }}
                className="text-[#145A4A] hover:text-[#0F4639] text-xs font-semibold flex items-center gap-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-[#E7F0EC] dark:hover:bg-[#145A4A]/20 transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add Plan</span>
              </button>
            </div>
          </div>

          {/* 2. UPCOMING (Next 7 Days) */}
          <div className="card">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#17202A] dark:text-white">
                Upcoming (Next 7 Days)
              </h4>
              <button
                onClick={() => setViewMode('Week')}
                className="text-[11px] font-semibold text-[#5F6872] hover:text-[#145A4A]"
              >
                View Calendar
              </button>
            </div>

            <div className="py-3 space-y-3">
              {upcomingList.length === 0 ? (
                <p className="text-xs text-[#5F6872] italic text-center py-2">No upcoming items in next 7 days</p>
              ) : (
                upcomingList.map((up) => {
                  const style = CATEGORY_STYLES[up.category] || CATEGORY_STYLES.Task
                  return (
                    <div
                      key={up.id}
                      onClick={() => {
                        setSelectedDateStr(up.date)
                        const [y, m, d] = up.date.split('-').map(Number)
                        setCurrentDate(new Date(y, m - 1, d))
                      }}
                      className="flex items-center justify-between text-xs py-1 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] p-1.5 rounded-lg cursor-pointer transition-colors"
                    >
                      <div>
                        <span className="font-bold text-[#17202A] dark:text-white block">{up.date}</span>
                        <span className="text-[11px] text-[#5F6872]">{up.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: style.dot }} />
                        <span className="font-semibold text-[#17202A] dark:text-white text-xs">{up.title}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 text-center border-t border-[#DEDCD5]/60 dark:border-[#1E2D40]/60">
              <Link
                to="/tasks"
                className="text-xs font-semibold text-[#145A4A] hover:underline inline-flex items-center gap-1"
              >
                <span>View all upcoming</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* 3. Quick Notes Widget */}
          <div className="card">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#17202A] dark:text-white">
                Quick Notes
              </h4>
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-[#5F6872] hover:text-[#17202A] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors"
                title="Add Note"
              >
                <Plus size={15} />
              </button>
            </div>

            <ul className="py-3 space-y-2 text-xs text-[#17202A] dark:text-gray-300 list-disc list-inside">
              {quickNotes.slice(0, 4).map((n) => (
                <li key={n.id} className="break-words">
                  {n.text}
                </li>
              ))}
            </ul>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setIsNoteModalOpen(true)}
                className="text-[#145A4A] hover:text-[#0F4639] p-1"
                title="Quick note editor"
              >
                <Edit3 size={15} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        taskId={editTaskId}
        onSuccess={() => { fetchTasks(); }}
      />

      {/* Quick Note Modal */}
      <QuickNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
      />

    </div>
  )
}
