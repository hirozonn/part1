'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
}

interface PastQuestion {
  id: string
  title: string
  description: string
  file_url: string
  view_count: number
  created_at: string
  categories: { id: string; name: string } | null
  users: { name: string } | null
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const [questions, setQuestions] = useState<PastQuestion[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchQuestions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory) params.set('category', selectedCategory)

      const res = await fetch(`/api/past-questions?${params.toString()}`)
      const data = await res.json()
      if (res.ok) {
        setQuestions(data.questions || [])
      }
    } catch {
      toast.error('過去問の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    fetchQuestions()
  }, [fetchQuestions])

  useEffect(() => {
    const fetchCategories = async () => {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (res.ok) setCategories(data.categories || [])
    }
    fetchCategories()
  }, [])

  const handleView = async (id: string) => {
    await fetch(`/api/past-questions/${id}`, { method: 'PATCH' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">過去問一覧</h1>
          <p className="text-gray-500 mt-1">
            ようこそ、{session?.user.name}さん
          </p>
        </div>
        {(session?.user.approved || session?.user.role === 'admin') && (
          <Link
            href="/dashboard/upload"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm"
          >
            ＋ 過去問をアップロード
          </Link>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="タイトルで検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
        >
          <option value="">すべてのカテゴリ</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Questions Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">読み込み中...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-500 text-lg">過去問が見つかりません</p>
          <p className="text-gray-400 mt-2">検索条件を変更するか、過去問をアップロードしてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {questions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">{q.title}</h3>
              </div>
              {q.categories && (
                <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full mb-3">
                  {q.categories.name}
                </span>
              )}
              {q.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{q.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                <span>投稿者: {q.users?.name || '不明'}</span>
                <span>👁 {q.view_count} 回閲覧</span>
              </div>
              <a
                href={q.file_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleView(q.id)}
                className="block w-full text-center bg-indigo-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                ファイルを開く
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
