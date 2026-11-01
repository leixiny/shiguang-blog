import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api, errMsg, type UserInfo } from '../api'
import { useAuth } from '../auth'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return setError('请输入用户名和密码')
    setLoading(true)
    setError('')
    try {
      const r = await api.post<{ token: string; user: UserInfo }>('/auth/login', {
        username: username.trim(),
        password,
      })
      login(r.data.token, r.data.user)
      const from = (location.state as { from?: string } | null)?.from || '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(errMsg(err))
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>登录拾光志</h2>
        <p className="sub">登录后可以发布和管理你的学习笔记</p>
        {error && <div className="alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="l-username">用户名或邮箱</label>
          <input id="l-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="leixiny" />
        </div>
        <div className="field">
          <label htmlFor="l-password">密码</label>
          <input
            id="l-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
          />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '登录中…' : '登录'}
        </button>
        <p className="switch">
          还没有账号？<Link to="/register">去注册</Link>
        </p>
      </form>
    </div>
  )
}
