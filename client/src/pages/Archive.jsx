import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Archive as ArchiveIcon, Trash2, Search, Filter, RotateCcw,
  CheckCircle2, FileText, CheckSquare, MoreVertical, LayoutGrid,
  List, ChevronDown, ChevronUp, Shield, ArrowUpDown, X, Check,
  AlertTriangle, RefreshCw, Eye
} from 'lucide-react'
import { toast } from 'react-toastify'
import { getArchivedTasks, restoreTask, permanentDelete } from '../services/api'

// Rich Demo Dataset matching the reference image
const INITIAL_ARCHIVED_ITEMS = [
  {
    id: 'arch-1',
    title: 'Redesign Landing Page',
    subtitle: 'High priority design task for Q3 campaign',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '24 Aug 2026, 09:15 AM',
    archivedBy: 'by you',
    location: 'Work / Design',
    iconType: 'task',
  },
  {
    id: 'arch-2',
    title: 'Content Strategy Ideas',
    subtitle: 'Notes on content pillars and target audience',
    type: 'Note',
    typeBadgeBg: 'bg-[#FAF2E6] text-[#B78332]',
    archivedOn: '22 Aug 2026, 07:40 PM',
    archivedBy: 'by you',
    location: 'Notes / Work Ideas',
    iconType: 'note',
  },
  {
    id: 'arch-3',
    title: 'Learn Advanced React',
    subtitle: 'Complete all modules and build 2 projects',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '18 Aug 2026, 04:30 PM',
    archivedBy: 'by you',
    location: 'Personal / Learning',
    iconType: 'task',
  },
  {
    id: 'arch-4',
    title: 'Book Recommendations',
    subtitle: 'Must-read list for personal growth',
    type: 'Note',
    typeBadgeBg: 'bg-[#F3EDF4] text-[#765C78]',
    archivedOn: '15 Aug 2026, 11:05 AM',
    archivedBy: 'by you',
    location: 'Notes / Personal',
    iconType: 'note',
  },
  {
    id: 'arch-5',
    title: 'Plan Weekend Trip',
    subtitle: 'Itinerary and places to visit',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '10 Aug 2026, 02:20 PM',
    archivedBy: 'by you',
    location: 'Personal / Travel',
    iconType: 'task',
  },
  {
    id: 'arch-6',
    title: 'Q2 Performance Report',
    subtitle: 'Consolidated quarterly sales performance',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '05 Aug 2026, 11:00 AM',
    archivedBy: 'by you',
    location: 'Work / Finance',
    iconType: 'task',
  },
  {
    id: 'arch-7',
    title: 'UI Component Library Draft',
    subtitle: 'Tokens and layout specifications',
    type: 'Note',
    typeBadgeBg: 'bg-[#EEF3F8] text-[#61758A]',
    archivedOn: '01 Aug 2026, 04:15 PM',
    archivedBy: 'by you',
    location: 'Notes / Design System',
    iconType: 'note',
  },
  {
    id: 'arch-8',
    title: 'Client Contract Review',
    subtitle: 'Legal clauses and payment schedule check',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '28 Jul 2026, 03:00 PM',
    archivedBy: 'by you',
    location: 'Work / Legal',
    iconType: 'task',
  }
]

const INITIAL_TRASH_ITEMS = [
  {
    id: 'trash-1',
    title: 'Old Sprint Retrospective',
    subtitle: 'Outdated sprint items and feedback draft',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '23 Aug 2026, 06:10 PM',
    archivedBy: 'by you',
    location: 'Work / Sprint',
    iconType: 'task',
  },
  {
    id: 'trash-2',
    title: 'Rough Meeting Scratchpad',
    subtitle: 'Temporary notes from call with vendor',
    type: 'Note',
    typeBadgeBg: 'bg-[#FAF2E6] text-[#B78332]',
    archivedOn: '20 Aug 2026, 02:45 PM',
    archivedBy: 'by you',
    location: 'Notes / Scratchpad',
    iconType: 'note',
  },
  {
    id: 'trash-3',
    title: 'Grocery List July',
    subtitle: 'Old grocery items list',
    type: 'Note',
    typeBadgeBg: 'bg-[#FAF2E6] text-[#B78332]',
    archivedOn: '14 Aug 2026, 10:15 AM',
    archivedBy: 'by you',
    location: 'Personal / Chores',
    iconType: 'note',
  },
  {
    id: 'trash-4',
    title: 'Deprecated API Integration Spec',
    subtitle: 'Legacy v1 endpoint mappings',
    type: 'Task',
    typeBadgeBg: 'bg-[#EBF3EF] text-[#4F8068]',
    archivedOn: '11 Aug 2026, 09:30 AM',
    archivedBy: 'by you',
    location: 'Work / Engineering',
    iconType: 'task',
  }
]

