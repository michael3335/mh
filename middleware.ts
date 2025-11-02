import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/auth/error", "/api/auth"]; // allowed unauthenticated

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // ✅ Check if user is authenticated
  const token = await getToken({ req });

  if (!token) {
    // Not authenticated → redirect to error page
    const url = new URL("/auth/error", req.url);
    url.searchParams.set("error", "AccessDenied");
    return NextResponse.redirect(url);
  }

  // ✅ Authenticated → allow access
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|static|favicon.ico).*)"],
};
