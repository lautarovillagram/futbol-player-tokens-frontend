import { createContext, useContext, useState, useCallback } from 'react'
import { auth as authApi } from '../api/endpoints'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [userId, setUserId] = useState(() => {
    const stored = localStorage.getItem('userId')
    return stored ? Number(stored) : null
  })
  const [username, setUsername] = useState(() => localStorage.getItem('username'))

  const login = useCallback(async (username, password) => {
    const res = await authApi.login(username, password)
    const data = res.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('userId', data.userId)
    localStorage.setItem('username', username)
    setToken(data.token)
    setUserId(data.userId)
    setUsername(username)
    return data
  }, [])

  const register = useCallback(async (username, password, email) => {
    const res = await authApi.register(username, password, email)
    return res.data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('username')
    setToken(null)
    setUserId(null)
    setUsername(null)
    authApi.logout().catch(() => {})
  }, [])

  return (
    <AuthContext.Provider value={{ token, userId, username, isAuthenticated: !!token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
