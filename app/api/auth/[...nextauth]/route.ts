import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

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
    // Custom error page for denied users
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ account, profile }) {
      // Only enforce allowlist for GitHub provider
      if (account?.provider === "github") {
        // GitHub returns both a numeric id and a login (username)
        const githubId = String(
          // @ts-expect-error profile shape depends on provider
          profile?.id ?? account.providerAccountId ?? ""
        );
        // @ts-expect-error profile shape depends on provider
        const githubLogin: string | undefined = profile?.login;

        const allowById = ALLOWED_GITHUB_ID
          ? githubId === String(ALLOWED_GITHUB_ID)
          : false;
        const allowByLogin = ALLOWED_GITHUB_LOGIN
          ? githubLogin === ALLOWED_GITHUB_LOGIN
          : false;

        if (!allowById && !allowByLogin) {
          // Returning false blocks the sign-in and redirects to pages.error
          return false;
        }
      }

      return true;
    },
    async session({ session, token }) {
      // Expose the user's id on the session for convenience
      if (session.user && token?.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
  // debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
