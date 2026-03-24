import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/users/approve - approve or reject a user (admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  try {
    const { userId, approved } = await req.json()

    if (!userId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: '無効なリクエストです' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ approved, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select('id, name, email, approved')
      .single()

    if (error) {
      return NextResponse.json({ error: 'ユーザーの更新に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (err) {
    console.error('Approve error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
