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

-- Allow service role to bypass RLS (used by our API routes)
-- These policies are for direct client access if needed

-- Users policies
CREATE POLICY "Service role can manage all users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Categories policies
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage categories"
  ON categories FOR ALL
  USING (true)
  WITH CHECK (true);

-- Past questions policies
CREATE POLICY "Anyone can read past questions"
  ON past_questions FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage past questions"
  ON past_questions FOR ALL
  USING (true)
  WITH CHECK (true);

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
