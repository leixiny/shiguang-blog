import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, type Category, type PostListItem } from '../api'
import { useAuth } from '../auth'

// 首页 = 落地页：只做介绍与入口，不直接展示笔记内容
export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [totalViews, setTotalViews] = useState(0)
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    api
      .get<{ list: Category[] }>('/categories')
      .then((r) => setCategories(r.data.list))
      .catch(() => {})
    api
      .get<{ list: PostListItem[]; total: number }>('/posts', { params: { page: 1, pageSize: 50 } })
      .then((r) => {
        setTotal(r.data.total)
        setTotalViews(r.data.list.reduce((s, p) => s + p.views, 0))
      })
      .catch(() => {})
  }, [])

  return (
    <section className="hero hero-landing">
      <p className="eyebrow">数字经济 · 在读 · 学习笔记</p>
      <h1>
        把学过的东西<br />
        写成<span>看得见的成长</span>
      </h1>
      <p className="tagline">
        这里记录我的课程笔记、项目复盘与行业观察——学完不写等于没学，写下来才算真的学会。
      </p>
      <div className="hero-cta">
        <button type="button" className="btn btn-primary" onClick={() => navigate('/posts')}>
          查看笔记 →
        </button>
        {user ? (
          <Link className="btn btn-ghost" to="/write">
            写一篇笔记
          </Link>
        ) : (
          <Link className="btn btn-ghost" to="/register">
            注册账号
          </Link>
        )}
      </div>
      <div className="hero-stats">
        <span>
          <strong>{total}</strong> 篇笔记
        </span>
        <span>
          <strong>{totalViews}</strong> 次阅读
        </span>
        <span>
          <strong>{categories.length}</strong> 个专栏
        </span>
      </div>
    </section>
  )
}
