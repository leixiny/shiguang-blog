import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api, errMsg, type Category, type PostListItem } from '../api'
import PostCard from '../components/PostCard'

// 笔记列表页：分类筛选 + 搜索 + 分页
export default function Posts() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || 1)
  const categoryId = params.get('category') || ''
  const keyword = params.get('q') || ''

  const [posts, setPosts] = useState<PostListItem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState(keyword)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<{ list: Category[] }>('/categories')
      .then((r) => setCategories(r.data.list))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      api
        .get<{ list: PostListItem[]; total: number; pages: number }>('/posts', {
          params: { page, pageSize: 9, categoryId: categoryId || undefined, keyword: keyword || undefined },
        })
        .then((r) => {
          setPosts(r.data.list)
          setTotal(r.data.total)
          setPages(r.data.pages)
          setError('')
        })
        .catch((e) => setError(errMsg(e)))
    }, keyword ? 400 : 0)
    return () => clearTimeout(timer)
  }, [page, categoryId, keyword])

  function applyPatch(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) next.delete(k)
      else next.set(k, v)
    }
    setParams(next)
  }

  return (
    <>
      <h2 className="page-title">学习笔记</h2>
      <p className="page-sub">共 {total} 篇 · 按专栏筛选，或搜索关键词</p>

      <div className="filter-bar">
        <div className="chips">
          <button
            type="button"
            className={`chip ${categoryId === '' ? 'active' : ''}`}
            onClick={() => applyPatch({ category: undefined, page: '1' })}
          >
            全部
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`chip ${categoryId === String(c.id) ? 'active' : ''}`}
              onClick={() => applyPatch({ category: String(c.id), page: '1' })}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="search">
          <input
            placeholder="搜索标题 / 内容…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyPatch({ q: search.trim() || undefined, page: '1' })}
          />
        </div>
      </div>

      {error && <p className="empty">{error}</p>}
      {!error && posts.length === 0 && <p className="empty">没有找到笔记，换个关键词试试？</p>}

      <div className="post-grid">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} onClick={() => navigate(`/post/${p.id}`)} />
        ))}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="page-btn"
            disabled={page <= 1}
            onClick={() => applyPatch({ page: String(page - 1) })}
          >
            ← 上一页
          </button>
          <span className="page-info">
            第 {page} / {pages} 页
          </span>
          <button
            type="button"
            className="page-btn"
            disabled={page >= pages}
            onClick={() => applyPatch({ page: String(page + 1) })}
          >
            下一页 →
          </button>
        </div>
      )}
    </>
  )
}
