import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import './db.js'
import { seedIfEmpty } from './seed.js'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import postRoutes from './routes/posts.js'
import commentRoutes from './routes/comments.js'

seedIfEmpty()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 生产模式：托管前端构建产物（前后端同源单服务）
const webDist = path.join(__dirname, '../../web/dist')

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.static(webDist))

app.get('/api/health', (_req, res) => res.json({ ok: true, name: 'shiguang-blog-api' }))

app.use('/api/auth', authRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/posts', postRoutes)
app.use('/api', commentRoutes)

// 404
app.use('/api', (_req, res) => res.status(404).json({ message: '接口不存在' }))

// SPA 回退：非 /api 的 GET 请求统一返回前端入口（支持前端路由刷新）
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(webDist, 'index.html'))
  }
  next()
})

// 统一错误处理中间件
app.use((err, _req, res, _next) => {
  console.error('[error]', err)
  res.status(500).json({ message: '服务器开小差了，请稍后再试' })
})

const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, () => {
  console.log(`[shiguang-blog] 服务已启动: http://localhost:${PORT}`)
})
