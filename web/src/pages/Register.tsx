import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, errMsg, type UserInfo } from '../api'
import { useAuth } from '../auth'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!username.trim() || username.trim().length < 3 || username.trim().length > 20)
      return setError('用户名需要 3-20 个字符')
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('请输入正确的邮箱')
    if (password.length < 6) return setError('密码至少 6 位')
    setLoading(true)
    setError('')
    try {
      const r = await api.post<{ token: string; user: UserInfo }>('/auth/register', {
        username: username.trim(),
        email: email.trim(),
        password,
      })
      login(r.data.token, r.data.user)
      navigate('/')
    } catch (err) {
      setError(errMsg(err))
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>注册拾光志</h2>
        <p className="sub">一分钟注册，开始记录你的学习轨迹</p>
        {error && <div className="alert-error">{error}</div>}
        <div className="field">
          <label htmlFor="r-username">用户名（3-20 字符）</label>
          <input id="r-username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="你的昵称" />
        </div>
        <div className="field">
          <label htmlFor="r-email">邮箱</label>
          <input id="r-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="r-password">密码（至少 6 位）</label>
          <input id="r-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" />
        </div>
        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '注册中…' : '注册并登录'}
        </button>
        <p className="switch">
          已有账号？<Link to="/login">去登录</Link>
        </p>
      </form>
    </div>
  )
}
