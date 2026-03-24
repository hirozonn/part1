import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: '必須項目を入力してください' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上で入力してください' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        name,
        email,
        password_hash,
        role: 'user',
        approved: false,
      })
      .select('id, name, email, role, approved, created_at')
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'ユーザー登録に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
