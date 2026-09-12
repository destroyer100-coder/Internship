import axios from 'axios'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'
})

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('taskflow_user') || '{}')
  if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
  return config
})

// Auth
export const sendOtp       = (data) => API.post('/auth/send-otp', data)
export const verifyOtp     = (data) => API.post('/auth/verify-otp', data)
export const registerUser  = (data) => API.post('/auth/register', data)
export const loginUser     = (data) => API.post('/auth/login', data)
export const loginWithOtp  = (data) => API.post('/auth/login-otp', data)
export const resetPassword = (data) => API.post('/auth/reset-password', data)
export const getProfile    = ()     => API.get('/auth/profile')
export const updateProfile = (data) => API.put('/auth/profile', data)
export const updateNotificationPrefs = (data) => API.put('/auth/notification-prefs', data)

// Tasks
export const getTasks        = (params) => API.get('/tasks', { params })
export const createTask      = (data)   => API.post('/tasks', data)
export const getTask         = (id)     => API.get(`/tasks/${id}`)
export const updateTask      = (id, d)  => API.put(`/tasks/${id}`, d)
export const deleteTask      = (id)     => API.delete(`/tasks/${id}`)
export const archiveTask     = (id)     => API.patch(`/tasks/archive/${id}`)
export const restoreTask     = (id)     => API.patch(`/tasks/restore/${id}`)
export const permanentDelete = (id)     => API.delete(`/tasks/permanent/${id}`)
export const getArchivedTasks = ()      => API.get('/tasks/archived')
export const getTrashedTasks  = ()      => API.get('/tasks/trashed')
export const getAnalytics     = ()      => API.get('/tasks/analytics')

export default API
