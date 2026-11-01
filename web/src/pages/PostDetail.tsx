import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api, errMsg, formatDateCN, type PostDetail as PostDetailType } from '../api'
import { useAuth } from '../auth'

interface CommentItem {
  id: number
  content: string
  created_at: string
  author_id: number
  author: string
}

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [post, setPost] = useState<PostDetailType | null>(null)
  const [error, setError] = useState('')
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentError, setCommentError] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    setPost(null)
    setError('')
    api
      .get<{ post: PostDetailType }>(`/posts/${id}`)
      .then((r) => setPost(r.data.post))
      .catch((e) => setError(errMsg(e)))
  }, [id])

  useEffect(() => {
    api
      .get<{ list: CommentItem[] }>(`/posts/${id}/comments`)
      .then((r) => setComments(r.data.list))
      .catch(() => {})
  }, [id])

  async function handleSubmitComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return setCommentError('评论内容不能为空')
    setPosting(true)
    setCommentError('')
    try {
      const r = await api.post<{ comment: CommentItem }>(`/posts/${id}/comments`, {
        content: commentText.trim(),
      })
      setComments((prev) => [...prev, r.data.comment])
      setCommentText('')
    } catch (err) {
      setCommentError(errMsg(err))
    } finally {
      setPosting(false)
    }
  }

  async function handleDeleteComment(commentId: number) {
    if (!window.confirm('确定删除这条评论吗？')) return
    try {
      await api.delete(`/comments/${commentId}`)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(errMsg(err))
    }
  }

  async function handleDelete() {
    if (!post) return
    if (!window.confirm(`确定删除《${post.title}》吗？删除后不可恢复。`)) return
    try {
      await api.delete(`/posts/${post.id}`)
      navigate('/')
    } catch (e) {
      alert(errMsg(e))
    }
  }

  if (error) return <p className="empty">{error}</p>
  if (!post) return <p className="empty">正在加载文章…</p>

  const isAuthor = user && user.id === post.author_id

  return (
    <article className="detail">
      <div className="detail-head">
        <h1>{post.title}</h1>
        <div className="detail-meta">
          {post.category && <span className="badge">{post.category}</span>}
          <span>{post.author}</span>
          <span>{formatDateCN(post.created_at)} 发布</span>
          <span>{post.views} 阅读</span>
          <span>约 {post.read_minutes} 分钟</span>
          {isAuthor && (
            <span className="detail-actions">
              <Link className="btn btn-ghost btn-sm" to={`/write?id=${post.id}`}>
                编辑
              </Link>
              <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete}>
                删除
              </button>
            </span>
          )}
        </div>
      </div>

      {post.cover && <img className="detail-cover" src={post.cover} alt={post.title} />}

      {post.tags.length > 0 && (
        <div className="post-meta" style={{ marginTop: 16 }}>
          {post.tags.map((t) => (
            <span key={t} className="badge pink">
              # {t}
            </span>
          ))}
        </div>
      )}

      <div className="markdown">
        <Markdown remarkPlugins={[remarkGfm]}>{post.content}</Markdown>
      </div>

      <section className="comments">
        <h2 className="comments-title">讨论 · {comments.length} 条</h2>

        {user ? (
          <form className="comment-form" onSubmit={handleSubmitComment}>
            {commentError && <div className="alert-error">{commentError}</div>}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="写下你的想法、疑问或补充…（最多 1000 字）"
              maxLength={1000}
              rows={3}
            />
            <div className="comment-form-foot">
              <span className="comment-count">{commentText.length}/1000</span>
              <button type="submit" className="btn btn-primary btn-sm" disabled={posting}>
                {posting ? '发表中…' : '发表评论'}
              </button>
            </div>
          </form>
        ) : (
          <p className="comment-login-hint">
            <Link to="/login">登录</Link> 后参与讨论
          </p>
        )}

        {comments.length === 0 ? (
          <p className="comment-empty">还没有评论，来抢沙发～</p>
        ) : (
          <ul className="comment-list">
            {comments.map((c) => (
              <li key={c.id} className="comment-item">
                <span className="comment-avatar">{c.author.slice(0, 1).toUpperCase()}</span>
                <div className="comment-body">
                  <div className="comment-head">
                    <b>{c.author}</b>
                    <time>{formatDateCN(c.created_at)}</time>
                    {user && user.id === c.author_id && (
                      <button
                        type="button"
                        className="comment-delete"
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        删除
                      </button>
                    )}
                  </div>
                  <p>{c.content}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
