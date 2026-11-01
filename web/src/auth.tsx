import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { UserInfo } from './api'
import { api } from './api'

interface AuthState {
  user: UserInfo | null
  ready: boolean
  login: (token: string, user: UserInfo) => void
  logout: () => void
}

const AuthCtx = createContext<AuthState>({
  user: null,
  ready: false,
  login: () => {},
  logout: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as UserInfo) : null
  })
  const [ready, setReady] = useState(false)

  // 启动时用 token 校验登录态是否仍然有效
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setReady(true)
      return
    }
    api
      .get<{ user: UserInfo }>('/auth/me')
      .then((r) => {
        setUser(r.data.user)
        localStorage.setItem('user', JSON.stringify(r.data.user))
      })
      .catch(() => {
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      })
      .finally(() => setReady(true))
  }, [])

  function login(token: string, u: UserInfo) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, ready, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  return useContext(AuthCtx)
}
