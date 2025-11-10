// lib/auth.ts
import { type NextAuthOptions } from "next-auth";
import type { JWT } from "next-auth/jwt";
import GitHub, { type GithubProfile } from "next-auth/providers/github";

const ALLOWED_GITHUB_ID = process.env.ALLOWED_GITHUB_ID; // e.g. "12345678"
const ALLOWED_GITHUB_LOGIN = process.env.ALLOWED_GITHUB_LOGIN; // e.g. "your-username"

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.provider === "github") {
        const ghProfile = profile as GithubProfile | undefined;
        const githubLogin = ghProfile?.login?.toLowerCase();
        if (githubLogin) {
          (token as JWT & { githubLogin?: string }).githubLogin = githubLogin;
        }
      }
      return token;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "github") {
        const ghProfile = profile as GithubProfile | undefined;
        const githubId = String(
          ghProfile?.id ?? account.providerAccountId ?? ""
        );
        const githubLogin: string | undefined = ghProfile?.login;

        const allowById = ALLOWED_GITHUB_ID
          ? githubId === String(ALLOWED_GITHUB_ID)
          : false;
        const allowByLogin = ALLOWED_GITHUB_LOGIN
          ? githubLogin === ALLOWED_GITHUB_LOGIN
          : false;

        if (!allowById && !allowByLogin) return false;
      }
      return true;
    },
    async session({ session, token }) {
      if (session.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      const githubLogin = (token as JWT & { githubLogin?: string })
        .githubLogin;
      if (session.user && githubLogin) {
        (session.user as { githubLogin?: string }).githubLogin = githubLogin;
      }
      return session;
    },
  },
  // debug: process.env.NODE_ENV === "development",
};
