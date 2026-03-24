import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          過去問共有サイト
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          試験の過去問・演習問題を共有するプラットフォームです。
          登録して承認されたユーザーのみ閲覧できます。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            ログイン
          </Link>
          <Link
            href="/register"
            className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            新規登録
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">豊富な過去問</h3>
            <p className="text-gray-600">様々な科目・カテゴリの過去問を検索・閲覧できます。</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">安全な管理</h3>
            <p className="text-gray-600">管理者承認制で、信頼できるメンバーのみアクセス可能です。</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📤</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">簡単アップロード</h3>
            <p className="text-gray-600">PDF・画像形式の過去問を簡単にアップロードできます。</p>
          </div>
        </div>
      </div>
    </main>
  )
}
