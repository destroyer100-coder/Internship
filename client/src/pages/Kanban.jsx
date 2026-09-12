import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TaskModal from '../components/TaskModal'
import { toast } from 'react-toastify'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getTasks, updateTask } from '../services/api'
import { Calendar, GripVertical, Plus } from 'lucide-react'

const COLUMNS = ['To Do', 'In Progress', 'Completed']

const COLUMN_STYLES = {
  'To Do':       { header: 'bg-[#F1EFE9] text-[#17202A] dark:bg-[#1E2D40] dark:text-white', dot: 'bg-[#89919A]'   },
  'In Progress': { header: 'bg-[#EEF3F8] text-[#61758A] dark:bg-[#1A3A54] dark:text-[#EEF3F8]', dot: 'bg-[#61758A]'   },
  'Completed':   { header: 'bg-[#EBF3EF] text-[#4F8068] dark:bg-[#13241C] dark:text-[#EBF3EF]', dot: 'bg-[#4F8068]'  },
}

function TaskCard({ task, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task._id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div ref={setNodeRef} style={style} onClick={() => onEdit && onEdit(task._id)} className="bg-white dark:bg-[#101C2B] rounded-xl border border-[#DEDCD5] dark:border-[#1E2D40] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-2">
        <button {...listeners} {...attributes} className="mt-0.5 text-[#89919A] hover:text-[#17202A] cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#17202A] dark:text-white leading-snug">{task.title}</p>
          {task.description && <p className="text-xs text-[#5F6872] dark:text-[#89919A] mt-1 line-clamp-2">{task.description}</p>}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${task.priority === 'High' ? 'bg-[#F8EBEA] text-[#B65D52]' : task.priority === 'Medium' ? 'bg-[#FAF2E6] text-[#B78332]' : 'bg-[#EBF3EF] text-[#4F8068]'}`}>
              {task.priority}
            </span>
            <div className="flex items-center gap-1 text-xs text-[#89919A]">
              <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()} {task.dueTime && <span className="inline-block ml-2 px-1.5 py-0.5 bg-[#E7F0EC] dark:bg-[#145A4A]/30 text-[#145A4A] dark:text-[#4F8068] rounded text-[10px] font-bold">{new Date('1970-01-01T' + task.dueTime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Kanban() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editTaskId, setEditTaskId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const fetchTasks = async () => {
    try {
      const { data } = await getTasks({})
      setTasks(data)
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchTasks() }, [])

  const getColumnTasks = (col) => tasks.filter(t => t.status === col)

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const movedTask = tasks.find(t => t._id === active.id)
    const overTask  = tasks.find(t => t._id === over.id)
    if (!movedTask || !overTask || movedTask.status === overTask.status) return

    const newStatus = overTask.status
    setTasks(prev => prev.map(t => t._id === active.id ? { ...t, status: newStatus } : t))
    try {
      await updateTask(active.id, { status: newStatus })
      toast.success(`Moved to "${newStatus}"`)
    } catch {
      toast.error('Failed to update task'); fetchTasks()
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#145A4A]"></div></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#17202A] dark:text-white">Kanban Board</h1>
        <button onClick={() => { setEditTaskId(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Task</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {COLUMNS.map(col => {
            const colTasks = getColumnTasks(col)
            const style = COLUMN_STYLES[col]
            return (
              <div key={col} className="bg-[#F7F5F0] dark:bg-[#172638] rounded-[16px] p-4 border border-[#DEDCD5] dark:border-[#1E2D40]">
                <div className={`flex items-center gap-2 mb-4 px-3 py-2 rounded-lg ${style.header}`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${style.dot}`}></div>
                  <span className="font-semibold text-sm">{col}</span>
                  <span className="ml-auto text-xs font-bold bg-white dark:bg-[#101C2B] px-2 py-0.5 rounded-full">{colTasks.length}</span>
                </div>
                <SortableContext items={colTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3 min-h-[100px]">
                    {colTasks.length === 0 ? (
                      <div className="text-center py-8 text-[#89919A] text-sm border-2 border-dashed border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl">Drop tasks here</div>
                    ) : (
                      colTasks.map(task => <TaskCard key={task._id} task={task} onEdit={(id) => { setEditTaskId(id); setIsModalOpen(true); }} />)
                    )}
                  </div>
                </SortableContext>
              </div>
            )
          })}
        </div>
      </DndContext>
      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} taskId={editTaskId} onSuccess={fetchTasks} />
    </div>
  )
}
