import React, { createContext, useContext, useState, useEffect } from 'react'
import { api, getToken } from '@/services/api'
import type { UserResponse } from '@/types/api'

interface AuthContextType {
  user: UserResponse | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    fullName: string
    phone?: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isAdmin: boolean
  isLibrarian: boolean
  canAccessAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken())
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      if (getToken()) {
        const u = await api.getCurrentUser()
        setUser(u)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
      api.logout()
      setTokenState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string) => {
    await api.login(email, password)
    setTokenState(getToken())
    await refreshUser()
  }

  const register = async (data: {
    username: string
    email: string
    password: string
    fullName: string
    phone?: string
  }) => {
    await api.register(data)
  }

  const logout = () => {
    api.logout()
    setUser(null)
    setTokenState(null)
  }

  const isAdmin = user?.role === 'ADMIN'
  const isLibrarian = user?.role === 'LIBRARIAN'
  const canAccessAdmin = isAdmin || isLibrarian

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isLibrarian,
        canAccessAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
