import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import api from '../services/api'

type User = {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  role?: string
}

type AuthResponse = {
  user: User
  token: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('vacation-token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('vacation-user')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        localStorage.removeItem('vacation-user')
      }
    }
    setLoading(false)
  }, [])

  const persistAuth = (auth: AuthResponse) => {
    localStorage.setItem('vacation-token', auth.token)
    localStorage.setItem('vacation-user', JSON.stringify(auth.user))
    setToken(auth.token)
    setUser(auth.user)
  }

  const login = async (email: string, password: string) => {
    const response = await api.post<AuthResponse>('/auth/login', { email, password })
    persistAuth(response.data)
  }

  const register = async (payload: RegisterPayload) => {
    const response = await api.post<AuthResponse>('/auth/register', payload)
    persistAuth(response.data)
  }

  const logout = () => {
    localStorage.removeItem('vacation-token')
    localStorage.removeItem('vacation-user')
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
