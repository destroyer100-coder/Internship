import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, Save } from 'lucide-react'
import { createTask, getTask, updateTask } from '../services/api'

const CATEGORIES = ['Work', 'Personal', 'Study', 'Health', 'Other']
const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES   = ['To Do', 'In Progress', 'Completed']

export default function AddEditTask() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)
  const [form, setForm] = useState({
    title: '', description: '', category: 'Work',
    priority: 'Medium', status: 'To Do', dueDate: '', dueTime: ''
  })

  useEffect(() => {
    if (!isEdit) return
    getTask(id).then(({ data }) => {
      setForm({
        title: data.title, description: data.description || '',
        category: data.category, priority: data.priority,
        status: data.status, dueDate: data.dueDate?.slice(0, 10), dueTime: data.dueTime || ''
      })
    }).catch(() => toast.error('Task not found')).finally(() => setFetching(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return toast.error('Title is required')
    if (!form.dueDate)      return toast.error('Due date is required')
    setLoading(true)
    try {
      if (isEdit) { await updateTask(id, form); toast.success('Task updated!') }
      else        { await createTask(form); toast.success('Task created!') }
      navigate('/tasks')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (fetching) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#145A4A]"></div></div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/tasks" className="p-2 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] rounded-xl transition-colors">
          <ArrowLeft size={20} className="text-[#5F6872]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-serif text-[#17202A] dark:text-white">{isEdit ? 'Edit Task' : 'New Task'}</h1>
          <p className="text-[#5F6872] dark:text-[#89919A] text-sm">{isEdit ? 'Update task details' : 'Fill in the details below'}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Task Title <span className="text-[#B65D52]">*</span></label>
          <input id="task-title" type="text" className="input-field" placeholder="e.g. Complete project report"
            value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Description</label>
          <textarea id="task-desc" rows={3} className="input-field resize-none h-auto py-3" placeholder="Optional description..."
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Category <span className="text-[#B65D52]">*</span></label>
            <select id="task-category" className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Priority <span className="text-[#B65D52]">*</span></label>
            <select id="task-priority" className="input-field" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Due Date <span className="text-[#B65D52]">*</span></label>
            <input id="task-duedate" type="date" className="input-field" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Due Time</label>
            <input id="task-duetime" type="time" className="input-field" value={form.dueTime} onChange={e => setForm({ ...form, dueTime: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#17202A] dark:text-gray-200 mb-1.5">Status</label>
          <select id="task-status" className="input-field" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link to="/tasks" className="btn-secondary">Cancel</Link>
          <button id="task-save-btn" type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
            <Save size={16} /> {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
