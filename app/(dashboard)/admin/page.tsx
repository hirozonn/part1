'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  approved: boolean
  created_at: string
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users')
        const data = await res.json()
        if (res.ok) {
          setUsers(data.users || [])
        } else {
          toast.error('ユーザー一覧の取得に失敗しました')
        }
      } catch {
        toast.error('エラーが発生しました')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleApproval = async (userId: string, approved: boolean) => {
    try {
      const res = await fetch('/api/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, approved }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || '操作に失敗しました')
        return
      }

      setUsers(users.map((u) => (u.id === userId ? { ...u, approved } : u)))
      toast.success(approved ? 'ユーザーを承認しました' : 'ユーザーの承認を取り消しました')
    } catch {
      toast.error('エラーが発生しました')
    }
  }

  const filteredUsers = users.filter((u) => {
    if (u.role === 'admin') return false
    if (filter === 'pending') return !u.approved
    if (filter === 'approved') return u.approved
    return true
  })

  const pendingCount = users.filter((u) => !u.approved && u.role !== 'admin').length

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-gray-500 mt-1">ユーザーの承認・管理を行います</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">全ユーザー</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {users.filter((u) => u.role !== 'admin').length}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">承認待ち</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <p className="text-sm text-gray-500">承認済み</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {users.filter((u) => u.approved && u.role !== 'admin').length}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f === 'pending' ? `承認待ち (${pendingCount})` : f === 'approved' ? '承認済み' : '全員'}
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {filter === 'pending' ? '承認待ちのユーザーはいません' : 'ユーザーが見つかりません'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('ja-JP')}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.approved
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {user.approved ? '承認済み' : '承認待ち'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {user.approved ? (
                      <button
                        onClick={() => handleApproval(user.id, false)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        承認取り消し
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApproval(user.id, true)}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
                      >
                        承認する
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
