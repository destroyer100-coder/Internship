import { useState, useEffect, useRef } from 'react'
import {
  Plus, Search, Filter, LayoutGrid, List, ChevronDown, ChevronLeft, ChevronRight,
  ArrowUpDown, Bookmark, Pin, Calendar as CalIcon, CheckSquare, Image as ImageIcon,
  Tag, Bell, Star, MoreHorizontal, Lock, CheckCircle2, Lightbulb, Users, Dumbbell,
  BookOpen, Phone, FileText, ShoppingCart, Cake, Plane, ArrowRight, Sparkles, Check,
  X, Edit3, Trash2, Copy, Clock, CalendarDays, RotateCcw, Paperclip, Download, ExternalLink, File
} from 'lucide-react'
import { toast } from 'react-toastify'
import TaskModal from '../components/TaskModal'

// Pre-populated rich notes matching the reference image
const INITIAL_NOTES = []

// Reminders list matching right panel
const INITIAL_REMINDERS = []

const renderReminderIcon = (iconType) => {
  switch (iconType) {
    case 'phone': return <Phone size={15} />
    case 'file': return <FileText size={15} />
    case 'dumbbell': return <Dumbbell size={15} />
    case 'cart': return <ShoppingCart size={15} />
    case 'users': return <Users size={15} />
    case 'cake': return <Cake size={15} />
    case 'plane': return <Plane size={15} />
    default: return <Bell size={15} />
  }
}

