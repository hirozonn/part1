import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/past-questions
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || (!session.user.approved && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'アクセスが制限されています' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const category = searchParams.get('category') || ''

  let query = supabaseAdmin
    .from('past_questions')
    .select(`
      id,
      title,
      description,
      file_url,
      view_count,
      created_at,
      categories (id, name),
      users!past_questions_uploaded_by_fkey (name)
    `)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  if (category) {
    query = query.eq('category_id', category)
  }

  const { data: questions, error } = await query

  if (error) {
    console.error('Fetch questions error:', error)
    return NextResponse.json({ error: '過去問の取得に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ questions })
}

// POST /api/past-questions (approved users and admins)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || (!session.user.approved && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'アクセスが制限されています' }, { status: 403 })
  }

  try {
    const { title, description, category_id, file_url } = await req.json()

    if (!title || !file_url) {
      return NextResponse.json({ error: 'タイトルとファイルは必須です' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('past_questions')
      .insert({
        title,
        description,
        category_id: category_id || null,
        file_url,
        uploaded_by: session.user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '過去問の登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ question: data }, { status: 201 })
  } catch (err) {
    console.error('Create question error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
