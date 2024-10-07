// export { default } from "next-auth/middleware"

// export const config = { matcher: ["/", "/today"] }

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parse } from "cookie";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();

  // Allow access to Next.js internal paths and favicon
  if (
    req.nextUrl.pathname.startsWith("/_next/") ||
    req.nextUrl.pathname === "/favicon.ico" ||
    req.nextUrl.pathname.startsWith("/auth")
  ) {
    return response;
  }

  const cookies = parse(req.headers.get("cookie") || "");
  const accessToken = cookies.AccessToken;

  // If user is not authenticated and trying to access protected routes
  if (
    !accessToken &&
    !req.nextUrl.pathname.startsWith("/sign-in") &&
    !req.nextUrl.pathname.startsWith("/sign-up")
  ) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
  }

  // If user is authenticated and trying to access sign-in or sign-up routes
  if (accessToken && ["/sign-in", "/sign-up"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sign-in).*)",
  ],
};
