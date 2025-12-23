import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'
import {
  type UserRole,
  type Permission,
  type SafeUser,
  type ApiResponse,
  type LoginResponse,
  rolePermissions,
} from '@/types'

// Re-export types for convenience
export type { UserRole, Permission, SafeUser }
export { rolePermissions }

// Hydration-safe hook for stores with persist middleware
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}

// Risk levels inherited from types
import { type RiskLevel } from '@/types'
export type { RiskLevel }

// Assessment domains based on WHO ICOPE
export const assessmentDomains = [
  { id: 'cognition', name: 'Cognition', icon: 'Brain', description: 'Memory, thinking, and mental clarity' },
  { id: 'mobility', name: 'Mobility', icon: 'Footprints', description: 'Walking, balance, and physical movement' },
  { id: 'nutrition', name: 'Nutrition', icon: 'Apple', description: 'Diet, appetite, and weight management' },
  { id: 'vision', name: 'Vision', icon: 'Eye', description: 'Eyesight and visual health' },
  { id: 'hearing', name: 'Hearing', icon: 'Ear', description: 'Hearing ability and ear health' },
  { id: 'depression', name: 'Mental Health', icon: 'Heart', description: 'Mood, emotions, and psychological wellbeing' },
  { id: 'social', name: 'Social Health', icon: 'Users', description: 'Social connections and support network' },
  { id: 'medication', name: 'Medication', icon: 'Pill', description: 'Medicine management and adherence' },
  { id: 'falls', name: 'Fall Risk', icon: 'AlertTriangle', description: 'Risk of falls and accidents' },
  { id: 'sleep', name: 'Sleep', icon: 'Moon', description: 'Sleep quality and patterns' },
  { id: 'pain', name: 'Pain Management', icon: 'Activity', description: 'Chronic pain and discomfort' },
  { id: 'adl', name: 'Daily Activities', icon: 'Home', description: 'Ability to perform daily tasks' },
  { id: 'continence', name: 'Continence', icon: 'Droplet', description: 'Bladder and bowel control' },
  { id: 'oral', name: 'Oral Health', icon: 'Smile', description: 'Teeth, gums, and mouth health' },
  { id: 'skin', name: 'Skin Health', icon: 'Shield', description: 'Skin condition and wound care' },
  { id: 'respiratory', name: 'Respiratory', icon: 'Wind', description: 'Breathing and lung health' },
  { id: 'cardiovascular', name: 'Heart Health', icon: 'HeartPulse', description: 'Heart and circulation' },
  { id: 'diabetes', name: 'Diabetes Care', icon: 'Syringe', description: 'Blood sugar management' },
  { id: 'caregiver', name: 'Caregiver Support', icon: 'HandHeart', description: 'Support for caregivers' },
  { id: 'palliative', name: 'Palliative Care', icon: 'Flower2', description: 'End-of-life care needs' },
] as const

// Auth store interface
interface AuthState {
  user: SafeUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  register: (email: string, password: string, name: string, phone?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshAuth: () => Promise<boolean>
  fetchCurrentUser: () => Promise<void>
  setUser: (user: SafeUser | null) => void
  clearError: () => void
  hasPermission: (permission: Permission) => boolean
  hasRole: (roles: UserRole[]) => boolean
}

// UI store interface
interface UIState {
  sidebarCollapsed: boolean
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  fontScale: 'normal' | 'large' | 'xlarge' | 'xxlarge'
  highContrast: boolean
  toggleSidebarCollapse: () => void
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setFontScale: (scale: 'normal' | 'large' | 'xlarge' | 'xxlarge') => void
  setHighContrast: (enabled: boolean) => void
}

// Auth store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, rememberMe }),
          })

          const data: ApiResponse<LoginResponse> = await response.json()

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: data.error || 'Login failed',
            })
            return false
          }
        } catch (error) {
          console.error('Login error:', error)
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
          })
          return false
        }
      },

      register: async (email: string, password: string, name: string, phone?: string, role?: UserRole) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, name, phone, role }),
          })

          const data: ApiResponse<LoginResponse> = await response.json()

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            return { success: true }
          } else {
            set({
              isLoading: false,
              error: data.error || 'Registration failed',
            })
            return { success: false, error: data.error }
          }
        } catch (error) {
          console.error('Registration error:', error)
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
          })
          return { success: false, error: 'Network error' }
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          set({ user: null, isAuthenticated: false, error: null })
        }
      },

      refreshAuth: async () => {
        try {
          const response = await fetch('/api/auth/refresh', { method: 'POST' })
          const data = await response.json()
          return data.success
        } catch {
          return false
        }
      },

      fetchCurrentUser: async () => {
        set({ isLoading: true })

        try {
          const response = await fetch('/api/auth/me')
          const data: ApiResponse<SafeUser> = await response.json()

          if (data.success && data.data) {
            set({
              user: data.data,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      clearError: () => {
        set({ error: null })
      },

      hasPermission: (permission: Permission) => {
        const { user } = get()
        if (!user) return false
        return rolePermissions[user.role].includes(permission)
      },

      hasRole: (roles: UserRole[]) => {
        const { user } = get()
        if (!user) return false
        return roles.includes(user.role)
      },
    }),
    {
      name: 'vayo-auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
)

// UI store
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarOpen: false,
      theme: 'light',
      fontScale: 'normal',
      highContrast: false,

      toggleSidebarCollapse: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarOpen: (open) => {
        set({ sidebarOpen: open })
      },

      setTheme: (theme) => {
        set({ theme })
      },

      setFontScale: (scale) => {
        set({ fontScale: scale })
        // Apply font scale to HTML element
        if (typeof window !== 'undefined') {
          const html = document.documentElement
          html.classList.remove('font-scale-large', 'font-scale-xlarge', 'font-scale-xxlarge')
          if (scale !== 'normal') {
            html.classList.add(`font-scale-${scale}`)
          }
        }
      },

      setHighContrast: (enabled) => {
        set({ highContrast: enabled })
        if (typeof window !== 'undefined') {
          const html = document.documentElement
          if (enabled) {
            html.classList.add('high-contrast')
          } else {
            html.classList.remove('high-contrast')
          }
        }
      },
    }),
    {
      name: 'vayo-ui-storage',
    }
  )
)

// Combined hook for convenience
export function useStore() {
  const auth = useAuthStore()
  const ui = useUIStore()
  return { ...auth, ...ui }
}

// Helper to get risk level color classes
export function getRiskLevelStyles(level: RiskLevel) {
  const styles = {
    healthy: {
      bg: 'bg-healthy-light',
      text: 'text-healthy-dark',
      border: 'border-healthy',
      badge: 'bg-healthy-light text-healthy-dark border-healthy/30',
    },
    'at_risk': {
      bg: 'bg-at-risk-light',
      text: 'text-at-risk-dark',
      border: 'border-at-risk',
      badge: 'bg-at-risk-light text-at-risk-dark border-at-risk/30',
    },
    intervention: {
      bg: 'bg-intervention-light',
      text: 'text-intervention-dark',
      border: 'border-intervention',
      badge: 'bg-intervention-light text-intervention-dark border-intervention/30',
    },
  }
  return styles[level]
}
