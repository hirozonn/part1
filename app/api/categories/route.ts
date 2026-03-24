import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/categories
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
  }

  const { data: categories, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: 'カテゴリの取得に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ categories })
}

// POST /api/categories (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  try {
    const { name, description } = await req.json()

    if (!name) {
      return NextResponse.json({ error: 'カテゴリ名は必須です' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ name, description })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'カテゴリの作成に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (err) {
    console.error('Category create error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
