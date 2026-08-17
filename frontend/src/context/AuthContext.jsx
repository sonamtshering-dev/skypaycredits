// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Rely on the httpOnly cookie for auth — just verify the session is still valid
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    api.get('/auth/me').then(r => {
      setUser(r.data)
      localStorage.setItem('user', JSON.stringify(r.data))
    }).catch(() => {
      localStorage.removeItem('user')
      setUser(null)
    }).finally(() => setLoading(false))
  }, [])

  const login = (_token, userData) => {
    // Token is stored in httpOnly cookie by the server — we only cache user profile data
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    localStorage.removeItem('user')
    setUser(null)
  }

  const isAdmin    = user?.role === 'admin'
  const isReseller = user?.role === 'reseller'

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isReseller }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)