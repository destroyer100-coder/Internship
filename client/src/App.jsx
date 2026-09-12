import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import AddEditTask from './pages/AddEditTask'
import Calendar from './pages/Calendar'
import Kanban from './pages/Kanban'
import Analytics from './pages/Analytics'
import Archive from './pages/Archive'
import Trash from './pages/Trash'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotesReminders from './pages/NotesReminders'

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index              element={<Dashboard />} />
        <Route path="tasks"       element={<Tasks />} />
        <Route path="tasks/add"   element={<AddEditTask />} />
        <Route path="tasks/edit/:id" element={<AddEditTask />} />
        <Route path="calendar"    element={<Calendar />} />
        <Route path="notes"       element={<NotesReminders />} />
        <Route path="notes-reminders" element={<NotesReminders />} />
        <Route path="kanban"      element={<Kanban />} />
        <Route path="analytics"   element={<Analytics />} />
        <Route path="archive"     element={<Archive />} />
        <Route path="trash"       element={<Trash />} />
        <Route path="profile"     element={<Profile />} />
        <Route path="settings"    element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AppRoutes />
          <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="light" />
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}
