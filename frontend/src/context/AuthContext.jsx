import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

function decodeToken(t) {
  try {
    const payload = JSON.parse(atob(t.split('.')[1]))
    if (payload.exp * 1000 < Date.now()) return null
    return { email: payload.sub, role: payload.role, userId: payload.userId, name: payload.name }
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('token')
    if (t && !decodeToken(t)) {
      // Token exists but is expired — purge it immediately
      localStorage.removeItem('token')
      return null
    }
    return t
  })
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('token')
    return t ? decodeToken(t) : null
  })

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token)
      if (!decoded) { logout(); return }
      setUser(decoded)
    } else {
      setUser(null)
    }
  }, [token])

  const login = (newToken) => {
    localStorage.setItem('token', newToken)
    setToken(newToken)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
