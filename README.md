# 過去問共有サイト

試験の過去問・演習問題を安全に共有するための Web アプリケーションです。
管理者承認制のユーザー登録システムを採用し、承認されたメンバーのみがコンテンツにアクセスできます。

## 機能

- **ユーザー管理**
  - メールアドレスによるユーザー登録
  - 管理者による承認システム（承認前はアクセス不可）
  - NextAuth.js による認証
  - ロールベースのアクセス制御（admin / user）

- **過去問管理**
  - PDF・画像ファイルのアップロード（Supabase Storage）
  - カテゴリ別の整理
  - タイトル検索・カテゴリフィルタリング
  - 閲覧数トラッキング

- **アクセス制御**
  - 承認済みユーザーのみ過去問を閲覧可能
  - 公開登録ページ
  - 管理者専用承認ダッシュボード
  - 保護されたルート（認証必須）

## 技術スタック

| カテゴリ | 技術 |
|--------|------|
| フロントエンド | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| バックエンド | Next.js API Routes |
| データベース | Supabase (PostgreSQL) |
| 認証 | NextAuth.js |
| ストレージ | Supabase Storage |
| デプロイ | Vercel |

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/hirozonn/part1.git
cd part1
```

### 2. 依存パッケージのインストール

```bash
npm install
```

### 3. Supabase プロジェクトのセットアップ

1. [Supabase](https://supabase.com) にアクセスし、無料アカウントを作成
2. 新しいプロジェクトを作成
3. **SQL Editor** を開き、`supabase/schema.sql` の内容を実行
4. **Storage** → **New bucket** で `past-questions` という名前のバケットを作成（Public にする）

### 4. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集し、以下の値を設定：

```env
# Supabase ダッシュボード → Settings → API から取得
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxx...

# ランダムな文字列（openssl rand -base64 32 で生成可能）
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-here

# 初期管理者アカウント
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-secure-password
```

### 5. 管理者アカウントの作成

```bash
node scripts/create-admin.js
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## プロジェクト構成

```
part1/
├── app/
│   ├── (auth)/
│   │   ├── login/          # ログインページ
│   │   └── register/       # 新規登録ページ
│   ├── (dashboard)/
│   │   ├── admin/          # 管理者ダッシュボード
│   │   └── dashboard/      # 過去問一覧・アップロード
│   ├── api/
│   │   ├── auth/           # NextAuth.js エンドポイント
│   │   ├── users/          # ユーザー管理 API
│   │   ├── past-questions/ # 過去問 API
│   │   └── categories/     # カテゴリ API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Navigation.tsx
│   └── Providers.tsx
├── lib/
│   ├── auth.ts             # NextAuth 設定
│   ├── supabase.ts         # Supabase クライアント（公開）
│   └── supabase-admin.ts   # Supabase クライアント（管理者）
├── scripts/
│   └── create-admin.js     # 管理者作成スクリプト
├── supabase/
│   └── schema.sql          # データベーススキーマ
├── types/
│   └── next-auth.d.ts      # NextAuth 型定義
├── middleware.ts            # 保護されたルートの設定
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## データベーススキーマ

```sql
-- ユーザーテーブル
users (
  id UUID PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT ('admin' | 'user'),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- カテゴリテーブル
categories (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ
)

-- 過去問テーブル
past_questions (
  id UUID PRIMARY KEY,
  title TEXT,
  description TEXT,
  category_id UUID → categories.id,
  file_url TEXT,
  uploaded_by UUID → users.id,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

## API エンドポイント

| メソッド | パス | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/users/register` | ユーザー登録 | 公開 |
| GET | `/api/users` | ユーザー一覧 | 管理者 |
| POST | `/api/users/approve` | ユーザー承認/却下 | 管理者 |
| GET | `/api/categories` | カテゴリ一覧 | 認証済み |
| POST | `/api/categories` | カテゴリ作成 | 管理者 |
| GET | `/api/past-questions` | 過去問一覧 | 承認済みユーザー |
| POST | `/api/past-questions` | 過去問登録 | 承認済みユーザー |
| POST | `/api/past-questions/upload` | ファイルアップロード | 承認済みユーザー |
| PATCH | `/api/past-questions/[id]` | 閲覧数更新 | 承認済みユーザー |
| DELETE | `/api/past-questions/[id]` | 過去問削除 | 管理者 |

## Vercel へのデプロイ

1. [Vercel](https://vercel.com) にアクセスし、GitHub リポジトリをインポート
2. Environment Variables に `.env.local` の内容を設定
3. `NEXTAUTH_URL` を本番 URL に変更（例: `https://your-app.vercel.app`）
4. デプロイ完了後、`node scripts/create-admin.js` を実行して管理者を作成

## ライセンス

MIT
