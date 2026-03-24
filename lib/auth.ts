import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from './supabase-admin'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください')
        }

        const { data: user, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single()

        if (error || !user) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) {
          throw new Error('メールアドレスまたはパスワードが正しくありません')
        }

        if (!user.approved && user.role !== 'admin') {
          throw new Error('アカウントはまだ承認されていません。管理者の承認をお待ちください。')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          approved: user.approved,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as { role: string }).role
        token.approved = (user as { approved: boolean }).approved
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.approved = token.approved as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
