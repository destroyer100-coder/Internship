import { createContext, useContext, useState, useEffect } from 'react'

export const ACCENT_PRESETS = [
  {
    id: 'forest',
    name: 'Forest Green',
    hex: '#145A4A',
    hover: '#0F4639',
    light: '#E7F0EC',
    text: '#145A4A',
    ring: 'rgba(20, 90, 74, 0.25)',
    sidebarActive: '#145A4A',
    border: '#0F4639'
  },
  {
    id: 'navy',
    name: 'Deep Navy',
    hex: '#101C2B',
    hover: '#172638',
    light: '#EEF3F8',
    text: '#101C2B',
    ring: 'rgba(16, 28, 43, 0.25)',
    sidebarActive: '#172638',
    border: '#1E2D40'
  },
  {
    id: 'sage',
    name: 'Sage Success',
    hex: '#4F8068',
    hover: '#3D6853',
    light: '#EBF3EF',
    text: '#4F8068',
    ring: 'rgba(79, 128, 104, 0.25)',
    sidebarActive: '#4F8068',
    border: '#3D6853'
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    hex: '#B78332',
    hover: '#9B6C24',
    light: '#FAF2E6',
    text: '#B78332',
    ring: 'rgba(183, 131, 50, 0.25)',
    sidebarActive: '#B78332',
    border: '#9B6C24'
  },
  {
    id: 'plum',
    name: 'Muted Plum',
    hex: '#765C78',
    hover: '#5E4760',
    light: '#F3EDF4',
    text: '#765C78',
    ring: 'rgba(118, 92, 120, 0.25)',
    sidebarActive: '#765C78',
    border: '#5E4760'
  },
  {
    id: 'slate',
    name: 'Slate Info',
    hex: '#61758A',
    hover: '#4C5D70',
    light: '#EEF3F8',
    text: '#61758A',
    ring: 'rgba(97, 117, 138, 0.25)',
    sidebarActive: '#61758A',
    border: '#4C5D70'
  }
]

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // Theme state: 'light' | 'dark' | 'system'
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('taskflow_theme') || 'light'
  })

  // Accent color state - default to forest green
  const [accentColor, setAccentColorState] = useState(() => {
    const saved = localStorage.getItem('taskflow_accent')
    if (saved && ACCENT_PRESETS.some(p => p.id === saved)) {
      return saved
    }
    return 'forest'
  })

  // Interface density: 'Comfortable' | 'Compact' | 'Spacious'
  const [interfaceDensity, setInterfaceDensityState] = useState(() => {
    return localStorage.getItem('taskflow_density') || 'Comfortable'
  })

  // Custom User Avatar stored globally
  const [customAvatar, setCustomAvatarState] = useState(() => {
    return localStorage.getItem('taskflow_avatar') || null
  })

  // Apply Accent Color CSS variables to :root
  const applyAccent = (colorId) => {
    const preset = ACCENT_PRESETS.find(c => c.id === colorId) || ACCENT_PRESETS[0]
    const root = document.documentElement
    root.style.setProperty('--primary-color', preset.hex)
    root.style.setProperty('--primary-hover', preset.hover)
    root.style.setProperty('--primary-dark', preset.hover)
    root.style.setProperty('--primary-light', preset.light)
    root.style.setProperty('--primary-text', preset.text)
    root.style.setProperty('--primary-ring', preset.ring)
    root.style.setProperty('--sidebar-active-bg', preset.sidebarActive)
    root.style.setProperty('--sidebar-active-border', preset.border)
  }

  // Apply Theme class to documentElement
  const applyTheme = (themeMode) => {
    const root = document.documentElement
    if (themeMode === 'dark') {
      root.classList.add('dark')
    } else if (themeMode === 'light') {
      root.classList.remove('dark')
    } else if (themeMode === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
  }

  // Apply Density attribute
  const applyDensity = (density) => {
    document.documentElement.setAttribute('data-density', density.toLowerCase())
  }

  // Update theme and persist
  const setTheme = (newTheme) => {
    setThemeState(newTheme)
    localStorage.setItem('taskflow_theme', newTheme)
    applyTheme(newTheme)
  }

  // Update accent and persist
  const setAccentColor = (newAccent) => {
    setAccentColorState(newAccent)
    localStorage.setItem('taskflow_accent', newAccent)
    applyAccent(newAccent)
  }

  // Update density and persist
  const setInterfaceDensity = (newDensity) => {
    setInterfaceDensityState(newDensity)
    localStorage.setItem('taskflow_density', newDensity)
    applyDensity(newDensity)
  }

  // Update avatar and persist
  const setCustomAvatar = (avatarDataUrl) => {
    setCustomAvatarState(avatarDataUrl)
    if (avatarDataUrl) {
      localStorage.setItem('taskflow_avatar', avatarDataUrl)
    } else {
      localStorage.removeItem('taskflow_avatar')
    }
  }

  // Initial setup & system theme listener
  useEffect(() => {
    applyTheme(theme)
    applyAccent(accentColor)
    applyDensity(interfaceDensity)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [theme, accentColor, interfaceDensity])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        accentPresets: ACCENT_PRESETS,
        currentAccentPreset: ACCENT_PRESETS.find(c => c.id === accentColor) || ACCENT_PRESETS[0],
        interfaceDensity,
        setInterfaceDensity,
        customAvatar,
        setCustomAvatar
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
