import type { PostListItem } from '../api'
import { formatDateCN } from '../api'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function PostCard({ post, onClick }: { post: PostListItem; onClick: () => void }) {
  const { user } = useAuth()
  const isMine = user && user.id === post.author_id

  return (
    <article className="post-card" onClick={onClick}>
      <div className="post-cover">
        {post.cover ? (
          <img src={post.cover} alt={post.title} loading="lazy" />
        ) : (
          <div className="cover-fallback">
            <b>{post.title.slice(0, 2)}</b>
          </div>
        )}
        {isMine && (
          <Link
            to={`/write?id=${post.id}`}
            className="card-edit"
            title="编辑这篇文章"
            onClick={(e) => e.stopPropagation()}
          >
            ✎ 编辑
          </Link>
        )}
      </div>
      <div className="post-body">
        <div className="post-meta">
          {post.category && <span className="badge">{post.category}</span>}
          <span>约 {post.read_minutes} 分钟</span>
        </div>
        <h3>{post.title}</h3>
        <p className="post-excerpt">{post.excerpt}…</p>
        <div className="post-foot">
          <span>{post.author}</span>
          <span>
            {formatDateCN(post.created_at)} · {post.views} 阅读
            {post.comments_count > 0 && ` · ${post.comments_count} 讨论`}
          </span>
        </div>
      </div>
    </article>
  )
}
