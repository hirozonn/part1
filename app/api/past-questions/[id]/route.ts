import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// PATCH /api/past-questions/[id] - increment view count
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || (!session.user.approved && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'アクセスが制限されています' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin.rpc('increment_view_count', {
    question_id: id,
  })

  if (error) {
    console.error('View count error:', error)
    return NextResponse.json({ error: '閲覧数の更新に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/past-questions/[id] - delete a past question (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 })
  }

  const { id } = await params

  const { error } = await supabaseAdmin
    .from('past_questions')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
