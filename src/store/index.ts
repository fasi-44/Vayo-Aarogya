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

// Profile selection for multi-profile login
export interface LoginProfile {
  id: string
  name: string
  role: UserRole
  vayoId?: string
  avatar?: string
}

// Auth store interface
interface AuthState {
  user: SafeUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  // Multi-profile login support
  pendingProfiles: LoginProfile[] | null
  pendingLoginCredentials: { phone: string; password: string; rememberMe: boolean } | null
  login: (phone: string, password: string, rememberMe?: boolean) => Promise<boolean>
  loginWithProfile: (profileId: string) => Promise<boolean>
  clearPendingProfiles: () => void
  register: (phone: string, password: string, name: string, email?: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>
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
      pendingProfiles: null,
      pendingLoginCredentials: null,

      login: async (phone: string, password: string, rememberMe: boolean = false) => {
        set({ isLoading: true, error: null, pendingProfiles: null, pendingLoginCredentials: null })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, rememberMe }),
          })

          const data: ApiResponse<any> = await response.json()

          if (data.success && data.data) {
            // Check if multiple profiles need selection
            if (data.data.requiresProfileSelection && data.data.profiles) {
              set({
                isLoading: false,
                pendingProfiles: data.data.profiles,
                pendingLoginCredentials: { phone, password, rememberMe },
              })
              return false // Not logged in yet, needs profile selection
            }

            // Single profile login
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              pendingProfiles: null,
              pendingLoginCredentials: null,
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

      loginWithProfile: async (profileId: string) => {
        const credentials = get().pendingLoginCredentials
        if (!credentials) {
          set({ error: 'No pending login. Please try again.' })
          return false
        }

        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone: credentials.phone,
              password: credentials.password,
              rememberMe: credentials.rememberMe,
              profileId,
            }),
          })

          const data: ApiResponse<LoginResponse> = await response.json()

          if (data.success && data.data) {
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              pendingProfiles: null,
              pendingLoginCredentials: null,
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
          console.error('Login with profile error:', error)
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
          })
          return false
        }
      },

      clearPendingProfiles: () => {
        set({ pendingProfiles: null, pendingLoginCredentials: null })
      },

      register: async (phone: string, password: string, name: string, email?: string, role?: UserRole) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password, name, email, role }),
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
