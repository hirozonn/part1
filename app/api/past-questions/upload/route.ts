import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/past-questions/upload - upload file to Supabase Storage
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || (!session.user.approved && session.user.role !== 'admin')) {
    return NextResponse.json({ error: 'アクセスが制限されています' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 })
    }

    // Map each allowed MIME type to its valid file extensions.
    // This prevents clients from spoofing Content-Type to bypass the type check.
    const MIME_TO_EXTENSIONS: Record<string, string[]> = {
      'application/pdf': ['pdf'],
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
    }

    if (!MIME_TO_EXTENSIONS[file.type]) {
      return NextResponse.json(
        { error: 'PDF、JPEG、PNG、WebP形式のファイルのみアップロードできます' },
        { status: 400 }
      )
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'ファイルサイズは10MB以下にしてください' }, { status: 400 })
    }

    // Validate that the file extension is consistent with the declared MIME type.
    const rawExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExtsForType = MIME_TO_EXTENSIONS[file.type]
    if (!allowedExtsForType.includes(rawExt)) {
      return NextResponse.json(
        { error: 'ファイルの拡張子と形式が一致しません' },
        { status: 400 }
      )
    }

    // Use the validated extension (not the raw client value) to build the storage path.
    const fileName = `${crypto.randomUUID()}.${rawExt}`
    const filePath = `past-questions/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('past-questions')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'ファイルのアップロードに失敗しました' }, { status: 500 })
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('past-questions')
      .getPublicUrl(filePath)

    return NextResponse.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
