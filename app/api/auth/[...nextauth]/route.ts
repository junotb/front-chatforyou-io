import NextAuth, { NextAuthOptions } from 'next-auth'
import NaverProvider from 'next-auth/providers/naver'
import KakaoProvider from 'next-auth/providers/kakao'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { addOAuthUser, getOAuthUser, getCredentialsUser } from '@/firebase'

const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    CredentialsProvider({
      type: 'credentials',
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        // 아이디와 비밀번호 입력 여부 체크
        if (!credentials || !credentials.username || !credentials.password) {
          return null;
        }

        // 회원 조회 (User 객체 또는 null 반환)
        return getCredentialsUser(credentials.username, credentials.password);
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // SNS 로그인 체크
      if (user && account && profile) {
        const snsUser = await getOAuthUser(account.provider, account.providerAccountId);
        if (!snsUser) {
          addOAuthUser(user.name!, account.providerAccountId, {
            provider: account.provider,
            providerAccountId: account.providerAccountId
          });  
        }
      }

      // 로그인 제한 로직 (필요 시 활용)
      const isAllowedToSignIn = true;
      if (isAllowedToSignIn) {
        return true
      } else {
        // Return false to display a default error message
        return false
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    },
    async redirect({ url, baseUrl }) {
      return baseUrl;
    },
    async session({ session, token, user }) {
      return session;
    },
    async jwt({ token, user, account, profile, trigger }) {
      return token;
    },
    
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }