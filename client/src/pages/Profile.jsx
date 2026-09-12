import { useState, useEffect, useRef } from 'react'
import {
  User, Mail, Camera, Sun, Moon, Monitor, Bell, Calendar as CalIcon,
  CalendarDays, MailCheck, LayoutGrid, CheckSquare, Clock, ArrowUpDown,
  Check, Edit3, Save, Shield, Sparkles, Heart, Lock, KeyRound
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { updateProfile, updateNotificationPrefs } from '../services/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    accentPresets,
    interfaceDensity,
    setInterfaceDensity,
    customAvatar,
    setCustomAvatar
  } = useTheme()

  const avatarInputRef = useRef(null)

  // Profile Info State
  const [fullName, setFullName] = useState(user?.name || 'Vansh Sharma')
  const [emailAddress, setEmailAddress] = useState(user?.email || 'vansh.sharma@example.com')
  const [bio, setBio] = useState('Passionate about productivity and building better habits.')
  const [memberSince] = useState('12 May 2024')

  // Password State (Optional)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Webpage / In-App Notifications State
  const [webpageNotifsEnabled, setWebpageNotifsEnabled] = useState(true)
  const [webpageSoundEnabled, setWebpageSoundEnabled] = useState(true)
  const [webpageOverdueBanner, setWebpageOverdueBanner] = useState(true)

  // Email Notifications State (sent to inbox)
  const [taskReminderFrequency, setTaskReminderFrequency] = useState('Daily')
  const [taskReminderEnabled, setTaskReminderEnabled] = useState(true)

  const [calendarReminderTiming, setCalendarReminderTiming] = useState('30 minutes before')
  const [calendarReminderEnabled, setCalendarReminderEnabled] = useState(true)

  const [weeklySummaryTiming, setWeeklySummaryTiming] = useState('Every Monday, 9 AM')
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(true)

  // Email Notification Preferences (synced with backend)
  const [emailNotifsEnabled, setEmailNotifsEnabled] = useState(true)
  const [dailySummaryTime, setDailySummaryTime] = useState('08:00')
  const [overdueAlertsEnabled, setOverdueAlertsEnabled] = useState(true)
  const [emailPrefsSaving, setEmailPrefsSaving] = useState(false)

  // Load email notification prefs from user profile
  useEffect(() => {
    if (user) {
      if (typeof user.taskReminderEnabled === 'boolean') setTaskReminderEnabled(user.taskReminderEnabled)
      if (user.taskReminderFrequency) setTaskReminderFrequency(user.taskReminderFrequency)

      if (typeof user.calendarReminderEnabled === 'boolean') setCalendarReminderEnabled(user.calendarReminderEnabled)
      if (user.calendarReminderTiming) setCalendarReminderTiming(user.calendarReminderTiming)

      if (typeof user.weeklySummaryEnabled === 'boolean') setWeeklySummaryEnabled(user.weeklySummaryEnabled)
      if (user.weeklySummaryTiming) setWeeklySummaryTiming(user.weeklySummaryTiming)

      if (typeof user.emailNotifications === 'boolean') setEmailNotifsEnabled(user.emailNotifications)
      if (user.dailySummaryTime) setDailySummaryTime(user.dailySummaryTime)
      if (typeof user.overdueAlerts === 'boolean') setOverdueAlertsEnabled(user.overdueAlerts)
    }

    const saved = localStorage.getItem('taskflow_email_prefs')
    if (saved) {
      try {
        const p = JSON.parse(saved)
        if (typeof p.emailNotifications === 'boolean') setEmailNotifsEnabled(p.emailNotifications)
        if (p.dailySummaryTime) setDailySummaryTime(p.dailySummaryTime)
        if (typeof p.overdueAlerts === 'boolean') setOverdueAlertsEnabled(p.overdueAlerts)

        if (typeof p.taskReminderEnabled === 'boolean') setTaskReminderEnabled(p.taskReminderEnabled)
        if (p.taskReminderFrequency) setTaskReminderFrequency(p.taskReminderFrequency)

        if (typeof p.calendarReminderEnabled === 'boolean') setCalendarReminderEnabled(p.calendarReminderEnabled)
        if (p.calendarReminderTiming) setCalendarReminderTiming(p.calendarReminderTiming)

        if (typeof p.weeklySummaryEnabled === 'boolean') setWeeklySummaryEnabled(p.weeklySummaryEnabled)
        if (p.weeklySummaryTiming) setWeeklySummaryTiming(p.weeklySummaryTiming)
      } catch {}
    }
  }, [user])

  const handleSaveEmailPrefs = async () => {
    setEmailPrefsSaving(true)
    try {
      const payload = {
        emailNotifications: emailNotifsEnabled,
        dailySummaryTime,
        overdueAlerts: overdueAlertsEnabled,

        taskReminderEnabled,
        taskReminderFrequency,

        calendarReminderEnabled,
        calendarReminderTiming,

        weeklySummaryEnabled,
        weeklySummaryTiming,
      }
      await updateNotificationPrefs(payload)
      localStorage.setItem('taskflow_email_prefs', JSON.stringify(payload))
      toast.success('Notification preferences saved!')
    } catch {
      localStorage.setItem('taskflow_email_prefs', JSON.stringify({
        emailNotifications: emailNotifsEnabled,
        dailySummaryTime,
        overdueAlerts: overdueAlertsEnabled,
        taskReminderEnabled,
        taskReminderFrequency,
        calendarReminderEnabled,
        calendarReminderTiming,
        weeklySummaryEnabled,
        weeklySummaryTiming,
      }))
      toast.success('Notification preferences saved locally!')
    }
    setEmailPrefsSaving(false)
  }

  // Preferences State
  const [defaultView, setDefaultView] = useState('Tasks')
  const [defaultCalendarView, setDefaultCalendarView] = useState('Week')
  const [defaultTaskSort, setDefaultTaskSort] = useState('Due Date (Earliest)')
  const [startOfWeek, setStartOfWeek] = useState('Monday')

  const [isSaving, setIsSaving] = useState(false)

  // Load custom settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('taskflow_user_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        if (parsed.fullName) setFullName(parsed.fullName)
        if (parsed.emailAddress) setEmailAddress(parsed.emailAddress)
        if (parsed.bio !== undefined) setBio(parsed.bio)
        if (parsed.taskReminderFrequency) setTaskReminderFrequency(parsed.taskReminderFrequency)
        if (parsed.taskReminderEnabled !== undefined) setTaskReminderEnabled(parsed.taskReminderEnabled)
        if (parsed.calendarReminderTiming) setCalendarReminderTiming(parsed.calendarReminderTiming)
        if (parsed.calendarReminderEnabled !== undefined) setCalendarReminderEnabled(parsed.calendarReminderEnabled)
        if (parsed.weeklySummaryTiming) setWeeklySummaryTiming(parsed.weeklySummaryTiming)
        if (parsed.weeklySummaryEnabled !== undefined) setWeeklySummaryEnabled(parsed.weeklySummaryEnabled)
        if (parsed.defaultView) setDefaultView(parsed.defaultView)
        if (parsed.defaultCalendarView) setDefaultCalendarView(parsed.defaultCalendarView)
        if (parsed.defaultTaskSort) setDefaultTaskSort(parsed.defaultTaskSort)
        if (parsed.startOfWeek) setStartOfWeek(parsed.startOfWeek)
      } catch {}
    }
  }, [])

  // Handle Avatar Image Upload
  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      setCustomAvatar(event.target.result)
      toast.success('Profile avatar updated!')
    }
    reader.readAsDataURL(file)
  }

  // Save All Settings
  const handleSaveProfileAndSettings = async () => {
    if (!fullName.trim()) {
      toast.error('Full Name is required')
      return
    }

    if (newPassword) {
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match')
        return
      }
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters')
        return
      }
    }

    setIsSaving(true)
    try {
      const settingsPayload = {
        fullName: fullName.trim(),
        emailAddress: emailAddress.trim(),
        bio: bio.trim(),
        taskReminderFrequency,
        taskReminderEnabled,
        calendarReminderTiming,
        calendarReminderEnabled,
        weeklySummaryTiming,
        weeklySummaryEnabled,
        defaultView,
        defaultCalendarView,
        defaultTaskSort,
        startOfWeek
      }
      localStorage.setItem('taskflow_user_settings', JSON.stringify(settingsPayload))
      
      // Attempt backend profile update if logged in
      try {
        const updatePayload = { name: fullName.trim(), email: emailAddress.trim() }
        if (newPassword) updatePayload.password = newPassword
        const res = await updateProfile(updatePayload)
        if (updateUser) {
          updateUser({ ...user, name: fullName.trim(), email: emailAddress.trim() })
        }
      } catch {}

      setNewPassword('')
      setConfirmPassword('')
      toast.success('Profile & settings updated successfully! ✨')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Get Initials for Avatar
  const getInitials = (name) => {
    if (!name) return 'VS'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-serif text-[#17202A] dark:text-white tracking-tight">
            Profile & Settings
          </h1>
          <p className="text-xs text-[#5F6872] dark:text-[#89919A] mt-1">
            Manage your account and customize your experience.
          </p>
        </div>

        <button
          onClick={handleSaveProfileAndSettings}
          disabled={isSaving}
          className="btn-primary px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <Edit3 size={14} />
          <span>{isSaving ? 'Updating...' : 'Update Profile'}</span>
        </button>
      </div>

      {/* 2. Profile Information Card */}
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <User size={16} className="text-[var(--primary-color,#145A4A)]" />
            <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
              Profile Information
            </h2>
          </div>
          <p className="text-xs text-[#5F6872] mt-0.5">
            Manage your personal information and account details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2">
          
          {/* Avatar Column (Span 3) */}
          <div className="md:col-span-3 flex flex-col items-center sm:items-start text-center sm:text-left space-y-2">
            <div className="relative">
              {customAvatar ? (
                <img
                  src={customAvatar}
                  alt={fullName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#1E2D40] shadow-lg"
                />
              ) : (
                <div
                  style={{ backgroundColor: 'var(--primary-color, #145A4A)' }}
                  className="w-24 h-24 rounded-full text-white font-serif font-bold text-3xl flex items-center justify-center shadow-lg border-4 border-white dark:border-[#1E2D40]"
                >
                  {getInitials(fullName)}
                </div>
              )}
              
              {/* Camera Trigger */}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white dark:bg-[#172638] text-[#17202A] dark:text-white shadow-md border border-[#DEDCD5] dark:border-[#1E2D40] flex items-center justify-center hover:scale-105 transition-transform"
                title="Upload custom photo"
              >
                <Camera size={14} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <p className="text-[11px] text-[#5F6872] max-w-[140px]">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>

          {/* Form Inputs (Span 9) */}
          <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>

            {/* Bio */}
            <div className="sm:row-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200">
                  Bio (optional)
                </label>
              </div>
              <textarea
                rows={3}
                maxLength={120}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a short bio..."
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] resize-none"
              />
              <span className="text-[10px] text-[#89919A] block text-right mt-1">
                {bio.length}/120 characters
              </span>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
              />
            </div>

            {/* Member Since Card */}
            <div className="sm:col-span-2 pt-2 flex items-center justify-between flex-wrap gap-2">
              <div>
                <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200 mb-1.5">
                  Member Since
                </label>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] text-xs font-medium text-[#17202A] dark:text-white">
                  <CalIcon size={14} className="text-[#5F6872]" />
                  <span>{memberSince}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-xs text-[var(--primary-color,#145A4A)] hover:underline font-bold flex items-center gap-1.5 pt-5"
              >
                <KeyRound size={14} />
                <span>{showPasswordSection ? 'Hide Password Change' : 'Change Password'}</span>
              </button>
            </div>

            {/* Optional Password Change Fields */}
            {showPasswordSection && (
              <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17202A] dark:text-gray-200 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full px-3.5 py-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none"
                  />
                </div>
              </div>
            )}

          </div>

        </div>
      </div>

      {/* 3. Appearance Card */}
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--primary-color,#145A4A)]" />
            <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
              Appearance
            </h2>
          </div>
          <p className="text-xs text-[#5F6872] mt-0.5">
            Customize how TaskFlow looks and feels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Theme Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6872] mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F7F5F0] dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40]">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'system', label: 'System', icon: Monitor }
              ].map(t => {
                const Icon = t.icon
                const isActive = theme === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-white dark:bg-[#101C2B] text-[var(--primary-color,#145A4A)] dark:text-white shadow-sm border border-[#DEDCD5] dark:border-[#1E2D40]'
                        : 'text-[#5F6872] hover:text-[#17202A]'
                    }`}
                  >
                    <Icon size={14} />
                    <span>{t.label}</span>
                    {isActive && <Check size={12} strokeWidth={3} />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6872] mb-2">
              Accent Color
            </label>
            <div className="flex items-center gap-2.5 pt-1">
              {accentPresets.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAccentColor(c.id)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white transition-transform ${
                    accentColor === c.id ? 'ring-2 ring-offset-2 ring-[#5F6872] scale-110 shadow-md' : 'hover:scale-105 opacity-90'
                  }`}
                  title={c.name}
                >
                  {accentColor === c.id && <Check size={13} strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Interface Density */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6872] mb-2">
              Interface Density
            </label>
            <select
              value={interfaceDensity}
              onChange={(e) => setInterfaceDensity(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]"
            >
              <option value="Comfortable">Comfortable</option>
              <option value="Compact">Compact</option>
              <option value="Spacious">Spacious</option>
            </select>
            <span className="text-[10px] text-[#89919A] block mt-1">Choose the spacing</span>
          </div>

        </div>
      </div>

      {/* 4A. Webpage / In-App Notifications Card */}
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-[var(--primary-color,#145A4A)]" />
            <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
              In-App (Webpage) Notifications
            </h2>
          </div>
          <p className="text-xs text-[#5F6872] mt-0.5">
            Configure real-time alerts, popups, and badges on the TaskFlow website.
          </p>
        </div>

        <div className="space-y-3.5 pt-2 divide-y divide-[#DEDCD5] dark:divide-[#1E2D40]">
          {/* Row 1: Webpage Bell Alerts */}
          <div className="pt-3.5 first:pt-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3EF] text-[#4F8068] flex items-center justify-center flex-shrink-0">
                <Bell size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Webpage Bell Alerts & Badges</p>
                <p className="text-[11px] text-[#5F6872]">Show real-time notification popups and counter badges inside the web app.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWebpageNotifsEnabled(!webpageNotifsEnabled)}
              style={webpageNotifsEnabled ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                webpageNotifsEnabled ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${webpageNotifsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Row 2: Webpage Sound Effects */}
          <div className="pt-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E6] text-[#B78332] flex items-center justify-center flex-shrink-0">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Notification Sound Chime</p>
                <p className="text-[11px] text-[#5F6872]">Play a subtle chime sound when reminders alert on the website.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWebpageSoundEnabled(!webpageSoundEnabled)}
              style={webpageSoundEnabled ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                webpageSoundEnabled ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${webpageSoundEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Row 3: Sticky Overdue Task Banner */}
          <div className="pt-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F8EBEA] text-[#B65D52] flex items-center justify-center flex-shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Sticky Overdue Alert Banner</p>
                <p className="text-[11px] text-[#5F6872]">Display a prominent top banner when you have overdue tasks.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWebpageOverdueBanner(!webpageOverdueBanner)}
              style={webpageOverdueBanner ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                webpageOverdueBanner ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${webpageOverdueBanner ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 4B. Email Notifications Card */}
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Mail size={16} className="text-[var(--primary-color,#145A4A)]" />
            <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
              Email Notifications (Inbox Delivery)
            </h2>
          </div>
          <p className="text-xs text-[#5F6872] mt-0.5">
            Choose what updates and reports are delivered directly to your email inbox.
          </p>
        </div>

        <div className="space-y-3.5 pt-2 divide-y divide-[#DEDCD5] dark:divide-[#1E2D40]">
          
          {/* Row 1: Task Reminders */}
          <div className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EBF3EF] text-[#4F8068] flex items-center justify-center flex-shrink-0">
                <CalIcon size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Task Reminders</p>
                <p className="text-[11px] text-[#5F6872]">Get reminded about upcoming and overdue tasks via email.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={taskReminderFrequency}
                onChange={(e) => setTaskReminderFrequency(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none"
              >
                <option value="Daily">Daily</option>
                <option value="Hourly">Hourly</option>
                <option value="At due time">At due time</option>
                <option value="Off">Off</option>
              </select>

              <button
                type="button"
                onClick={() => setTaskReminderEnabled(!taskReminderEnabled)}
                style={taskReminderEnabled ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  taskReminderEnabled ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${taskReminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Row 2: Calendar Events */}
          <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F3EDF4] text-[#765C78] flex items-center justify-center flex-shrink-0">
                <CalendarDays size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Calendar Events</p>
                <p className="text-[11px] text-[#5F6872]">Receive email reminders for upcoming calendar events.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={calendarReminderTiming}
                onChange={(e) => setCalendarReminderTiming(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none"
              >
                <option value="10 minutes before">10 minutes before</option>
                <option value="30 minutes before">30 minutes before</option>
                <option value="1 hour before">1 hour before</option>
                <option value="1 day before">1 day before</option>
              </select>

              <button
                type="button"
                onClick={() => setCalendarReminderEnabled(!calendarReminderEnabled)}
                style={calendarReminderEnabled ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  calendarReminderEnabled ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${calendarReminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Row 3: Weekly Summary */}
          <div className="pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF2E6] text-[#B78332] flex items-center justify-center flex-shrink-0">
                <MailCheck size={16} />
              </div>
              <div>
                <p className="font-bold text-xs text-[#17202A] dark:text-white">Weekly Summary Report</p>
                <p className="text-[11px] text-[#5F6872]">Get a weekly overview of your productivity delivered to your email.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <select
                value={weeklySummaryTiming}
                onChange={(e) => setWeeklySummaryTiming(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#172638] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs text-[#17202A] dark:text-white focus:outline-none"
              >
                <option value="Every Monday, 9 AM">Every Monday, 9 AM</option>
                <option value="Every Friday, 5 PM">Every Friday, 5 PM</option>
                <option value="Every Sunday, 8 PM">Every Sunday, 8 PM</option>
              </select>

              <button
                type="button"
                onClick={() => setWeeklySummaryEnabled(!weeklySummaryEnabled)}
                style={weeklySummaryEnabled ? { backgroundColor: 'var(--primary-color, #145A4A)' } : {}}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  weeklySummaryEnabled ? '' : 'bg-[#DEDCD5] dark:bg-[#1E2D40]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${weeklySummaryEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

        </div>

        {/* Save Email Notification Preferences Button */}
        <div className="pt-3 border-t border-[#DEDCD5] dark:border-[#1E2D40] flex justify-end">
          <button
            type="button"
            onClick={handleSaveEmailPrefs}
            disabled={emailPrefsSaving}
            style={{ backgroundColor: 'var(--primary-color, #145A4A)' }}
            className="px-4 py-2 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save size={14} />
            <span>{emailPrefsSaving ? 'Saving...' : 'Save Email Notification Preferences'}</span>
          </button>
        </div>
      </div>

      {/* 5. Preferences Card */}
      <div className="card p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid size={16} className="text-[var(--primary-color,#145A4A)]" />
            <h2 className="font-serif font-bold text-base text-[#17202A] dark:text-white">
              Preferences
            </h2>
          </div>
          <p className="text-xs text-[#5F6872] mt-0.5">
            Set default behavior for your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          
          {/* Card 1: Default View */}
          <div className="p-4 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EEF3F8] text-[#61758A] flex items-center justify-center">
                <LayoutGrid size={14} />
              </div>
              <span className="font-bold text-xs text-[#17202A] dark:text-white">Default View</span>
            </div>
            <p className="text-[10px] text-[#5F6872]">Choose the default view</p>
            <select
              value={defaultView}
              onChange={(e) => setDefaultView(e.target.value)}
              className="w-full p-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none"
            >
              <option value="Tasks">Tasks</option>
              <option value="Dashboard">Dashboard</option>
              <option value="Calendar">Calendar</option>
              <option value="Notes">Notes & Reminders</option>
            </select>
          </div>

          {/* Card 2: Default Calendar View */}
          <div className="p-4 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#EBF3EF] text-[#4F8068] flex items-center justify-center">
                <CalIcon size={14} />
              </div>
              <span className="font-bold text-xs text-[#17202A] dark:text-white">Default Calendar View</span>
            </div>
            <p className="text-[10px] text-[#5F6872]">Choose how calendar opens</p>
            <select
              value={defaultCalendarView}
              onChange={(e) => setDefaultCalendarView(e.target.value)}
              className="w-full p-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none"
            >
              <option value="Day">Day</option>
              <option value="Week">Week</option>
              <option value="Month">Month</option>
              <option value="Year">Year</option>
            </select>
          </div>

          {/* Card 3: Default Task Sort */}
          <div className="p-4 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F3EDF4] text-[#765C78] flex items-center justify-center">
                <ArrowUpDown size={14} />
              </div>
              <span className="font-bold text-xs text-[#17202A] dark:text-white">Default Task Sort</span>
            </div>
            <p className="text-[10px] text-[#5F6872]">Choose task sorting order</p>
            <select
              value={defaultTaskSort}
              onChange={(e) => setDefaultTaskSort(e.target.value)}
              className="w-full p-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none"
            >
              <option value="Due Date (Earliest)">Due Date (Earliest)</option>
              <option value="Priority (High to Low)">Priority (High to Low)</option>
              <option value="Recently Created">Recently Created</option>
              <option value="Alphabetical">Alphabetical</option>
            </select>
          </div>

          {/* Card 4: Start of the Week */}
          <div className="p-4 rounded-2xl border border-[#DEDCD5] dark:border-[#1E2D40] bg-[#F7F5F0] dark:bg-[#172638] space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#FAF2E6] text-[#B78332] flex items-center justify-center">
                <Clock size={14} />
              </div>
              <span className="font-bold text-xs text-[#17202A] dark:text-white">Start of the Week</span>
            </div>
            <p className="text-[10px] text-[#5F6872]">Choose the first day of week</p>
            <select
              value={startOfWeek}
              onChange={(e) => setStartOfWeek(e.target.value)}
              className="w-full p-2 bg-white dark:bg-[#101C2B] border border-[#DEDCD5] dark:border-[#1E2D40] rounded-xl text-xs font-semibold text-[#17202A] dark:text-white focus:outline-none"
            >
              <option value="Sunday">Sunday</option>
              <option value="Monday">Monday</option>
              <option value="Saturday">Saturday</option>
            </select>
          </div>

        </div>
      </div>


      {/* 7. Footer Signature */}
      <div className="text-center pt-4 text-xs text-[#5F6872] dark:text-[#89919A]">
        <p>TaskFlow v1.0.0 • Made for better planning</p>
      </div>

    </div>
  )
}
