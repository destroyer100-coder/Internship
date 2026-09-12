import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { CheckCircle, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { getTasks } from '../services/api'

const COLORS = ['#145A4A', '#B78332', '#4F8068', '#B65D52', '#765C78', '#61758A']

const StatCard = ({ title, value, icon: Icon, color, suffix = '' }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-sm text-[#5F6872] dark:text-[#89919A]">{title}</p>
      <p className="text-2xl font-bold font-serif text-[#17202A] dark:text-white">{value}{suffix}</p>
    </div>
  </div>
)

function computeAnalytics(tasks) {
  const total       = tasks.length
  const completed   = tasks.filter(t => t.status === 'Completed').length
  const inProgress  = tasks.filter(t => t.status === 'In Progress').length
  const pending     = tasks.filter(t => t.status === 'Pending' || t.status === 'To Do').length
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

  const byCategory = {}
  const byPriority = {}
  tasks.forEach(t => {
    if (t.category) byCategory[t.category] = (byCategory[t.category] || 0) + 1
    if (t.priority) byPriority[t.priority] = (byPriority[t.priority] || 0) + 1
  })

  return { total, completed, inProgress, pending, completionRate, byCategory, byPriority }
}

export default function Analytics() {
  const [data, setData] = useState({
    total: 0, completed: 0, inProgress: 0, pending: 0, completionRate: 0, byCategory: {}, byPriority: {}
  })

  useEffect(() => {
    getTasks({}).then(({ data }) => {
      if (data) setData(computeAnalytics(data))
    }).catch(() => {})
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#145A4A]"></div>
    </div>
  )

  const statusChartData = [
    { name: 'To Do',       value: data.pending    },
    { name: 'In Progress', value: data.inProgress },
    { name: 'Completed',   value: data.completed  },
  ].filter(d => d.value > 0)

  const categoryChartData = Object.entries(data.byCategory || {}).map(([name, value]) => ({ name, value }))
  const priorityChartData = Object.entries(data.byPriority || {}).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#17202A] dark:text-white">Analytics</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Tasks"     value={data.total}          icon={TrendingUp}  color="bg-[#145A4A]" />
        <StatCard title="Completed"       value={data.completed}      icon={CheckCircle} color="bg-[#4F8068]" />
        <StatCard title="Pending"         value={data.pending}        icon={Clock}       color="bg-[#B78332]" />
        <StatCard title="Completion Rate" value={data.completionRate} icon={AlertCircle} color="bg-[#61758A]" suffix="%" />
      </div>

      {/* Completion Rate Bar */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[#17202A] dark:text-white mb-3">Completion Rate</h2>
        <div className="w-full bg-[#F1EFE9] dark:bg-[#172638] rounded-full h-4">
          <div
            className="bg-[#145A4A] h-4 rounded-full transition-all duration-700 flex items-center justify-end pr-2"
            style={{ width: `${Math.max(data.completionRate, 4)}%` }}
          >
            <span className="text-white text-xs font-bold">{data.completionRate}%</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Pie */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[#17202A] dark:text-white mb-4">Tasks by Status</h2>
          {statusChartData.length === 0
            ? <p className="text-[#89919A] text-center py-10">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%" cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Category Bar */}
        <div className="card">
          <h2 className="text-lg font-semibold text-[#17202A] dark:text-white mb-4">Tasks by Category</h2>
          {categoryChartData.length === 0
            ? <p className="text-[#89919A] text-center py-10">No data yet</p>
            : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5F6872' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#5F6872' }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#145A4A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* Priority Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold text-[#17202A] dark:text-white mb-4">Tasks by Priority</h2>
        {priorityChartData.length === 0
          ? <p className="text-[#89919A] text-center py-6">No data yet</p>
          : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 12, fill: '#5F6872' }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#5F6872' }} width={70} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {priorityChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.name === 'High' ? '#B65D52' : entry.name === 'Medium' ? '#B78332' : '#4F8068'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>
    </div>
  )
}
