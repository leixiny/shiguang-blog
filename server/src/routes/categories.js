import { Router } from 'express'
import { db } from '../db.js'

const router = Router()

// 分类列表（含文章数）：GET /api/categories
router.get('/', (_req, res) => {
  const list = db
    .prepare(
      `SELECT c.id, c.name, c.description, COUNT(p.id) AS post_count
       FROM categories c
       LEFT JOIN posts p ON p.category_id = c.id
       GROUP BY c.id
       ORDER BY c.id`
    )
    .all()
  res.json({ list })
})

export default router
