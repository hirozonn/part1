/**
 * Script to create the initial admin user in Supabase.
 * Run: node scripts/create-admin.js
 *
 * Make sure to set environment variables first:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   ADMIN_EMAIL
 *   ADMIN_PASSWORD
 *   ADMIN_NAME (optional, defaults to "管理者")
 */

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

async function createAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || '管理者'

  if (!supabaseUrl || !serviceRoleKey || !adminEmail || !adminPassword) {
    console.error('必要な環境変数が設定されていません')
    console.error('NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD が必要です')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  console.log(`管理者アカウントを作成中: ${adminEmail}`)

  const password_hash = await bcrypt.hash(adminPassword, 12)

  const { data, error } = await supabase
    .from('users')
    .upsert({
      name: adminName,
      email: adminEmail,
      password_hash,
      role: 'admin',
      approved: true,
    }, { onConflict: 'email' })
    .select('id, email, role')
    .single()

  if (error) {
    console.error('エラー:', error.message)
    process.exit(1)
  }

  console.log('✅ 管理者アカウントが作成されました:', data)
}

createAdmin()
