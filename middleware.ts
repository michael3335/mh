import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Allow NextAuth internals + auth pages so users can sign in.
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth/error") ||
    pathname.startsWith("/auth/signin")
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (!token) {
    // API callers get a 401 JSON instead of a redirect.
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Matcher that catches EVERYTHING except internal Next.js assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)",
  ],
};
