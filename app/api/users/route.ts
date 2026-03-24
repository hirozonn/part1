import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/users - list all users (admin only)
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, name, email, role, approved, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'ユーザー一覧の取得に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ users })
}
