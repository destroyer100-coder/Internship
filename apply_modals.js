const fs = require('fs');
const path = require('path');

// Dashboard.jsx
let dashFile = 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/Dashboard.jsx';
let dash = fs.readFileSync(dashFile, 'utf8');
if (!dash.includes('TaskModal')) {
  dash = dash.replace(
    "import { Link } from 'react-router-dom'",
    "import { Link } from 'react-router-dom'\nimport TaskModal from '../components/TaskModal'"
  );
  dash = dash.replace(
    "const [loading, setLoading] = useState(true)",
    "const [loading, setLoading] = useState(true)\n  const [isModalOpen, setIsModalOpen] = useState(false)\n  const [editTaskId, setEditTaskId] = useState(null)"
  );
  dash = dash.replace(
    "const fetchData = async () => {",
    "const fetchData = async () => {\n"
  );
  // Add fetch to modal onSuccess
  dash = dash.replace(
    "fetchData()",
    "fetchData()\n  // eslint-disable-next-line react-hooks/exhaustive-deps"
  );
  dash = dash.replace(
    /<Link to="\/tasks\/add" id="dash-add-task" className="btn-primary flex items-center gap-2">\s*<Plus size=\{18\} \/> New Task\s*<\/Link>/g,
    `<button onClick={() => { setEditTaskId(null); setIsModalOpen(true); }} id="dash-add-task" className="btn-primary flex items-center gap-2"><Plus size={18} /> New Task</button>`
  );
  dash = dash.replace(
    /<Link to="\/tasks\/add" className="text-\[#4F46E5\]">Create one!<\/Link>/g,
    `<button onClick={() => { setEditTaskId(null); setIsModalOpen(true); }} className="text-[#4F46E5] hover:underline">Create one!</button>`
  );
  
  // Make recent tasks editable by clicking
  dash = dash.replace(
    /className="flex items-center gap-3 p-3 bg-\[#F8FAFC\] dark:bg-\[#0F172A\] rounded-xl"/g,
    `className="flex items-center gap-3 p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1E293B] cursor-pointer transition-colors" onClick={() => { setEditTaskId(task._id); setIsModalOpen(true); }}`
  );
  
  dash = dash.replace(
    "</div>\n  )\n}",
    "</div>\n      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} taskId={editTaskId} onSuccess={() => window.location.reload()} />\n    </div>\n  )\n}"
  );
  fs.writeFileSync(dashFile, dash, 'utf8');
}

// Kanban.jsx
let kanFile = 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/Kanban.jsx';
let kan = fs.readFileSync(kanFile, 'utf8');
if (!kan.includes('TaskModal')) {
  kan = kan.replace(
    "import { Link } from 'react-router-dom'",
    "import { Link } from 'react-router-dom'\nimport TaskModal from '../components/TaskModal'"
  );
  kan = kan.replace(
    "const [loading, setLoading] = useState(true)",
    "const [loading, setLoading] = useState(true)\n  const [isModalOpen, setIsModalOpen] = useState(false)\n  const [editTaskId, setEditTaskId] = useState(null)"
  );
  kan = kan.replace(
    /<Link to="\/tasks\/add" className="btn-primary flex items-center gap-2"><Plus size=\{18\} \/> Add Task<\/Link>/g,
    `<button onClick={() => { setEditTaskId(null); setIsModalOpen(true); }} className="btn-primary flex items-center gap-2"><Plus size={18} /> Add Task</button>`
  );
  kan = kan.replace(
    "</div>\n      </DndContext>\n    </div>\n  )\n}",
    "</div>\n      </DndContext>\n      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} taskId={editTaskId} onSuccess={fetchTasks} />\n    </div>\n  )\n}"
  );
  // Add edit to TaskCard
  kan = kan.replace(
    "function TaskCard({ task }) {",
    "function TaskCard({ task, onEdit }) {"
  );
  kan = kan.replace(
    /className="bg-white dark:bg-\[#1E293B\] rounded-xl border border-\[#E5E7EB\] dark:border-\[#334155\] p-4 shadow-sm hover:shadow-md transition-shadow"/g,
    `onClick={() => onEdit && onEdit(task._id)} className="bg-white dark:bg-[#1E293B] rounded-xl border border-[#E5E7EB] dark:border-[#334155] p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"`
  );
  kan = kan.replace(
    "<TaskCard key={task._id} task={task} />",
    "<TaskCard key={task._id} task={task} onEdit={(id) => { setEditTaskId(id); setIsModalOpen(true); }} />"
  );
  fs.writeFileSync(kanFile, kan, 'utf8');
}

// Calendar.jsx
let calFile = 'c:/Users/admin/OneDrive/Desktop/Intership_project/client/src/pages/Calendar.jsx';
let cal = fs.readFileSync(calFile, 'utf8');
if (!cal.includes('TaskModal')) {
  cal = cal.replace(
    "import { toast } from 'react-toastify'",
    "import { toast } from 'react-toastify'\nimport TaskModal from '../components/TaskModal'"
  );
  cal = cal.replace(
    "const [selectedDate, setSelectedDate] = useState(null)",
    "const [selectedDate, setSelectedDate] = useState(null)\n  const [isModalOpen, setIsModalOpen] = useState(false)\n  const [editTaskId, setEditTaskId] = useState(null)"
  );
  
  cal = cal.replace(
    "const handleEventClick = (info) => navigate(`/tasks/edit/${info.event.id}`)",
    "const handleEventClick = (info) => { setEditTaskId(info.event.id); setIsModalOpen(true); }"
  );
  
  // Refresh func
  cal = cal.replace(
    "useEffect(() => {",
    "const fetchTasksCal = () => {\n    getTasks({}).then(({ data }) => {\n      const evts = data.map(task => ({\n        id: task._id,\n        title: task.title,\n        date: task.dueDate?.slice(0, 10),\n        color: task.priority === 'High' ? '#EF4444' : task.priority === 'Medium' ? '#F59E0B' : '#22C55E',\n        extendedProps: { task }\n      }))\n      setEvents(evts)\n      if (selectedDate) {\n        const dayTasks = evts.filter(e => e.date === selectedDate).map(e => e.extendedProps.task)\n        setSelectedDateTasks(dayTasks)\n      }\n    }).catch(() => toast.error('Failed to load calendar tasks'))\n  }\n  useEffect(() => {\n    fetchTasksCal()"
  );
  cal = cal.replace(
    "setEvents(evts)\n    }).catch(() => toast.error('Failed to load calendar tasks'))\n  }, [])",
    "// Already injected\n  }, [])"
  );

  cal = cal.replace(
    /className="p-3 bg-\[#F8FAFC\] dark:bg-\[#0F172A\] rounded-xl border border-\[#E5E7EB\] dark:border-\[#334155\]"/g,
    `className="p-3 bg-[#F8FAFC] dark:bg-[#0F172A] rounded-xl border border-[#E5E7EB] dark:border-[#334155] cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1E293B] transition-colors" onClick={() => { setEditTaskId(task._id); setIsModalOpen(true); }}`
  );

  cal = cal.replace(
    "</div>\n    </div>\n  )\n}",
    "</div>\n      <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} taskId={editTaskId} onSuccess={fetchTasksCal} />\n    </div>\n  )\n}"
  );
  fs.writeFileSync(calFile, cal, 'utf8');
}

console.log('Unified Modal applied!');
