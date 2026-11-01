import axios from 'axios'

// 统一封装：自动携带 token；401 时清除本地登录态
export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(err)
  },
)

export interface PostListItem {
  id: number
  title: string
  cover: string | null
  tags: string[]
  views: number
  created_at: string
  excerpt: string
  read_minutes: number
  author: string
  author_id: number
  category: string | null
}

export interface PostDetail extends PostListItem {
  content: string
  category_id: number | null
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description: string
  post_count: number
}

export interface UserInfo {
  id: number
  username: string
  email: string
  avatar: string
}

export function errMsg(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string } } }
  return ax?.response?.data?.message || '网络异常，请稍后再试'
}

export function formatDateCN(iso: string) {
  return (iso || '').slice(0, 10).replaceAll('-', '.')
}
