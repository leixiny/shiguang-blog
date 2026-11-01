import jwt from 'jsonwebtoken'

// JWT 鉴权中间件：从 Authorization: Bearer <token> 解析用户
export function authRequired(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ message: '请先登录' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' })
  }
}
