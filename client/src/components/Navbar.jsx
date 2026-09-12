import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, Menu, LogOut, Settings, Calendar as CalIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-toastify'
import { getTasks } from '../services/api'

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  
  // Dropdown states
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  
  const dropdownRef = useRef(null)
  const notifRef = useRef(null)

  // Fetch notifications (Tasks due today or overdue)
  useEffect(() => {
    if (user) {
      getTasks({}).then(({ data }) => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Get tasks that are not completed and due before tomorrow (i.e. due today or overdue)
        const dueTasks = data.filter(t => t.status !== 'Completed' && new Date(t.dueDate) < tomorrow)
                             .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        setNotifications(dueTasks.slice(0, 5))
      }).catch(() => {})
    }
  }, [user])

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/tasks?search=${encodeURIComponent(search.trim())}`)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-[70px] bg-white dark:bg-[#101C2B] border-b border-[#DEDCD5] dark:border-[#1E2D40] flex items-center px-6 gap-4 relative z-40">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="lg:hidden text-[#5F6872] hover:text-[#17202A] dark:hover:text-[#F7F5F0]">
        <Menu size={22} />
      </button>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89919A]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#145A4A] text-[#17202A] dark:text-white"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 ml-auto">
        
        {/* Notification Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative w-9 h-9 rounded-full hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center justify-center transition-colors focus:outline-none"
          >
            <Bell size={18} className="text-[#5F6872] dark:text-[#89919A]" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#B65D52] border-2 border-white dark:border-[#101C2B] rounded-full"></span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-xl py-2 z-50">
              <div className="px-4 py-2 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                <h3 className="font-semibold text-sm text-[#17202A] dark:text-white">Notifications</h3>
              </div>
              
              <div className="max-h-64 overflow-y-auto py-1">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-[#5F6872] dark:text-[#89919A]">
                    You have no new notifications. All caught up! 🎉
                  </div>
                ) : (
                  notifications.map(task => {
                    const isOverdue = new Date(task.dueDate) < new Date(new Date().setHours(0,0,0,0));
                    return (
                      <div 
                        key={task._id} 
                        onClick={() => { setNotifOpen(false); navigate(`/tasks`); }}
                        className="px-4 py-3 hover:bg-[#F1EFE9] dark:hover:bg-[#172638] cursor-pointer border-b border-[#DEDCD5] dark:border-[#1E2D40] last:border-0 transition-colors"
                      >
                        <p className="text-sm font-medium text-[#17202A] dark:text-white line-clamp-1">{task.title}</p>
                        <div className="flex items-center gap-1.5 mt-1">
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

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-9 h-9 bg-[#145A4A] rounded-full flex items-center justify-center font-semibold text-white text-sm hover:bg-[#0F4639] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#145A4A] dark:focus:ring-offset-[#101C2B]"
          >
            {user?.name?.charAt(0).toUpperCase() || <User size={16} />}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl shadow-lg py-1 z-50">
              <div className="px-4 py-3 border-b border-[#DEDCD5] dark:border-[#1E2D40]">
                <p className="text-sm font-semibold text-[#17202A] dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-[#5F6872] dark:text-[#89919A] truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#17202A] dark:text-[#F7F5F0] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2"
                >
                  <User size={15} className="text-[#89919A]" /> Profile
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#17202A] dark:text-[#F7F5F0] hover:bg-[#F1EFE9] dark:hover:bg-[#172638] flex items-center gap-2"
                >
                  <Settings size={15} className="text-[#89919A]" /> Settings
                </button>
              </div>

              <div className="border-t border-[#DEDCD5] dark:border-[#1E2D40] py-1">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-[#B65D52] hover:bg-[#F8EBEA] dark:hover:bg-[#B65D52]/20 flex items-center gap-2 font-medium"
                >
                  <LogOut size={15} /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