export default function NotesReminders() {
  const [activeTab, setActiveTab] = useState('Quick Notes') // 'Quick Notes' | 'Reminders'
  const [notes, setNotes] = useState(INITIAL_NOTES)
  const [reminders, setReminders] = useState(INITIAL_REMINDERS)
  const [reminderFilter, setReminderFilter] = useState('All') // 'All' | 'Today' | 'Tomorrow' | 'This Week'
  const [layoutMode, setLayoutMode] = useState('grid') // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('Updated') // 'Updated' | 'Title' | 'Pinned'
  const [sortAsc, setSortAsc] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 8

  // Composer State
  const [inputText, setInputText] = useState('')
  const [inputTitle, setInputTitle] = useState('')
  const [inputTag, setInputTag] = useState('Work')
  const [isChecklistMode, setIsChecklistMode] = useState(false)
  const [checklistItems, setChecklistItems] = useState([''])
  const [reminderTime, setReminderTime] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [attachedImage, setAttachedImage] = useState(null)
  const [attachedFile, setAttachedFile] = useState(null)
  const [previewLightboxImage, setPreviewLightboxImage] = useState(null)
  const [previewDocModal, setPreviewDocModal] = useState(null)
  const fileInputRef = useRef(null)
  
  // Custom Datetime in Popovers
  const [customDateVal, setCustomDateVal] = useState(new Date().toISOString().slice(0, 10))
  const [customTimeVal, setCustomTimeVal] = useState('17:00')
  const [customTagInput, setCustomTagInput] = useState('')
  
  // Popovers & Dropdowns
  const [showTagMenu, setShowTagMenu] = useState(false)
  const [showReminderMenu, setShowReminderMenu] = useState(false)
  const [showDateMenu, setShowDateMenu] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [selectedTagFilter, setSelectedTagFilter] = useState('All')
  const [activeMenuNoteId, setActiveMenuNoteId] = useState(null)

  // Edit / View Modal State
  const [editingNote, setEditingNote] = useState(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [taskModalInitialData, setTaskModalInitialData] = useState(null)
  const [isAddReminderModalOpen, setIsAddReminderModalOpen] = useState(false)
  const [newReminderTitle, setNewReminderTitle] = useState('')
  const [newReminderDate, setNewReminderDate] = useState(new Date().toISOString().slice(0, 10))
  const [newReminderTimeOnly, setNewReminderTimeOnly] = useState('17:00')
  const [newReminderCategory, setNewReminderCategory] = useState('Work')

  const [undoStack, setUndoStack] = useState([])

  // Universal File & Image Upload Handler (PDF, DOC, Images, etc.)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isImg = file.type.startsWith('image/')
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const isDoc = file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx') || file.type.includes('word') || file.type.includes('document')
    const isSheet = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
    const ext = file.name.split('.').pop().toUpperCase()
    const sizeFormatted = file.size > 1024 * 1024 
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : Math.max(1, Math.round(file.size / 1024)) + ' KB'

    const reader = new FileReader()
    reader.onload = (event) => {
      const fileObj = {
        name: file.name,
        type: file.type,
        size: sizeFormatted,
        url: event.target.result,
        isImage: isImg,
        isPdf,
        isDoc,
        isSheet,
        ext
      }
      setAttachedFile(fileObj)
      if (isImg) {
        setAttachedImage(event.target.result)
        toast.success(`Image "${file.name}" attached 🖼️`)
      } else if (isPdf) {
        toast.success(`PDF "${file.name}" attached 📄`)
      } else {
        toast.success(`Document "${file.name}" attached 📎`)
      }
    }
    reader.readAsDataURL(file)
  }

  // Load from localStorage if present
  useEffect(() => {
    const savedNotes = localStorage.getItem('taskflow_all_notes')
    if (savedNotes) {
      try { setNotes(JSON.parse(savedNotes)) } catch {}
    }
    const savedReminders = localStorage.getItem('taskflow_all_reminders')
    if (savedReminders) {
      try {
        const parsed = JSON.parse(savedReminders)
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map(r => ({
            ...r,
            iconType: typeof r.iconType === 'string' ? r.iconType : 'bell'
          }))
          setReminders(sanitized)
        }
      } catch {}
    }
  }, [])

  // Global Ctrl+Z Undo shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault()
          handleUndo()
        }
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [undoStack, notes])

  const saveNotesToStorage = (updated, pushUndo = true) => {
    if (pushUndo) {
      setUndoStack(prev => [...prev, notes])
    }
    setNotes(updated)
    localStorage.setItem('taskflow_all_notes', JSON.stringify(updated))
  }

  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info('Nothing to undo')
      return
    }
    const previous = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setNotes(previous)
    localStorage.setItem('taskflow_all_notes', JSON.stringify(previous))
    toast.success('Undone successfully! ↩️')
  }

  const saveRemindersToStorage = (updated) => {
    setReminders(updated)
    localStorage.setItem('taskflow_all_reminders', JSON.stringify(updated))
  }

  // Format 24h to 12h: "17:00" -> "05:00 PM"
  const formatTimeHelper = (timeStr) => {
    if (!timeStr) return '05:00 PM'
    if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr
    const [h, m] = timeStr.split(':')
    const hr = parseInt(h, 10)
    const ampm = hr >= 12 ? 'PM' : 'AM'
    const hr12 = hr % 12 || 12
    return `${String(hr12).padStart(2, '0')}:${m || '00'} ${ampm}`
  }

  // Format YYYY-MM-DD to "26 Aug"
  const formatDateHelper = (dStr) => {
    if (!dStr) return 'Today'
    const todayStr = new Date().toISOString().slice(0, 10)
    if (dStr === todayStr) return 'Today'
    const parts = dStr.split('-')
    if (parts.length < 3) return dStr
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${parseInt(parts[2], 10)} ${months[parseInt(parts[1], 10) - 1]}`
  }

  // Create note from composer
  const handleCreateQuickNote = () => {
    if (!inputText.trim() && !inputTitle.trim() && !attachedImage && !attachedFile && (!isChecklistMode || checklistItems.every(i => !i.trim()))) {
      toast.info('Please write something or attach a file.')
      return
    }

    const tagColors = {
      Work: 'bg-[#E7F0EC] text-[#145A4A]',
      Personal: 'bg-[#EBF3EF] text-[#4F8068]',
      Health: 'bg-[#EEF3F8] text-[#61758A]',
      Reading: 'bg-[#FAF2E6] text-[#B78332]',
      Ideas: 'bg-[#F3EDF4] text-[#765C78]',
      Private: 'bg-[#F1EFE9] text-[#5F6872]',
      Design: 'bg-[#EEF3F8] text-[#61758A]',
      Finance: 'bg-[#FAF2E6] text-[#B78332]'
    }

    const validChecklist = isChecklistMode
      ? checklistItems.filter(i => i.trim()).map(text => ({ text, done: false }))
      : null

    const newNote = {
      id: 'note-' + Date.now(),
      title: inputTitle.trim() || (isChecklistMode ? 'Checklist' : (attachedFile ? attachedFile.name : 'Quick Note')),
      content: isChecklistMode ? '' : inputText.trim(),
      image: attachedImage || (attachedFile?.isImage ? attachedFile.url : null),
      file: attachedFile || null,
      isChecklist: isChecklistMode && validChecklist && validChecklist.length > 0,
      checklist: validChecklist,
      pinned: false,
      tag: inputTag,
      tagColor: tagColors[inputTag] || 'bg-[#FAF2E6] text-[#B78332]',
      dateStr: reminderTime || ('Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })),
      bg: 'bg-white dark:bg-[#101C2B] border-[#DEDCD5] dark:border-[#1E2D40]',
      textColor: 'text-[#17202A] dark:text-white',
      reminder: reminderTime || null,
      dueDate: dueDate || null
    }

    const updated = [newNote, ...notes]
    saveNotesToStorage(updated)

    // Also add to reminders if a reminder was set
    if (reminderTime) {
      const newRem = {
        id: 'r-' + Date.now(),
        title: newNote.title,
        subtitle: 'Note • ' + newNote.tag,
        time: reminderTime,
        filterGroup: 'Today',
        badge: 'Upcoming',
        badgeBg: 'bg-[#FAF2E6] text-[#B78332]',
        iconType: 'bell',
        iconBg: 'bg-[#FAF2E6] text-[#B78332]',
        starred: false,
        done: false
      }
      saveRemindersToStorage([newRem, ...reminders])
    }

    setInputText('')
    setInputTitle('')
    setAttachedImage(null)
    setAttachedFile(null)
    setChecklistItems([''])
    setIsChecklistMode(false)
    setReminderTime('')
    setDueDate('')
    toast.success('Note saved successfully!')
  }

  // Keyboard shortcut Ctrl+Enter to save
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleCreateQuickNote()
    }
  }

  // Toggle checklist item
  const handleToggleChecklist = (noteId, itemIdx) => {
    const updated = notes.map(n => {
      if (n.id === noteId && n.checklist) {
        const nextList = [...n.checklist]
        nextList[itemIdx] = { ...nextList[itemIdx], done: !nextList[itemIdx].done }
        return { ...n, checklist: nextList }
      }
      return n
    })
    saveNotesToStorage(updated)
  }

  // Toggle pin
  const handleTogglePin = (noteId, e) => {
    if (e) e.stopPropagation()
    const updated = notes.map(n => n.id === noteId ? { ...n, pinned: !n.pinned } : n)
    saveNotesToStorage(updated)
    toast.success('Pin updated')
  }

  // Delete note with undo toast
  const handleDeleteNote = (noteId, e) => {
    if (e) e.stopPropagation()
    const updated = notes.filter(n => n.id !== noteId)
    saveNotesToStorage(updated)
    if (editingNote && editingNote.id === noteId) setEditingNote(null)
    toast.success(
      <div className="flex items-center justify-between gap-2">
        <span>Note deleted</span>
        <button onClick={handleUndo} className="font-bold underline text-[#145A4A] ml-2">Undo</button>
      </div>
    )
  }

  // Duplicate note
  const handleDuplicateNote = (note, e) => {
    if (e) e.stopPropagation()
    const duplicated = {
      ...note,
      id: 'note-' + Date.now(),
      title: `${note.title} (Copy)`,
      dateStr: 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    }
    saveNotesToStorage([duplicated, ...notes])
    toast.success('Note duplicated')
  }

  // Convert note to task
  const handleConvertToTask = (note, e) => {
    if (e) e.stopPropagation()
    setTaskModalInitialData({
      title: note.title,
      description: note.content || (note.items ? note.items.join(', ') : ''),
      category: note.tag === 'Health' ? 'Health' : note.tag === 'Personal' ? 'Personal' : 'Work'
    })
    setIsTaskModalOpen(true)
  }

  // Toggle reminder star
  const handleToggleReminderStar = (rId, e) => {
    if (e) e.stopPropagation()
    const updated = reminders.map(r => r.id === rId ? { ...r, starred: !r.starred } : r)
    saveRemindersToStorage(updated)
  }

  // Toggle reminder done
  const handleToggleReminderDone = (rId, e) => {
    if (e) e.stopPropagation()
    const updated = reminders.map(r => r.id === rId ? { ...r, done: !r.done } : r)
    saveRemindersToStorage(updated)
    toast.success('Reminder updated')
  }

  // Add custom reminder
  const handleAddCustomReminder = () => {
    if (!newReminderTitle.trim()) {
      toast.info('Please enter reminder title.')
      return
    }
    const formatted = `${formatDateHelper(newReminderDate)}, ${formatTimeHelper(newReminderTimeOnly)}`
    const newRem = {
      id: 'r-' + Date.now(),
      title: newReminderTitle.trim(),
      subtitle: 'Custom Reminder • ' + newReminderCategory,
      time: formatted,
      filterGroup: formatted.includes('Tomorrow') ? 'Tomorrow' : formatted.includes('Today') ? 'Today' : 'This Week',
      badge: 'Upcoming',
      badgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
      iconType: 'bell',
      iconBg: 'bg-[#EBF3EF] text-[#4F8068]',
      starred: false,
      done: false
    }
    const updated = [newRem, ...reminders]
    saveRemindersToStorage(updated)
    setNewReminderTitle('')
    setIsAddReminderModalOpen(false)
    toast.success('Reminder added!')
  }

  // Filter & Sort Notes
  const filteredNotes = notes.filter(n => {
    if (selectedTagFilter !== 'All' && n.tag !== selectedTagFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      return (
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q)) ||
        (n.items && n.items.some(i => i.toLowerCase().includes(q))) ||
        (n.tag && n.tag.toLowerCase().includes(q))
      )
    }
    return true
  }).sort((a, b) => {
    // Pinned notes always top
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sortBy === 'Title') {
      return sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)
    }
    return 0 // default order (recently updated)
  })

  // Pagination calculation
  const totalPages = Math.ceil(filteredNotes.length / pageSize) || 1
  const paginatedNotes = filteredNotes.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Filter Reminders by pill
  const filteredReminders = reminders.filter(r => {
    if (reminderFilter === 'All') return true
    return r.filterGroup === reminderFilter
  })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen">
      
      {/* 1. Header & Controls */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight leading-tight">
            Notes & Reminders
          </h1>
          <p className="text-sm font-medium text-[#5F6872] dark:text-[#89919A] mt-1">
            Capture ideas. Set reminders. Never forget what matters.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* + New Note Button */}
          <button
            onClick={() => {
              setEditingNote({
                id: 'note-' + Date.now(),
                title: '',
                content: '',
                tag: 'Work',
                pinned: false,
                isChecklist: false,
                checklist: []
              })
            }}
            className="bg-[#145A4A] hover:bg-[#0F4639] text-white px-5 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Note</span>
          </button>

          {/* View Switcher (Grid / List) */}
          <div className="flex items-center p-1 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] shadow-sm">
            <button
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'grid' ? 'bg-[#F1EFE9] dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068]' : 'text-[#5F6872]'}`}
              title="Grid view"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${layoutMode === 'list' ? 'bg-[#F1EFE9] dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068]' : 'text-[#5F6872]'}`}
              title="List view"
            >
              <List size={16} />
            </button>
          </div>

          {/* Search with '/' shortcut */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89919A]" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-xs font-medium text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] w-48 sm:w-60 transition-all shadow-sm"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#89919A] bg-[#F7F5F0] dark:bg-[#172638] px-1.5 py-0.5 rounded border border-[#DEDCD5] dark:border-[#1E2D40]">
              /
            </span>
          </div>

          {/* Undo Button (if stack has history) */}
          {undoStack.length > 0 && (
            <button
              onClick={handleUndo}
              className="px-3.5 py-2.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-[#145A4A] dark:text-[#4F8068] hover:bg-[#E7F0EC] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Undo last change (Ctrl+Z)"
            >
              <RotateCcw size={14} />
              <span>Undo</span>
            </button>
          )}

          {/* Filters Button */}
          <div className="relative">
            <button
              onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
              className={`px-4 py-2.5 rounded-xl border transition-colors shadow-sm flex items-center gap-2 text-xs font-semibold ${
                filterDropdownOpen || selectedTagFilter !== 'All'
                  ? 'bg-[#145A4A] text-white border-[#0F4639]'
                  : 'border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] text-[#17202A] dark:text-white hover:bg-[#F1EFE9]'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {selectedTagFilter !== 'All' && <span className="w-2 h-2 rounded-full bg-[#B78332]" />}
            </button>

            {filterDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-xl p-3 z-50 animate-in fade-in space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                  <span className="font-bold font-serif text-sm text-[#17202A] dark:text-white">Filter by Tag</span>
                  <button
                    onClick={() => { setSelectedTagFilter('All'); setFilterDropdownOpen(false); }}
                    className="text-[#145A4A] text-[11px] font-semibold hover:underline"
                  >
                    Reset
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['All', 'Work', 'Personal', 'Health', 'Reading', 'Ideas', 'Private'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => { setSelectedTagFilter(tag); setFilterDropdownOpen(false); }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                        selectedTagFilter === tag ? 'bg-[#145A4A] text-white font-bold' : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-gray-300 hover:bg-[#F1EFE9]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. Top Tabs: Quick Notes | Reminders */}
      <div className="flex items-center gap-8 border-b border-[#DEDCD5] dark:border-[#1E2D40] text-sm font-semibold">
        <button
          onClick={() => setActiveTab('Quick Notes')}
          className={`pb-2.5 transition-all relative ${
            activeTab === 'Quick Notes'
              ? 'text-[#145A4A] dark:text-[#4F8068] font-bold border-b-2 border-[#145A4A]'
              : 'text-[#5F6872] hover:text-[#17202A] dark:text-gray-400'
          }`}
        >
          Quick Notes
        </button>
        <button
          onClick={() => setActiveTab('Reminders')}
          className={`pb-2.5 transition-all relative ${
            activeTab === 'Reminders'
              ? 'text-[#145A4A] dark:text-[#4F8068] font-bold border-b-2 border-[#145A4A]'
              : 'text-[#5F6872] hover:text-[#17202A] dark:text-gray-400'
          }`}
        >
          Reminders
        </button>
      </div>

      {/* 3. Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column (Span 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TAB 1: QUICK NOTES VIEW */}
          {activeTab === 'Quick Notes' && (
            <>
              {/* Quick Input Composer Card */}
              <div className="card p-5 bg-[#F7F5F0] dark:bg-[#172638] border-[#DEDCD5] dark:border-[#1E2D40] space-y-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FAF2E6] text-[#B78332] flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bookmark size={18} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      placeholder="Note title (optional)..."
                      value={inputTitle}
                      onChange={(e) => setInputTitle(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full bg-transparent font-serif font-bold text-sm text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none"
                    />

                    {/* Standard Textarea or Checklist Builder */}
                    {!isChecklistMode ? (
                      <textarea
                        placeholder="Write something down... Take a note, add a reminder, or turn it into a task."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        className="w-full bg-transparent text-xs text-[#17202A] dark:text-gray-300 placeholder-[#89919A] focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="space-y-1.5 py-1">
                        {checklistItems.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <CheckSquare size={14} className="text-[#145A4A]" />
                            <input
                              type="text"
                              placeholder={`List item ${idx + 1}...`}
                              value={item}
                              onChange={(e) => {
                                const next = [...checklistItems]
                                next[idx] = e.target.value
                                setChecklistItems(next)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  setChecklistItems([...checklistItems, ''])
                                }
                              }}
                              className="flex-1 bg-transparent text-xs text-[#17202A] dark:text-white focus:outline-none border-b border-[#DEDCD5] dark:border-[#1E2D40] py-0.5"
                            />
                            {checklistItems.length > 1 && (
                              <button
                                onClick={() => setChecklistItems(checklistItems.filter((_, i) => i !== idx))}
                                className="text-[#89919A] hover:text-[#B65D52]"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={() => setChecklistItems([...checklistItems, ''])}
                          className="text-[11px] font-bold text-[#145A4A] hover:underline pt-1 flex items-center gap-1"
                        >
                          <Plus size={12} /> Add item
                        </button>
                      </div>
                    )}

                    {/* File / Image / Document Preview if attached */}
                    {attachedFile && (
                      <div className="my-2">
                        {attachedFile.isImage ? (
                          <div className="relative inline-block group/prev">
                            <img
                              src={attachedFile.url}
                              alt="Attached preview"
                              onClick={() => setPreviewDocModal(attachedFile)}
                              className="w-32 h-24 object-cover rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                              title="Click to view full image"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAttachedFile(null)
                                setAttachedImage(null)
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#B65D52] text-white rounded-full flex items-center justify-center shadow hover:bg-[#9B4D43] z-10"
                              title="Remove image"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => setPreviewDocModal(attachedFile)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] shadow-sm cursor-pointer hover:border-[#145A4A] transition-all group/doc"
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${attachedFile.isPdf ? 'bg-[#F8EBEA] text-[#B65D52]' : attachedFile.isDoc ? 'bg-[#EEF3F8] text-[#61758A]' : 'bg-[#FAF2E6] text-[#B78332]'}`}>
                              {attachedFile.isPdf ? 'PDF' : attachedFile.isDoc ? 'DOC' : attachedFile.ext || 'FILE'}
                            </div>
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-xs text-[#17202A] dark:text-white truncate max-w-[160px]">{attachedFile.name}</p>
                              <p className="text-[10px] text-[#5F6872]">{attachedFile.size} • Click to open</p>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setAttachedFile(null)
                              }}
                              className="w-5 h-5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-[#B65D52] flex items-center justify-center"
                              title="Remove document"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Meta pills if attached */}
                    {(reminderTime || dueDate || inputTag !== 'Work') && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {inputTag && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF2E6] text-[#B78332] text-[10px] font-bold flex items-center gap-1">
                            🏷️ {inputTag}
                            <button onClick={() => setInputTag('Work')} className="hover:text-[#B65D52]">×</button>
                          </span>
                        )}
                        {reminderTime && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EBF3EF] text-[#4F8068] text-[10px] font-bold flex items-center gap-1">
                            🔔 {reminderTime}
                            <button onClick={() => setReminderTime('')} className="hover:text-[#B65D52]">×</button>
                          </span>
                        )}
                        {dueDate && (
                          <span className="px-2 py-0.5 rounded-md bg-[#EEF3F8] text-[#61758A] text-[10px] font-bold flex items-center gap-1">
                            📅 {dueDate}
                            <button onClick={() => setDueDate('')} className="hover:text-[#B65D52]">×</button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Composer Footer Controls */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] relative">
                  
                  {/* Action icon buttons with popovers */}
                  <div className="flex items-center gap-1 text-[#5F6872]">
                    
                    {/* 1. Reminder Button & Custom Time Popover */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowReminderMenu(!showReminderMenu); setShowTagMenu(false); setShowDateMenu(false); }}
                        className={`p-1.5 rounded-lg transition-colors ${reminderTime ? 'text-[#4F8068] bg-[#EBF3EF]' : 'hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A]'}`}
                        title="Set custom reminder time"
                      >
                        <Bell size={15} />
                      </button>
                      {showReminderMenu && (
                        <div className="absolute left-0 bottom-full mb-2 w-64 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between pb-1 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                            <span className="font-bold text-[11px] text-[#17202A] dark:text-white">🔔 Set Exact Reminder</span>
                            {reminderTime && (
                              <button onClick={() => { setReminderTime(''); setShowReminderMenu(false); }} className="text-[10px] text-[#B65D52] hover:underline">
                                Clear
                              </button>
                            )}
                          </div>

                          {/* Direct Custom Pickers */}
                          <div className="space-y-1.5">
                            <div>
                              <label className="text-[10px] text-[#5F6872] block mb-0.5 font-semibold">Date</label>
                              <input
                                type="date"
                                value={customDateVal}
                                onChange={(e) => setCustomDateVal(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-[#5F6872] block mb-0.5 font-semibold">Time</label>
                              <input
                                type="time"
                                value={customTimeVal}
                                onChange={(e) => setCustomTimeVal(e.target.value)}
                                className="w-full text-xs p-1.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white"
                              />
                            </div>
                            <button
                              onClick={() => {
                                const formatted = `${formatDateHelper(customDateVal)}, ${formatTimeHelper(customTimeVal)}`
                                setReminderTime(formatted)
                                setShowReminderMenu(false)
                                toast.success(`Reminder set for ${formatted}`)
                              }}
                              className="w-full py-1.5 bg-[#145A4A] text-white rounded-lg font-bold text-[11px] hover:bg-[#0F4639] transition-colors"
                            >
                              Apply Custom Time
                            </button>
                          </div>

                          {/* Quick Presets */}
                          <div className="pt-1.5 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
                            <span className="text-[10px] text-[#89919A] font-semibold block mb-1">Quick Presets</span>
                            <div className="grid grid-cols-2 gap-1">
                              {['Today, 05:00 PM', 'Tomorrow, 09:00 AM', 'Tonight, 08:00 PM', 'Next Mon, 10:00 AM'].map(t => (
                                <button
                                  key={t}
                                  onClick={() => { setReminderTime(t); setShowReminderMenu(false); toast.info(`Reminder set for ${t}`); }}
                                  className="text-left px-2 py-1 rounded bg-[#F7F5F0] dark:bg-[#172638] hover:bg-[#F1EFE9] text-[#17202A] dark:text-white text-[10px] font-medium truncate"
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Due Date Button & Custom Date Picker */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowDateMenu(!showDateMenu); setShowTagMenu(false); setShowReminderMenu(false); }}
                        className={`p-1.5 rounded-lg transition-colors ${dueDate ? 'text-[#61758A] bg-[#EEF3F8]' : 'hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A]'}`}
                        title="Set exact due date"
                      >
                        <CalIcon size={15} />
                      </button>
                      {showDateMenu && (
                        <div className="absolute left-0 bottom-full mb-2 w-60 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2.5 animate-in fade-in">
                          <div className="flex items-center justify-between pb-1 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                            <span className="font-bold text-[11px] text-[#17202A] dark:text-white">📅 Pick Due Date</span>
                            {dueDate && (
                              <button onClick={() => { setDueDate(''); setShowDateMenu(false); }} className="text-[10px] text-[#B65D52] hover:underline">
                                Clear
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <input
                              type="date"
                              value={customDateVal}
                              onChange={(e) => setCustomDateVal(e.target.value)}
                              className="w-full text-xs p-1.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white"
                            />
                            <button
                              onClick={() => {
                                const formatted = formatDateHelper(customDateVal)
                                setDueDate(formatted)
                                setShowDateMenu(false)
                                toast.success(`Due date set to ${formatted}`)
                              }}
                              className="w-full py-1.5 bg-[#61758A] text-white rounded-lg font-bold text-[11px] hover:bg-[#4E5E6F] transition-colors"
                            >
                              Apply Date
                            </button>
                          </div>

                          <div className="pt-1.5 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
                            <span className="text-[10px] text-[#89919A] font-semibold block mb-1">Quick Presets</span>
                            <div className="grid grid-cols-2 gap-1">
                              {['Today', 'Tomorrow', 'This Weekend', 'Next Week'].map(d => (
                                <button
                                  key={d}
                                  onClick={() => { setDueDate(d); setShowDateMenu(false); toast.info(`Due date set to ${d}`); }}
                                  className="text-left px-2 py-1 rounded bg-[#F7F5F0] dark:bg-[#172638] hover:bg-[#F1EFE9] text-[#17202A] dark:text-white text-[10px] font-medium"
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 3. Checklist Toggle */}
                    <button
                      onClick={() => setIsChecklistMode(!isChecklistMode)}
                      className={`p-1.5 rounded-lg transition-colors ${isChecklistMode ? 'text-[#145A4A] bg-[#E7F0EC] dark:bg-[#145A4A]/20' : 'hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A]'}`}
                      title="Toggle checklist mode"
                    >
                      <CheckSquare size={15} />
                    </button>

                    {/* 4. Document / PDF / File Attachment */}
                    <div className="relative flex items-center">
                      <label
                        htmlFor="composer-universal-file-input"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${attachedFile && !attachedFile.isImage ? 'text-[#145A4A] bg-[#E7F0EC]' : 'hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A]'}`}
                        title="Attach PDF, Word doc, or file"
                      >
                        <Paperclip size={15} />
                        <input
                          id="composer-universal-file-input"
                          type="file"
                          accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {/* 5. Image Attachment Shortcut */}
                    <div className="relative flex items-center">
                      <label
                        htmlFor="composer-image-file-input"
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-center ${attachedImage ? 'text-[#145A4A] bg-[#E7F0EC]' : 'hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A]'}`}
                        title="Attach image from computer"
                      >
                        <ImageIcon size={15} />
                        <input
                          id="composer-image-file-input"
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          onChange={handleFileUpload}
                        />
                      </label>
                    </div>

                    {/* 6. Tag Selector with Custom Tag Input */}
                    <div className="relative">
                      <button
                        onClick={() => { setShowTagMenu(!showTagMenu); setShowReminderMenu(false); setShowDateMenu(false); }}
                        className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#101C2B] hover:text-[#17202A] transition-colors flex items-center gap-1"
                        title="Select or add tag"
                      >
                        <Tag size={15} />
                        <span className="text-[10px] font-bold text-[#5F6872]">{inputTag}</span>
                      </button>
                      {showTagMenu && (
                        <div className="absolute left-0 bottom-full mb-2 w-48 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-2xl p-2.5 z-50 text-xs space-y-2 animate-in fade-in">
                          <span className="font-bold text-[11px] text-[#17202A] dark:text-white block px-1">Tags</span>
                          
                          {/* Predefined Tags */}
                          <div className="grid grid-cols-2 gap-1 max-h-36 overflow-y-auto">
                            {['Work', 'Personal', 'Health', 'Reading', 'Ideas', 'Private', 'Design', 'Finance'].map(t => (
                              <button
                                key={t}
                                onClick={() => { setInputTag(t); setShowTagMenu(false); }}
                                className={`text-left px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${inputTag === t ? 'bg-[#145A4A] text-white' : 'hover:bg-[#F7F5F0] dark:hover:bg-[#172638] text-[#17202A] dark:text-white'}`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          {/* Custom Tag Input */}
                          <div className="pt-1.5 border-t border-[#DEDCD5] dark:border-[#1E2D40] flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Custom tag..."
                              value={customTagInput}
                              onChange={(e) => setCustomTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && customTagInput.trim()) {
                                  setInputTag(customTagInput.trim())
                                  setCustomTagInput('')
                                  setShowTagMenu(false)
                                }
                              }}
                              className="flex-1 text-[11px] p-1 rounded border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                if (customTagInput.trim()) {
                                  setInputTag(customTagInput.trim())
                                  setCustomTagInput('')
                                  setShowTagMenu(false)
                                }
                              }}
                              className="px-2 py-1 bg-[#145A4A] text-white rounded text-[10px] font-bold"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Save Section */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#4F8068]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F8068]" />
                      <span>Auto save</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleCreateQuickNote}
                        className="bg-[#145A4A] hover:bg-[#0F4639] text-white px-4 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
                      >
                        <span>Save</span>
                      </button>
                      <span className="text-[10px] text-[#5F6872] hidden sm:inline-block">Ctrl + Enter</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* All Notes Section Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-serif font-bold text-[#17202A] dark:text-white">
                    All Notes
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872] text-xs font-bold border border-[#DEDCD5] dark:border-[#1E2D40]">
                    {filteredNotes.length}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#5F6872]">
                  <div className="flex items-center gap-1">
                    <span>Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent font-bold text-[#17202A] dark:text-white focus:outline-none cursor-pointer"
                    >
                      <option value="Updated">Updated</option>
                      <option value="Title">Title</option>
                      <option value="Pinned">Pinned</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="p-1 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]"
                    title="Toggle sort order"
                  >
                    <ArrowUpDown size={13} />
                  </button>
                  <button
                    onClick={() => setSelectedTagFilter(selectedTagFilter === 'Pinned' ? 'All' : 'Pinned')}
                    className={`p-1 rounded-lg border transition-colors ${selectedTagFilter === 'Pinned' ? 'bg-[#145A4A] text-white border-[#0F4639]' : 'border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]'}`}
                    title="Filter pinned"
                  >
                    <Bookmark size={13} />
                  </button>
                </div>
              </div>

              {/* Notes Grid / List */}
              <div className={layoutMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4' : 'space-y-3'}>
                {paginatedNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => setEditingNote(note)}
                    className={`p-5 rounded-2xl border transition-all hover:shadow-md cursor-pointer relative flex flex-col justify-between group ${note.bg}`}
                  >
                    {/* Card Header (PIN badge or tag) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        {note.pinned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B78332] tracking-wider uppercase bg-[#FAF2E6] dark:bg-[#FAF2E6]/20 px-2 py-0.5 rounded-full">
                            📌 PINNED
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${note.tagColor}`}>
                            {note.tag}
                          </span>
                        )}

                        {note.isLocked && <Lock size={13} className="text-[#5F6872]" />}
                        {!note.isLocked && (
                          <button
                            onClick={(e) => handleTogglePin(note.id, e)}
                            className="text-[#B78332] hover:text-[#9B6C24] p-1"
                            title={note.pinned ? 'Unpin note' : 'Pin note'}
                          >
                            <Pin size={14} className={note.pinned ? 'fill-current' : ''} />
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className={`font-serif font-bold text-base mb-1.5 ${note.textColor}`}>
                        {note.title}
                      </h3>

                      {/* Attached Image if present */}
                      {note.image && (
                        <div
                          className="my-2.5 rounded-xl overflow-hidden border border-black/10 shadow-sm max-h-48 cursor-pointer relative group/img"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewLightboxImage(note.image)
                          }}
                          title="Click to view full image"
                        >
                          <img src={note.image} alt={note.title} className="w-full h-full object-cover transition-transform group-hover/img:scale-105" />
                          <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold backdrop-blur-[1px]">
                            🔍 View Full Image
                          </div>
                        </div>
                      )}

                      {/* Attached Document (PDF, DOC, Sheet) if present */}
                      {note.file && !note.file.isImage && (
                        <div
                          className="my-2.5 p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 transition-all flex items-center justify-between gap-2 cursor-pointer group/doccard shadow-sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewDocModal(note.file)
                          }}
                          title="Click to open/view document"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${note.file.isPdf ? 'bg-[#F8EBEA] text-[#B65D52]' : note.file.isDoc ? 'bg-[#EEF3F8] text-[#61758A]' : 'bg-[#FAF2E6] text-[#B78332]'}`}>
                              {note.file.isPdf ? 'PDF' : note.file.isDoc ? 'DOC' : note.file.ext || 'FILE'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-xs truncate max-w-[130px]">{note.file.name}</p>
                              <p className="text-[10px] opacity-70">{note.file.size} • Open</p>
                            </div>
                          </div>
                          <ExternalLink size={14} className="text-[#5F6872] group-hover/doccard:text-[#145A4A] flex-shrink-0" />
                        </div>
                      )}

                      {/* Text Content */}
                      {note.content && (
                        <p className={`text-xs leading-relaxed whitespace-pre-line mb-3 opacity-90 ${note.textColor}`}>
                          {note.content}
                        </p>
                      )}

                      {/* Checklist Items */}
                      {note.isChecklist && note.checklist && (
                        <div className="space-y-1.5 my-2">
                          {note.checklist.map((cItem, cIdx) => (
                            <div
                              key={cIdx}
                              onClick={(e) => { e.stopPropagation(); handleToggleChecklist(note.id, cIdx); }}
                              className="flex items-center gap-2 text-xs cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={cItem.done}
                                onChange={() => {}}
                                className="rounded accent-[#145A4A]"
                              />
                              <span className={`${cItem.done ? 'line-through text-[#89919A] opacity-60' : note.textColor}`}>
                                {cItem.text}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Bullet Items */}
                      {note.items && (
                        <ul className={`text-xs space-y-1 list-disc list-inside my-2 opacity-90 ${note.textColor}`}>
                          {note.items.map((it, iIdx) => (
                            <li key={iIdx} className="leading-snug">
                              {it}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Card Footer (Tag + Date + Actions) */}
                    <div className="pt-3 mt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] opacity-80">
                      <span className={note.textColor}>
                        {note.dateStr}
                      </span>

                      <div className="flex items-center gap-1.5 relative">
                        <button
                          onClick={(e) => handleTogglePin(note.id, e)}
                          className="p-1 hover:opacity-100"
                          title="Pin"
                        >
                          <Pin size={13} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toast.info(`Reminder: ${note.dateStr}`); }}
                          className="p-1 hover:opacity-100"
                          title="Date"
                        >
                          <CalIcon size={13} />
                        </button>
                        <button
                          onClick={(e) => handleConvertToTask(note, e)}
                          className="p-1 hover:opacity-100 text-[#4F8068]"
                          title="Convert to task"
                        >
                          <Check size={13} />
                        </button>
                        
                        {/* More Menu Dropdown */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id)
                            }}
                            className="p-1 hover:opacity-100"
                            title="More options"
                          >
                            <MoreHorizontal size={13} />
                          </button>

                          {activeMenuNoteId === note.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-xl py-1 z-30 text-xs text-[#17202A] dark:text-white"
                            >
                              <button
                                onClick={(e) => { setEditingNote(note); setActiveMenuNoteId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2"
                              >
                                <Edit3 size={13} /> Edit
                              </button>
                              <button
                                onClick={(e) => { handleDuplicateNote(note, e); setActiveMenuNoteId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2"
                              >
                                <Copy size={13} /> Duplicate
                              </button>
                              <button
                                onClick={(e) => { handleConvertToTask(note, e); setActiveMenuNoteId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2 text-[#61758A]"
                              >
                                <CheckSquare size={13} /> As Task
                              </button>
                              <button
                                onClick={(e) => { handleDeleteNote(note.id, e); setActiveMenuNoteId(null); }}
                                className="w-full text-left px-3 py-1.5 hover:bg-[#F8EBEA] dark:hover:bg-[#B65D52]/20 text-[#B65D52] flex items-center gap-2"
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Pagination Footer */}
              <div className="flex items-center justify-between text-xs text-[#5F6872] pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
                <span>Showing {paginatedNotes.length} of {filteredNotes.length} notes</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                        currentPage === p
                          ? 'bg-[#145A4A] text-white shadow-sm'
                          : 'border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: DEDICATED REMINDERS VIEW */}
          {activeTab === 'Reminders' && (
            <div className="space-y-4">
              <div className="card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif font-bold text-lg text-[#17202A] dark:text-white">Scheduled Reminders</h2>
                    <p className="text-xs text-[#5F6872]">All upcoming alarms, deadlines, and notifications</p>
                  </div>
                  <button
                    onClick={() => setIsAddReminderModalOpen(true)}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    <span>Add Reminder</span>
                  </button>
                </div>

                <div className="divide-y divide-[#DEDCD5] dark:divide-[#1E2D40]">
                  {reminders.map(rem => (
                    <div key={rem.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] px-3 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleToggleReminderDone(rem.id, e)}
                          className="text-[#89919A] hover:text-[#4F8068]"
                        >
                          {rem.done ? <CheckCircle2 size={18} className="text-[#4F8068]" /> : <div className="w-4 h-4 rounded-full border-2 border-[#89919A]" />}
                        </button>
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${rem.iconBg}`}>
                          {renderReminderIcon(rem.iconType)}
                        </div>
                        <div>
                          <p className={`text-xs font-bold ${rem.done ? 'line-through text-[#89919A]' : 'text-[#17202A] dark:text-white'}`}>{rem.title}</p>
                          <p className="text-[11px] text-[#5F6872]">{rem.subtitle} • {rem.time}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${rem.badgeBg}`}>
                          {rem.badge}
                        </span>
                        <button
                          onClick={(e) => handleToggleReminderStar(rem.id, e)}
                          className={rem.starred ? 'text-[#B78332]' : 'text-gray-300'}
                        >
                          <Star size={15} fill={rem.starred ? '#B78332' : 'none'} />
                        </button>
                        <button
                          onClick={() => {
                            saveRemindersToStorage(reminders.filter(r => r.id !== rem.id))
                            toast.success('Reminder removed')
                          }}
                          className="text-gray-400 hover:text-[#B65D52]"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Span 4) - Upcoming Reminders & Quick Actions */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Upcoming Reminders Card */}
          <div className="card p-5 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#145A4A]" />
                <h3 className="font-serif font-bold text-sm text-[#17202A] dark:text-white">
                  Upcoming Reminders
                </h3>
              </div>
              <button
                onClick={() => setActiveTab('Reminders')}
                className="text-[11px] font-semibold text-[#145A4A] hover:underline"
              >
                View All
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1">
              {['All', 'Today', 'Tomorrow', 'This Week'].map((f) => (
                <button
                  key={f}
                  onClick={() => setReminderFilter(f)}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    reminderFilter === f
                      ? 'bg-[#145A4A] text-white shadow-sm'
                      : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872] hover:text-[#17202A]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Reminders List */}
            <div className="space-y-3 pt-1">
              {filteredReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9]/60 dark:hover:bg-[#172638] transition-colors flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${rem.iconBg}`}>
                      {renderReminderIcon(rem.iconType)}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold text-xs truncate ${rem.done ? 'line-through text-[#89919A]' : 'text-[#17202A] dark:text-white'}`}>
                        {rem.title}
                      </p>
                      <p className="text-[10px] text-[#5F6872] dark:text-[#89919A] truncate">
                        {rem.subtitle} • {rem.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${rem.badgeBg}`}>
                      {rem.badge}
                    </span>
                    <button
                      onClick={(e) => handleToggleReminderStar(rem.id, e)}
                      className={rem.starred ? 'text-[#B78332]' : 'text-gray-300 hover:text-gray-400'}
                    >
                      <Star size={14} fill={rem.starred ? '#B78332' : 'none'} />
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Add Reminder button */}
            <div className="pt-2 text-center border-t border-[#DEDCD5] dark:border-[#1E2D40]">
              <button
                onClick={() => setIsAddReminderModalOpen(true)}
                className="text-[#145A4A] hover:text-[#0F4639] text-xs font-semibold flex items-center gap-1.5 mx-auto py-1 px-3 rounded-lg hover:bg-[#E7F0EC] dark:hover:bg-[#145A4A]/20 transition-colors"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Add Reminder</span>
              </button>
            </div>

          </div>

          {/* 2. Quick Actions Card */}
          <div className="card p-5 space-y-4">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-[#17202A] dark:text-white">
              Quick Actions
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => {
                  if (notes.length > 0) handleConvertToTask(notes[0])
                  else toast.info('No notes to convert')
                }}
                className="p-3 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-[#145A4A] font-bold">
                  <CheckSquare size={15} />
                  <span>Convert to Task</span>
                </div>
                <span className="text-[10px] text-[#5F6872] mt-1 block">Turn this note into a task</span>
              </button>

              <button
                onClick={() => setIsAddReminderModalOpen(true)}
                className="p-3 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-[#B78332] font-bold">
                  <Bell size={15} />
                  <span>Create Reminder</span>
                </div>
                <span className="text-[10px] text-[#5F6872] mt-1 block">Set a reminder for this note</span>
              </button>

              <button
                onClick={() => {
                  if (notes.length > 0) handleTogglePin(notes[0].id)
                }}
                className="p-3 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-[#B78332] font-bold">
                  <Pin size={15} />
                  <span>Pin Important</span>
                </div>
                <span className="text-[10px] text-[#5F6872] mt-1 block">Keep important notes at top</span>
              </button>

              <button
                onClick={() => toast.info('Notes synchronized to archive')}
                className="p-3 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-left transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center gap-2 text-[#5F6872] font-bold">
                  <Bookmark size={15} />
                  <span>Archive Note</span>
                </div>
                <span className="text-[10px] text-[#5F6872] mt-1 block">Move note to archive</span>
              </button>
            </div>

            {/* Tip Card */}
            <div className="p-3.5 rounded-2xl bg-[#FAF2E6] dark:bg-[#172638] border border-[#EADCC8] dark:border-[#1E2D40] flex items-start gap-2.5 text-xs text-[#B78332]">
              <Sparkles size={16} className="text-[#B78332] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <span className="font-bold">Tip:</span> Use <span className="font-bold">#tags</span> to organize your notes and find them quickly.
              </p>
            </div>

          </div>

        </div>

      </div>

      {/* Note View / Edit Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C2B]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingNote({ ...editingNote, pinned: !editingNote.pinned })}
                  className="text-[#B78332] p-1 rounded-lg hover:bg-[#FAF2E6]"
                  title="Toggle pin"
                >
                  <Pin size={16} className={editingNote.pinned ? 'fill-current' : ''} />
                </button>
                <span className="font-serif font-bold text-sm text-[#17202A] dark:text-white">
                  {editingNote.title ? 'Edit Note' : 'New Note'}
                </span>
              </div>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-lg text-[#89919A] hover:text-[#17202A] hover:bg-[#F1EFE9]"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingNote.title}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="Enter note title..."
                  className="input-field text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">
                  Tag
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Work', 'Personal', 'Health', 'Reading', 'Ideas', 'Private'].map(t => (
                    <button
                      key={t}
                      onClick={() => setEditingNote({ ...editingNote, tag: t })}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        editingNote.tag === t ? 'bg-[#145A4A] text-white' : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">
                  Time & Date
                </label>
                <div className="relative mb-2">
                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5F6872]" />
                  <input
                    type="text"
                    value={editingNote.dateStr || 'Today, 04:00 PM'}
                    onChange={(e) => setEditingNote({ ...editingNote, dateStr: e.target.value })}
                    placeholder="e.g. Today, 04:00 PM or 24 Aug, 09:15 AM"
                    className="input-field pl-9 text-xs font-bold"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {['Today, 09:00 AM', 'Today, 04:00 PM', 'Tomorrow, 10:00 AM', '24 Aug, 09:15 AM', '23 Aug, 07:40 PM'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditingNote({ ...editingNote, dateStr: p })}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                        editingNote.dateStr === p
                          ? 'bg-[#145A4A] text-white border-[#0F4639] font-bold'
                          : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">
                  Content
                </label>
                <textarea
                  rows={4}
                  value={editingNote.content || (editingNote.items ? editingNote.items.join('\n') : '')}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Write your note here..."
                  className="input-field h-auto py-2.5 text-xs resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
              <button
                onClick={() => handleDeleteNote(editingNote.id)}
                className="text-[#B65D52] hover:text-[#9B4D43] text-xs font-bold flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingNote(null)}
                  className="btn-secondary text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const exists = notes.some(n => n.id === editingNote.id)
                    let updated
                    if (exists) {
                      updated = notes.map(n => n.id === editingNote.id ? editingNote : n)
                    } else {
                      updated = [{ ...editingNote, dateStr: 'Today, ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }, ...notes]
                    }
                    saveNotesToStorage(updated)
                    setEditingNote(null)
                    toast.success('Note saved')
                  }}
                  className="btn-primary text-xs px-5 py-2"
                >
                  Save Changes
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Add Reminder Custom Modal */}
      {isAddReminderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C2B]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <span className="font-serif font-bold text-base text-[#17202A] dark:text-white">Add New Reminder</span>
              <button onClick={() => setIsAddReminderModalOpen(false)} className="text-[#89919A] hover:text-[#17202A]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">Reminder Title</label>
                <input
                  type="text"
                  placeholder="e.g. Call Rahul, Doctor appointment..."
                  value={newReminderTitle}
                  onChange={(e) => setNewReminderTitle(e.target.value)}
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">Category</label>
                <div className="flex flex-wrap gap-1.5">
                  {['Work', 'Personal', 'Health', 'Finance', 'General'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewReminderCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        newReminderCategory === cat
                          ? 'bg-[#145A4A] text-white shadow-sm'
                          : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872] hover:text-[#17202A]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="date"
                    value={newReminderDate}
                    onChange={(e) => setNewReminderDate(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6872] uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="time"
                    value={newReminderTimeOnly}
                    onChange={(e) => setNewReminderTimeOnly(e.target.value)}
                    className="input-field text-xs"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div>
                <label className="block text-[10px] font-semibold text-[#89919A] mb-1">Quick Presets</label>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'Today 3 PM', d: new Date().toISOString().slice(0, 10), t: '15:00' },
                    { label: 'Today 5 PM', d: new Date().toISOString().slice(0, 10), t: '17:00' },
                    { label: 'Tonight 8 PM', d: new Date().toISOString().slice(0, 10), t: '20:00' },
                    { label: 'Tomorrow 9 AM', d: new Date(Date.now() + 86400000).toISOString().slice(0, 10), t: '09:00' },
                    { label: 'Tomorrow 2 PM', d: new Date(Date.now() + 86400000).toISOString().slice(0, 10), t: '14:00' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setNewReminderDate(p.d)
                        setNewReminderTimeOnly(p.t)
                      }}
                      className="text-[10px] px-2 py-0.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] hover:bg-[#F1EFE9] text-[#5F6872] font-medium"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scheduled Summary preview */}
              <div className="p-2.5 rounded-xl bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] flex items-center gap-2 text-xs">
                <Clock size={14} className="text-[#145A4A]" />
                <span className="text-[#5F6872]">
                  Will trigger: <strong className="text-[#17202A] dark:text-white">{formatDateHelper(newReminderDate)}, {formatTimeHelper(newReminderTimeOnly)}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
              <button onClick={() => setIsAddReminderModalOpen(false)} className="btn-secondary text-xs px-4 py-2">
                Cancel
              </button>
              <button onClick={handleAddCustomReminder} className="btn-primary text-xs px-5 py-2">
                Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation Modal (When converting note to task) */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => { setIsTaskModalOpen(false); setTaskModalInitialData(null); }}
        initialData={taskModalInitialData}
        onSuccess={() => toast.success('Task created from note!')}
      />

      {/* Universal Document / PDF / Image Viewer Modal */}
      {(previewDocModal || previewLightboxImage) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C2B]/80 backdrop-blur-md animate-in fade-in"
          onClick={() => { setPreviewDocModal(null); setPreviewLightboxImage(null); }}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-[#101C2B] rounded-3xl overflow-hidden shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#E7F0EC] dark:bg-[#145A4A]/30 text-[#145A4A] flex items-center justify-center font-bold text-xs">
                  {previewDocModal?.isPdf ? 'PDF' : previewDocModal?.isDoc ? 'DOC' : previewDocModal?.isImage || previewLightboxImage ? 'IMG' : 'FILE'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-sm text-[#17202A] dark:text-white truncate max-w-[280px] sm:max-w-md">
                    {previewDocModal?.name || 'Image Preview'}
                  </h3>
                  {previewDocModal?.size && (
                    <p className="text-[11px] text-[#5F6872]">{previewDocModal.size}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDocModal?.url || previewLightboxImage}
                  download={previewDocModal?.name || 'attachment.png'}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download size={13} />
                  <span>Download</span>
                </a>
                <a
                  href={previewDocModal?.url || previewLightboxImage}
                  className="p-1.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]"
                  target="_blank"
                  rel="noreferrer"
                  title="Open in new window"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => { setPreviewDocModal(null); setPreviewLightboxImage(null); }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#89919A] hover:text-[#17202A] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body: PDF iframe, Image render, or Document card */}
            <div className="flex items-center justify-center min-h-[40vh] max-h-[75vh] overflow-hidden rounded-2xl bg-[#F7F5F0] dark:bg-black/40 p-2">
              {previewDocModal?.isPdf ? (
                <iframe
                  src={previewDocModal.url}
                  className="w-full h-[70vh] rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40]"
                  title={previewDocModal.name}
                />
              ) : (previewDocModal?.isImage || previewLightboxImage) ? (
                <img
                  src={previewDocModal?.url || previewLightboxImage}
                  alt={previewDocModal?.name || 'Preview'}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md mx-auto"
                />
              ) : (
                <div className="text-center p-8 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#EEF3F8] text-[#61758A] flex items-center justify-center mx-auto text-2xl font-bold">
                    {previewDocModal?.ext || 'DOC'}
                  </div>
                  <div>
                    <p className="font-serif font-bold text-base text-[#17202A] dark:text-white">{previewDocModal?.name}</p>
                    <p className="text-xs text-[#5F6872] mt-1">{previewDocModal?.size} • Document ready for download</p>
                  </div>
                  <a
                    href={previewDocModal?.url}
                    download={previewDocModal?.name}
                    className="btn-primary text-xs px-5 py-2.5 inline-flex items-center gap-2"
                  >
                    <Download size={15} /> Download & Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
