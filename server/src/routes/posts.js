import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { db } from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
const now = () => new Date().toISOString()

// 简单去除 Markdown 符号，生成列表摘要
function excerptOf(content, len = 120) {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`~\[\]()!|_-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, len)
}

function readMinutesOf(content) {
  return Math.max(1, Math.ceil(content.length / 400))
}

function decorate(row) {
  return {
    ...row,
    tags: JSON.parse(row.tags || '[]'),
    excerpt: excerptOf(row.content),
    read_minutes: readMinutesOf(row.content),
  }
}

// 文章列表：GET /api/posts?page=&pageSize=&categoryId=&keyword=&mine=1
router.get('/', async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 6))
  const { categoryId, keyword } = req.query

  const where = []
  const params = []
  if (categoryId) {
    where.push('p.category_id = ?')
    params.push(Number(categoryId))
  }
  if (keyword) {
    where.push('(p.title LIKE ? OR p.content LIKE ?)')
    params.push(`%${keyword}%`, `%${keyword}%`)
  }
  if (req.query.mine === '1') {
    const header = req.headers.authorization || ''
    // 列表的"我的文章"也需要登录态：软校验，失败视为空
    try {
      const payload = jwt.verify(header.startsWith('Bearer ') ? header.slice(7) : '', process.env.JWT_SECRET)
      where.push('p.author_id = ?')
      params.push(payload.id)
    } catch {
      where.push('1 = 0')
    }
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

  const total = db.prepare(`SELECT COUNT(*) AS c FROM posts p ${whereSql}`).get(...params).c
  const list = db
    .prepare(
      `SELECT p.id, p.title, p.cover, p.tags, p.views, p.created_at, p.content, p.author_id,
              u.username AS author, c.name AS category,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comments_count
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN categories c ON c.id = p.category_id
       ${whereSql}
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize)

  res.json({ list: list.map(decorate), total, page, pageSize })
})

// 文章详情：GET /api/posts/:id（浏览次数 +1）
router.get('/:id', (req, res) => {
  const id = Number(req.params.id)
  db.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').run(id)
  const row = db
    .prepare(
      `SELECT p.*, u.username AS author, c.name AS category
       FROM posts p
       JOIN users u ON u.id = p.author_id
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`
    )
    .get(id)
  if (!row) return res.status(404).json({ message: '文章不存在' })
  res.json({ post: decorate(row) })
})

// 创建文章：POST /api/posts（需登录）
router.post('/', authRequired, (req, res) => {
  const { title, content, categoryId, tags, cover } = req.body || {}
  if (!title || !String(title).trim()) return res.status(400).json({ message: '请填写标题' })
  if (!content || !String(content).trim()) return res.status(400).json({ message: '请填写正文' })
  if (categoryId) {
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId))
    if (!cat) return res.status(400).json({ message: '分类不存在' })
  }
  const tagsJson = JSON.stringify(Array.isArray(tags) ? tags.slice(0, 6).map(String) : [])
  const result = db
    .prepare(
      `INSERT INTO posts (title, content, cover, category_id, tags, author_id, views, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
    )
    .run(
      String(title).trim(),
      String(content),
      cover ? String(cover) : null,
      categoryId ? Number(categoryId) : null,
      tagsJson,
      req.user.id,
      now(),
      now()
    )
  res.status(201).json({ id: Number(result.lastInsertRowid) })
})

// 更新文章：PUT /api/posts/:id（仅作者本人）
router.put('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id)
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
  if (!post) return res.status(404).json({ message: '文章不存在' })
  if (post.author_id !== req.user.id) return res.status(403).json({ message: '只能编辑自己的文章' })

  const { title, content, categoryId, tags, cover } = req.body || {}
  if (categoryId) {
    const cat = db.prepare('SELECT id FROM categories WHERE id = ?').get(Number(categoryId))
    if (!cat) return res.status(400).json({ message: '分类不存在' })
  }
  db.prepare(
    `UPDATE posts SET title = ?, content = ?, cover = ?, category_id = ?, tags = ?, updated_at = ?
     WHERE id = ?`
  ).run(
    title && String(title).trim() ? String(title).trim() : post.title,
    content && String(content).trim() ? String(content) : post.content,
    cover === undefined ? post.cover : cover ? String(cover) : null,
    categoryId === undefined ? post.category_id : categoryId ? Number(categoryId) : null,
    tags === undefined ? post.tags : JSON.stringify(Array.isArray(tags) ? tags.slice(0, 6).map(String) : []),
    now(),
    id
  )
  res.json({ ok: true })
})

// 删除文章：DELETE /api/posts/:id（仅作者本人）
router.delete('/:id', authRequired, (req, res) => {
  const id = Number(req.params.id)
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id)
  if (!post) return res.status(404).json({ message: '文章不存在' })
  if (post.author_id !== req.user.id) return res.status(403).json({ message: '只能删除自己的文章' })
  db.prepare('DELETE FROM posts WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default router
