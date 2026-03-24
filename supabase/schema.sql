-- ============================================================
-- Past Questions Sharing Site - Database Schema
-- Run this SQL in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Categories table
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Past Questions table
-- ============================================================
CREATE TABLE IF NOT EXISTS past_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_approved ON users(approved);
CREATE INDEX IF NOT EXISTS idx_past_questions_category ON past_questions(category_id);
CREATE INDEX IF NOT EXISTS idx_past_questions_uploaded_by ON past_questions(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_past_questions_title ON past_questions USING gin(to_tsvector('simple', title));

-- ============================================================
-- RPC function for incrementing view count
-- ============================================================
CREATE OR REPLACE FUNCTION increment_view_count(question_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE past_questions
  SET view_count = view_count + 1
  WHERE id = question_id;
END;
$$;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE past_questions ENABLE ROW LEVEL SECURITY;

-- The service role bypasses RLS automatically and is used exclusively by
-- server-side API routes (supabaseAdmin). No permissive "FOR ALL" policies
-- are defined here so that direct anon/authenticated client access is denied
-- by default for write operations.

-- Users policies
-- No client-facing policies: all user operations go through the service role
-- API routes. Direct anon or authenticated access to the users table is denied.

-- Categories policies
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

-- Past questions policies
-- Only authenticated users may read past questions directly; write operations
-- are handled exclusively by the service role API routes.
CREATE POLICY "Authenticated users can read past questions"
  ON past_questions FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- Supabase Storage bucket
-- ============================================================
-- Run this in Supabase Storage settings or SQL Editor:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('past-questions', 'past-questions', true)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- Seed data - Initial categories
-- ============================================================
INSERT INTO categories (name, description) VALUES
  ('数学', '数学の過去問・演習問題'),
  ('英語', '英語の過去問・演習問題'),
  ('国語', '国語の過去問・演習問題'),
  ('理科', '理科（物理・化学・生物・地学）の過去問'),
  ('社会', '社会（地理・歴史・公民）の過去問'),
  ('情報', '情報・プログラミングの過去問'),
  ('その他', 'その他の科目の過去問')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- Initial admin user (update password_hash after running)
-- Use bcrypt hash of your desired admin password
-- Example: bcrypt('your_password', 12)
-- ============================================================
-- INSERT INTO users (name, email, password_hash, role, approved)
-- VALUES ('管理者', 'admin@example.com', '$2b$12$...', 'admin', true);
