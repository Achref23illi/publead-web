import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth gate — redirect unauthenticated requests to /login.
 *
 * Uses the `publeader_auth` cookie written by `signIn()` in
 * `@/lib/auth`. `/login` itself is excluded via the matcher below.
 *
 * This is prototype-grade (the cookie isn't signed); swap with a real
 * session check when the backend lands.
 */
export function middleware(req: NextRequest) {
  const authed = req.cookies.get("publeader_auth")?.value === "1";
  if (!authed) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Run on every route except: /login, Next.js internals, static assets.
export const config = {
  matcher: [
    "/((?!login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
