import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, Check } from 'lucide-react'

export default function Layout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F5F0] dark:bg-[#0B131E] text-[#17202A] dark:text-[#F7F5F0]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static z-50 lg:z-auto transition-transform duration-300 ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <Sidebar setMobileSidebarOpen={setMobileSidebarOpen} />
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Global Header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-3 bg-white dark:bg-[#101C2B] border-b border-[#DEDCD5] dark:border-[#1E2D40] z-20">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full border-2 border-[#145A4A] flex items-center justify-center text-[#4F8068] bg-[#172638]">
              <Check size={14} strokeWidth={3} />
            </div>
            <span className="text-lg font-bold font-serif text-[#17202A] dark:text-white tracking-tight">TaskFlow</span>
          </div>
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-[#F1EFE9] dark:hover:bg-[#172638] text-[#5F6872] dark:text-[#89919A] transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
