import { Router } from 'express'
import { db } from '../db.js'
import { authRequired } from '../middleware/auth.js'

const router = Router()
const now = () => new Date().toISOString()

// 评论列表（公开）：GET /api/posts/:id/comments
router.get('/posts/:id/comments', (req, res) => {
  const postId = Number(req.params.id)
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) return res.status(404).json({ message: '文章不存在' })
  const list = db
    .prepare(
      `SELECT cm.id, cm.content, cm.created_at, cm.author_id, u.username AS author
       FROM comments cm
       JOIN users u ON u.id = cm.author_id
       WHERE cm.post_id = ?
       ORDER BY cm.created_at ASC`
    )
    .all(postId)
  res.json({ list })
})

// 发表评论：POST /api/posts/:id/comments（需登录）
router.post('/posts/:id/comments', authRequired, (req, res) => {
  const postId = Number(req.params.id)
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId)
  if (!post) return res.status(404).json({ message: '文章不存在' })
  const content = String(req.body?.content || '').trim()
  if (!content) return res.status(400).json({ message: '评论内容不能为空' })
  if (content.length > 1000) return res.status(400).json({ message: '评论最多 1000 字' })
  const result = db
    .prepare('INSERT INTO comments (post_id, author_id, content, created_at) VALUES (?, ?, ?, ?)')
    .run(postId, req.user.id, content, now())
  const row = db
    .prepare(
      `SELECT cm.id, cm.content, cm.created_at, cm.author_id, u.username AS author
       FROM comments cm JOIN users u ON u.id = cm.author_id WHERE cm.id = ?`
    )
    .get(Number(result.lastInsertRowid))
  res.status(201).json({ comment: row })
})

// 删除评论：DELETE /api/comments/:id（仅评论人本人）
router.delete('/comments/:id', authRequired, (req, res) => {
  const id = Number(req.params.id)
  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id)
  if (!comment) return res.status(404).json({ message: '评论不存在' })
  if (comment.author_id !== req.user.id) return res.status(403).json({ message: '只能删除自己的评论' })
  db.prepare('DELETE FROM comments WHERE id = ?').run(id)
  res.json({ ok: true })
})

export default router