export default function Archive() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'trash' ? 'trash' : 'archive'
  const [activeTab, setActiveTab] = useState(initialTab) // 'archive' | 'trash'
  
  const [archivedList, setArchivedList] = useState(INITIAL_ARCHIVED_ITEMS)
  const [trashList, setTrashList] = useState(INITIAL_TRASH_ITEMS)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('Archived Date')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'
  const [selectedIds, setSelectedIds] = useState([])
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')
  const [locationFilter, setLocationFilter] = useState('All')
  const [isExpanded, setIsExpanded] = useState(false)
  const [emptyTrashConfirmOpen, setEmptyTrashConfirmOpen] = useState(false)
  const [viewDetailItem, setViewDetailItem] = useState(null)

  // Load and sync from localStorage
  useEffect(() => {
    const savedArch = localStorage.getItem('taskflow_archived_items')
    if (savedArch) {
      try { setArchivedList(JSON.parse(savedArch)) } catch {}
    }
    const savedTrash = localStorage.getItem('taskflow_trash_items')
    if (savedTrash) {
      try { setTrashList(JSON.parse(savedTrash)) } catch {}
    }
  }, [])

  // Sync tab with URL
  useEffect(() => {
    if (searchParams.get('tab') === 'trash') {
      setActiveTab('trash')
    }
  }, [searchParams])

  const saveArchived = (items) => {
    setArchivedList(items)
    localStorage.setItem('taskflow_archived_items', JSON.stringify(items))
  }

  const saveTrash = (items) => {
    setTrashList(items)
    localStorage.setItem('taskflow_trash_items', JSON.stringify(items))
  }

  // Restore single item
  const handleRestoreItem = (item, e) => {
    if (e) e.stopPropagation()
    if (activeTab === 'archive') {
      const updated = archivedList.filter(i => i.id !== item.id)
      saveArchived(updated)
    } else {
      const updated = trashList.filter(i => i.id !== item.id)
      saveTrash(updated)
    }

    // Push restored item back to active Notes or Tasks in localStorage
    try {
      if (item.type === 'Note') {
        const existingNotes = JSON.parse(localStorage.getItem('taskflow_notes') || '[]')
        const restoredNote = {
          id: 'note-restored-' + Date.now(),
          title: item.title,
          content: item.subtitle || '',
          tag: item.location ? item.location.replace('Notes / ', '') : 'Work',
          tagColor: 'bg-[#FAF2E6] text-[#B78332]',
          dateStr: 'Restored just now',
          bg: 'bg-white dark:bg-[#101C2B] border-[#DEDCD5] dark:border-[#1E2D40]',
          textColor: 'text-[#17202A] dark:text-white',
          pinned: false
        }
        localStorage.setItem('taskflow_notes', JSON.stringify([restoredNote, ...existingNotes]))
      }
    } catch {}

    setSelectedIds(selectedIds.filter(id => id !== item.id))
    setActiveMenuId(null)
    toast.success(`"${item.title}" restored to active workspace! ↩️`)
  }

  // Delete item permanently
  const handleDeletePermanent = (item, e) => {
    if (e) e.stopPropagation()
    if (activeTab === 'archive') {
      const updated = archivedList.filter(i => i.id !== item.id)
      saveArchived(updated)
    } else {
      const updated = trashList.filter(i => i.id !== item.id)
      saveTrash(updated)
    }
    setSelectedIds(selectedIds.filter(id => id !== item.id))
    setActiveMenuId(null)
    toast.info(`"${item.title}" permanently deleted`)
  }

  // Move from Archive to Trash
  const handleMoveToTrash = (item, e) => {
    if (e) e.stopPropagation()
    const updatedArch = archivedList.filter(i => i.id !== item.id)
    saveArchived(updatedArch)
    const updatedTrash = [item, ...trashList]
    saveTrash(updatedTrash)
    setActiveMenuId(null)
    toast.info(`Moved "${item.title}" to Trash 🗑️`)
  }

  // Empty entire Trash
  const handleEmptyTrash = () => {
    saveTrash([])
    setSelectedIds([])
    setEmptyTrashConfirmOpen(false)
    toast.success('Trash emptied completely')
  }

  // Bulk restore
  const handleBulkRestore = () => {
    if (selectedIds.length === 0) return
    if (activeTab === 'archive') {
      saveArchived(archivedList.filter(i => !selectedIds.includes(i.id)))
    } else {
      saveTrash(trashList.filter(i => !selectedIds.includes(i.id)))
    }
    const count = selectedIds.length
    setSelectedIds([])
    toast.success(`Restored ${count} items to active workspace! ↩️`)
  }

  // Bulk permanent delete
  const handleBulkPermanentDelete = () => {
    if (selectedIds.length === 0) return
    if (activeTab === 'archive') {
      saveArchived(archivedList.filter(i => !selectedIds.includes(i.id)))
    } else {
      saveTrash(trashList.filter(i => !selectedIds.includes(i.id)))
    }
    const count = selectedIds.length
    setSelectedIds([])
    toast.info(`Permanently deleted ${count} items`)
  }

  // Toggle select all
  const currentList = activeTab === 'archive' ? archivedList : trashList
  const filteredItems = currentList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          item.location.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'All' || item.type === typeFilter
    const matchesLoc = locationFilter === 'All' || item.location.includes(locationFilter)
    return matchesSearch && matchesType && matchesLoc
  })

  const displayedItems = isExpanded ? filteredItems : filteredItems.slice(0, 5)

  const handleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredItems.map(i => i.id))
    }
  }

  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation()
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // Stats
  const archiveTaskCount = archivedList.filter(i => i.type === 'Task').length
  const archiveNoteCount = archivedList.filter(i => i.type === 'Note').length
  const trashTaskCount = trashList.filter(i => i.type === 'Task').length
  const trashNoteCount = trashList.filter(i => i.type === 'Note').length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight">
            Archive & Trash
          </h1>
          <p className="text-xs text-[#5F6872] dark:text-[#89919A] mt-1">
            Restore items or permanently delete them.
          </p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#89919A]" />
            <input
              type="text"
              placeholder="Search archived or deleted items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#89919A] hover:text-[#17202A]"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterPopoverOpen(!filterPopoverOpen)}
              className={`btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 ${
                typeFilter !== 'All' || locationFilter !== 'All' ? 'border-[#145A4A] text-[#145A4A] dark:text-[#4F8068] font-bold bg-[#E7F0EC] dark:bg-[#145A4A]/20' : ''
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
              {(typeFilter !== 'All' || locationFilter !== 'All') && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#145A4A]" />
              )}
            </button>

            {/* Filter Popover */}
            {filterPopoverOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-2xl shadow-2xl p-4 z-50 text-xs space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                  <span className="font-bold font-serif text-sm text-[#17202A] dark:text-white">Filter Items</span>
                  <button
                    onClick={() => { setTypeFilter('All'); setLocationFilter('All'); setFilterPopoverOpen(false); }}
                    className="text-[11px] text-[#145A4A] hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#5F6872] block mb-1">Item Type</label>
                  <div className="grid grid-cols-3 gap-1">
                    {['All', 'Task', 'Note'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTypeFilter(t)}
                        className={`py-1 rounded-lg text-xs font-semibold ${
                          typeFilter === t ? 'bg-[#145A4A] text-white' : 'bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase text-[#5F6872] block mb-1">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] text-[#17202A] dark:text-white"
                  >
                    <option value="All">All Locations</option>
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Notes">Notes</option>
                    <option value="Design">Design</option>
                    <option value="Learning">Learning</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tabs & Stats Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        {/* Tab Buttons */}
        <div className="inline-flex p-1 rounded-2xl bg-[#F7F5F0] dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40]">
          <button
            onClick={() => { setActiveTab('archive'); setSearchParams({}); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068] shadow-sm border-b-2 border-[#145A4A]'
                : 'text-[#5F6872] hover:text-[#17202A]'
            }`}
          >
            <ArchiveIcon size={16} />
            <span>Archive ({archivedList.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('trash'); setSearchParams({ tab: 'trash' }); setSelectedIds([]); }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
              activeTab === 'trash'
                ? 'bg-white dark:bg-[#172638] text-[#145A4A] dark:text-[#4F8068] shadow-sm border-b-2 border-[#145A4A]'
                : 'text-[#5F6872] hover:text-[#17202A]'
            }`}
          >
            <Trash2 size={16} />
            <span>Trash ({trashList.length})</span>
          </button>
        </div>

        {/* Right Stat Card */}
        <div className="card p-3 px-4 flex items-center gap-3 w-fit self-end sm:self-auto">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            activeTab === 'archive' ? 'bg-[#EBF3EF] text-[#4F8068]' : 'bg-[#F8EBEA] text-[#B65D52]'
          }`}>
            {activeTab === 'archive' ? <ArchiveIcon size={18} /> : <Trash2 size={18} />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                {activeTab === 'archive' ? archivedList.length : trashList.length}
              </span>
              <span className="text-xs font-semibold text-[#17202A] dark:text-white">
                {activeTab === 'archive' ? 'Archived Items' : 'Trash Items'}
              </span>
            </div>
            <p className="text-[10px] text-[#5F6872]">
              {activeTab === 'archive'
                ? `Tasks ${archiveTaskCount} • Notes ${archiveNoteCount}`
                : `Tasks ${trashTaskCount} • Notes ${trashNoteCount}`}
            </p>
          </div>
        </div>

      </div>

      {/* 3. Main Content Card */}
      <div className="card p-0 overflow-hidden shadow-sm">
        
        {/* Card Header & Controls */}
        <div className="p-5 border-b border-[#DEDCD5] dark:border-[#1E2D40] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F7F5F0]/40 dark:bg-[#101C2B]">
          
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
              activeTab === 'archive' ? 'bg-[#EBF3EF] text-[#4F8068]' : 'bg-[#F8EBEA] text-[#B65D52]'
            }`}>
              {activeTab === 'archive' ? <ArchiveIcon size={16} /> : <Trash2 size={16} />}
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                {activeTab === 'archive' ? 'Archived Items' : 'Trash Items'}
              </h2>
              <p className="text-xs text-[#5F6872]">
                {activeTab === 'archive'
                  ? "Items you've archived to keep your workspace clean."
                  : 'Items in trash are scheduled for deletion or can be restored.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-[#172638] px-3 py-1.5 rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40]">
              <span className="text-[#5F6872] font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-[#17202A] dark:text-white focus:outline-none cursor-pointer text-xs"
              >
                <option value="Archived Date">Archived Date</option>
                <option value="Title">Title</option>
                <option value="Type">Type</option>
                <option value="Original Location">Original Location</option>
              </select>
            </div>

            {/* View Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40]">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'list' ? 'bg-[#145A4A] text-white shadow-sm' : 'text-[#5F6872] hover:text-[#17202A]'
                }`}
                title="List View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-[#145A4A] text-white shadow-sm' : 'text-[#5F6872] hover:text-[#17202A]'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {/* Empty Trash Button (Only in Trash tab) */}
            {activeTab === 'trash' && trashList.length > 0 && (
              <button
                onClick={() => setEmptyTrashConfirmOpen(true)}
                className="text-xs font-bold text-[#B65D52] hover:text-[#9B4D43] bg-[#F8EBEA] dark:bg-[#B65D52]/20 px-3 py-1.5 rounded-xl border border-[#E8D0CE] dark:border-[#1E2D40] flex items-center gap-1.5 transition-colors"
              >
                <Trash2 size={13} />
                <span>Empty Trash</span>
              </button>
            )}
          </div>

        </div>

        {/* Bulk Action Bar (When items selected) */}
        {selectedIds.length > 0 && (
          <div className="bg-[#145A4A] text-white px-5 py-2.5 flex items-center justify-between text-xs animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span className="font-bold">{selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkRestore}
                className="px-3 py-1 bg-white text-[#145A4A] rounded-lg font-bold hover:bg-[#F1EFE9] flex items-center gap-1"
              >
                <RotateCcw size={12} /> Restore Selected
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="px-3 py-1 bg-[#B65D52] text-white rounded-lg font-bold hover:bg-[#9B4D43] flex items-center gap-1"
              >
                <Trash2 size={12} /> Delete Permanently
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="text-white/80 hover:text-white ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 4. Table / List of Items */}
        {displayedItems.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F5F0] dark:bg-[#172638] text-[#5F6872] flex items-center justify-center mx-auto text-2xl shadow-inner">
              {activeTab === 'archive' ? '📦' : '🗑️'}
            </div>
            <div>
              <p className="font-serif font-bold text-base text-[#17202A] dark:text-white">
                {activeTab === 'archive' ? 'No Archived Items' : 'Trash is Empty'}
              </p>
              <p className="text-xs text-[#5F6872] mt-0.5">
                {activeTab === 'archive'
                  ? 'Items you archive from tasks or notes will appear here.'
                  : 'Items you delete will be kept here safely.'}
              </p>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0]/50 dark:bg-[#101C2B] text-[#5F6872] font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      onChange={handleSelectAll}
                      className="rounded accent-[#145A4A]"
                    />
                  </th>
                  <th className="py-4 px-3 text-left">Title</th>
                  <th className="py-4 px-3 text-left">Type</th>
                  <th className="py-4 px-3 text-left">Archived On</th>
                  <th className="py-4 px-3 text-left">Original Location</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DEDCD5] dark:divide-[#1E2D40]">
                {displayedItems.map((item) => {
                  const isSelected = selectedIds.includes(item.id)
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleToggleSelect(item.id)}
                      className={`hover:bg-[#F1EFE9]/80 dark:hover:bg-[#172638] transition-colors cursor-pointer ${
                        isSelected ? 'bg-[#E7F0EC]/60 dark:bg-[#145A4A]/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleToggleSelect(item.id, e)}
                          className="rounded accent-[#145A4A]"
                        />
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            item.type === 'Task' ? 'bg-[#EBF3EF] text-[#4F8068]' : 'bg-[#FAF2E6] text-[#B78332]'
                          }`}>
                            {item.type === 'Task' ? <CheckSquare size={15} /> : <FileText size={15} />}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#17202A] dark:text-white">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#5F6872] truncate max-w-[280px]">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${item.typeBadgeBg}`}>
                          {item.type}
                        </span>
                      </td>

                      {/* Archived On */}
                      <td className="py-3.5 px-3 text-[#17202A] dark:text-gray-200">
                        <p className="font-semibold">{item.archivedOn}</p>
                        <p className="text-[10px] text-[#5F6872]">{item.archivedBy}</p>
                      </td>

                      {/* Original Location */}
                      <td className="py-3.5 px-3 text-[#5F6872] font-medium">
                        {item.location}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2 relative">
                          <button
                            onClick={(e) => handleRestoreItem(item, e)}
                            className="btn-secondary text-xs px-3 py-1 flex items-center gap-1 hover:border-[#4F8068] hover:text-[#4F8068] transition-colors"
                            title="Restore item"
                          >
                            <RotateCcw size={13} />
                            <span>Restore</span>
                          </button>

                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === item.id ? null : item.id)
                              }}
                              className="p-1.5 rounded-lg border border-[#DEDCD5] dark:border-[#1E2D40] hover:bg-[#F1EFE9] text-[#5F6872]"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === item.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-xl py-1 z-30 text-xs text-left animate-in fade-in"
                              >
                                <button
                                  onClick={() => { setViewDetailItem(item); setActiveMenuId(null); }}
                                  className="w-full px-3 py-1.5 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2 text-[#17202A] dark:text-white"
                                >
                                  <Eye size={13} /> View Details
                                </button>
                                {activeTab === 'archive' && (
                                  <button
                                    onClick={(e) => handleMoveToTrash(item, e)}
                                    className="w-full px-3 py-1.5 hover:bg-[#FAF2E6] dark:hover:bg-[#172638] flex items-center gap-2 text-[#B78332]"
                                  >
                                    <Trash2 size={13} /> Move to Trash
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDeletePermanent(item, e)}
                                  className="w-full px-3 py-1.5 hover:bg-[#F8EBEA] dark:hover:bg-[#B65D52]/20 text-[#B65D52] flex items-center gap-2"
                                >
                                  <Trash2 size={13} /> Delete Permanently
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
        ) : (
          /* Grid View Mode */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {displayedItems.map((item) => {
              const isSelected = selectedIds.includes(item.id)
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleSelect(item.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-[#145A4A] bg-[#E7F0EC]/40 dark:bg-[#145A4A]/20 shadow-sm'
                      : 'border-[#DEDCD5] dark:border-[#1E2D40] bg-white dark:bg-[#101C2B] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.typeBadgeBg}`}>
                      {item.type}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleToggleSelect(item.id, e)}
                      className="rounded accent-[#145A4A]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-sm text-[#17202A] dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#5F6872] mt-1 line-clamp-2">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#DEDCD5] dark:border-[#1E2D40] text-[11px] text-[#5F6872] flex items-center justify-between">
                    <span>{item.location}</span>
                    <button
                      onClick={(e) => handleRestoreItem(item, e)}
                      className="text-[#145A4A] hover:underline font-bold flex items-center gap-1"
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* View More Expander */}
        {filteredItems.length > 5 && (
          <div className="p-3 text-center border-t border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0]/30 dark:bg-[#101C2B]">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs font-bold text-[#5F6872] hover:text-[#17202A] dark:hover:text-white inline-flex items-center gap-1.5 py-1 px-4 rounded-lg hover:bg-white dark:hover:bg-[#172638] transition-all"
            >
              <span>{isExpanded ? 'Show Less' : `View More ${activeTab === 'archive' ? 'Archived' : 'Trash'} Items (${filteredItems.length})`}</span>
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        )}

      </div>

      {/* 5. Bottom Info Notice Card */}
      <div className="p-4 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0]/60 dark:bg-[#101C2B] flex items-center gap-3 text-xs">
        <div className="w-8 h-8 rounded-xl bg-[#EBF3EF] dark:bg-[#145A4A]/20 text-[#4F8068] flex items-center justify-center flex-shrink-0">
          <Shield size={16} />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-[#17202A] dark:text-white">
            {activeTab === 'archive'
              ? 'Archived items are saved indefinitely until you decide to delete them.'
              : 'Items in trash are stored safely and can be restored anytime.'}
          </p>
          <p className="text-[#5F6872]">
            {activeTab === 'archive'
              ? 'They will not appear in your active workspace or clutter your dashboard.'
              : 'Permanent deletion will remove items forever from your account.'}
          </p>
        </div>
      </div>

      {/* Empty Trash Confirmation Modal */}
      {emptyTrashConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C2B]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F8EBEA] text-[#B65D52] flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-serif font-bold text-lg text-[#17202A] dark:text-white">Empty Trash?</h3>
              <p className="text-xs text-[#5F6872] mt-1">
                Are you sure you want to permanently delete all {trashList.length} items in the trash? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setEmptyTrashConfirmOpen(false)}
                className="btn-secondary flex-1 text-xs py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="btn-primary bg-[#B65D52] hover:bg-[#9B4D43] border-[#B65D52] flex-1 text-xs py-2"
              >
                Empty Trash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      {viewDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#101C2B]/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
              <span className="font-serif font-bold text-base text-[#17202A] dark:text-white">Item Details</span>
              <button onClick={() => setViewDetailItem(null)} className="text-[#89919A] hover:text-[#17202A]">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#89919A] font-bold uppercase text-[10px] block">Title</span>
                <p className="font-bold text-sm text-[#17202A] dark:text-white">{viewDetailItem.title}</p>
              </div>
              <div>
                <span className="text-[#89919A] font-bold uppercase text-[10px] block">Description</span>
                <p className="text-[#5F6872]">{viewDetailItem.subtitle || 'No description provided.'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[#89919A] font-bold uppercase text-[10px] block">Type</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${viewDetailItem.typeBadgeBg}`}>
                    {viewDetailItem.type}
                  </span>
                </div>
                <div>
                  <span className="text-[#89919A] font-bold uppercase text-[10px] block">Original Location</span>
                  <p className="font-semibold text-[#17202A] dark:text-white mt-1">{viewDetailItem.location}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40]">
              <button
                onClick={() => setViewDetailItem(null)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Close
              </button>
              <button
                onClick={() => { handleRestoreItem(viewDetailItem); setViewDetailItem(null); }}
                className="btn-primary text-xs px-4 py-2 flex items-center gap-1"
              >
                <RotateCcw size={13} /> Restore Item
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
