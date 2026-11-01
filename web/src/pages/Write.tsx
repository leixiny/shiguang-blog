import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, errMsg, type Category, type PostDetail as PostDetailType } from '../api'

export default function Write() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get('id')

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [tags, setTags] = useState('')
  const [cover, setCover] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get<{ list: Category[] }>('/categories').then((r) => setCategories(r.data.list)).catch(() => {})
  }, [])

  // 编辑模式：加载已有文章
  useEffect(() => {
    if (!editId) return
    api
      .get<{ post: PostDetailType }>(`/posts/${editId}`)
      .then((r) => {
        const p = r.data.post
        setTitle(p.title)
        setContent(p.content)
        setCategoryId(p.category_id ? String(p.category_id) : '')
        setTags(p.tags.join(' '))
        setCover(p.cover || '')
      })
      .catch((e) => setError(errMsg(e)))
  }, [editId])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('请填写标题')
    if (!content.trim()) return setError('请填写正文')
    setSaving(true)
    setError('')
    const payload = {
      title: title.trim(),
      content,
      categoryId: categoryId ? Number(categoryId) : null,
      tags: tags.split(/[\s,，]+/).filter(Boolean),
      cover: cover.trim() || null,
    }
    try {
      if (editId) {
        await api.put(`/posts/${editId}`, payload)
        navigate(`/post/${editId}`)
      } else {
        const r = await api.post<{ id: number }>('/posts', payload)
        navigate(`/post/${r.data.id}`)
      }
    } catch (err) {
      setError(errMsg(err))
      setSaving(false)
    }
  }

  return (
    <>
      <h2 className="page-title">{editId ? '编辑文章' : '写一篇新笔记'}</h2>
      <p className="page-sub">左侧写 Markdown，右侧实时预览；支持 GFM 表格、删除线等语法。</p>

      <form onSubmit={handleSubmit}>
        <div className="form-card">
          {error && <div className="alert-error">{error}</div>}
          <div className="field">
            <label htmlFor="w-title">标题</label>
            <input
              id="w-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="一句话说清这篇笔记讲什么"
            />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="w-cat">分类</label>
              <select id="w-cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">未分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="w-tags">标签</label>
              <input
                id="w-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="用空格或逗号分隔，如：SQL 可视化"
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="w-cover">封面图 URL（可选）</label>
            <input
              id="w-cover"
              value={cover}
              onChange={(e) => setCover(e.target.value)}
              placeholder="https://… 留空则使用蓝粉渐变封面"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? '保存中…' : editId ? '保存修改' : '发布笔记'}
          </button>
        </div>

        <div className="writer-grid">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'## 小标题\n\n正文支持 **加粗**、`代码`、> 引用、表格等 Markdown 语法。'}
          />
          <div className="preview-pane markdown">
            <Markdown remarkPlugins={[remarkGfm]}>{content || '*预览区：开始输入即可实时渲染*'}</Markdown>
          </div>
        </div>
      </form>
    </>
  )
}
