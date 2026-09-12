import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { X, Save, Sparkles, Calendar, Clock, Tag, Flag, AlertCircle } from 'lucide-react'
import { createTask, getTask, updateTask } from '../services/api'

const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES   = ['To Do', 'In Progress', 'Completed']

const getDefaultForm = () => {
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, -1);
  return {
    title: '', description: '', category: 'Work',
    priority: 'Medium', status: 'To Do', 
    dueDate: localISOTime.split('T')[0], 
    dueTime: localISOTime.split('T')[1].slice(0, 5)
  }
}

export default function TaskModal({ isOpen, onClose, taskId, onSuccess }) {
  const isEdit = Boolean(taskId)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [form, setForm] = useState(getDefaultForm())

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        setFetching(true)
        getTask(taskId).then(({ data }) => {
          setForm({
            title: data.title, description: data.description || '',
            category: data.category, priority: data.priority,
            status: data.status, dueDate: data.dueDate?.slice(0, 10), 
            dueTime: data.dueTime || getDefaultForm().dueTime
          })
        }).catch(() => {
          toast.error('Task not found')
          onClose()
        }).finally(() => setFetching(false))
      } else {
        setForm(getDefaultForm())
      }
    }
  }, [isOpen, taskId, onClose, isEdit])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.dueDate)      return toast.error('Due date is required')
    setLoading(true)
    try {
      if (isEdit) { await updateTask(taskId, form); toast.success('Task updated!') }
      else        { await createTask(form); toast.success('Task created!') }
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Deep Blurred Backdrop */}
      <div 
        className="absolute inset-0 bg-[#101C2B]/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>
      
      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#101C2B] rounded-[28px] shadow-2xl border border-[#DEDCD5] dark:border-[#1E2D40] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Premium Header */}
        <div className="flex items-center justify-between px-8 py-6 bg-[#F7F5F0] dark:bg-[#172638] border-b border-[#DEDCD5] dark:border-[#1E2D40]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#145A4A] text-white flex items-center justify-center shadow-md">
              <Sparkles size={20} className="text-[#4F8068]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-[#17202A] dark:text-white">
                {isEdit ? 'Edit Task' : 'New Task'}
              </h2>
              <p className="text-xs font-medium text-[#5F6872] dark:text-gray-400 mt-0.5">
                {isEdit ? 'Refine your task details' : 'Plan it. Remember it. Get it done.'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center text-[#89919A] hover:text-[#17202A] dark:hover:text-gray-200 hover:bg-white dark:hover:bg-[#1E2D40] rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-8 overflow-y-auto">
          {fetching ? (
            <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#145A4A]"></div></div>
          ) : (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                  Task Title <span className="text-[#B65D52]">*</span>
                </label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all font-medium text-sm" 
                  placeholder="e.g. CEO Meeting, Prepare Monthly Report..."
                  value={form.title} 
                  onChange={e => setForm({ ...form, title: e.target.value })} 
                  required 
                />
              </div>

              {/* Description */}
              <div>
                <label className="flex items-center gap-2 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                  Location / Description
                </label>
                <textarea 
                  rows={2} 
                  className="w-full px-4 py-3 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white placeholder-[#89919A] focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all resize-none text-sm" 
                  placeholder="e.g. Conference Room, Zoom Meeting, Finance..."
                  value={form.description} 
                  onChange={e => setForm({ ...form, description: e.target.value })} 
                />
              </div>

              {/* Grid 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                    <Tag size={14} className="text-[#145A4A]" /> Category
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all text-sm font-medium" 
                    value={form.category} 
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                    <Flag size={14} className="text-[#B65D52]" /> Priority
                  </label>
                  <select 
                    className="w-full px-4 py-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all text-sm font-medium" 
                    value={form.priority} 
                    onChange={e => setForm({ ...form, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Grid 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                    <Calendar size={14} className="text-[#4F8068]" /> Due Date <span className="text-[#B65D52]">*</span>
                  </label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all text-sm font-medium" 
                    value={form.dueDate} 
                    onChange={e => setForm({ ...form, dueDate: e.target.value })} 
                    required 
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                    <Clock size={14} className="text-[#B78332]" /> Due Time
                  </label>
                  <input 
                    type="time" 
                    className="w-full px-4 py-2.5 bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#145A4A] transition-all text-sm font-medium" 
                    value={form.dueTime} 
                    onChange={e => setForm({ ...form, dueTime: e.target.value })} 
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-[#17202A] dark:text-gray-200 uppercase tracking-wider mb-2">
                  <AlertCircle size={14} className="text-[#4F8068]" /> Status
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, status: s })}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        form.status === s 
                        ? 'bg-[#145A4A] text-white shadow-sm ring-2 ring-[#145A4A] ring-offset-2 dark:ring-offset-[#101C2B]' 
                        : 'bg-[#F7F5F0] text-[#5F6872] hover:bg-[#F1EFE9] dark:bg-[#172638] dark:text-gray-300 dark:hover:bg-[#1E2D40]'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-[#DEDCD5] dark:border-[#1E2D40] flex justify-end gap-3 bg-[#F7F5F0] dark:bg-[#172638]">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#5F6872] hover:text-[#17202A] dark:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="task-form" 
            disabled={loading || fetching} 
            className="btn-primary px-6 py-2.5 text-xs font-bold flex items-center gap-2"
          >
            <Save size={15} /> {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>

      </div>
    </div>
  )
}
