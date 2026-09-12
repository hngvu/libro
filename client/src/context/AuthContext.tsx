import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { api, getToken } from '@/services/api'
import type { UserResponse } from '@/types/api'

interface AuthContextType {
  user: UserResponse | null
  rawUser: UserResponse | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserResponse | null>
  register: (data: {
    email: string
    password: string
    fullName: string
    username?: string
    phone?: string
  }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<UserResponse | null>
  isAdmin: boolean
  isLibrarian: boolean
  canAccessAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const [rawUser, setRawUser] = useState<UserResponse | null>(null)
  const [token, setTokenState] = useState<string | null>(getToken())
  const [loading, setLoading] = useState(true)

  const isStaffRoute = location.pathname.startsWith('/admin')

  // Effective user: Outside of /admin/**, non-MEMBER accounts are treated as null (unauthenticated)
  const user = useMemo(() => {
    if (!rawUser) return null
    if (!isStaffRoute && rawUser.role !== 'MEMBER') {
      return null
    }
    return rawUser
  }, [rawUser, isStaffRoute])

  const refreshUser = async (): Promise<UserResponse | null> => {
    try {
      if (getToken()) {
        const u = await api.getCurrentUser()
        setRawUser(u)
        return u
      } else {
        setRawUser(null)
        return null
      }
    } catch {
      setRawUser(null)
      api.logout()
      setTokenState(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const login = async (email: string, password: string): Promise<UserResponse | null> => {
    await api.login(email, password)
    setTokenState(getToken())
    return await refreshUser()
  }

  const register = async (data: {
    email: string
    password: string
    fullName: string
    username?: string
    phone?: string
  }) => {
    await api.register(data)
  }

  const logout = () => {
    api.logout()
    setRawUser(null)
    setTokenState(null)
  }

  const isAdmin = rawUser?.role === 'ADMIN'
  const isLibrarian = rawUser?.role === 'LIBRARIAN'
  const canAccessAdmin = isAdmin || isLibrarian

  return (
    <AuthContext.Provider
      value={{
        user,
        rawUser,
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
