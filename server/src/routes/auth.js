import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
const now = () => new Date().toISOString()
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

function publicUser(u) {
  return { id: u.id, username: u.username, email: u.email, avatar: u.avatar }
}

// 注册：POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {}
  if (!username || typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 20) {
    return res.status(400).json({ message: '用户名需要 3-20 个字符' })
  }
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ message: '邮箱格式不正确' })
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ message: '密码至少 6 位' })
  }
  const name = username.trim()
  const mail = email.trim().toLowerCase()
  const exists = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(name, mail)
  if (exists) {
    return res.status(409).json({ message: '用户名或邮箱已被注册' })
  }
  const result = db
    .prepare('INSERT INTO users (username, email, password, avatar, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(name, mail, bcrypt.hashSync(password, 10), '', now())
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(result.lastInsertRowid))
  res.status(201).json({ token: signToken(user), user: publicUser(user) })
})

// 登录：POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {}
  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' })
  }
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(username.trim(), username.trim().toLowerCase())
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: '用户名或密码错误' })
  }
  res.json({ token: signToken(user), user: publicUser(user) })
})

// 当前用户：GET /api/auth/me
router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id)
  if (!user) return res.status(404).json({ message: '用户不存在' })
  res.json({ user: publicUser(user) })
})

export default router
