import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link to="/" className="logo">
            拾光志
            <small>数字经济学习笔记</small>
          </Link>
          <nav>
            <Link to="/posts">学习笔记</Link>
            {user ? (
              <>
                <Link to="/write">写文章</Link>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    logout()
                  }}
                >
                  退出（{user.username}）
                </a>
              </>
            ) : (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register">注册</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container">{children}</main>
      <footer className="footer">
        拾光志 · 雷馨怡的数字经济学习笔记 · React + Express + SQLite 全栈练习项目
      </footer>
    </>
  )
}
