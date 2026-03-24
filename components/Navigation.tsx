'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-indigo-600">
            過去問共有サイト
          </Link>

          {session ? (
            <div className="flex items-center gap-4">
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm text-gray-600 hover:text-indigo-600 font-medium"
                >
                  管理者ダッシュボード
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium"
              >
                過去問一覧
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{session.user.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium"
              >
                ログイン
              </Link>
              <Link
                href="/register"
                className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                新規登録
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
