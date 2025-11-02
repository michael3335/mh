import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Public routes that anyone can access
  if (
    pathname === "/" || // Home
    pathname.startsWith("/auth/error") || // Auth error page
    pathname.startsWith("/api/auth") // NextAuth internals
  ) {
    return NextResponse.next();
  }

  // ✅ Check if authenticated
  const token = await getToken({ req });

  // ❌ If NOT authenticated → always redirect to error page
  if (!token) {
    const url = new URL("/auth/error", req.url);
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  // ✅ Authenticated → allow
  return NextResponse.next();
}

// Matcher that catches EVERYTHING except internal Next.js assets
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg).*)",
  ],
};
