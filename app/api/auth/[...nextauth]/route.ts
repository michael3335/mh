import NextAuth, { type NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // `session` and `token` are now typed.
      // `token.sub` is a string | undefined (user id for OAuth/JWT)
      if (session.user && token?.sub) {
        session.user.id = token.sub; // ✅ no `any`
      }
      return session;
    },
  },
  // pages: { signIn: "/login" },
  // debug: process.env.NODE_ENV === "development",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
