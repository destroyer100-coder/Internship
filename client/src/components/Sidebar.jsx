import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import {
  Home, CheckSquare, Calendar, FileText, BarChart2,
  Archive, User, ChevronDown, LogOut, ChevronLeft, ChevronRight, Check
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: Home,        label: 'Dashboard'         },
  { to: '/calendar',  icon: Calendar,    label: 'Calendar'          },
  { to: '/tasks',     icon: CheckSquare, label: 'Tasks'             },
  { to: '/notes',     icon: FileText,    label: 'Notes & Reminders' },
  { to: '/analytics', icon: BarChart2,   label: 'Analytics'         },
  { to: '/archive',   icon: Archive,     label: 'Archive & Trash'   },
  { to: '/profile',   icon: User,        label: 'Profile & Settings'},
]

export default function Sidebar({ setMobileSidebarOpen }) {
  const [collapsed, setCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { logout, user } = useAuth()
  const { customAvatar } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const displayName = user?.name || 'Vansh Sharma'
  const displayEmail = user?.email || 'vansh.sharma@example.com'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-[#101C2B] text-[#89919A] flex flex-col transition-all duration-300 min-h-screen relative border-r border-[#1E2D40] z-30 select-none`}>
      
      {/* Brand Header */}
      <div className={`p-5 pb-6 border-b border-[#1E2D40] ${collapsed ? 'text-center' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full border-2 border-[#145A4A] flex items-center justify-center flex-shrink-0 text-[#4F8068] bg-[#172638]">
            <Check size={18} strokeWidth={2.8} />
          </div>
          {!collapsed && (
            <div>
              <span className="text-xl font-bold font-serif text-white tracking-tight block leading-tight">
                TaskFlow
              </span>
              <span className="text-[11px] text-[#89919A] tracking-wide block mt-0.5 font-light">
                Plan it. Remember it. Get it done.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) =>
              isActive
                ? {
                    backgroundColor: 'var(--sidebar-active-bg, #145A4A)',
                    borderColor: 'var(--sidebar-active-border, #0F4639)'
                  }
                : {}
            }
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-200 text-sm font-medium
              ${isActive
                ? 'text-white shadow-sm border'
                : 'text-[#89919A] hover:bg-[#172638] hover:text-white'
              }
              ${collapsed ? 'justify-center px-2' : ''}`
            }
            onClick={() => setMobileSidebarOpen && setMobileSidebarOpen(false)}
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}

        {/* Sidebar Quick Add button */}
        <div className="pt-3 px-1">
          <button
            onClick={() => {
              navigate('/tasks')
              if (setMobileSidebarOpen) setMobileSidebarOpen(false)
            }}
            className={`w-full py-2.5 px-3 rounded-xl border border-[#1E2D40] hover:border-[#145A4A] bg-[#172638] hover:bg-[#1E2D40] text-[#DEDCD5] hover:text-white text-xs font-semibold flex items-center gap-2 transition-all ${collapsed ? 'justify-center px-2' : ''}`}
            title="Quick Add"
          >
            <span className="text-[#4F8068] text-base font-bold leading-none">+</span>
            {!collapsed && <span>Quick Add</span>}
          </button>
        </div>
      </nav>

      {/* User Section & Profile Switcher */}
      <div className="p-3 border-t border-[#1E2D40]">
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-[#172638] transition-colors text-left ${collapsed ? 'justify-center p-1.5' : ''}`}
          >
            {customAvatar ? (
              <img
                src={customAvatar}
                alt={displayName}
                className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-md border-2 border-white/20"
              />
            ) : (
              <div
                style={{ backgroundColor: 'var(--primary-color, #145A4A)' }}
                className="w-10 h-10 text-white font-serif font-bold text-base rounded-full flex items-center justify-center flex-shrink-0 shadow-md"
              >
                {initial}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                <p className="text-xs text-[#89919A] truncate">{displayEmail}</p>
              </div>
            )}
            {!collapsed && <ChevronDown size={15} className={`text-[#89919A] transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />}
          </button>

          {/* User popup dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#172638] border border-[#1E2D40] rounded-xl shadow-2xl p-1.5 text-xs text-[#DEDCD5] z-50 animate-in fade-in">
              <button
                onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#1E2D40] text-white flex items-center gap-2"
              >
                <User size={14} /> My Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#B65D52]/20 text-[#B65D52] flex items-center gap-2"
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          )}
        </div>

        {/* Motivational Quote Widget */}
        {!collapsed && (
          <div className="mt-4 pt-3 border-t border-[#1E2D40] px-2 text-center">
            <span className="text-[#4F8068] text-2xl font-serif leading-none block select-none">“</span>
            <p className="text-xs font-serif text-[#89919A] italic leading-relaxed px-1 mt-1">
              A well planned day is a productive day.
            </p>
            <div className="w-10 h-[1.5px] bg-[#145A4A]/40 mx-auto mt-2.5 rounded-full" />
          </div>
        )}
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{ backgroundColor: 'var(--primary-color, #145A4A)' }}
        className="absolute -right-3 top-7 w-6 h-6 text-white rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity z-40 border border-white/20"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
